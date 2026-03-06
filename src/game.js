import { GameObject, Vector2 } from './engine.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 64, 64);
        this.color = '#FFD700'; // Dourado Mago
        this.speed = 0.4;
        this.jumpForce = -0.9;
        this.canGrito = true;

        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
    }

    handleInput(keys, engine) {
        if (keys['ArrowLeft'] || keys['a']) this.velocity.x = -this.speed;
        else if (keys['ArrowRight'] || keys['d']) this.velocity.x = this.speed;
        else this.velocity.x *= 0.8;

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
        if (hud) hud.innerText = 'MAGIA: Canalizando Ódio...';

        engine.entities.forEach(e => {
            if (e instanceof Enemy) {
                const d = Math.abs(e.position.x - this.position.x);
                if (d < 300) {
                    e.isStunned = true;
                    e.velocity.x = (e.position.x > this.position.x ? 2 : -2);
                    e.velocity.y = -0.4 * Math.sign(engine.gravity.y);
                    setTimeout(() => e.isStunned = false, 3000);
                }
            }
        });

        document.body.classList.add('shaking');
        setTimeout(() => {
            document.body.classList.remove('shaking');
            if (hud) hud.innerText = 'MAGIA: Pronto para Julgar';
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
        this.speed = type === 'petista' ? 0.08 : 0.2;

        this.sprite = new Image();
        this.sprite.src = `assets/${type}.png`;
    }

    update(dt, gravity) {
        if (!this.isStunned) {
            this.velocity.x = -this.speed;
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
        this.color = '#00FFFF';
        this.timer = 0;
    }

    update(dt, gravity, engine) {
        this.timer += dt;
        if (this.timer > 5000) {
            engine.gravity.y *= -1;
            this.timer = 0;
            console.log("GRAVIDADE INVERTIDA!");
        }
        super.update(dt, gravity);
    }
}
