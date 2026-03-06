import { GameObject, Vector2 } from './engine.js';
import { ASSETS } from './assets_data.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 64, 64);
        this.color = '#FFD700';
        this.speed = 0.45;
        this.jumpForce = -0.95;
        this.canGrito = true;
        this.sprite.src = ASSETS.player;
        this.frameCount = 1; // Ajustável se o sprite for sheet
    }

    handleInput(keys, engine) {
        if (keys['ArrowLeft'] || keys['a']) this.velocity.x = -this.speed;
        else if (keys['ArrowRight'] || keys['d']) this.velocity.x = this.speed;
        else this.velocity.x *= 0.85;

        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && this.isGrounded) {
            this.velocity.y = this.jumpForce * Math.sign(engine.gravity.y);
            this.isGrounded = false;
        }

        if (keys['Shift'] && this.canGrito) this.castMagic(engine);
    }

    castMagic(engine) {
        this.canGrito = false;
        const hud = document.getElementById('grito-cooldown');
        if (hud) {
            hud.innerText = 'CANALIZANDO ÓDIO...';
            hud.classList.add('active');
        }

        engine.entities.forEach(e => {
            if (e instanceof Enemy && !(e instanceof Boss)) {
                const dist = Math.abs(e.position.x - this.position.x);
                if (dist < 400) {
                    e.isStunned = true;
                    e.velocity.x = (e.position.x > this.position.x ? 4 : -4);
                    e.velocity.y = -0.6 * Math.sign(engine.gravity.y);
                    setTimeout(() => { e.isStunned = false; }, 3000);
                }
            }
        });

        document.body.classList.add('shaking');
        setTimeout(() => {
            document.body.classList.remove('shaking');
            if (hud) {
                hud.innerText = 'PRONTO PARA JULGAR';
                hud.classList.remove('active');
            }
            this.canGrito = true;
        }, 3000);
    }
}

export class Enemy extends GameObject {
    constructor(x, y, type) {
        super(x, y, 64, 64);
        this.type = type;
        this.isStunned = false;
        this.color = type === 'petista' ? '#FF0000' : '#FFFF00';
        this.speed = type === 'petista' ? 0.08 : 0.15;
        this.dir = 1;
        this.sprite.src = ASSETS[type];
        this.frameCount = 1;
    }

    update(dt, gravity) {
        if (!this.isStunned) {
            this.velocity.x = this.speed * this.dir;

            // Simples IA de patrulha: inverte se colidir lateralmente
            if (Math.abs(this.velocity.x) < 0.01 && this.isGrounded) {
                // Provavelmente bateu em algo (ou o atrito parou)
                // Mas GameObject vX*0.85 não existe pra Enemy sem input
            }
        } else {
            this.velocity.x *= 0.95;
        }
        super.update(dt, gravity);
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'danilo');
        this.size = new Vector2(128, 128);
        this.timer = 0;
        this.sprite.src = ASSETS.danilo;
        this.frameCount = 4; // Danilo é sheet
    }

    update(dt, gravity, engine) {
        this.timer += dt;
        if (this.timer > 5000) {
            engine.gravity.y *= -1;
            this.timer = 0;
            document.body.classList.add('gravity-swap');
            setTimeout(() => document.body.classList.remove('gravity-swap'), 300);
        }

        // Movimentação básica do Boss rumo ao jogador
        const player = engine.entities.find(e => e instanceof Player);
        if (player && !this.isStunned) {
            this.dir = player.position.x > this.position.x ? 1 : -1;
            this.velocity.x = 0.05 * this.dir;
        }

        super.update(dt, gravity);
    }
}
