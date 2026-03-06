export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

export class GameObject {
    constructor(x, y, width, height) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(width, height);
        this.gravityScale = 1;
        this.isStatic = false;
        this.isGrounded = false;
        this.color = 'red';
    }

    update(dt, gravityVector) {
        if (this.isStatic) return;

        // Apply gravity if gravityVector is passed (from Engine)
        if (gravityVector) {
            this.velocity.x += gravityVector.x * this.gravityScale * dt;
            this.velocity.y += gravityVector.y * this.gravityScale * dt;
        }

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }

    get bounds() {
        return {
            left: this.position.x,
            right: this.position.x + this.size.x,
            top: this.position.y,
            bottom: this.position.y + this.size.y
        };
    }
}

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("Canvas not found!");
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.gravity = new Vector2(0, 0.0015);
        this.lastTime = 0;
        this.camera = new Vector2(0, 0);
        this.tileMap = null;
        this.tileSize = 64;
        this.isRunning = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (dt > 0 && dt < 100) {
            this.update(dt);
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.entities.forEach(entity => {
            entity.update(dt, this.gravity);
            this.checkCollisions(entity);
        });
    }

    swapGravity() {
        this.gravity.y *= -1;
        this.entities.forEach(e => {
            if (!e.isStatic) {
                e.isGrounded = false;
            }
        });
    }

    checkCollisions(entity) {
        if (entity.isStatic || !this.tileMap) return;

        const bounds = entity.bounds;
        entity.isGrounded = false;

        const startX = Math.floor(bounds.left / this.tileSize);
        const endX = Math.ceil(bounds.right / this.tileSize);
        const startY = Math.floor(bounds.top / this.tileSize);
        const endY = Math.ceil(bounds.bottom / this.tileSize);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (this.tileMap[y] && this.tileMap[y][x] === 1) {
                    this.resolveCollision(entity, x, y);
                }
            }
        }
    }

    resolveCollision(entity, tx, ty) {
        const tw = this.tileSize;
        const th = this.tileSize;
        const ex = entity.position.x;
        const ey = entity.position.y;
        const ew = entity.size.x;
        const eh = entity.size.y;

        const gravDir = Math.sign(this.gravity.y);

        // Vertical Resolution (relative to gravity)
        if (gravDir > 0) { // Standard Gravity
            if (entity.velocity.y > 0 && ey + eh > ty * th && ey < ty * th) {
                entity.position.y = ty * th - eh;
                entity.velocity.y = 0;
                entity.isGrounded = true;
                return;
            } else if (entity.velocity.y < 0 && ey < (ty + 1) * th && ey + eh > (ty + 1) * th) {
                entity.position.y = (ty + 1) * th;
                entity.velocity.y = 0;
                return;
            }
        } else { // Inverted Gravity
            if (entity.velocity.y < 0 && ey < (ty + 1) * th && ey + eh > (ty + 1) * th) {
                entity.position.y = (ty + 1) * th;
                entity.velocity.y = 0;
                entity.isGrounded = true;
                return;
            } else if (entity.velocity.y > 0 && ey + eh > ty * th && ey < ty * th) {
                entity.position.y = ty * th - eh;
                entity.velocity.y = 0;
                return;
            }
        }

        // Horizontal Resolution
        if (entity.velocity.x > 0 && ex + ew > tx * tw && ex < tx * tw) {
            entity.position.x = tx * tw - ew;
            entity.velocity.x = 0;
        } else if (entity.velocity.x < 0 && ex < (tx + 1) * tw && ex + ew > (tx + 1) * tw) {
            entity.position.x = (tx + 1) * tw;
            entity.velocity.x = 0;
        }
    }

    draw() {
        this.ctx.fillStyle = '#050505'; // Clear background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Draw World
        if (this.tileMap) {
            this.ctx.fillStyle = '#1a1a1a';
            this.tileMap.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile === 1) {
                        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                        this.ctx.strokeStyle = '#333';
                        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                });
            });
        }

        // Draw Entities
        this.entities.forEach(entity => {
            if (entity.sprite && entity.sprite.complete && entity.sprite.naturalWidth > 0) {
                this.ctx.drawImage(entity.sprite, entity.position.x, entity.position.y, entity.size.x, entity.size.y);
            } else {
                // FALLBACK DRAWING
                this.ctx.fillStyle = entity.color || 'red';
                this.ctx.fillRect(entity.position.x, entity.position.y, entity.size.x, entity.size.y);
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(entity.position.x, entity.position.y, entity.size.x, entity.size.y);
            }
        });

        this.ctx.restore();
    }
}
