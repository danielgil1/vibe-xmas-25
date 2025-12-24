import { Theme } from './theme.js';

class FireParticle {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 400;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.life = 1.0; // Seconds
        this.radius = 10;
        this.color = `hsl(${Math.random() * 60}, 100%, 50%)`; // Fire colors
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.radius += 10 * dt; // Expand
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Tree {
    constructor(w, h) {
        this.w = 60;
        this.h = 80;
        this.x = Math.random() * (w - this.w);
        this.y = Math.random() * (h - this.h);
        this.health = 100;
        this.maxHealth = 100;
        this.emoji = '🎄';
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 50) this.emoji = '🔥';
    }

    draw(ctx) {
        ctx.font = "60px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Shake if burning
        let offsetX = 0;
        if (this.health < this.maxHealth) {
            offsetX = (Math.random() - 0.5) * 5;
        }

        ctx.fillText(this.emoji, this.x + this.w / 2 + offsetX, this.y + this.h / 2);

        // Health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 10, this.w, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - 10, this.w * (this.health / this.maxHealth), 5);
        }
    }
}

export class DragonGrinchTheme extends Theme {
    constructor(ctx, width, height) {
        super(ctx, width, height);
        this.particles = [];
        this.trees = [];
        this.spawnTimer = 0;
        this.fireCooldown = 0;

        // Initial trees
        for (let i = 0; i < 5; i++) {
            this.trees.push(new Tree(width, height));
        }
    }

    update(deltaTime, handLandmarks, difficultyFactor, faceLandmarks) {
        const speedMult = difficultyFactor || 1;

        // Spawn Trees
        if (this.trees.length < 5 + difficultyFactor) {
            this.spawnTimer -= deltaTime;
            if (this.spawnTimer <= 0) {
                this.trees.push(new Tree(this.canvasWidth, this.canvasHeight));
                this.spawnTimer = 2.0;
            }
        }

        // Face Logic
        if (faceLandmarks && faceLandmarks.length > 0) {
            const face = faceLandmarks[0];

            // Nose tip (1)
            const nose = face[1];
            const noseX = (1 - nose.x) * this.canvasWidth; // Mirror
            const noseY = nose.y * this.canvasHeight;

            // Lips: Upper (13), Lower (14)
            const upperLip = face[13];
            const lowerLip = face[14];

            // Calculate mouth opening distance
            const mouthDist = Math.sqrt(
                Math.pow(upperLip.x - lowerLip.x, 2) +
                Math.pow(upperLip.y - lowerLip.y, 2)
            );

            // Threshold for open mouth (approximate, depends on distance to camera)
            // Using a relative metric might be better, but simple threshold works for now
            const isMouthOpen = mouthDist > 0.05;

            // Breathe Fire
            this.fireCooldown -= deltaTime;
            if (isMouthOpen && this.fireCooldown <= 0) {
                // Spawn multiple particles in a cone
                for (let i = 0; i < 3; i++) {
                    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Downwards cone
                    // Or follow face orientation? Let's just shoot "out" from mouth
                    // Actually, let's shoot towards where the face is pointing? 
                    // Too complex. Let's just shoot in direction of movement or just "forward" (which is 2D static).
                    // Let's shoot in a random direction around the mouth for chaos!
                    const randomAngle = Math.random() * Math.PI * 2;
                    this.particles.push(new FireParticle(noseX, noseY, randomAngle));
                }
                this.fireCooldown = 0.05;
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(deltaTime);

            // Check Collision with Trees
            for (let j = this.trees.length - 1; j >= 0; j--) {
                const t = this.trees[j];
                if (this.checkCircleCollision(p.x, p.y, p.radius, t.x + t.w / 2, t.y + t.h / 2)) { // Approx center
                    t.takeDamage(5);
                    p.life = 0; // Kill particle
                    if (t.health <= 0) {
                        this.score += 10;
                        this.trees.splice(j, 1);
                    }
                    break;
                }
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        // Draw Trees
        for (const t of this.trees) {
            t.draw(this.ctx);
        }

        // Draw Particles
        for (const p of this.particles) {
            p.draw(this.ctx);
        }

        // Instructions
        this.ctx.font = "20px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "left";
        this.ctx.fillText("Open mouth to breathe fire! 🔥", 20, 40);
    }
}
