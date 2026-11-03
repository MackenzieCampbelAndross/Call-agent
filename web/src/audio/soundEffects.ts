/**
 * Web Audio API Sound Synthesizer for DTMF Tones and Cellular Call Signals.
 * Runs in browser environment with zero external asset dependencies.
 */

class SoundEffectsEngine {
  private ctx: any = null;
  private ringbackInterval: any = null;
  private incomingRingtoneInterval: any = null;
  private activeToneOscillators: any[] = [];

  private dtmfFrequencies: Record<string, [number, number]> = {
    '1': [697, 1209],
    '2': [697, 1336],
    '3': [697, 1477],
    '4': [770, 1209],
    '5': [770, 1336],
    '6': [770, 1477],
    '7': [852, 1209],
    '8': [852, 1336],
    '9': [852, 1477],
    '*': [941, 1209],
    '0': [941, 1336],
    '#': [941, 1477],
  };

  private getContext(): any {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: any }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays realistic dual-frequency DTMF key tone for 120ms
   */
  public playDtmfTone(key: string): void {
    const freqs = this.dtmfFrequencies[key];
    if (!freqs) return;

    try {
      const ctx = this.getContext();
      const [f1, f2] = freqs;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = f1;
      osc2.frequency.value = f2;

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio playback fails gracefully if user hasn't interacted
    }
  }

  /**
   * Starts playing US standard cellular ringback tone (440Hz + 480Hz, 2s on, 4s off)
   */
  public startRingback(): void {
    this.stopAllTones();
    const playBurst = () => {
      try {
        const ctx = this.getContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.95);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 2.0);
        osc2.stop(ctx.currentTime + 2.0);
      } catch {
        // audio context safety
      }
    };

    playBurst();
    this.ringbackInterval = setInterval(playBurst, 4000);
  }

  public stopRingback(): void {
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
  }

  /**
   * Starts playing incoming call phone ringtone
   */
  public startIncomingRingtone(): void {
    this.stopAllTones();
    const playChime = () => {
      try {
        const ctx = this.getContext();
        const notes = [587.33, 659.25, 783.99, 880.0]; // D5, E5, G5, A5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + i * 0.12;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.1, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.35);
        });
      } catch {
        // audio context safety
      }
    };

    playChime();
    this.incomingRingtoneInterval = setInterval(playChime, 2500);
  }

  public stopIncomingRingtone(): void {
    if (this.incomingRingtoneInterval) {
      clearInterval(this.incomingRingtoneInterval);
      this.incomingRingtoneInterval = null;
    }
  }

  /**
   * Plays fast busy / disconnect signal (480Hz + 620Hz, repeated beeps)
   */
  public playBusySignal(): void {
    this.stopAllTones();
    try {
      const ctx = this.getContext();
      for (let i = 0; i < 3; i++) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.4;

        osc1.frequency.value = 480;
        osc2.frequency.value = 620;
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + 0.25);
        osc2.stop(start + 0.25);
      }
    } catch {
      // audio safety
    }
  }

  /**
   * Plays connected chirp
   */
  public playConnectedChirp(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // audio safety
    }
  }

  public stopAllTones(): void {
    this.stopRingback();
    this.stopIncomingRingtone();
    this.activeToneOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // ignore
      }
    });
    this.activeToneOscillators = [];
  }
}

export const soundEffects = new SoundEffectsEngine();
