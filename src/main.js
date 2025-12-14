import { Camera } from './camera.js';
import { GameManager } from './gameManager.js';

async function main() {
    try {
        console.log("Starting Main...");
        // alert("Requesting Camera Access..."); // Optional, might be annoying if loop

        const camera = new Camera();
        await camera.init();
        console.log("Camera Initialized");

        const gameManager = new GameManager(camera);
        console.log("Game Manager Initialized");
        // Optional: Start loop or wait for user interaction to start
    } catch (e) {
        alert("Startup Error: " + e.message);
        console.error(e);
    }
}

window.onerror = function (msg, url, line) {
    alert("Error: " + msg + "\nLine: " + line);
};

window.addEventListener('load', main);
