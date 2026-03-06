export class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
}

export class GameObject {
    constructor(x, y, w, h) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(w, h);
        this.gravityScale = 1;
        this.isGrounded = false;
        this.isStatic = false;
        this.color = 'magenta';
    }

    get bounds() {
        return {
            left: this.position.x,
            right: this.position.x + this.size.x,
            top: this.position.y,
            bottom: this.position.y + this.size.y
        };
    }

    update(dt, gravity) {
        if (this.isStatic) return;
        this.velocity.y += gravity.y * this.gravityScale * dt;
        this.velocity.x += gravity.x * this.gravityScale * dt;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }
}

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.gravity = new Vector2(0, 0.002);
        this.camera = new Vector2(0, 0);
        this.tileMap = [];
        this.tileSize = 64;
        this.lastTime = 0;
        this.tileset = new Image();
        this.tileset.src = 'https://raw.githubusercontent.com/arthur-paltrinieri/2D-Game/main/assets/tileset.png'; // Tentar carregar do GitHub se local falhar

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        const dt = Math.min(timestamp - this.lastTime, 32);
        this.lastTime = timestamp;

        // Anti-crash: se o dt for muito alto ou instável, resetamos
        if (dt > 0) {
            this.update(dt);
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.entities.forEach(entity => {
            entity.update(dt, this.gravity);
            this.handleCollisions(entity);
        });
    }

    handleCollisions(entity) {
        if (entity.isStatic) return;
        entity.isGrounded = false;
        const b = entity.bounds;

        const startX = Math.floor(b.left / this.tileSize) - 1;
        const endX = Math.floor(b.right / this.tileSize) + 1;
        const startY = Math.floor(b.top / this.tileSize) - 1;
        const endY = Math.floor(b.bottom / this.tileSize) + 1;

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.tileMap[y] && this.tileMap[y][x] === 1) {
                    this.resolveAABB(entity, x * this.tileSize, y * this.tileSize);
                }
            }
        }
    }

    resolveAABB(entity, tx, ty) {
        const tw = this.tileSize;
        const th = this.tileSize;
        const p = entity.position;
        const s = entity.size;

        const overlapX = Math.min(p.x + s.x, tx + tw) - Math.max(p.x, tx);
        const overlapY = Math.min(p.y + s.y, ty + th) - Math.max(p.y, ty);

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX > overlapY) {
                if (p.y < ty) {
                    p.y -= overlapY;
                    entity.velocity.y = 0;
                    if (this.gravity.y > 0) entity.isGrounded = true;
                } else {
                    p.y += overlapY;
                    entity.velocity.y = 0;
                    if (this.gravity.y < 0) entity.isGrounded = true;
                }
            } else {
                if (p.x < tx) p.x -= overlapX;
                else p.x += overlapX;
                entity.velocity.x = 0;
            }
        }
    }

    draw() {
        // Céu do Mago
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#0a0022');
        grad.addColorStop(1, '#220044');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Background Paralax Simples
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#110033';
        for (let i = 0; i < 10; i++) {
            this.ctx.fillRect(i * 500 - (this.camera.x * 0.2), 0, 300, this.canvas.height);
        }
        this.ctx.globalAlpha = 1.0;

        // Desenhar Chão
        this.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 1) {
                    if (this.tileset.complete && this.tileset.naturalWidth > 0) {
                        this.ctx.drawImage(this.tileset, 0, 0, 64, 64, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    } else {
                        this.ctx.fillStyle = '#331100';
                        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                        this.ctx.strokeStyle = '#442211';
                        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            });
        });

        // Desenhar Entidades
        this.entities.forEach(e => {
            if (e.sprite && e.sprite.complete && e.sprite.naturalWidth > 0) {
                this.ctx.drawImage(e.sprite, e.position.x, e.position.y, e.size.x, e.size.y);
            } else {
                this.ctx.fillStyle = e.color;
                this.ctx.fillRect(e.position.x, e.position.y, e.size.x, e.size.y);
            }
        });

        this.ctx.restore();
    }
}
