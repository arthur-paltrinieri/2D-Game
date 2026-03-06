import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

// Nível desenhado para combate (Biblioteca Abandonada do Mestre)
const world = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = world;

const player = new Player(100, 380);
engine.entities.push(player);

// Inimigos em pontos de patrulha
engine.entities.push(new Enemy(600, 380, 'petista'));
engine.entities.push(new Enemy(1200, 380, 'felina'));
engine.entities.push(new Enemy(1800, 380, 'petista'));
engine.entities.push(new Enemy(2400, 380, 'felina'));

// Boss Final
const danilo = new Boss(3000, 350);
engine.entities.push(danilo);

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

const originalUpdate = engine.update.bind(engine);
engine.update = (dt) => {
    player.handleInput(keys, engine);

    // Lógica Avançada de Combate e IA
    engine.entities.forEach(e => {
        if (e instanceof Enemy) {
            e.update(dt, engine.gravity, engine);

            // Inverter patrulha se bater em parede (não se a IA estiver perseguindo)
            if (e.velocity.x === 0 && e.isGrounded && e.state === 'patrol') {
                e.patrolDir *= -1;
            }
        }

        // Sistema de Morte do Inimigo: Pulo na Cabeça
        if (e instanceof Enemy && !(e instanceof Boss) && !e.toRemove && !e.isStunned) {
            const pb = player.bounds;
            const eb = e.bounds;
            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                const isFalling = (engine.gravity.y > 0 && player.velocity.y > 0 && pb.bottom < eb.top + 20) ||
                    (engine.gravity.y < 0 && player.velocity.y < 0 && pb.top > eb.bottom - 20);

                if (isFalling) {
                    e.toRemove = true;
                    player.velocity.y = -0.55 * Math.sign(engine.gravity.y);
                } else {
                    // Dano ao Player: Joga o player para trás
                    player.velocity.x = (player.position.x > e.position.x ? 2 : -2);
                    player.velocity.y = -0.3 * Math.sign(engine.gravity.y);
                }
            }
        }
    });

    originalUpdate(dt);

    // Câmera Suave e Inteligente
    engine.camera.x += (player.position.x - engine.canvas.width / 2 - engine.camera.x) * 0.08;
    engine.camera.y += (player.position.y - engine.canvas.height / 2 - engine.camera.y) * 0.08;
};

engine.start();
console.log("MAGO NANDO MOURA: ADVENTURE RELOADED");
