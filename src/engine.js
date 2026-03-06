import { ASSETS } from './assets_data.js';

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
        this.toRemove = false;
        this.sprite = new Image();
        this.facing = 1;
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
        this.gravity = new Vector2(0, 0.0015);
        this.camera = new Vector2(0, 0);
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fixedDeltaTime = 1000 / 60; // 60 FPS fixo para física estável

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false; // Pixel art vibe
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (dt > 100) dt = this.fixedDeltaTime; // Previne saltos gigantes após lags

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

            // Integração de Euler Simples
            e.velocity.y += this.gravity.y * e.gravityScale * dt;
            e.position.x += e.velocity.x * dt;
            e.position.y += e.velocity.y * dt;

            // Resolução de Colisão com o Mundo
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
                if (e.position.y < ty) { // Cima
                    e.position.y -= overlapY;
                    e.velocity.y = 0;
                    if (this.gravity.y > 0) e.isGrounded = true;
                } else { // Baixo
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
        // Fundo Gradiente Arcano
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#0c001f');
        grad.addColorStop(1, '#1a0033');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Mundos/Tiles
        ctx.fillStyle = '#2d1b4d';
        this.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 1) {
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#3e2b6d';
                    ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            });
        });

        // Entidades
        this.entities.forEach(e => {
            if (e.sprite && e.sprite.complete && e.sprite.naturalWidth > 0) {
                // Desenhar com flip baseado na direção
                ctx.save();
                ctx.translate(e.position.x + e.size.x / 2, e.position.y + e.size.y / 2);
                ctx.scale(e.facing, 1);
                ctx.drawImage(e.sprite, -e.size.x / 2, -e.size.y / 2, e.size.x, e.size.y);
                ctx.restore();
            } else {
                ctx.fillStyle = 'red';
                ctx.fillRect(e.position.x, e.position.y, e.size.x, e.size.y);
            }
        });

        ctx.restore();
    }
}
