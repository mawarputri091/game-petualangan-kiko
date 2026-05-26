/**
 * Audio Synthesizer utilizing Web Audio API for zero-delay retro effects and chiptune BGM.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private currentSource: AudioNode | null = null;
  private isMusicPlaying: boolean = false;
  private bgmVolume: number = 0.15;
  private sfxVolume: number = 0.4;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBGM();
    } else if (this.isMusicPlaying) {
      this.startBGM();
    }
  }

  getIsMuted() {
    return this.isMuted;
  }

  playJump() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  playCoin() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpeggio
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

    gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.26);
  }

  playKey() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(this.sfxVolume, now + idx * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  playDamage() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 1.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }

  playVictory() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;

    // Happy fanfare
    const notes = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 587.33, d: 0.1 },  // D5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.4 }   // G5 (held)
    ];

    let accruedTime = 0;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + accruedTime);

      gain.gain.setValueAtTime(this.sfxVolume, now + accruedTime);
      gain.gain.exponentialRampToValueAtTime(0.01, now + accruedTime + note.d - 0.01);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + accruedTime);
      osc.stop(now + accruedTime + note.d);

      accruedTime += note.d + 0.02;
    });
  }

  playGameOver() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;

    // Sad descending fanfare
    const notes = [
      { f: 392.00, d: 0.2 }, // G4
      { f: 349.23, d: 0.2 }, // F4
      { f: 311.13, d: 0.2 }, // Eb4
      { f: 246.94, d: 0.5 }  // B3
    ];

    let accruedTime = 0;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, now + accruedTime);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8, now + accruedTime);
      gain.gain.exponentialRampToValueAtTime(0.01, now + accruedTime + note.d - 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + accruedTime);
      osc.stop(now + accruedTime + note.d);

      accruedTime += note.d + 0.05;
    });
  }

  playChestUnlock() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;

    // Magical rising sparkles
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const f = 400 + i * 150;
      const t = now + i * 0.05;

      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(this.sfxVolume, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  startBGM() {
    this.isMusicPlaying = true;
    if (this.isMuted) return;

    try {
      const ctx = this.initCtx();
      if (this.musicInterval) clearInterval(this.musicInterval);

      // Simple 4-step loop sequence
      // Am, F, C, G chord progression
      const chords = [
        [220, 261.63, 329.63, 440], // Am
        [174.61, 220, 261.63, 349.23], // F
        [261.63, 329.63, 392.00, 523.25], // C
        [196.00, 246.94, 293.66, 392.00]  // G
      ];

      let chordIndex = 0;
      let tick = 0;

      const playBgmTick = () => {
        if (this.isMuted || !this.isMusicPlaying) return;
        const now = ctx.currentTime;

        // Base/roots on index 0
        const chord = chords[chordIndex];
        
        // Bass Note on beat 0 and 2
        if (tick % 4 === 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(chord[0] / 2, now); // Octave below
          gain.gain.setValueAtTime(this.bgmVolume * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(now + 0.61);
        }

        // Cute melody arpeggio in the foreground
        const arpNote = chord[1 + (tick % 3)];
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(arpNote * 1.5, now);
        gain2.gain.setValueAtTime(this.bgmVolume * 0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(now + 0.26);

        tick++;
        if (tick >= 8) {
          tick = 0;
          chordIndex = (chordIndex + 1) % chords.length;
        }
      };

      // Play initially
      playBgmTick();
      this.musicInterval = setInterval(playBgmTick, 350); // 350ms per tick
    } catch (e) {
      console.warn("Audio Context busy or not supported on load: ", e);
    }
  }

  stopBGM() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const AudioFX = new SoundEngine();
