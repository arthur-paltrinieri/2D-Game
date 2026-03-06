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
        this.color = 'magenta';
        this.toRemove = false;
        this.sprite = new Image();
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
        // Clamp dt para evitar saltos enormes que podem causar bugs de colisão
        const cappedDt = Math.min(dt, 20);
        this.velocity.y += gravity.y * this.gravityScale * cappedDt;
        this.velocity.x += gravity.x * this.gravityScale * cappedDt;
        this.position.x += this.velocity.x * cappedDt;
        this.position.y += this.velocity.y * cappedDt;
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
        this.lastTime = performance.now();

        this.tileset = new Image();
        this.tileset.src = ASSETS.tileset;

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
        // Delta time suavizado e limitado (máx 32ms para evitar crashes se a aba for minimizada)
        let dt = timestamp - this.lastTime;
        if (dt > 100) dt = 16.67; // Se travou por mais de 0.1s, finge que passou um frame normal
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // 1. Lógica das entidades
        this.entities.forEach(entity => {
            entity.update(dt, this.gravity);
            this.handleCollisions(entity);
        });

        // 2. Limpeza de entidades marcadas para remoção
        this.entities = this.entities.filter(e => !e.toRemove);
    }

    handleCollisions(entity) {
        if (entity.isStatic) return;
        entity.isGrounded = false;
        const b = entity.bounds;

        // Verifica tiles vizinhos (Performance: apenas o que está em volta)
        const startX = Math.floor(b.left / this.tileSize);
        const endX = Math.floor(b.right / this.tileSize);
        const startY = Math.floor(b.top / this.tileSize);
        const endY = Math.floor(b.bottom / this.tileSize);

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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Céu
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#0a0022');
        grad.addColorStop(1, '#220044');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Tiles
        this.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 1) {
                    if (this.tileset.complete && this.tileset.naturalWidth > 0) {
                        this.ctx.drawImage(this.tileset, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    } else {
                        this.ctx.fillStyle = '#3a1f0a';
                        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            });
        });

        // Entidades
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
