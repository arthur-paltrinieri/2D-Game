import { GameObject, Vector2 } from './engine.js';
import { ASSETS } from './assets_data.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 50, 64); // Tamanho ajustado para o sprite do mago
        this.speed = 0.35;
        this.jumpForce = -0.7;
        this.canMagic = true;
        this.sprite.src = ASSETS.player;
    }

    handleInput(keys, engine) {
        if (keys['a'] || keys['ArrowLeft']) {
            this.velocity.x = -this.speed;
            this.facing = -1;
        } else if (keys['d'] || keys['ArrowRight']) {
            this.velocity.x = this.speed;
            this.facing = 1;
        } else {
            this.velocity.x *= 0.8;
        }

        const gDir = Math.sign(engine.gravity.y);
        if ((keys['w'] || keys[' '] || keys['ArrowUp']) && this.isGrounded) {
            this.velocity.y = this.jumpForce * gDir;
            this.isGrounded = false;
        }

        if (keys['Shift'] && this.canMagic) this.castMagic(engine);
    }

    castMagic(engine) {
        this.canMagic = false;
        const hud = document.getElementById('grito-cooldown');
        if (hud) hud.innerText = '🔥 EXURGE DOMINE! 🔥';

        document.body.classList.add('shaking');

        engine.entities.forEach(e => {
            if (e instanceof Enemy && !(e instanceof Boss)) {
                const dx = e.position.x - this.position.x;
                if (Math.abs(dx) < 350) {
                    e.isStunned = true;
                    e.velocity.x = Math.sign(dx) * 1.5;
                    e.velocity.y = -0.3 * Math.sign(engine.gravity.y);
                    setTimeout(() => e.isStunned = false, 2500);
                }
            }
        });

        setTimeout(() => {
            document.body.classList.remove('shaking');
            if (hud) hud.innerText = 'MAGIA: PRONTA';
            this.canMagic = true;
        }, 3000);
    }
}

export class Enemy extends GameObject {
    constructor(x, y, type) {
        super(x, y, 50, 50);
        this.type = type;
        this.isStunned = false;
        this.speed = type === 'petista' ? 0.08 : 0.18;
        this.dir = 1;
        this.sprite.src = ASSETS[type];
    }

    update(dt, gravity) {
        if (!this.isStunned) {
            this.velocity.x = this.speed * this.dir;
            this.facing = this.dir;
        } else {
            this.velocity.x *= 0.98;
        }
        super.update(dt, gravity);
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'danilo');
        this.size = new Vector2(100, 100);
        this.timer = 0;
        this.sprite.src = ASSETS.danilo;
    }

    update(dt, gravity, engine) {
        this.timer += dt;

        // Perseguição suave ao player
        const player = engine.entities.find(e => e instanceof Player);
        if (player && !this.isStunned) {
            this.dir = player.position.x > this.position.x ? 1 : -1;
        }

        // Troca de Gravidade a cada 6 segundos
        if (this.timer > 6000) {
            engine.gravity.y *= -1;
            this.timer = 0;
            const hud = document.getElementById('grito-cooldown');
            if (hud) {
                hud.innerText = "🌀 GRAVIDADE INVERTIDA! 🌀";
                setTimeout(() => { if (this.canMagic) hud.innerText = 'MAGIA: PRONTA'; }, 1000);
            }
            document.body.classList.add('gravity-swap');
            setTimeout(() => document.body.classList.remove('gravity-swap'), 400);
        }

        super.update(dt, gravity);
    }
}
