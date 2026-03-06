import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

// Nível Expandido para aventura
// 1 = Bloco Sólido, 0 = Espaço Vazio
const world = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Teto
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Chão
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = world;

const player = new Player(100, 380);
engine.entities.push(player);

// Posicionamento estratégico dos inimigos
engine.entities.push(new Enemy(600, 380, 'petista'));
engine.entities.push(new Enemy(1000, 380, 'felina'));
engine.entities.push(new Enemy(1400, 380, 'petista'));
engine.entities.push(new Enemy(1800, 380, 'felina'));

// Boss Final
engine.entities.push(new Boss(2400, 300));

const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

const originalUpdate = engine.update.bind(engine);
engine.update = (dt) => {
    player.handleInput(keys, engine);

    // Inimigos: Inverter direção se chegarem perto da borda de uma plataforma ou parede
    engine.entities.forEach(e => {
        if (e instanceof Enemy && !(e instanceof Boss)) {
            // Verificar colisão lateral simples
            if (e.velocity.x === 0 && e.isGrounded) e.dir *= -1;
        }

        // Colisão Player vs Inimigos (Head Jump)
        if (e instanceof Enemy && !(e instanceof Boss) && !e.isStunned && !e.toRemove) {
            const pb = player.bounds;
            const eb = e.bounds;
            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                const isFalling = (engine.gravity.y > 0 && player.velocity.y > 0 && pb.bottom < eb.top + 20) ||
                    (engine.gravity.y < 0 && player.velocity.y < 0 && pb.top > eb.bottom - 20);
                if (isFalling) {
                    e.toRemove = true;
                    player.velocity.y = -0.6 * Math.sign(engine.gravity.y);
                } else {
                    // Dano ao player (opcional, por enquanto só empurra)
                    player.velocity.x = (player.position.x > e.position.x ? 0.5 : -0.5);
                }
            }
        }
    });

    originalUpdate(dt);

    // Câmera dinâmica
    engine.camera.x += (player.position.x - engine.canvas.width / 2 - engine.camera.x) * 0.05;
    engine.camera.y += (player.position.y - engine.canvas.height / 2 - engine.camera.y) * 0.05;
};

engine.start();
console.log("GAME START: ADVENTURE MODE");
