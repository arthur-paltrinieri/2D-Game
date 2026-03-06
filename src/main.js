import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

// Nível: 1 = Bloco, 0 = Ar
const world = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Teto para o Anti-gravity
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = world;

const player = new Player(100, 300);
engine.entities.push(player);

// Inimigos e Boss
engine.entities.push(new Enemy(800, 380, 'petista'));
engine.entities.push(new Enemy(1200, 380, 'felina'));
engine.entities.push(new Boss(2000, 300));

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Loop de lógica customizada
const coreUpdate = engine.update.bind(engine);
engine.update = (dt) => {
    player.handleInput(keys, engine);

    // Boss especial
    engine.entities.forEach(e => {
        if (e instanceof Boss) e.update(dt, engine.gravity, engine);

        // Colisão Player vs Inimigo
        if (e instanceof Enemy && !(e instanceof Boss) && !e.isStunned) {
            const pb = player.bounds;
            const eb = e.bounds;
            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                // Pular na cabeça
                if (player.velocity.y > 0 && pb.bottom < eb.top + 20) {
                    e.isStunned = true;
                    player.velocity.y = -0.6;
                    setTimeout(() => {
                        engine.entities = engine.entities.filter(ent => ent !== e);
                    }, 200);
                }
            }
        }
    });

    coreUpdate(dt);

    // Câmera
    engine.camera.x = player.position.x - engine.canvas.width / 2;
    engine.camera.y = player.position.y - engine.canvas.height / 2;
};

engine.start();
console.log("MAGO INICIALIZADO!");
