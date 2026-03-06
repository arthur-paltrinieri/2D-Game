import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

// Nível focado em combate e bibliotecas
const world = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = world;

const player = new Player(100, 310);
engine.entities.push(player);

// Gerar inimigos
engine.entities.push(new Enemy(600, 310, 'petista'));
engine.entities.push(new Enemy(1200, 310, 'felina'));
engine.entities.push(new Enemy(1600, 310, 'petista'));
engine.entities.push(new Enemy(2000, 310, 'felina'));

// Boss Final (Danilo)
engine.entities.push(new Boss(2800, 310));

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

const originalUpdate = engine.update.bind(engine);
engine.update = (dt) => {
    if (player.isDead) {
        originalUpdate(dt);
        return;
    }

    player.handleInput(keys, engine);

    engine.entities.forEach(e => {
        if (e instanceof Enemy) {
            e.update(dt, engine.gravity, engine);

            // Inverter patrulha em colisões laterais se não estiver em perseguição
            if (e.velocity.x === 0 && e.isGrounded && e.state === 'patrol') {
                e.dir *= -1;
            }
        }

        // Combate Refinado
        if (e instanceof Enemy && !e.toRemove && !e.isStunned) {
            const pb = player.bounds;
            const eb = e.bounds;

            // Verificação de Intersecção AABB
            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                // 1. Matar Inimigo (Pulo na Cabeça)
                const headJump = (engine.gravity.y > 0 && player.velocity.y > 0 && pb.bottom < eb.top + 25) ||
                    (engine.gravity.y < 0 && player.velocity.y < 0 && pb.top > eb.bottom - 25);

                if (headJump && !(e instanceof Boss)) {
                    e.toRemove = true;
                    player.velocity.y = -0.6 * Math.sign(engine.gravity.y);
                } else {
                    // 2. Morte do Player (Colisão Lateral)
                    player.die();
                }
            }
        }
    });

    originalUpdate(dt);

    // Câmera Centralizada no Player
    engine.camera.x += (player.position.x - engine.canvas.width / 2 - engine.camera.x) * 0.1;
    engine.camera.y += (player.position.y - engine.canvas.height / 2 - engine.camera.y) * 0.1;
};

engine.start();
console.log("GAME ENGINE 3.0: ANIMATIONS & AI READY");
