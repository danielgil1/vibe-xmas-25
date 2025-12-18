import { Theme } from './theme.js';

export class SleighFormula1Theme extends Theme {
    constructor(ctx, width, height) {
        super(ctx, width, height);
        this.sleigh = {
            w: 100,
            h: 60,
            x: width / 2 - 50,
            y: height - 120,
            speed: 0,
            maxSpeed: 800,
            accel: 500,
            vx: 0, // Velocity X
            emoji: '🏎️🛷' // Formula 1 Sleigh!
        };

        this.obstacles = [];
        this.obstacleTimer = 0;
        this.baseObstacleInterval = 1.0;
        this.obstacleTypes = ['🍬', '💡', '☃️', '🎀', '🎁'];

        // Road Perspective & Curve
        this.roadTopW = width * 0.1;
        this.roadBottomW = width * 0.6; // Slightly narrower to make it harder
        this.roadTopX = (width - this.roadTopW) / 2; // Center Base

        this.curveFactor = 0; // Current curve amount (-1 to 1)
        this.curveTimer = 0;
        this.targetCurve = 0;

        // Environment
        this.roadOffset = 0;
        this.trees = [];
        this.initTrees();

        this.damageCooldown = 0;
        this.isOffRoad = false;
        this.faceLandmarks = [];
    }

    initTrees() {
        // Pre-populate dense forest
        for (let i = 0; i < 100; i++) {
            this.trees.push({
                y: Math.random() * this.canvasHeight,
                side: Math.random() > 0.5 ? -1 : 1,
                type: Math.random() > 0.8 ? '🎄' : '🌲'
            });
        }
    }

