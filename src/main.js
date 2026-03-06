import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

// Nível: 1 = Sólido, 0 = Vazio
// Nível plano com plataformas elevadas e teto selado
const world = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

engine.tileMap = world;

const player = new Player(100, 380);
engine.entities.push(player);

// População de inimigos
engine.entities.push(new Enemy(800, 380, 'petista'));
engine.entities.push(new Enemy(1200, 380, 'felina'));
engine.entities.push(new Enemy(1600, 380, 'petista'));
// Boss final
engine.entities.push(new Boss(2400, 350));

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

const originalUpdate = engine.update.bind(engine);
engine.update = (dt) => {
    player.handleInput(keys, engine);

    // Lógica IA Inimigos
    engine.entities.forEach(e => {
        if (e instanceof Enemy && !(e instanceof Boss)) {
            // Inverter se bater em algo ou chegar em bordas (simplificado: inverte se colidir com parede)
            if (e.velocity.x === 0 && !e.isStunned) e.dir *= -1;
        }

        // Sistema de Pulo na Cabeça (Mario Style)
        if (e instanceof Enemy && !(e instanceof Boss) && !e.toRemove && !e.isStunned) {
            const pb = player.bounds;
            const eb = e.bounds;
            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                // Depende da gravidade - saltar na cabeça mata o inimigo
                const headJump = (engine.gravity.y > 0 && player.velocity.y > 0 && pb.bottom < eb.top + 20) ||
                    (engine.gravity.y < 0 && player.velocity.y < 0 && pb.top > eb.bottom - 20);

                if (headJump) {
                    e.toRemove = true;
                    player.velocity.y = -0.5 * Math.sign(engine.gravity.y);
                }
            }
        }
    });

    originalUpdate(dt);

    // Câmera Suave
    engine.camera.x += (player.position.x - engine.canvas.width / 2 - engine.camera.x) * 0.1;
    engine.camera.y += (player.position.y - engine.canvas.height / 2 - engine.camera.y) * 0.1;
};

engine.start();
console.log("GAME ENGINE 2.0 STABLE RUNNING");
