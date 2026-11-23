// Web Audio API synthesizer for gentle classroom sound effects, background music-box loop,
// and Day 4 winter sound recognition games (100% offline, zero external audio URLs).

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = false;
  private musicInterval: number | null = null;
  private musicStep = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  public playClick() {
    if (!this.sfxEnabled) return;
    this.playTone(587.33, 0.09, 'sine', 0.05);
  }

  public playSuccess() {
    if (!this.sfxEnabled) return;
    this.playTone(523.25, 0.16, 'triangle', 0.09, 0);
    this.playTone(659.25, 0.16, 'triangle', 0.09, 0.09);
    this.playTone(783.99, 0.28, 'triangle', 0.1, 0.18);
  }

  public playGentleHint() {
    if (!this.sfxEnabled) return;
    this.playTone(329.63, 0.16, 'sine', 0.06, 0);
    this.playTone(293.66, 0.22, 'sine', 0.05, 0.12);
  }

  public playSealUnlock() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.35, 'triangle', 0.1, idx * 0.09);
    });
  }

  public playGrandVictory() {
    if (!this.sfxEnabled) return;
    const melody = [
      { f: 523.25, d: 0.2, t: 0 },
      { f: 659.25, d: 0.2, t: 0.14 },
      { f: 783.99, d: 0.2, t: 0.28 },
      { f: 1046.5, d: 0.45, t: 0.42 },
      { f: 783.99, d: 0.2, t: 0.7 },
      { f: 1046.5, d: 0.65, t: 0.88 },
    ];
    melody.forEach((m) => this.playTone(m.f, m.d, 'triangle', 0.11, m.t));
  }

  public playBellNote(index: number) {
    if (!this.sfxEnabled) return;
    const bellNotes = [523.25, 659.25, 783.99, 1046.5];
    const freq = bellNotes[index % bellNotes.length];
    this.playTone(freq, 0.32, 'sine', 0.08, 0);
    this.playTone(freq * 2, 0.18, 'sine', 0.03, 0);
  }

  // Day 4 synthesized winter sounds (strictly NO train sounds)
  public playWinterMysterySound(kind: 'csengo' | 'szel' | 'ho' | 'harang') {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (kind === 'csengo') {
      // Shimmering sleigh / handbell chimes
      [1567.98, 2093.0, 1760.0, 2349.32, 1567.98].forEach((freq, i) => {
        this.playTone(freq, 0.42, 'sine', 0.08, i * 0.14);
        this.playTone(freq * 2, 0.25, 'sine', 0.03, i * 0.14);
      });
    } else if (kind === 'szel') {
      // Soft winter wind noise sweep
      const duration = 1.6;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3.5;
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.7);
      filter.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 1.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.45);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (kind === 'ho') {
      // 4 crisp footsteps crunching in snow
      [0, 0.42, 0.84, 1.26].forEach((offset) => {
        const dur = 0.16;
        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1400;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(ctx.currentTime + offset);
      });
    } else if (kind === 'harang') {
      // Warm deep winter tower chime (3 strikes)
      [0, 0.55, 1.1].forEach((offset) => {
        this.playTone(440, 0.75, 'sine', 0.1, offset);
        this.playTone(880, 0.5, 'sine', 0.04, offset);
        this.playTone(659.25, 0.55, 'triangle', 0.03, offset);
      });
    }
  }

  private startMusic() {
    if (this.musicInterval !== null) return;
    // Gentle cozy music-box winter melody (C major / A minor lullaby pattern)
    const notes = [
      659.25, 587.33, 523.25, 587.33,
      659.25, 659.25, 659.25, 0,
      587.33, 587.33, 587.33, 0,
      659.25, 783.99, 783.99, 0,
      659.25, 587.33, 523.25, 587.33,
      659.25, 659.25, 659.25, 523.25,
      587.33, 587.33, 659.25, 587.33,
      523.25, 0, 0, 0,
    ];
    this.musicStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled) return;
      const freq = notes[this.musicStep % notes.length];
      if (freq > 0) {
        this.playTone(freq, 0.48, 'sine', 0.025);
      }
      this.musicStep += 1;
    }, 480);
  }

  private stopMusic() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
