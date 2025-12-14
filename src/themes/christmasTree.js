import { Theme } from './theme.js';

class Ball {
    constructor(w, h, speedMultiplier) {
        this.radius = 25; // Hitbox radius
        this.x = Math.random() * (w - this.radius * 2) + this.radius;
        this.y = -50;
        // Base speed 150-250
        this.speed = (Math.random() * 100 + 150) * speedMultiplier;
        this.active = true;

        // Random Christmas Ornament Emoji
        const ornaments = ['🎄', '🎀', '🔴', '🔵', '🟡', '🎁', '🔔', '🕯️'];
        this.emoji = ornaments[Math.floor(Math.random() * ornaments.length)];
    }
}

export class ChristmasTreeTheme extends Theme {
    constructor(ctx, width, height) {
        super(ctx, width, height);
        this.balls = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 1.2;
        this.lastSpawnX = width / 2; // Initial ref
    }

    update(deltaTime, handLandmarks, difficultyFactor) {
        // Use global difficultyFactor instead of internal timeElapsed for consistency
        const speedMult = difficultyFactor || 1;

        // Spawn Balls
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            // Find a position far from lastSpawnX
            let newX, valid = false;
            let attempts = 0;
            while (!valid && attempts < 10) {
                newX = Math.random() * (this.canvasWidth - 50) + 25;
                if (Math.abs(newX - this.lastSpawnX) > this.canvasWidth * 0.4) { // At least 40% screen width away
                    valid = true;
                }
                attempts++;
            }
            if (!valid) newX = Math.random() * (this.canvasWidth - 50) + 25; // Fallback

            const ball = new Ball(this.canvasWidth, this.canvasHeight, speedMult);
            ball.x = newX; // Override random x from constructor
            this.balls.push(ball);

            this.lastSpawnX = newX;
            this.spawnTimer = this.baseSpawnInterval / speedMult;
        }

        // Update Balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // Move
            ball.y += ball.speed * deltaTime;

            // Check Collision with Hands
            let caught = false;
            // handLandmarks is an array of hands, each is an array of 21 points
            if (handLandmarks && handLandmarks.length > 0) {
                for (const hand of handLandmarks) {
                    for (const point of hand) {
                        const px = (1 - point.x) * this.canvasWidth;
                        const py = point.y * this.canvasHeight;

                        // Check collision
                        if (this.checkCircleCollision(px, py, 20, ball.x, ball.y)) {
                            caught = true;
                            break;
                        }
                    }
                    if (caught) break;
                }
            }

            if (caught) {
                this.score++;
                this.balls.splice(i, 1);
                continue;
            }

            // Check Ground Collision (Fail)
            if (ball.y - ball.radius > this.canvasHeight) {
                this.lives--;
                this.balls.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.font = "50px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        for (const ball of this.balls) {
            this.ctx.fillText(ball.emoji, ball.x, ball.y);
        }
    }
}
