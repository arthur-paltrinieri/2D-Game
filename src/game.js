import { GameObject, Vector2 } from './engine.js';
import { ASSETS } from './assets_data.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 64);
        this.speed = 0.42;
        this.jumpForce = -0.75;
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
            this.velocity.x *= 0.82;
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
        if (hud) hud.innerText = '🗣️ O GRITO DO MESTRE! 🗣️';

        document.body.classList.add('shaking');

        engine.entities.forEach(e => {
            if (e instanceof Enemy && !(e instanceof Boss)) {
                const dx = e.position.x - this.position.x;
                const dy = e.position.y - this.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 400) {
                    e.isStunned = true;
                    // Joga o inimigo longe baseado na direção
                    e.velocity.x = Math.sign(dx) * 2.5;
                    e.velocity.y = -0.4 * Math.sign(engine.gravity.y);
                    setTimeout(() => e.isStunned = false, 3000);
                }
            }
        });

        setTimeout(() => {
            document.body.classList.remove('shaking');
            if (hud) hud.innerText = 'O GRITO: PRONTO';
            this.canMagic = true;
        }, 3000);
    }
}

export class Enemy extends GameObject {
    constructor(x, y, type) {
        super(x, y, 40, 50);
        this.type = type;
        this.isStunned = false;
        this.speed = type === 'petista' ? 0.08 : 0.16;
        this.chaseSpeed = type === 'petista' ? 0.12 : 0.22;
        this.sprite.src = ASSETS[type];
        this.patrolDir = 1;
        this.detectionRange = 450;
    }

    update(dt, gravity, engine) {
        if (!this.isStunned) {
            const player = engine.entities.find(e => e instanceof Player);
            if (player) {
                const dx = player.position.x - this.position.x;
                const dy = player.position.y - this.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // IA Agressiva: Se o player estiver no range, persegue
                if (dist < this.detectionRange) {
                    this.velocity.x = Math.sign(dx) * this.chaseSpeed;
                    this.facing = Math.sign(dx);
                    this.state = 'chase';

                    // Pequeno pulo se o jogador estiver acima para tentar alcançar
                    if (this.isGrounded && player.position.y < this.position.y - 100 && Math.random() < 0.02) {
                        this.velocity.y = -0.5 * Math.sign(engine.gravity.y);
                    }
                } else {
                    // Patrulha normal se não encontrar o player
                    this.velocity.x = this.speed * this.patrolDir;
                    this.facing = this.patrolDir;
                    this.state = 'patrol';
                }
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
        this.size = new Vector2(100, 120);
        this.renderSize = new Vector2(150, 150);
        this.timer = 0;
        this.sprite.src = ASSETS.danilo;
        this.detectionRange = 2000; // Sempre detecta o player
    }

    update(dt, gravity, engine) {
        this.timer += dt;

        // Troca de Gravidade agressiva e letal
        if (this.timer > 5000) {
            engine.gravity.y *= -1;
            this.timer = 0;
            const hud = document.getElementById('grito-cooldown');
            if (hud) hud.innerText = "🌀 ANTIGRAVIDADE ATIVADA! 🌀";
            document.body.classList.add('gravity-swap');
            setTimeout(() => document.body.classList.remove('gravity-swap'), 500);
        }

        super.update(dt, gravity, engine);
    }
}
