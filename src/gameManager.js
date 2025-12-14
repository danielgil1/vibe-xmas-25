import { Theme } from './themes/theme.js';
import { ChristmasTreeTheme } from './themes/christmasTree.js';
import { SantaTheme } from './themes/santa.js';
import { ReindeerTheme } from './themes/reindeer.js';
import { SoundManager } from './soundManager.js';

export class GameManager {
    constructor(camera) {
        this.camera = camera;
        this.soundManager = new SoundManager();
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // UI Elements
        this.uiLayer = {
            start: document.getElementById('start-screen'),
            hud: document.getElementById('hud'),
            countdown: document.getElementById('countdown-overlay'),
            countdownText: document.getElementById('countdown-text'),
            countdownTitle: document.getElementById('countdown-title'),
            roundEnd: document.getElementById('round-end-screen'),
            gameOver: document.getElementById('game-over-screen'),
            score: document.getElementById('score-display'),
            time: document.getElementById('time-display'),
            lives: document.getElementById('lives-display'),
            player: document.getElementById('player-display'),
            themeTitle: document.getElementById('theme-title'),
            finalScore: document.getElementById('final-score'),
            roundScore: document.getElementById('round-score')
        };

        // Game State
        this.state = 'WAITING'; // WAITING, COUNTDOWN, PLAYING, ROUND_OVER, GAME_OVER
        this.currentThemeIndex = 0;
        this.totalScore = 0;
        this.playerName = '';
        this.roundTime = 60;
        this.countdownTime = 5;
        this.activeTheme = null;

        // Setup Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-round-btn').addEventListener('click', () => this.nextRound());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());

        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = this.soundManager.toggleMute();
                muteBtn.innerText = isMuted ? '🔇' : '🔊';
            });
        }

        this.lastTime = 0;
    }

    startGame() {
        const nameInput = document.getElementById('player-name-input');
        if (!nameInput.value.trim()) {
            alert("Please enter your name!");
            return;
        }
        this.playerName = nameInput.value;
        this.uiLayer.player.innerText = `Player: ${this.playerName}`;
        this.totalScore = 0;
        this.currentThemeIndex = 0;

        this.startCountdown();
    }

    startCountdown() {
        this.state = 'COUNTDOWN';
        this.countdownTime = 5;

        // Start/Restart Music with Random Track
        this.soundManager.startMusic();

        this.switchScreen('hud');
        this.uiLayer.countdown.classList.add('active');

        this.setThemeTitle();

        this.lastTime = 0;
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    setThemeTitle() {
        let title = "";
        if (this.currentThemeIndex === 0) {
            title = "Round 1: Christmas Tree";
            this.uiLayer.themeTitle.innerText = "Round: Christmas Tree (Save the Ornaments!)";
        } else if (this.currentThemeIndex === 1) {
            title = "Round 2: Santa Claus";
            this.uiLayer.themeTitle.innerText = "Round: Santa (Catch Gifts & Put in Sleigh!)";
        } else {
            title = "Round 3: Reindeer";
            this.uiLayer.themeTitle.innerText = "Round: Reindeer (Catch the Reindeer!)";
        }
        this.uiLayer.countdownTitle.innerText = title;
    }

    startRound() {
        this.state = 'PLAYING';
        this.roundTime = 60;
        this.uiLayer.countdown.classList.remove('active');

        // Select Theme
        if (this.currentThemeIndex === 0) {
            this.activeTheme = new ChristmasTreeTheme(this.ctx, this.canvas.width, this.canvas.height);
        } else if (this.currentThemeIndex === 1) {
            this.activeTheme = new SantaTheme(this.ctx, this.canvas.width, this.canvas.height);
        } else {
            this.activeTheme = new ReindeerTheme(this.ctx, this.canvas.width, this.canvas.height);
        }


        // Loop is already running from Countdown, but if not, ensure it runs.
        // If we came from Countdown, loop is running.
    }

    endRound(reason) {
        this.state = 'ROUND_OVER';
        this.totalScore += this.activeTheme.score;
        this.uiLayer.roundScore.innerText = `Round Score: ${this.activeTheme.score} | Total: ${this.totalScore}`;
        this.switchScreen('roundEnd');
    }

    nextRound() {
        this.currentThemeIndex++;
        if (this.currentThemeIndex >= 3) {
            this.endGame();
        } else {
            this.startCountdown();
        }
    }

    endGame() {
        this.state = 'GAME_OVER';
        this.uiLayer.finalScore.innerText = `${this.playerName}, Final Score: ${this.totalScore}`;
        this.switchScreen('gameOver');
    }

    resetGame() {
        this.switchScreen('start');
    }

    update(deltaTime) {
        if (this.state === 'COUNTDOWN') {
            this.countdownTime -= deltaTime;
            this.uiLayer.countdownText.innerText = Math.ceil(this.countdownTime);
            if (this.countdownTime <= 0) {
                this.startRound();
            }
            return;
        }

        if (this.state !== 'PLAYING') return;

        // Update Timer
        this.roundTime -= deltaTime;
        if (this.roundTime <= 0) {
            this.roundTime = 0;
            this.endRound('TIME_UP');
            return;
        }
        this.uiLayer.time.innerText = `Time: ${Math.ceil(this.roundTime)}`;
        this.uiLayer.score.innerText = `Score: ${this.activeTheme.score}`;

        // Update Lives Visualization
        let livesStr = '';
        for (let i = 0; i < this.activeTheme.lives; i++) livesStr += '❤️';
        this.uiLayer.lives.innerText = `Lives: ${livesStr}`;

        // Calculate Difficulty (Increases as roundTime decreases/timeElapsed increases)
        const timeElapsed = 60 - this.roundTime;
        // Moderate Ramp: 1 + (time / 30). At 0s=1.0, 30s=2.0, 60s=3.0.
        const difficultyFactor = 1 + (timeElapsed / 30);

        // Speed up music
        this.soundManager.setSpeed(difficultyFactor);

        // Update Theme Logic
        const handLandmarks = this.camera.getLandmarks();
        if (this.activeTheme) {
            this.activeTheme.update(deltaTime, handLandmarks, difficultyFactor);

            // Check for Fail Condition
            if (this.activeTheme.lives <= 0) {
                this.endRound('LIVES_LOST');
            }
        }
    }

    draw() {
        // Clear Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Camera Feed (Mirrored)
        // We draw the video frame to the canvas to make it easier to composite with game elements
        // Note: Camera class has the video element.
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.translate(-this.canvas.width, 0);
        this.ctx.drawImage(this.camera.videoElement, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Draw Game Elements
        if (this.state === 'PLAYING' && this.activeTheme) {
            this.activeTheme.draw();

            // Draw Hand Landmarks for feedback
            const landmarks = this.camera.getLandmarks();
            if (landmarks) {
                this.ctx.save();
                this.ctx.scale(-1, 1);
                this.ctx.translate(-this.canvas.width, 0);
                for (const hands of landmarks) {
                    drawConnectors(this.ctx, hands, HAND_CONNECTIONS, { color: 'rgba(0, 255, 0, 0.5)', lineWidth: 2 });
                    drawLandmarks(this.ctx, hands, { color: 'rgba(255, 0, 0, 0.5)', lineWidth: 1, radius: 2 });
                }
                this.ctx.restore();
            }
        }
    }

    gameLoop(timestamp) {
        if (this.state !== 'PLAYING' && this.state !== 'COUNTDOWN') return;

        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    switchScreen(screenName) {
        // Hide all
        Object.values(this.uiLayer).forEach(el => {
            if (el && el.classList.contains('screen')) el.classList.remove('active');
        });

        // Show target
        if (screenName === 'countdown') {
            // Handle appropriately if needed, but we used classList add logic
        }

        if (this.uiLayer[screenName] && this.uiLayer[screenName].classList.contains('screen')) {
            this.uiLayer[screenName].classList.add('active');
        }
    }
}
