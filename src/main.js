import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

// Nível: 1 = Bloco, 0 = Ar
const world = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = world;

const player = new Player(100, 300);
engine.entities.push(player);

engine.entities.push(new Enemy(800, 300, 'petista'));
engine.entities.push(new Enemy(1200, 300, 'felina'));
engine.entities.push(new Enemy(1600, 300, 'petista'));
engine.entities.push(new Boss(2200, 300));

const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

const originalUpdate = engine.update.bind(engine);
engine.update = (dt) => {
    player.handleInput(keys, engine);

    // Lógica customizada de Boss e combate
    for (let i = 0; i < engine.entities.length; i++) {
        const e = engine.entities[i];

        if (e instanceof Boss) e.update(dt, engine.gravity, engine);

        // Colisões entre Player e Inimigos (Head Jump)
        if (e instanceof Enemy && !(e instanceof Boss) && !e.isStunned && !e.toRemove) {
            const pb = player.bounds;
            const eb = e.bounds;

            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                // Apenas se cair por cima (dependendo da gravidade)
                const isFallingOnHead = (engine.gravity.y > 0 && player.velocity.y > 0 && pb.bottom < eb.top + 30) ||
                    (engine.gravity.y < 0 && player.velocity.y < 0 && pb.top > eb.bottom - 30);

                if (isFallingOnHead) {
                    e.toRemove = true; // Marca para remoção segura no próximo frame
                    player.velocity.y = -0.5 * Math.sign(engine.gravity.y);
                }
            }
        }
    }

    originalUpdate(dt);

    // Câmera suave
    engine.camera.x += (player.position.x - engine.canvas.width / 2 - engine.camera.x) * 0.1;
    engine.camera.y += (player.position.y - engine.canvas.height / 2 - engine.camera.y) * 0.1;
};

engine.start();
console.log("SUPER MAGO NANDO MOURA PRONTO.");
