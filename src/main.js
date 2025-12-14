import { Camera } from './camera.js';
import { GameManager } from './gameManager.js';

async function main() {
    const camera = new Camera();
    await camera.init();

    const gameManager = new GameManager(camera);
    // Optional: Start loop or wait for user interaction to start
    console.log("Game Initialized");
}

window.addEventListener('load', main);
