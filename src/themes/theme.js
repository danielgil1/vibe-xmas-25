export class Theme {
    constructor(ctx, canvasWidth, canvasHeight) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.score = 0;
        this.lives = 15;
        this.isOver = false;
        this.timeElapsed = 0;
    }

    update(deltaTime, handLandmarks) {
        // To be implemented by subclasses
    }

    draw() {
        // To be implemented by subclasses
    }

    // Helper to check collision between point and circle
    checkCircleCollision(x, y, r, targetX, targetY) {
        const dist = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
        return dist < r;
    }

    // Helper to check collision between point and rect
    checkRectCollision(x, y, rx, ry, rw, rh) {
        return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    }
}
