import { AlarmPresetType, TickPresetType, AmbientPresetType } from './customAudio';

export type ChimeSoundType = AlarmPresetType | 'custom';
export type TickSoundType = TickPresetType;
export type AmbientSoundType = AmbientPresetType;

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientType: AmbientPresetType = 'none';
  private customAudioCache = new Map<string, AudioBuffer>();

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play completion alarm sound: built-in synthesis or user-uploaded custom audio.
   */
  public playChime(
    volume: number = 0.7,
    type: ChimeSoundType = 'chime',
    customDataUrl?: string
  ): void {
    if (customDataUrl) {
      this.playCustomAudio(customDataUrl, volume);
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.45, now);
    masterGain.connect(ctx.destination);

    if (type === 'bell') {
      // Meditation bell: deep fundamental + rich harmonics
      const partials = [
        { f: 440, a: 0.6, d: 2.5 },
        { f: 880, a: 0.4, d: 2.0 },
        { f: 1320, a: 0.25, d: 1.5 },
        { f: 1760, a: 0.15, d: 1.0 },
      ];
      partials.forEach(({ f, a, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(a, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + d);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + d + 0.1);
      });
    } else if (type === 'digital') {
      // Modern digital electronic tri-beep
      const freqs = [880, 1174.66, 1760];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0, now + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.4, now + i * 0.09 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.18);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.2);
      });
    } else if (type === 'wood') {
      // Zen temple woodblock strike
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'bowl') {
      // Tibetan singing bowl with acoustic beating
      [300, 303.5].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 3.4);
      });
    } else {
      // 'chime' (default harmonic triad)
      const frequencies = [523.25, 783.99, 1046.5];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.5 / (i + 1), now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.6);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.8);
      });
    }
  }

  /**
   * Play ticking pulse: mechanical clock, soft digital, or wood tap.
   */
  public playTick(
    volume: number = 0.3,
    type: TickPresetType = 'clock'
  ): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'digital_tick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(volume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    } else if (type === 'wood_tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.02);
      gain.gain.setValueAtTime(volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      gain.gain.setValueAtTime(volume * 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.01);
    } else {
      // 'clock' (default)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.015);
      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }
  }

  /**
   * Play user custom uploaded audio via HTMLAudioElement or Web Audio buffer.
   */
  public playCustomAudio(dataUrl: string, volume: number = 0.7): void {
    if (typeof window === 'undefined') return;
    try {
      const audio = new Audio(dataUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch {
      // ignore playback block
    }
  }

  public setAmbient(type: AmbientPresetType, volume: number = 0.5): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAmbient();
    this.currentAmbientType = type;

    if (type === 'none') return;

    const now = ctx.currentTime;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(volume * 0.15, now);
    this.ambientGain.connect(ctx.destination);

    if (type === 'whitenoise' || type === 'rain') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * (type === 'rain' ? 0.12 : 0.2);
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      if (type === 'rain') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
      } else {
        whiteNoise.connect(this.ambientGain);
      }

      whiteNoise.start();
      this.ambientSource = whiteNoise;
    } else if (type === 'binaural') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(210, now);
      osc2.frequency.setValueAtTime(220, now);
      osc1.connect(this.ambientGain);
      osc2.connect(this.ambientGain);
      osc1.start();
      osc2.start();
      this.ambientSource = osc1;
    } else if (type === 'stream') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.1;
      }
      const streamSource = ctx.createBufferSource();
      streamSource.buffer = noiseBuffer;
      streamSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(650, now);
      bandpass.Q.setValueAtTime(1.8, now);

      streamSource.connect(bandpass);
      bandpass.connect(this.ambientGain);
      streamSource.start();
      this.ambientSource = streamSource;
    }
  }

  public stopAmbient(): void {
    if (this.ambientSource) {
      try {
        (this.ambientSource as any).stop?.();
        this.ambientSource.disconnect();
      } catch {
        // ignore
      }
      this.ambientSource = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // ignore
      }
      this.ambientGain = null;
    }
    this.currentAmbientType = 'none';
  }

  public setAmbientVolume(volume: number): void {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundSynthesizer();
