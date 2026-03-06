import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

const level1 = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = level1;

const player = new Player(100, 300);
engine.entities.push(player);

engine.entities.push(new Enemy(600, 300, 'petista'));
engine.entities.push(new Enemy(1000, 200, 'felina'));
engine.entities.push(new Boss(1500, 200));

const originalUpdate = engine.update;
engine.update = function (dt) {
    player.handleInput(keys, engine);

    this.entities.forEach(entity => {
        if (entity instanceof Boss) {
            entity.update(dt, 0, engine);
        }
    });

    engine.camera.x = player.position.x - engine.canvas.width / 2;
    engine.camera.y = player.position.y - engine.canvas.height / 2;

    if (engine.camera.y > 0) engine.camera.y = 0;

    engine.entities.forEach((entity, index) => {
        if (entity instanceof Enemy && !(entity instanceof Boss)) {
            const pb = player.bounds;
            const eb = entity.bounds;

            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {
                if (player.velocity.y > 0 && pb.bottom < eb.top + 20) {
                    entity.stun(1000);
                    player.velocity.y = -0.4;
                    this.entities.splice(index, 1);
                }
            }
        }
    });

    originalUpdate.call(engine, dt);
};

engine.start();

console.log("Super Nando Moura Adventure Initialized");
