import { ASSETS } from './assets_data.js';

export class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
}

export class GameObject {
    constructor(x, y, w, h) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(w, h); // Tamanho da colisão
        this.gravityScale = 1;
        this.isGrounded = false;
        this.isStatic = false;
        this.color = 'magenta';
        this.toRemove = false;
        this.sprite = new Image();
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 1;
        this.animTimer = 0;
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
        const cappedDt = Math.min(dt, 20);
        this.velocity.y += gravity.y * this.gravityScale * cappedDt;
        this.velocity.x += gravity.x * this.gravityScale * cappedDt;

        // Limite de velocidade para evitar varar paredes
        this.velocity.x = Math.max(Math.min(this.velocity.x, 2), -2);
        this.velocity.y = Math.max(Math.min(this.velocity.y, 2), -2);

        this.position.x += this.velocity.x * cappedDt;
        this.position.y += this.velocity.y * cappedDt;

        // Simples animação de frames
        if (this.frameCount > 1) {
            this.animTimer += cappedDt;
            if (this.animTimer > 150) {
                this.frameX = (this.frameX + 1) % this.frameCount;
                this.animTimer = 0;
            }
        }
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

        this.bgImg = new Image();
        this.bgImg.src = ASSETS.tileset; // Usaremos o tileset como background panorâmico

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
        let dt = timestamp - this.lastTime;
        if (dt > 60) dt = 16.67;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.entities.forEach(entity => {
            entity.update(dt, this.gravity);
            this.handleCollisions(entity);
        });
        this.entities = this.entities.filter(e => !e.toRemove);
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Background (Roxo Arcano + Imagem do cenário)
        this.ctx.fillStyle = '#0a0022';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.bgImg.complete) {
            // Paralax simples
            const scale = 2;
            const bgX = -(this.camera.x * 0.5) % (this.bgImg.width * scale);
            this.ctx.drawImage(this.bgImg, bgX, 0, this.bgImg.width * scale, this.canvas.height);
            this.ctx.drawImage(this.bgImg, bgX + this.bgImg.width * scale, 0, this.bgImg.width * scale, this.canvas.height);
        }

        this.ctx.save();
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // 2. Tiles (Chão Sólido)
        this.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 1) {
                    // Chão com estilo "plataforma mágica"
                    this.ctx.fillStyle = '#1c0e3a';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#4e3a8e';
                    this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            });
        });

        // 3. Entidades (Recorte de Sprite)
        this.entities.forEach(e => {
            if (e.sprite && e.sprite.complete && e.sprite.naturalWidth > 0) {
                // Desenha apenas 1/4 da sheet (assumindo sheets 2x2 ou 4x? para boss)
                const sw = e.sprite.width / (e instanceof Player ? 1 : 2); // Nando é 1 per sheet as vezes
                if (e instanceof Boss || e.type === 'danilo') {
                    // Danilo é sheet 4x2 ou algo assim. Vamos pegar um frame 128x128 aproximado
                    const fW = 128; const fH = 128;
                    this.ctx.drawImage(e.sprite, e.frameX * fW, e.frameY * fH, fW, fH, e.position.x, e.position.y, e.size.x, e.size.y);
                } else {
                    // Outros
                    this.ctx.drawImage(e.sprite, e.position.x, e.position.y, e.size.x, e.size.y);
                }
            } else {
                this.ctx.fillStyle = e.color;
                this.ctx.fillRect(e.position.x, e.position.y, e.size.x, e.size.y);
            }
        });

        this.ctx.restore();
    }
}
