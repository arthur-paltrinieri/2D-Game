import { GameObject, Vector2 } from './engine.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 64, 64);
        this.color = '#FFD700';
        this.speed = 0.45;
        this.jumpForce = -0.95;
        this.canGrito = true;

        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
        // Se a imagem falhar localmente, buscar do GitHub (backup)
        this.sprite.onerror = () => {
            if (!this.sprite.src.includes('raw.githubusercontent')) {
                this.sprite.src = 'https://raw.githubusercontent.com/arthur-paltrinieri/2D-Game/main/assets/player.png';
            }
        };
    }

    handleInput(keys, engine) {
        if (keys['ArrowLeft'] || keys['a']) this.velocity.x = -this.speed;
        else if (keys['ArrowRight'] || keys['d']) this.velocity.x = this.speed;
        else this.velocity.x *= 0.85;

        const gDir = Math.sign(engine.gravity.y);
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && this.isGrounded) {
            this.velocity.y = this.jumpForce * gDir;
            this.isGrounded = false;
        }

        if (keys['Shift'] && this.canGrito) this.castMagic(engine);
    }

    castMagic(engine) {
        this.canGrito = false;
        const hud = document.getElementById('grito-cooldown');
        if (hud) {
            hud.innerText = 'MAGIA: Canalizando Ódio...';
            hud.classList.add('active');
        }

        engine.entities.forEach(e => {
            if (e instanceof Enemy) {
                const d = Math.abs(e.position.x - this.position.x);
                if (d < 350) {
                    e.isStunned = true;
                    e.velocity.x = (e.position.x > this.position.x ? 2.5 : -2.5);
                    e.velocity.y = -0.5 * Math.sign(engine.gravity.y);
                    setTimeout(() => e.isStunned = false, 3000);
                }
            }
        });

        document.body.classList.add('shaking');
        setTimeout(() => {
            document.body.classList.remove('shaking');
            if (hud) {
                hud.innerText = 'MAGIA: Pronto para Julgar';
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
        this.speed = type === 'petista' ? 0.08 : 0.22;

        this.sprite = new Image();
        this.sprite.src = `assets/${type}.png`;
        this.sprite.onerror = () => {
            if (!this.sprite.src.includes('raw.githubusercontent')) {
                this.sprite.src = `https://raw.githubusercontent.com/arthur-paltrinieri/2D-Game/main/assets/${type}.png`;
            }
        };
    }

    update(dt, gravity) {
        if (!this.isStunned) {
            this.velocity.x = -this.speed;
        } else {
            this.velocity.x *= 0.98; // Desaceleração mais suave no stun
        }
        super.update(dt, gravity);
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'danilo');
        this.size = new Vector2(128, 128);
        this.color = '#00FFFF';
        this.timer = 0;
    }

    update(dt, gravity, engine) {
        this.timer += dt;
        if (this.timer > 6000) {
            engine.gravity.y *= -1;
            this.timer = 0;
            // Efeito visual de inversão
            document.body.classList.add('gravity-swap');
            setTimeout(() => document.body.classList.remove('gravity-swap'), 500);
        }
        super.update(dt, gravity);
    }
}