    update(deltaTime, handLandmarks, difficultyFactor, faceLandmarks) {
        const speedMult = difficultyFactor || 1;
        const currentSpeed = 400 * speedMult;

        this.faceLandmarks = faceLandmarks || [];

        // --- 1. Control Logic (Head Tilt) ---
        let steering = 0;

        if (this.faceLandmarks && this.faceLandmarks.length > 0) {
            const face = this.faceLandmarks[0];
            // MediaPipe Face Mesh: 
            // Left Eye (outer corner): 33
            // Right Eye (outer corner): 263
            // These might need adjustment, but let's try generic points if indices are stable.
            // Using 468 points model. 
            // Let's use simpler logic if we can't guarantee indices: 
            // Left cheek (234) vs Right cheek (454)? 
            // Actually, let's just use top of head (10) vs chin (152) for vector? 
            // Or Left Eye (33) vs Right Eye (263) is standard for tilt.

            const leftEye = face[33];
            const rightEye = face[263];

            if (leftEye && rightEye) {
                // Determine tilt angle
                // Note: y increases downwards.
                const dy = rightEye.y - leftEye.y;
                const dx = rightEye.x - leftEye.x;
                const angle = Math.atan2(dy, dx);

                // Normal horizontal (level) is angle ~ 0 (if face is straight)
                // If I tilt Head Left (Left Ear to Left Shoulder), Left Eye goes DOWN (higher Y), Right Eye goes UP (lower Y).
                // Wait, coordinate system: 
                // x: 0 (left) -> 1 (right)
                // y: 0 (top) -> 1 (bottom)
                // Head Left Tilt: Left Eye Lower (Larger Y), Right Eye Higher (Smaller Y).
                // So dy = RightY - LeftY => Negative.

                // Sensitivity
                // angle is usually 0. Range +/- 0.5 rads is comfortable.
                // Le'ts clamp and map.

                // Deadzone
                if (Math.abs(angle) > 0.05) {
                    // USER REQUEST: Invert control. "Left to Right".
                    // Originally: angle * 1000.
                    // New: angle * -1000.
                    steering = angle * -1000;
                }
            }
        }

        // Apply Steering
        // Inverted or not? 
        // If angle is negative (Tilt Left), we want to go Left (negative vx).
        // If angle is positive (Tilt Right), we want to go Right (positive vx).
        // Let's try direct mapping.

        this.sleigh.vx += steering * deltaTime;
        // Dampening/Friction
        this.sleigh.vx *= 0.95;

        this.sleigh.x += this.sleigh.vx * deltaTime;

        // --- 2. Curved Road Logic ---
        this.curveTimer += deltaTime * 0.5;
        // Slowly change target curve
        if (Math.random() < 0.01) {
            this.targetCurve = (Math.random() * 2 - 1) * 200; // Random curve strength
        }
        // Smoothly approach target
        this.curveFactor += (this.targetCurve - this.curveFactor) * deltaTime;

        // --- 3. Off-Road Check ---
        // Calculate the road center at the Sleigh's Y position
        // We render road using a curve function. x = base_x + (y^2 * curve)
        // Let's define the center line function:
        // CenterX(y) = (Width/2) + sin(y * freq + offset) * amp?
        // Or simpler quadratic curve: CenterX(y) = (Width/2) + (curveFactor * ((Height-y)/Height)^2)
        // Let's use the latter for visual curvature.

        const sleighBottomY = this.sleigh.y + this.sleigh.h;
        // 0 to 1 progress from top
        const roadProgress = sleighBottomY / this.canvasHeight;
        // We want curve to be more pronounced at top (horizon) visually, but in 2D perspective, 
        // the "x-offset" accumulates.
        // Let's say curveFactor shifts the "horizon" x.
        // Base X (bottom) is fixed at center, Top X shifts? 
        // Actually, for a race feel, usually the whole road curves.
        // Let's try: Road Center at Y = CenterScreen + (CurveFactor * (1-RoadProgress)^2)

        const roadCenterAtSleigh = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - roadProgress, 2));

        // Road Width at Sleigh Y (Linear interpolation)
        const currentRoadW = this.roadTopW + (this.roadBottomW - this.roadTopW) * roadProgress;
        const leftEdge = roadCenterAtSleigh - (currentRoadW / 2);
        const rightEdge = roadCenterAtSleigh + (currentRoadW / 2);

        // Check bounds
        this.isOffRoad = false;
        if (this.sleigh.x < leftEdge || this.sleigh.x + this.sleigh.w > rightEdge) {
            // Off Road!
            this.isOffRoad = true;
            this.damageCooldown -= deltaTime;
            if (this.damageCooldown <= 0) {
                this.lives--;
                this.damageCooldown = 0.5; // Access hit every 0.5s
                // Sound effect could go here
            }
        }

        // Ensure visual limits (screen bounds)
        if (this.sleigh.x < 0) this.sleigh.x = 0;
        if (this.sleigh.x > this.canvasWidth - this.sleigh.w) this.sleigh.x = this.canvasWidth - this.sleigh.w;

        // --- 4. Environment Updates ---
        // Trees - Dense spawn
        if (Math.random() < 0.2 * speedMult) {
            this.trees.push({
                y: -50,
                side: Math.random() > 0.5 ? -1 : 1,
                type: Math.random() > 0.8 ? '🎄' : '🌲'
            });
        }

        for (let i = this.trees.length - 1; i >= 0; i--) {
            const tree = this.trees[i];
            tree.y += currentSpeed * deltaTime;
            if (tree.y > this.canvasHeight) this.trees.splice(i, 1);
        }

        // Obstacles
        this.obstacleTimer -= deltaTime;
        if (this.obstacleTimer <= 0) {
            // Spawn logic
            // We need to determine lane positions based on the CURVE at spawn time (Top of screen)
            // But the curve changes as it moves down?
            // Simpler: Obstacles track the road center as they move down.
            const spawnY = -50;
            const laneOffset = (Math.random() * 2 - 1) * 0.8; // -0.8 to 0.8 width ratio

            this.obstacles.push({
                y: spawnY,
                laneOffset: laneOffset, // Relative to road width/center
                emoji: this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)],
                scale: 0.2
            });
            this.obstacleTimer = this.baseObstacleInterval / speedMult;
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += currentSpeed * deltaTime;

            const progress = obs.y / this.canvasHeight;
            obs.scale = 0.2 + (progress * 0.8);
            obs.w = 50 * obs.scale;
            obs.h = 50 * obs.scale;

            // Recalculate X based on curve
            const roadW = this.roadTopW + (this.roadBottomW - this.roadTopW) * progress;
            const center = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - progress, 2));

            obs.x = center + (obs.laneOffset * roadW / 2) - (obs.w / 2);

            // Collision with Sleigh (Now COLLECTIBLES)
            if (obs.y + obs.h > this.sleigh.y + 10 && obs.y < this.sleigh.y + this.sleigh.h) {
                if (this.checkRectCollision(this.sleigh.x + 10, this.sleigh.y + 10,
                    obs.x, obs.y, obs.w, obs.h)) {
                    // Start of collect logic
                    this.score += 10; // Bonus score
                    this.obstacles.splice(i, 1);
                    // Add "Ding" sound here ideally
                    continue;
                }
            }

            if (obs.y > this.canvasHeight) {
                // Missed ornament - no penalty, just gone
                this.obstacles.splice(i, 1);
            }
        }
    }

    draw() {
        // Draw Grass
        this.ctx.fillStyle = '#0f380f';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw Road (Polygon for curve)
        const segments = 20;
        const segmentHeight = this.canvasHeight / segments;

        this.ctx.fillStyle = '#555';

        for (let i = 0; i < segments; i++) {
            const y1 = i * segmentHeight;
            const y2 = (i + 1) * segmentHeight;

            const p1 = y1 / this.canvasHeight;
            const p2 = y2 / this.canvasHeight;

            const w1 = this.roadTopW + (this.roadBottomW - this.roadTopW) * p1;
            const w2 = this.roadTopW + (this.roadBottomW - this.roadTopW) * p2;

            const c1 = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - p1, 2));
            const c2 = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - p2, 2));

            const x1_left = c1 - w1 / 2;
            const x1_right = c1 + w1 / 2;
            const x2_left = c2 - w2 / 2;
            const x2_right = c2 + w2 / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(x1_left, y1);
            this.ctx.lineTo(x1_right, y1);
            this.ctx.lineTo(x2_right, y2);
            this.ctx.lineTo(x2_left, y2);
            this.ctx.fill();
        }

        // Draw Center Strip (Dashed)
        this.ctx.strokeStyle = '#EDA';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        for (let i = 0; i < segments; i++) {
            // Only draw every other segment for dash effect
            if ((i + Math.floor(this.roadOffset / 20)) % 2 === 0) continue;

            const y1 = i * segmentHeight;
            const y2 = (i + 1) * segmentHeight;
            const p1 = y1 / this.canvasHeight;
            const p2 = y2 / this.canvasHeight;

            const c1 = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - p1, 2));
            const c2 = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - p2, 2));

            this.ctx.moveTo(c1, y1);
            this.ctx.lineTo(c2, y2);
        }
        this.ctx.stroke();

        // Draw Trees
        this.ctx.font = "30px Arial";
        for (const tree of this.trees) {
            const progress = tree.y / this.canvasHeight;
            const roadW = this.roadTopW + (this.roadBottomW - this.roadTopW) * progress;
            const center = (this.canvasWidth / 2) - (this.curveFactor * Math.pow(1 - progress, 2));

            let tx;
            if (tree.side === -1) {
                tx = center - (roadW / 2) - 40 - (Math.random() * 10);
            } else {
                tx = center + (roadW / 2) + 10 + (Math.random() * 10);
            }
            this.ctx.fillText(tree.type, tx, tree.y);
        }

        // Draw Obstacles
        for (const obs of this.obstacles) {
            this.ctx.font = `${Math.floor(40 * obs.scale)}px Arial`;
            this.ctx.fillText(obs.emoji, obs.x, obs.y + obs.h);
        }

        // Draw Sleigh
        // Visual Tilt based on steering velocity + Rotate to point UP
        this.ctx.save();
        this.ctx.translate(this.sleigh.x + this.sleigh.w / 2, this.sleigh.y + this.sleigh.h / 2);

        // Rotation: -90 degrees (points up) + 180 (flip) + steering tilt
        // Original (Up): -Math.PI / 2
        // Flip: + Math.PI
        // Result: Math.PI / 2 (Points Down/South? No, Up is -PI/2. Up + 180 = Down?)
        // Wait, user said "Rotate the car 180 degrees".
        // Original was pointing "Up" (North) as requested in Feedback 2.
        // If I flip 180, it points "Down" (South).
        // Is that what they want? "car should be facing vertically, that is, like the front of the car should be pointint up" (From Feedback 2).
        // New Feedback 3: "rotate the car 180 degrees".
        // Maybe they meant the EMOJI was upside down?
        // Let's assume they want it flipped relative to whatever it was.

        const baseRotation = (-Math.PI / 2) + Math.PI;
        const tilt = this.sleigh.vx * 0.0005; // Visual lean

        this.ctx.rotate(baseRotation + tilt);
        this.ctx.font = "60px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle"; // Center alignment crucial for rotation

        // Note: Default sleigh 🛷 faces Left? Or Right? 
        // Standard Android/Apple: 🛷 faces Left or Right.
        // If it faces Left, -90 makes it point Down?
        // Let's assume standard behavior. If wrong, we flip it.
        // Also added simple checks.
        this.ctx.fillText(this.sleigh.emoji, 0, 0);
        this.ctx.restore();

        // Damage Feedback (Red Screen) - Only when Off Road
        if (this.isOffRoad) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }

        // --- Draw Face Landmarks (Debug/Feedback) ---
        if (this.faceLandmarks && this.faceLandmarks.length > 0) {
            const face = this.faceLandmarks[0];
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow
            // Draw eyes (33, 263) and maybe nose (1)?
            // We need to map normalized coordinates to canvas
            const indices = [33, 263, 1];
            // 33: Left Eye, 263: Right Eye, 1: Nose Tip

            indices.forEach(idx => {
                const pt = face[idx];
                if (pt) {
                    const cx = (1 - pt.x) * this.canvasWidth; // Mirror x
                    const cy = pt.y * this.canvasHeight;

                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
            });
        }
    }
}
