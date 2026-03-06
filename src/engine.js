import { ASSETS } from './assets_data.js';

export class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
}

export class GameObject {
    constructor(x, y, w, h) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(w, h); // Área de colisão real
        this.renderSize = new Vector2(w * 1.5, h * 1.5); // Área visual (um pouco maior que colisão)
        this.gravityScale = 1;
        this.isGrounded = false;
        this.isStatic = false;
        this.toRemove = false;
        this.sprite = new Image();
        this.facing = 1;
        this.state = 'idle';
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
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.tileMap = [];
        this.tileSize = 64;
        this.gravity = new Vector2(0, 0.0018);
        this.camera = new Vector2(0, 0);
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fixedDeltaTime = 1000 / 60;

        this.bgPattern = null;
        this.bgImg = new Image();
        this.bgImg.src = ASSETS.tileset;
        this.bgImg.onload = () => {
            this.bgPattern = this.ctx.createPattern(this.bgImg, 'repeat');
        };

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (dt > 100) dt = this.fixedDeltaTime;

        this.accumulator += dt;
        while (this.accumulator >= this.fixedDeltaTime) {
            this.update(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.entities.forEach(e => {
            if (e.isStatic) return;
            e.velocity.y += this.gravity.y * e.gravityScale * dt;
            e.position.x += e.velocity.x * dt;
            e.position.y += e.velocity.y * dt;
            this.checkWorldCollision(e);
        });
        this.entities = this.entities.filter(e => !e.toRemove);
    }

    checkWorldCollision(e) {
        e.isGrounded = false;
        const b = e.bounds;
        const startX = Math.floor(b.left / this.tileSize);
        const endX = Math.floor(b.right / this.tileSize);
        const startY = Math.floor(b.top / this.tileSize);
        const endY = Math.floor(b.bottom / this.tileSize);

        for (let y = startY; y <= endY; y++) {
            if (!this.tileMap[y]) continue;
            for (let x = startX; x <= endX; x++) {
                if (this.tileMap[y][x] === 1) {
                    this.resolveAABB(e, x * this.tileSize, y * this.tileSize);
                }
            }
        }
    }

    resolveAABB(e, tx, ty) {
        const overlapX = Math.min(e.position.x + e.size.x, tx + this.tileSize) - Math.max(e.position.x, tx);
        const overlapY = Math.min(e.position.y + e.size.y, ty + this.tileSize) - Math.max(e.position.y, ty);

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX > overlapY) {
                if (e.position.y < ty) {
                    e.position.y -= overlapY;
                    e.velocity.y = 0;
                    if (this.gravity.y > 0) e.isGrounded = true;
                } else {
                    e.position.y += overlapY;
                    e.velocity.y = 0;
                    if (this.gravity.y < 0) e.isGrounded = true;
                }
            } else {
                if (e.position.x < tx) e.position.x -= overlapX;
                else e.position.x += overlapX;
                e.velocity.x = 0;
            }
        }
    }

    draw() {
        const ctx = this.ctx;

        // 1. Fundo Dinâmico
        ctx.fillStyle = '#0a0022';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.bgPattern) {
            ctx.save();
            // Paralax lento
            ctx.translate(-this.camera.x * 0.2, -this.camera.y * 0.2);
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = this.bgPattern;
            ctx.fillRect(this.camera.x * 0.2, this.camera.y * 0.2, this.canvas.width, this.canvas.height);
            ctx.restore();
        }

        ctx.save();
        ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // 2. Renderização do Mundo (Tiles como estantes/blocos)
        this.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 1) {
                    // Gradiente para os blocos ficarem 3D/Estilizados
                    const tX = x * this.tileSize;
                    const tY = y * this.tileSize;
                    ctx.fillStyle = '#1e0b3d';
                    ctx.fillRect(tX, tY, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#3d2b63';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(tX + 4, tY + 4, this.tileSize - 8, this.tileSize - 8);
                }
            });
        });

        // 3. Entidades
        this.entities.forEach(e => {
            if (e.sprite && e.sprite.complete) {
                ctx.save();
                ctx.translate(e.position.x + e.size.x / 2, e.position.y + e.size.y / 2);
                ctx.scale(e.facing, 1);

                // Shadows
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.isStunned ? 'red' : 'rgba(138, 43, 226, 0.5)';

                // Desenhar personagem centralizado
                ctx.drawImage(e.sprite, -e.renderSize.x / 2, -e.renderSize.y / 2, e.renderSize.x, e.renderSize.y);
                ctx.restore();
            }
        });

        ctx.restore();
    }
}
