import { Engine } from './engine.js';
import { Player, Enemy, Boss } from './game.js';

const engine = new Engine('game-canvas');

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Build a more robust test level
// 1 = solid block, 0 = empty space
const level1 = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

engine.tileMap = level1;

const player = new Player(100, 500);
engine.entities.push(player);

// Monsters
engine.entities.push(new Enemy(800, 500, 'petista'));
engine.entities.push(new Enemy(1200, 500, 'petista'));
engine.entities.push(new Enemy(1500, 400, 'felina'));
engine.entities.push(new Boss(2500, 400));

// Logic hook
const originalUpdate = engine.update;
engine.update = function (dt) {
    // 1. Inputs
    player.handleInput(keys, engine);

    // 2. Specialized Entity Logic
    this.entities.forEach(entity => {
        if (entity instanceof Boss) {
            entity.update(dt, this.gravity, engine);
        }
    });

    // 3. Physics & Collision (Engine call)
    originalUpdate.call(engine, dt);

    // 4. Camera Follow (Smooth-ish)
    const targetCamX = player.position.x - engine.canvas.width / 2;
    const targetCamY = player.position.y - engine.canvas.height / 2;

    engine.camera.x += (targetCamX - engine.camera.x) * 0.1;
    // Clamp camera.y to keep the floor visible
    engine.camera.y = Math.min(Math.max(targetCamY, -500), 200);

    // 5. Combat Logic (Jump on heads)
    engine.entities.forEach((entity, index) => {
        if (entity instanceof Enemy && !(entity instanceof Boss)) {
            const pb = player.bounds;
            const eb = entity.bounds;

            const gravDir = Math.sign(engine.gravity.y);

            // Simple collision check
            if (pb.right > eb.left && pb.left < eb.right && pb.bottom > eb.top && pb.top < eb.bottom) {

                // Jumping on head check
                let successfulHeadJump = false;
                if (gravDir > 0) { // Standard Gravity
                    if (player.velocity.y > 0 && pb.bottom < eb.top + 20) successfulHeadJump = true;
                } else { // Inverted Gravity
                    if (player.velocity.y < 0 && pb.top > eb.bottom - 20) successfulHeadJump = true;
                }

                if (successfulHeadJump) {
                    entity.stun(1000);
                    player.velocity.y = -0.6 * gravDir; // Bounce back
                    setTimeout(() => {
                        const i = this.entities.indexOf(entity);
                        if (i > -1) this.entities.splice(i, 1);
                    }, 100);
                } else if (!player.isInvincible) {
                    // Reset player on hit (placeholder for damage)
                    // player.position.x = 100;
                    // player.position.y = 500;
                }
            }
        }
    });
};

// INITIALIZE
engine.start();

console.log("Super Nando Moura Adventure: LÓGICA REFORMULADA");
