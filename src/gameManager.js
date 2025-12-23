import { Theme } from './themes/theme.js';
import { ChristmasTreeTheme } from './themes/christmasTree.js';
import { SantaTheme } from './themes/santa.js';
import { ReindeerTheme } from './themes/reindeer.js';
import { SleighFormula1Theme } from './themes/sleighFormula1.js';
import { ChristmasTennisTheme } from './themes/christmasTennis.js';
import { DragonGrinchTheme } from './themes/dragonGrinch.js';
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
            identity: document.getElementById('identity-screen'),
            identityAvatar: document.getElementById('identity-avatar'),
            identityName: document.getElementById('identity-name'),
            hud: document.getElementById('hud'),
            countdown: document.getElementById('countdown-overlay'),
            countdownText: document.getElementById('countdown-text'),
            countdownTitle: document.getElementById('countdown-title'),
            roundEnd: document.getElementById('round-end-screen'),
            leaderboard: document.getElementById('leaderboard-screen'),
            gameOver: document.getElementById('game-over-screen'),
            score: document.getElementById('score-display'),
            time: document.getElementById('time-display'),
            lives: document.getElementById('lives-display'),
            player: document.getElementById('player-display'),
            themeTitle: document.getElementById('theme-title'),
            roundScore: document.getElementById('round-score'),
            leaderboardList: document.getElementById('leaderboard-list'),
            winnerDisplay: document.getElementById('winner-display'),
            finalLeaderboard: document.getElementById('final-leaderboard')
        };

        // Game State
        this.state = 'WAITING';
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentRoundNumber = 1;
        this.maxRounds = 3;

        this.activeTheme = null;
        this.roundTime = 60;
        this.countdownTime = 5;

        // Setup Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.initGame());
        document.getElementById('identity-next-btn').addEventListener('click', () => this.nextIdentityOrStart());
        document.getElementById('next-turn-btn').addEventListener('click', () => this.nextTurn());
        document.getElementById('next-round-btn').addEventListener('click', () => this.startNextRound());
        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());

        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = this.soundManager.toggleMute();
                muteBtn.innerText = isMuted ? '🔇' : '🔊';
            });
        }

        this.lastTime = 0;

        // Add listeners for theme selection UI
        const selectAll = document.getElementById('theme-all');
        const themeChecks = document.querySelectorAll('.theme-select');

        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                themeChecks.forEach(cb => cb.checked = e.target.checked);
            });
        }

        themeChecks.forEach(cb => {
            cb.addEventListener('change', () => {
                // If any unchecked, uncheck selectAll. If all checked, check selectAll.
                const allChecked = Array.from(themeChecks).every(c => c.checked);
                if (selectAll) selectAll.checked = allChecked;
            });
        });

        this.selectedThemeIndices = []; // Indices of themes to play
        this.themeDeck = []; // Current deck of themes to draw from
    }

    // --- Identity Generation ---
    generateElfIdentity(id) {
        const firstNames = ["Jingle", "Sparkle", "Twinkle", "Buddy", "Snowball", "Peppermint", "Chestnut", "Holly", "Ivy", "Merry"];
        const lastNames = ["McPlum", "Snowfoot", "Candyane", "Sugarplum", "Winterbottom", "Sleighrider", "Evergreen", "Icicle"];

        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const colorHue = Math.floor(Math.random() * 360); // Random Hue

        return {
            id,
            name,
            colorHue,
            totalScore: 0,
            lives: 15
        };
    }

    // --- Game Flow Control ---

    initGame() {
        console.log("Init Game Called");
        const playerCountEl = document.getElementById('player-count');
        if (!playerCountEl) {
            alert("Error: Player Count input not found");
            return;
        }
        const playerCount = parseInt(playerCountEl.value);
        this.players = [];
        for (let i = 0; i < playerCount; i++) {
            this.players.push(this.generateElfIdentity(i));
        }

        this.currentRoundNumber = 1;
        this.currentRoundNumber = 1;
        this.currentPlayerIndex = 0; // For identity reveal loop

        // --- Initialize Theme Deck ---
        // Get selected themes
        const themeChecks = document.querySelectorAll('.theme-select');
        this.selectedThemeIndices = [];
        themeChecks.forEach(cb => {
            if (cb.checked) this.selectedThemeIndices.push(parseInt(cb.value));
        });

        if (this.selectedThemeIndices.length === 0) {
            alert("Please select at least one round!");
            return;
        }

        this.refillThemeDeck();

        // Start Identity Reveal Phase
        this.showIdentity(this.players[0]);
    }

    showIdentity(player) {
        this.state = 'IDENTITY_REVEAL';
        this.uiLayer.identityAvatar.innerText = "🧝";
        this.uiLayer.identityAvatar.style.filter = `hue-rotate(${player.colorHue}deg)`;
        this.uiLayer.identityName.innerText = player.name;
        this.switchScreen('identity');
    }

    nextIdentityOrStart() {
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex < this.players.length) {
            this.showIdentity(this.players[this.currentPlayerIndex]);
        } else {
            // All identities revealed, start Round 1
            this.currentPlayerIndex = 0; // Reset for gameplay
            this.pickNextRoundTheme();
            this.prepareTurn();
        }
    }

    pickNextRoundTheme() {
        if (this.themeDeck.length === 0) {
            this.refillThemeDeck();
        }
        this.currentRoundThemeIndex = this.themeDeck.pop();
    }

    refillThemeDeck() {
        // Create a deck from selected indices
        this.themeDeck = [...this.selectedThemeIndices];
        // Shuffle (Fisher-Yates)
        for (let i = this.themeDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.themeDeck[i], this.themeDeck[j]] = [this.themeDeck[j], this.themeDeck[i]];
        }
    }

    prepareTurn() {
        // Before creating theme, set UI
        const player = this.players[this.currentPlayerIndex];

        // Use the pre-selected theme for this round
        const themeIndex = this.currentRoundThemeIndex;

        if (themeIndex === 0) {
            this.activeTheme = new ChristmasTreeTheme(this.ctx, this.canvas.width, this.canvas.height);
            this.currentThemeName = "Christmas Tree";
        } else if (themeIndex === 1) {
            this.activeTheme = new SantaTheme(this.ctx, this.canvas.width, this.canvas.height);
            this.currentThemeName = "Santa Claus";
        } else if (themeIndex === 2) {
            this.activeTheme = new ReindeerTheme(this.ctx, this.canvas.width, this.canvas.height);
            this.currentThemeName = "Reindeer";
        } else if (themeIndex === 3) {
            this.activeTheme = new SleighFormula1Theme(this.ctx, this.canvas.width, this.canvas.height);
            this.currentThemeName = "Sleigh Formula 1";
        } else if (themeIndex === 4) {
            this.activeTheme = new ChristmasTennisTheme(this.ctx, this.canvas.width, this.canvas.height);
            this.currentThemeName = "Christmas Pong";
        } else {
            this.activeTheme = new DragonGrinchTheme(this.ctx, this.canvas.width, this.canvas.height);
            this.currentThemeName = "Dragon Grinch";
        }

        // Start Countdown Logic
        this.startCountdown(player);
    }

    startCountdown(player) {
        this.state = 'COUNTDOWN';
        this.countdownTime = 5;

        // Music
        this.soundManager.startMusic();

        this.switchScreen('hud');
        this.uiLayer.countdown.classList.add('active');

        // Update Titles
        let title = `Round ${this.currentRoundNumber}\nUp Next: ${player.name}\nGame: ${this.currentThemeName}`;
        this.uiLayer.countdownTitle.innerText = title;
        this.uiLayer.themeTitle.innerText = `Round ${this.currentRoundNumber}: ${this.currentThemeName} | Turn: ${player.name}`;

        // Update Player Stats in HUD
        this.uiLayer.player.innerText = `Elf: ${player.name}`;
        this.uiLayer.lives.innerText = `Lives: ${"❤️".repeat(player.lives)}`;

        this.lastTime = 0;
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    startRound() {
        this.state = 'PLAYING';
        this.roundTime = 60;
        this.uiLayer.countdown.classList.remove('active');

        // Reset player lives for the round if we want them to heal? 
        // User didn't specify, but usually round-based lives reset or persistent. 
        // Let's reset lives per game round for fairness, or keep per turn. The logic previously was `activeTheme.lives`.
        // The theme instance is new, so it starts with 15 lives.
    }

    endTurn(reason) {
        this.state = 'ROUND_OVER'; // Actually Turn Over
        const player = this.players[this.currentPlayerIndex];

        // Add Score
        player.totalScore += this.activeTheme.score;

        this.uiLayer.roundScore.innerText = `${player.name} Scored: ${this.activeTheme.score}\nTotal: ${player.totalScore}`;
        this.switchScreen('roundEnd');
    }

    nextTurn() {
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex >= this.players.length) {
            // All players finished this round
            this.showLeaderboard();
        } else {
            // Next player
            this.prepareTurn();
        }
    }

    showLeaderboard() {
        this.state = 'LEADERBOARD';
        let html = '<ol>';
        // Sort by score
        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);

        sorted.forEach(p => {
            html += `<li><span style="filter: hue-rotate(${p.colorHue}deg)">🧝</span> ${p.name}: ${p.totalScore}</li>`;
        });
        html += '</ol>';
        this.uiLayer.leaderboardList.innerHTML = html;
        this.switchScreen('leaderboard');
    }

    startNextRound() {
        this.currentRoundNumber++;
        if (this.currentRoundNumber > this.maxRounds) {
            this.endGame();
        } else {
            this.currentPlayerIndex = 0;
            this.pickNextRoundTheme();
            this.prepareTurn();
        }
    }

    endGame() {
        this.state = 'GAME_OVER';

        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const winner = sorted[0];

        this.uiLayer.winnerDisplay.innerText = `Winner: ${winner.name}! 🏆`;

        let html = '<ol>';
        sorted.forEach(p => {
            html += `<li><span style="filter: hue-rotate(${p.colorHue}deg)">🧝</span> ${p.name}: ${p.totalScore}</li>`;
        });
        html += '</ol>';

        this.uiLayer.finalLeaderboard.innerHTML = html;
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
            this.endTurn('TIME_UP');
            return;
        }
        this.uiLayer.time.innerText = `Time: ${Math.ceil(this.roundTime)}`;
        this.uiLayer.score.innerText = `Score: ${this.activeTheme.score}`;

        // Update Lives Visualization
        let livesStr = '';
        for (let i = 0; i < this.activeTheme.lives; i++) livesStr += '❤️';
        this.uiLayer.lives.innerText = `Lives: ${livesStr}`;

        // Calculate Difficulty
        const timeElapsed = 60 - this.roundTime;
        const difficultyFactor = 1 + (timeElapsed / 30);

        this.soundManager.setSpeed(difficultyFactor);

        // Update Theme Logic
        const handLandmarks = this.camera.getLandmarks();
        const faceLandmarks = this.camera.getFaceLandmarks();
        if (this.activeTheme) {
            this.activeTheme.update(deltaTime, handLandmarks, difficultyFactor, faceLandmarks);

            // Check for Fail Condition
            if (this.activeTheme.lives <= 0) {
                this.endTurn('LIVES_LOST');
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
                    // Using global drawing utils if imported
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
        Object.values(this.uiLayer).forEach(el => {
            if (el && el.classList.contains('screen')) el.classList.remove('active');
        });

        if (this.uiLayer[screenName] && this.uiLayer[screenName].classList.contains('screen')) {
            this.uiLayer[screenName].classList.add('active');
        }
    }
}
