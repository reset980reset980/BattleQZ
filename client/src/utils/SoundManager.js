class SoundManager {
    constructor() {
        this.ctx = null;
        this.bgmTimer = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', vol = 0.1) {
        if (!this.ctx || this.muted) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 0.2) {
        if (!this.ctx || this.muted) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playTheme(char) {
        this.playTone(char === 'Tanjiro' ? 392 : 150, 0.3, char === 'Tanjiro' ? 'square' : 'sawtooth', 0.1);
    }

    stopTheme() { }

    startBattleBgm() {
        if (!this.ctx) return;
        this.stopBattleBgm();
        let beat = 0;
        this.bgmTimer = setInterval(() => {
            if (this.muted) return;
            const t = this.ctx.currentTime;
            if (beat % 4 === 0) this.playTone(60, 0.1, 'square', 0.2);
            if (beat % 2 === 0) this.playNoise(0.05, 0.05);
            if (beat % 8 === 0) this.playTone(40, 0.2, 'sawtooth', 0.1);
            if (beat % 8 === 4) this.playTone(45, 0.2, 'sawtooth', 0.1);
            beat++;
        }, 125);
    }

    stopBattleBgm() {
        if (this.bgmTimer) clearInterval(this.bgmTimer);
    }

    sfxCorrect() {
        this.playTone(523.25, 0.1, 'square', 0.1);
        setTimeout(() => this.playTone(659.25, 0.2, 'square', 0.1), 100);
    }

    sfxWrong() {
        this.playTone(100, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.2), 150);
    }

    sfxAttack() {
        this.playNoise(0.1, 0.1);
        this.playTone(300, 0.1, 'triangle', 0.05);
    }

    sfxHit() {
        this.playNoise(0.3, 0.4);
        this.playTone(50, 0.2, 'sawtooth', 0.3);
    }
}

export const soundMgr = new SoundManager();
