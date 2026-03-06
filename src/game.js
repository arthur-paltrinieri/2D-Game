import { GameObject, Vector2 } from './engine.js';
import { ASSETS } from './assets_data.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 64);
        this.renderSize = new Vector2(64, 80);
        this.speed = 0.45;
        this.jumpForce = -0.85;
        this.canMagic = true;
        this.sprite.src = ASSETS.player;
        this.isDead = false;

        // Setup de animação (Mago individual ou sheet)
        this.maxFrames = 1;
    }

    handleInput(keys, engine) {
        if (this.isDead) return;

        if (keys['a'] || keys['ArrowLeft']) {
            this.velocity.x = -this.speed;
            this.facing = -1;
        } else if (keys['d'] || keys['ArrowRight']) {
            this.velocity.x = this.speed;
            this.facing = 1;
        } else {
            this.velocity.x *= 0.85;
        }

        if ((keys['w'] || keys[' '] || keys['ArrowUp']) && this.isGrounded) {
            this.velocity.y = this.jumpForce * Math.sign(engine.gravity.y);
            this.isGrounded = false;
        }

        if (keys['Shift'] && this.canMagic) this.castMagic(engine);
    }

    castMagic(engine) {
        this.canMagic = false;
        const hud = document.getElementById('grito-cooldown');
        if (hud) {
            hud.innerText = '🔥 REFUTADO COM SUCESSO! 🔥';
            hud.classList.add('active');
        }

        document.body.classList.add('shaking');

        engine.entities.forEach(e => {
            if (e instanceof Enemy && !(e instanceof Boss)) {
                const dist = Math.abs(e.position.x - this.position.x);
                if (dist < 400) {
                    e.isStunned = true;
                    e.velocity.x = (e.position.x > this.position.x ? 3.5 : -3.5);
                    e.velocity.y = -0.3 * Math.sign(engine.gravity.y);
                    setTimeout(() => e.isStunned = false, 3000);
                }
            }
        });

        setTimeout(() => {
            document.body.classList.remove('shaking');
            if (hud) {
                hud.innerText = 'MAGIA: PRONTA';
                hud.classList.remove('active');
            }
            this.canMagic = true;
        }, 2000);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.velocity.y = -0.5;
        const hud = document.getElementById('grito-cooldown');
        if (hud) hud.innerText = '☠️ VOCÊ FOI SILENCIADO! ☠️';
        setTimeout(() => location.reload(), 2000);
    }
}

export class Enemy extends GameObject {
    constructor(x, y, type) {
        super(x, y, 40, 56);
        this.renderSize = new Vector2(64, 64);
        this.type = type;
        this.isStunned = false;
        this.speed = type === 'petista' ? 0.09 : 0.21;
        this.dir = -1;
        this.sprite.src = ASSETS[type];

        // Setup de animação para os inimigos (assumindo que as sheets são 4x1)
        this.maxFrames = (type === 'danilo') ? 4 : 2;
    }

    update(dt, gravity, engine) {
        if (!this.isStunned && !this.toRemove) {
            this.velocity.x = this.speed * this.dir;
            this.facing = -this.dir; // Ajuste de flip proporcional à direção

            // Inverter direção se bater lateralmente ou chegar em abismos
            // (Verificação de parede baseada na velocidade travada pela colisão)
            if (Math.abs(this.velocity.x) < 0.01) {
                // Pequeno delay para inverter
            }
        } else {
            this.velocity.x *= 0.96;
        }
        super.update(dt, gravity);
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'danilo');
        this.size = new Vector2(100, 110);
        this.renderSize = new Vector2(140, 140);
        this.timer = 0;
        this.maxFrames = 4; // Danilo Gentili tem a sheet maior
    }

    update(dt, gravity, engine) {
        this.timer += dt;

        // IA de Perseguição Agressiva do Boss
        const player = engine.entities.find(e => e instanceof Player);
        if (player && !this.isStunned) {
            this.dir = (player.position.x > this.position.x) ? 1 : -1;
        }

        if (this.timer > 6000) {
            engine.gravity.y *= -1;
            this.timer = 0;
            document.body.classList.add('gravity-swap');
            setTimeout(() => document.body.classList.remove('gravity-swap'), 300);
        }

        super.update(dt, gravity, engine);
    }
}
