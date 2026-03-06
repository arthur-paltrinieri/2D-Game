import { GameObject, Vector2 } from './engine.js';

export class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 64, 64);
        this.speed = 0.5;
        this.jumpForce = -0.8;
        this.canGrito = true;
        this.gritoCooldown = 3000;
        this.isInvincible = false;
        this.baseSpeed = 0.5;

        this.sprite = new Image();
        this.sprite.src = 'assets/player.png';
    }

    handleInput(keys, engine) {
        if (keys['ArrowLeft'] || keys['a']) {
            this.velocity.x = -this.speed;
        } else if (keys['ArrowRight'] || keys['d']) {
            this.velocity.x = this.speed;
        } else {
            this.velocity.x *= 0.8;
        }

        const gravDir = Math.sign(engine.gravity.y);
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && this.isGrounded) {
            this.velocity.y = this.jumpForce * gravDir;
            this.isGrounded = false;
        }

        if (keys['Shift'] && this.canGrito) {
            this.performGrito(engine);
        }
    }

    performGrito(engine) {
        this.canGrito = false;
        const cooldownEl = document.getElementById('grito-cooldown');
        if (cooldownEl) {
            cooldownEl.innerText = 'O GRITO: Recarregando...';
            cooldownEl.style.opacity = '0.5';
        }

        engine.entities.forEach(entity => {
            if (entity instanceof Enemy) {
                const dist = Math.abs(entity.position.x - this.position.x);
                if (dist < 200) {
                    entity.stun(2000);
                    entity.velocity.x = (entity.position.x > this.position.x ? 1 : -1) * 0.8;
                }
            }
        });

        document.body.classList.add('shaking');
        setTimeout(() => document.body.classList.remove('shaking'), 500);

        setTimeout(() => {
            this.canGrito = true;
            if (cooldownEl) {
                cooldownEl.innerText = 'O GRITO: Pronto';
                cooldownEl.style.opacity = '1';
            }
        }, this.gritoCooldown);
    }
}

export class Enemy extends GameObject {
    constructor(x, y, type) {
        super(x, y, 64, 64);
        this.type = type;
        this.isStunned = false;
        this.sprite = new Image();
        this.sprite.src = `assets/${type}.png`;

        if (type === 'petista') {
            this.speed = 0.1;
        } else if (type === 'felina') {
            this.speed = 0.3;
            this.jumpTimer = 0;
        }
    }

    update(dt, gravity) {
        if (this.isStunned) {
            this.velocity.x *= 0.9;
            super.update(dt, gravity);
            return;
        }

        this.velocity.x = -this.speed;

        if (this.type === 'felina' && this.isGrounded) {
            this.jumpTimer += dt;
            if (this.jumpTimer > 2000) {
                this.velocity.y = -0.6;
                this.jumpTimer = 0;
            }
        }

        super.update(dt, gravity);
    }

    stun(duration) {
        this.isStunned = true;
        setTimeout(() => this.isStunned = false, duration);
    }
}

export class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'danilo');
        this.size = new Vector2(128, 128);
        this.swapTimer = 0;
    }

    update(dt, gravity, engine) {
        if (this.isStunned) return;

        this.swapTimer += dt;
        if (this.swapTimer > 5000) {
            engine.swapGravity();
            this.swapTimer = 0;
        }

        super.update(dt, gravity);
    }
}
