# 🎄 Christmas Party Game 🎅

A festive, webcam-based arcade game where you use your actual hands to catch ornaments, pack gifts, and chase reindeer! 

## Features
*   **🤲 Webcam Hand Tracking**: Play using your hands! No mouse or keyboard required during gameplay.
*   **🎵 Retro 8-Bit Music**: Procedurally generated Christmas carols that speed up as the game gets harder!
*   **🚀 3 Unique Rounds**:
    1.  **Christmas Tree**: Save the falling ornaments!
    2.  **Santa**: Catch falling gifts and put them back in Santa's Sleigh.
    3.  **Reindeer**: Catch the flying reindeer before they escape.
    4.  **Sleigh Formula 1**: Race your sleigh through the track!
    5.  **Christmas Pong**: Play tennis against Santa AI!
    6.  **Dragon Grinch**: Breathe fire to burn Christmas trees!
*   **⚡ Increasing Difficulty**: The game gets faster and faster as the 60-second timer ticks down.

## Tech Stack & Implementation Details

This game is built with performance and simplicity in mind, using standard web technologies and powerful ML libraries.

### Core
*   **HTML5 & Vanilla JavaScript**: No heavy frameworks (React/Vue/Angular) used. Direct DOM manipulation and Canvas API for maximum performance.
*   **CSS3**: Custom styling with Flexbox for layout.

### 🎥 Hand Tracking (Computer Vision)
The core interaction is powered by **Google MediaPipe Hands**, a high-fidelity hand tracking solution.
*   **Library**: `@mediapipe/hands`
*   **Mechanism**: It infers 21 3D landmarks of a hand from a single video frame. We use these landmarks to detect collisions with game elements (e.g., tip of the index finger).
*   **Documentation**: [MediaPipe Hands Solutions](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)

### 🔊 Audio Engine
*   **Web Audio API**: All music is generated *procedurally* in real-time using oscillators (Square waves for 8-bit sound). No mp3 files are loaded!
*   **Documentation**: [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## How to Play
1.  **Allow Camera Access**: When prompted, allow the browser to access your webcam.
2.  **Enter Name**: Type your name and click Start.
3.  **Use Your Hands**:
    *   Wave your hands in front of the camera.
    *   **Round 1**: Touch the falling items.
    *   **Round 2**: Grab the gift (touch/hover) and move your hand UP to the Sleigh to score.
    *   **Round 3**: Touch the reindeers flying across the screen.
4.  **Lives**: You have 15 lives. Don't let items hit the floor or escape!

## Installation & Setup

### Prerequisites
*   A modern web browser (Chrome, Safari, Edge).
*   A webcam.

### Running Locally
Because this game uses the Camera, some browsers require it to be served via a local server (not just clicking `index.html`).

1.  **Clone/Download** this repository.
2.  Open a terminal in the project folder.
3.  Run a simple HTTP server:
    ```bash
    # Python 3
    python3 -m http.server 8080
    ```
4.  Open your browser to `http://localhost:8080`.

## Deployment
To share with friends, deploy to a static host with HTTPS (Required for Camera).

**Recommended**: [Netlify Drop](https://app.netlify.com/drop)
*   Drag and drop the project folder.
*   Share the link!

---
*Built with Vanilla JS and MediaPipe Hands.*
