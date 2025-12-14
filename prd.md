# Christmas Party Game - Product Requirements Document (Final)

## Project Overview
A browser-based interactive Christmas party game that uses the webcam and hand tracking (MediaPipe) to allow players to interact with virtual Christmas elements.

## Tech Stack
*   **Core**: HTML5, Vanilla CSS, Vanilla JavaScript.
*   **Tracking**: MediaPipe Hands.
*   **Audio**: Web Audio API (No external assets required).

## Game Structure
*   **Total Rounds**: 3
*   **Round Duration**: 60 Seconds per round.
*   **Lives**: 15 Lives (Hearts). Lives are lost if items hit the ground (or escape).

## Core Mechanics
1.  **Hand Tracking**:
    *   Uses webcam to track player's hands.
    *   Video feed is mirrored horizontally for intuitive interaction.
    *   Visual skeleton (Green lines/Red dots) overlay on hands.
2.  **Difficulty Scaling**:
    *   Game difficulty (Speed of items) increases as the timer counts down.
    *   Starts at 1.0x speed, ends around 3.0x speed.
    *   Music tempo increases in sync with game speed.
3.  **Audio system**:
    *   Procedurally generated 8-bit Retro Christmas Carols.
    *   Tracks: "Jingle Bells", "We Wish You a Merry Christmas", "Deck the Halls".
    *   Randomly selects a track at the start of each round.
    *   Mute/Unmute toggle button available.

## Game Rounds (Themes)

### Round 1: Christmas Tree (Save the Ornaments)
*   **Goal**: Catch falling ornaments before they hit the bottom of the screen.
*   **Entities**: Various Christmas emojis (🎄, 🎀, 🎁, etc.).
*   **Spawning**: Ornaments spawn at random X positions (enforcing distance variation).

### Round 2: Santa Claus (Help Santa Pack)
*   **Goal**: Catch gifts falling from Santa's Sleigh and put them back into the Sleigh.
*   **Entities**: Santa Sleigh (🛷 + 🎅) moving horizontally along the top. Gifts (🎁) falling from it.
*   **Mechanic**:
    1.  Touch falling gift to "grab" it.
    2.  Move hand to Sleigh hitbox to "deposit" it (+1 Score).
    3.  If gift hits bottom -> Life Lost.

### Round 3: Reindeer (Catch the Reindeers)
*   **Goal**: Catch Reindeers as they run across the screen.
*   **Entities**: Reindeers (🦌).
*   **Movement**: Move from Left to Right.
    *   Path includes a sine-wave "wobble" for erratic movement.
    *   Spawning ensures significant vertical distance between consecutive reindeers.
*   **Mechanic**: Hover hand over Reindeer to catch (+1 Score). If they exit screen right -> Life Lost.

## UI Requirements
*   **Color Palette**: Christmas Green (`#27ae60`) for primary text/headers.
*   **HUD**:
    *   Score
    *   Timer (60s)
    *   Lives (Hearts)
    *   Player Name (Displayed below lives)
*   **Screens**: Start Screen (Name Input), Countdown Overlay (5s), Round End, Game Over.