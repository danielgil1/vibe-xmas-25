import { Theme } from './theme.js';

class Reindeer {
    constructor(w, h, speedMult) {
        this.w = 60;
        this.h = 60;

        // Start: Left side, random Y
        this.x = -this.w;
        this.y = Math.random() * (h - this.h - 100) + 50;

        // Target: Right side
        const targetX = w + 50;

        // Calculate velocity (Horizontal only or slightly angled?) 
        // PRD said "from left side to right side". 
        // Let's keep diagonal slightly or mostly horizontal.
        const targetY = Math.random() * (h - this.h);

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = (150 + Math.random() * 150) * speedMult;

        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        // Random "Wobble" properties
        this.initialY = this.y;
        this.wobbleSpeed = Math.random() * 5 + 2;
        this.wobbleAmp = Math.random() * 100 + 50;
        this.time = 0;

        this.emoji = '🦌';
    }
}

export class ReindeerTheme extends Theme {
    constructor(ctx, width, height) {
        super(ctx, width, height);
        this.reindeers = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 1.5;
        this.lastSpawnY = height / 2;
    }

    update(deltaTime, handLandmarks, difficultyFactor) {
        const speedMult = difficultyFactor || 1;

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            let newY, valid = false;
            let attempts = 0;
            while (!valid && attempts < 10) {
                newY = Math.random() * (this.canvasHeight - 60 - 100) + 50;
                if (Math.abs(newY - this.lastSpawnY) > this.canvasHeight * 0.4) {
                    valid = true;
                }
                attempts++;
            }
            if (!valid) newY = Math.random() * (this.canvasHeight - 160) + 50;

            const deer = new Reindeer(this.canvasWidth, this.canvasHeight, speedMult);
            deer.y = newY; // Override

            // Re-calc velocity because Y changed
            const targetX = this.canvasWidth + 50;
            const targetY = Math.random() * (this.canvasHeight - 60);
            const dx = targetX - deer.x;
            const dy = targetY - deer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = (150 + Math.random() * 150) * speedMult;
            deer.vx = (dx / dist) * speed;
            deer.vy = (dy / dist) * speed;
            deer.initialY = newY; // Important for wobble

            this.reindeers.push(deer);
            this.lastSpawnY = newY;
            this.spawnTimer = this.baseSpawnInterval / speedMult;
        }

        for (let i = this.reindeers.length - 1; i >= 0; i--) {
            const deer = this.reindeers[i];

            deer.time += deltaTime;
            deer.x += deer.vx * deltaTime;
            // Linear Y move + Sine wave Wobble
            deer.y = deer.initialY + (deer.vy * deer.time) + Math.sin(deer.time * deer.wobbleSpeed) * deer.wobbleAmp;

            // Check Capture
            let caught = false;
            if (handLandmarks && handLandmarks.length > 0) {
                for (const hand of handLandmarks) {
                    for (const point of hand) {
                        const px = (1 - point.x) * this.canvasWidth; // Mirrored
                        const py = point.y * this.canvasHeight;

                        if (this.checkRectCollision(px, py, deer.x, deer.y, deer.w, deer.h)) {
                            caught = true;
                            break;
                        }
                    }
                    if (caught) break;
                }
            }

            if (caught) {
                this.score++;
                this.reindeers.splice(i, 1);
                continue;
            }

            // Check Escape (Reaches Right side fully)
            if (deer.x > this.canvasWidth + 20) {
                this.lives--;
                this.reindeers.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.font = "50px Arial";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";

        for (const deer of this.reindeers) {
            // Mirror the emoji to look to the right!
            this.ctx.save();
            this.ctx.translate(deer.x + deer.w / 2, deer.y + deer.h / 2);
            this.ctx.scale(-1, 1); // Flip horizontally
            this.ctx.fillText(deer.emoji, -deer.w / 2, -deer.h / 2);
            this.ctx.restore();
        }
    }
}
