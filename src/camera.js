export class Camera {
    constructor() {
        this.videoElement = document.getElementById('webcam');
        this.canvasElement = document.getElementById('game-canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');
        this.handLandmarks = [];
        this.hands = null;
        this.camera = null;
        this.isReady = false;
    }

    async init() {
        // Initialize MediaPipe Hands
        this.hands = new Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults.bind(this));

        // Initialize Camera using native getUserMedia for better control/simpler setup without Utils if preferable,
        // but MediaPipe's CameraUtils is robust. Let's use a simple custom implementation to avoid another dependency if we can,
        // BUT MediaPipe documentation suggests using their Camera util. 
        // For simplicity and avoiding extra CDN imports if not needed, we'll implement a basic rAF loop.
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720, facingMode: 'user' } 
            });
            this.videoElement.srcObject = stream;
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });
            this.videoElement.play();

            // Resize canvas to match video
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas.bind(this));
            
            this.isReady = true;
            this.startProcessing();
        } catch (e) {
            console.error("Error accessing camera:", e);
            alert("Camera access required for this game!");
        }
    }

    resizeCanvas() {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
    }

    startProcessing() {
        const processFrame = async () => {
            if (this.videoElement.paused || this.videoElement.ended) {
                return;
            }
            await this.hands.send({image: this.videoElement});
            requestAnimationFrame(processFrame);
        };
        processFrame();
    }

    onResults(results) {
        // Update landmarks
        if (results.multiHandLandmarks) {
            this.handLandmarks = results.multiHandLandmarks;
        } else {
            this.handLandmarks = [];
        }

        // We can draw landmarks here if we want debug or visual feedback
        // this.drawDebug(results);
    }
    
    getLandmarks() {
        return this.handLandmarks; // Returns array of hand arrays
    }

    drawDebug(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        // Note: Actual game drawing should probably happen in the Game Loop, not here.
        // This is just for initial testing if needed.
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS,
                             {color: '#00FF00', lineWidth: 5});
                drawLandmarks(this.canvasCtx, landmarks, 
                            {color: '#FF0000', lineWidth: 2});
            }
        }
        this.canvasCtx.restore();
    }
}
