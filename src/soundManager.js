export class SoundManager {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.tempo = 200;
        this.noteIndex = 0;
        this.nextNoteTime = 0;
        this.speedMultiplier = 1.0;

        // Frequencies
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 784.99, A5 = 880.00, B5 = 987.77;

        // Jingle Bells
        this.jingleBells = [
            { f: E5, d: 1 }, { f: E5, d: 1 }, { f: E5, d: 2 },
            { f: E5, d: 1 }, { f: E5, d: 1 }, { f: E5, d: 2 },
            { f: E5, d: 1 }, { f: G5, d: 1 }, { f: C5, d: 1.5 }, { f: D5, d: 0.5 }, { f: E5, d: 4 },
            { f: F5, d: 1 }, { f: F5, d: 1 }, { f: F5, d: 1.5 }, { f: F5, d: 0.5 },
            { f: F5, d: 1 }, { f: E5, d: 1 }, { f: E5, d: 1 }, { f: E5, d: 0.5 }, { f: E5, d: 0.5 },
            { f: E5, d: 1 }, { f: D5, d: 1 }, { f: D5, d: 1 }, { f: E5, d: 1 }, { f: D5, d: 2 }, { f: G5, d: 2 }
        ];

        // We Wish You
        this.weWishYou = [
            { f: C5, d: 1 },
            { f: F5, d: 1 }, { f: F5, d: 0.5 }, { f: G5, d: 0.5 }, { f: F5, d: 0.5 }, { f: E5, d: 0.5 },
            { f: D5, d: 1 }, { f: D5, d: 1 }, { f: D5, d: 1 },
            { f: G5, d: 1 }, { f: G5, d: 0.5 }, { f: A5, d: 0.5 }, { f: G5, d: 0.5 }, { f: F5, d: 0.5 },
            { f: E5, d: 1 }, { f: C5, d: 1 }, { f: C5, d: 1 },
            { f: A5, d: 1 }, { f: A5, d: 0.5 }, { f: B5, d: 0.5 }, { f: A5, d: 0.5 }, { f: G5, d: 0.5 },
            { f: F5, d: 1 }, { f: D5, d: 1 }, { f: C5, d: 0.5 }, { f: C5, d: 0.5 },
            { f: D5, d: 1 }, { f: G5, d: 1 }, { f: E5, d: 1 },
            { f: F5, d: 2 }
        ];

        // Deck the Halls
        this.deckTheHalls = [
            { f: G5, d: 1.5 }, { f: F5, d: 0.5 }, { f: E5, d: 1 }, { f: D5, d: 1 },
            { f: C5, d: 1 }, { f: D5, d: 1 }, { f: E5, d: 1 }, { f: C5, d: 1 },
            { f: D5, d: 0.5 }, { f: E5, d: 0.5 }, { f: F5, d: 0.5 }, { f: D5, d: 0.5 }, { f: E5, d: 1 }, { f: C5, d: 1 },
            { f: D5, d: 0.5 }, { f: C5, d: 0.5 }, { f: B4, d: 1 }, { f: C5, d: 2 }
        ];

        this.melodies = [this.jingleBells, this.weWishYou, this.deckTheHalls];
        this.currentMelody = this.jingleBells;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    startMusic() {
        this.init();
        this.stopMusic(); // Ensure stop before starting new

        this.isPlaying = true;
        this.noteIndex = 0;
        this.nextNoteTime = this.audioCtx.currentTime;
        this.speedMultiplier = 1.0;

        // Pick Random Melody
        this.currentMelody = this.melodies[Math.floor(Math.random() * this.melodies.length)];
        // reset tempo default? Or keep standard
        this.tempo = 180; // Standard

        this.scheduler();
    }

    setSpeed(mult) {
        this.speedMultiplier = mult;
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.timerID) clearTimeout(this.timerID);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.audioCtx) {
            if (this.isMuted) {
                this.audioCtx.suspend();
            } else {
                this.audioCtx.resume();
            }
        }
        return this.isMuted;
    }

    scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
            this.playNote(this.currentMelody[this.noteIndex]);
            this.advanceNote();
        }

        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    playNote(note) {
        if (this.isMuted) return; // Redundant if suspended, but safe.

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.type = 'square';
        osc.frequency.value = note.f;

        const dynamicTempo = this.tempo * this.speedMultiplier;
        const duration = note.d * (60 / dynamicTempo);

        gainNode.gain.setValueAtTime(0.05, this.nextNoteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + duration * 0.9);

        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + duration);
    }

    advanceNote() {
        const dynamicTempo = this.tempo * this.speedMultiplier;
        const secondsPerBeat = 60.0 / dynamicTempo;
        this.nextNoteTime += this.currentMelody[this.noteIndex].d * secondsPerBeat;

        this.noteIndex++;
        if (this.noteIndex === this.currentMelody.length) {
            this.noteIndex = 0;
        }
    }
}
