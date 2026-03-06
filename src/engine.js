import { ASSETS } from './assets_data.js';

export class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
}

export class GameObject {
    constructor(x, y, w, h) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(w, h);
        this.renderSize = new Vector2(w, h);
        this.gravityScale = 1;
        this.isGrounded = false;
        this.isStatic = false;
        this.toRemove = false;
        this.sprite = new Image();
        this.facing = 1;

        // Sistema de Animação
        this.frameX = 0;
        this.frameY = 0;
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.animTimer = 0;
        this.maxFrames = 1;
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
        this.gravity = new Vector2(0, 0.002);
        this.camera = new Vector2(0, 0);
        this.lastTime = performance.now();

        // Fundo Temático (Biblioteca/Escritório)
        this.bgImg = new Image();
        this.bgImg.src = ASSETS.tileset;

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        let dt = timestamp - this.lastTime;
        if (dt > 64) dt = 16.67; // Cap de Lag
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.entities.forEach(e => {
            if (e.isStatic) return;

            // Física Real
            e.velocity.y += this.gravity.y * e.gravityScale * dt;
            e.position.x += e.velocity.x * dt;
            e.position.y += e.velocity.y * dt;

            // Animação
            if (e.maxFrames > 1) {
                e.animTimer += dt;
                if (e.animTimer > 120) {
                    e.frameX = (e.frameX + 1) % e.maxFrames;
                    e.animTimer = 0;
                }
            }

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
        const tw = this.tileSize;
        const th = this.tileSize;

        const overlapX = Math.min(e.position.x + e.size.x, tx + tw) - Math.max(e.position.x, tx);
        const overlapY = Math.min(e.position.y + e.size.y, ty + th) - Math.max(e.position.y, ty);

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX > overlapY) {
                if (e.position.y < ty) { // Bateu por cima (pousou)
                    e.position.y -= overlapY;
                    e.velocity.y = 0;
                    if (this.gravity.y > 0) e.isGrounded = true;
                } else { // Bateu por baixo (teto)
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

        // 1. Background Corrigido (Cinza Escuro / Marrom - Biblioteca)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.bgImg.complete) {
            ctx.globalAlpha = 0.2;
            const bgS = 2; // Escala do background
            const loopX = (this.camera.x * 0.2) % (this.bgImg.width * bgS);
            for (let i = -2; i < 5; i++) {
                ctx.drawImage(this.bgImg, (i * this.bgImg.width * bgS) - loopX, 0, this.bgImg.width * bgS, this.canvas.height);
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.save();
        ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // 2. Chão (Blocos de Madeira Escura / Biblioteca)
        this.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 1) {
                    ctx.fillStyle = '#3e2723'; // Marrom Madeira
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    ctx.strokeStyle = '#263238';
                    ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    // Detalhe de estante
                    ctx.fillStyle = '#4e342e';
                    ctx.fillRect(x * this.tileSize + 10, y * this.tileSize + 10, this.tileSize - 20, 10);
                }
            });
        });

        // 3. Entidades com Animacao
        this.entities.forEach(e => {
            if (e.sprite && e.sprite.complete && e.sprite.naturalWidth > 0) {
                ctx.save();
                ctx.translate(Math.floor(e.position.x + e.size.x / 2), Math.floor(e.position.y + e.size.y / 2));
                ctx.scale(e.facing, 1);

                // Recorte inteligente de frame (assume sheets baseadas no tamanho do render)
                const fW = e.frameWidth || e.sprite.width / (e.maxFrames || 1);
                const fH = e.frameHeight || e.sprite.height;

                ctx.drawImage(
                    e.sprite,
                    e.frameX * fW, e.frameY * fH, fW, fH, // Recorte
                    -e.renderSize.x / 2, -e.renderSize.y / 2, e.renderSize.x, e.renderSize.y // Desenho
                );
                ctx.restore();
            }
        });

        this.ctx.restore();
    }
}
