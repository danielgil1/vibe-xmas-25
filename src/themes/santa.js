import { Theme } from './theme.js';

class Gift {
    constructor(x, y, speedMult) {
        this.w = 50;
        this.h = 50;
        this.x = x;
        this.y = y;
        this.vy = 200 * speedMult;
        this.heldByHandIndex = -1;
        this.emoji = '🎁';
    }
}

class Sleigh {
    constructor(w, h) {
        this.w = 180; // Bigger
        this.h = 90;
        this.x = -this.w;
        this.y = 50;
        this.baseVx = 150;
        this.vx = 150;
        this.direction = 1;
        this.bounds = { w, h };
        this.emoji = '🛷';
    }

    update(dt, speedMult) {
        this.vx = this.baseVx * speedMult;
        this.x += this.vx * this.direction * dt;
        if (this.x > this.bounds.w - this.w) {
            this.direction = -1;
            this.x = this.bounds.w - this.w;
        } else if (this.x < 0) {
            this.direction = 1;
            this.x = 0;
        }
    }
}

export class SantaTheme extends Theme {
    constructor(ctx, width, height) {
        super(ctx, width, height);
        this.sleigh = new Sleigh(width, height);
        this.gifts = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2.0;
    }

    update(deltaTime, handLandmarks, difficultyFactor) {
        const speedMult = difficultyFactor || 1;

        // Update Sleigh
        this.sleigh.update(deltaTime, speedMult);

        // Spawn Gifts
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.gifts.push(new Gift(this.sleigh.x + this.sleigh.w / 2 - 20, this.sleigh.y + this.sleigh.h, speedMult));
            this.spawnTimer = this.baseSpawnInterval / speedMult;
        }

        // Update Gifts
        for (let i = this.gifts.length - 1; i >= 0; i--) {
            const gift = this.gifts[i];

            // Logic if held
            if (gift.heldByHandIndex !== -1) {
                if (!handLandmarks || !handLandmarks[gift.heldByHandIndex]) {
                    gift.heldByHandIndex = -1;
                } else {
                    const hand = handLandmarks[gift.heldByHandIndex];
                    const tip = hand[8];
                    gift.x = (1 - tip.x) * this.canvasWidth - gift.w / 2;
                    gift.y = tip.y * this.canvasHeight - gift.h / 2;

                    // Deposit
                    if (this.checkRectCollision(gift.x + gift.w / 2, gift.y + gift.h / 2,
                        this.sleigh.x, this.sleigh.y, this.sleigh.w, this.sleigh.h)) {
                        this.score += 10; // 10 points per present
                        this.gifts.splice(i, 1);
                        continue;
                    }
                }
            } else {
                // Falling
                gift.y += gift.vy * deltaTime;

                // Pick up
                if (handLandmarks && handLandmarks.length > 0) {
                    handLandmarks.forEach((hand, index) => {
                        const tip = hand[8];
                        const px = (1 - tip.x) * this.canvasWidth;
                        const py = tip.y * this.canvasHeight;

                        if (this.checkRectCollision(px, py, gift.x, gift.y, gift.w, gift.h)) {
                            gift.heldByHandIndex = index;
                        }
                    });
                }
            }

            // Fail
            if (gift.y > this.canvasHeight) {
                this.lives--;
                this.gifts.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.font = "100px Arial"; // Bigger for Sleigh
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        const sleighCX = this.sleigh.x + this.sleigh.w / 2;
        const sleighCY = this.sleigh.y + this.sleigh.h / 2;

        // Draw Sleigh Base
        this.ctx.fillText("🛷", sleighCX, sleighCY);

        // Draw Santa & Fixed Gifts "inside" sleigh
        this.ctx.font = "50px Arial";
        this.ctx.fillText("🎅", sleighCX - 20, sleighCY - 30);
        this.ctx.font = "30px Arial";
        this.ctx.fillText("🎁", sleighCX + 30, sleighCY - 20);
        this.ctx.fillText("✨", sleighCX + 10, sleighCY - 40);

        // Draw Falling Gifts
        this.ctx.font = "40px Arial";
        for (const gift of this.gifts) {
            this.ctx.fillText(gift.emoji, gift.x + gift.w / 2, gift.y + gift.h / 2);
        }
    }
}
