import { Theme } from './theme.js';

class Paddle {
    constructor(x, y, w, h, isAI = false) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.isAI = isAI;
        this.speed = 300;
        this.emoji = isAI ? '🤖' : '🎅';
    }

    update(dt, targetX, canvasWidth) {
        if (this.isAI) {
            // Simple AI: Move towards the ball
            const center = this.x + this.w / 2;
            if (center < targetX - 10) {
                this.x += this.speed * dt;
            } else if (center > targetX + 10) {
                this.x -= this.speed * dt;
            }
        } else {
            // Player: Position set directly by hand, but clamped
            this.x = targetX - this.w / 2;
        }

        // Clamp to screen
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvasWidth) this.x = canvasWidth - this.w;
    }

    draw(ctx) {
        ctx.fillStyle = this.isAI ? '#e74c3c' : '#2ecc71';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.emoji, this.x + this.w / 2, this.y + this.h / 2);
    }
}

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.vx = 200 * (Math.random() > 0.5 ? 1 : -1);
        this.vy = 200 * (Math.random() > 0.5 ? 1 : -1);
        this.emoji = '🎾';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.emoji, this.x, this.y);
    }
}

export class ChristmasTennisTheme extends Theme {
    constructor(ctx, width, height) {
        super(ctx, width, height);

        const paddleW = 100;
        const paddleH = 20;

        // AI Paddle (Top)
        this.aiPaddle = new Paddle((width - paddleW) / 2, 50, paddleW, paddleH, true);

        // Player Paddle (Bottom)
        this.playerPaddle = new Paddle((width - paddleW) / 2, height - 50 - paddleH, paddleW, paddleH, false);

        this.ball = new Ball(width / 2, height / 2);
        this.lives = 5; // Fewer lives for this fast-paced game
    }

    update(deltaTime, handLandmarks, difficultyFactor) {
        const speedMult = difficultyFactor || 1;

        // Update Ball
        this.ball.update(deltaTime * speedMult);

        // Wall Collisions (Left/Right)
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx *= -1;
        } else if (this.ball.x + this.ball.radius > this.canvasWidth) {
            this.ball.x = this.canvasWidth - this.ball.radius;
            this.ball.vx *= -1;
        }

        // Update AI Paddle
        this.aiPaddle.speed = 250 * speedMult;
        this.aiPaddle.update(deltaTime, this.ball.x, this.canvasWidth);

        // Update Player Paddle
        let handX = this.canvasWidth / 2;
        if (handLandmarks && handLandmarks.length > 0) {
            const hand = handLandmarks[0];
            const tip = hand[8]; // Index finger tip
            handX = (1 - tip.x) * this.canvasWidth;
        }
        this.playerPaddle.update(deltaTime, handX, this.canvasWidth);

        // Paddle Collisions
        this.checkPaddleCollision(this.playerPaddle, 1); // 1 = hitting up
        this.checkPaddleCollision(this.aiPaddle, -1);   // -1 = hitting down

        // Score / Fail Conditions
        if (this.ball.y - this.ball.radius < 0) {
            // AI Missed (Player scores)
            this.score += 30;
            this.resetBall();
        } else if (this.ball.y + this.ball.radius > this.canvasHeight) {
            // Player Missed
            this.lives--;
            this.resetBall();
        }
    }

    checkPaddleCollision(paddle, direction) {
        // Simple AABB collision
        if (this.ball.x + this.ball.radius > paddle.x &&
            this.ball.x - this.ball.radius < paddle.x + paddle.w &&
            this.ball.y + this.ball.radius > paddle.y &&
            this.ball.y - this.ball.radius < paddle.y + paddle.h) {

            // Check if hitting the correct side based on direction
            if ((direction === 1 && this.ball.vy > 0) || (direction === -1 && this.ball.vy < 0)) {
                this.ball.vy *= -1.1; // Speed up slightly
                this.ball.vx += (Math.random() - 0.5) * 50; // Add some random angle
            }
        }
    }

    resetBall() {
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.canvasHeight / 2;
        this.ball.vx = 200 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.vy = 200 * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
        // Draw Net
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvasHeight / 2);
        this.ctx.lineTo(this.canvasWidth, this.canvasHeight / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.aiPaddle.draw(this.ctx);
        this.playerPaddle.draw(this.ctx);
        this.ball.draw(this.ctx);
    }
}
