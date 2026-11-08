class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientType: string = 'none';
  private ambientCustomSource: HTMLAudioElement | null = null;

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

  public playChime(volume: number = 0.7): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.4, now);
    masterGain.connect(ctx.destination);

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

  /** Alarm presets: synthesized chime variants + custom file id ('custom:<id>'). */
  public playAlarm(preset: string, volume: number = 0.7, customDataUrl?: string | null): void {
    if (preset.startsWith('custom:') && customDataUrl) {
      try {
        const audio = new Audio(customDataUrl);
        audio.volume = Math.min(1, Math.max(0, volume));
        void audio.play().catch(() => undefined);
        return;
      } catch { /* fall through to chime */ }
    }
    switch (preset) {
      case 'zen': this.playZenChime(volume); break;
      case 'temple': this.playTempleBell(volume); break;
      case 'beep': this.playDigitalBeep(volume); break;
      case 'wood': this.playWoodBlock(volume); break;
      case 'bowl': this.playSingingBowl(volume); break;
      default: this.playChime(volume);
    }
  }

  private tone(freq: number, start: number, dur: number, peak: number, type: OscillatorType = 'sine', glideTo?: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(start); osc.stop(start + dur + 0.05);
  }

  private playZenChime(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(528, now, 2.2, volume * 0.35);
    this.tone(792, now + 0.4, 2.0, volume * 0.25);
    this.tone(1056, now + 0.9, 1.8, volume * 0.18);
  }
  private playTempleBell(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    // Inharmonic partials = bell-ish
    this.tone(220, now, 3.0, volume * 0.4, 'sine');
    this.tone(329.6, now + 0.05, 2.4, volume * 0.25, 'sine');
    this.tone(440.9, now + 0.1, 1.8, volume * 0.18, 'triangle');
    this.tone(587.3, now + 0.15, 1.2, volume * 0.12, 'sine');
  }
  private playDigitalBeep(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(880, now, 0.18, volume * 0.4, 'square');
    this.tone(880, now + 0.25, 0.18, volume * 0.4, 'square');
    this.tone(1174, now + 0.5, 0.4, volume * 0.4, 'square');
  }
  private playWoodBlock(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(620, now, 0.12, volume * 0.5, 'triangle', 180);
    this.tone(930, now + 0.18, 0.1, volume * 0.35, 'triangle', 300);
  }
  private playSingingBowl(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    const now = ctx.currentTime;
    this.tone(432, now, 4.0, volume * 0.35, 'sine');
    this.tone(648, now + 0.2, 3.5, volume * 0.2, 'sine');
    this.tone(864, now + 0.5, 3.0, volume * 0.12, 'sine');
  }

  /** Tick styles for the per-second countdown. */
  public playTickStyled(style: string, volume: number = 0.3): void {
    switch (style) {
      case 'clock': this.playTickClock(volume); break;
      case 'pulse': this.playTickPulse(volume); break;
      case 'metronome': this.playTickMetronome(volume); break;
      case 'tap': this.playTickTap(volume); break;
      default: this.playTick(volume);
    }
  }

  private playTickClock(volume: number) {
    this.tone(1400, this.getAudioContext()!.currentTime, 0.03, volume * 0.12, 'square');
  }
  private playTickPulse(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    this.tone(660, ctx.currentTime, 0.05, volume * 0.1, 'sine', 440);
  }
  private playTickMetronome(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    this.tone(1150, ctx.currentTime, 0.04, volume * 0.18, 'triangle');
  }
  private playTickTap(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
    g.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.04);
  }

  public playTick(volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

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

  public setAmbient(type: string, volume: number = 0.5, customDataUrl?: string | null): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAmbient();
    this.currentAmbientType = type;

    if (type === 'none') return;

    if (type.startsWith('custom:') && customDataUrl && typeof Audio !== 'undefined') {
      const audio = new Audio(customDataUrl);
      audio.loop = true;
      audio.volume = Math.min(1, Math.max(0, volume * 0.5));
      void audio.play().catch(() => undefined);
      this.ambientCustomSource = audio;
      return;
    }
    if (type === 'rain') { this.startRainAmbient(volume); return; }
    if (type === 'stream') { this.startStreamAmbient(volume); return; }
    if (type === 'alpha') { this.startAlphaAmbient(volume); return; }

    const now = ctx.currentTime;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(volume * 0.15, now);
    this.ambientGain.connect(ctx.destination);

    if (type === 'whitenoise') {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.2;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.connect(this.ambientGain);
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
    }
  }

  public stopAmbient(): void {
    if (this.ambientCustomSource) {
      try { this.ambientCustomSource.pause(); this.ambientCustomSource = null; } catch { /* ignore */ }
    }
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

  // ---- additional ambient beds ----
  private noiseBuffer(kind: 'white' | 'pink' | 'brown'): AudioBuffer | null {
    const ctx = this.getAudioContext(); if (!ctx) return null;
    const len = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const out = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') { out[i] = w; continue; }
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  private startNoiseBed(buffer: AudioBuffer | null, volume: number) {
    const ctx = this.getAudioContext(); if (!ctx || !buffer) return;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
    this.ambientGain.connect(ctx.destination);
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    src.connect(this.ambientGain); src.start();
    this.ambientSource = src;
  }

  private startRainAmbient(volume: number) {
    // pink noise + slow amplitude LFO approximates rain
    const buffer = this.noiseBuffer('pink');
    this.startNoiseBed(buffer, volume);
    const ctx = this.getAudioContext(); if (!ctx || !this.ambientGain) return;
    const lfo = ctx.createOscillator(); const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.13; lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain); lfoGain.connect(this.ambientGain.gain);
    lfo.start();
  }
  private startStreamAmbient(volume: number) {
    this.startNoiseBed(this.noiseBuffer('brown'), volume);
  }
  private startAlphaAmbient(volume: number) {
    const ctx = this.getAudioContext(); if (!ctx) return;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
    this.ambientGain.connect(ctx.destination);
    const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
    o1.frequency.value = 200; o2.frequency.value = 210; // 10 Hz binaural
    o1.connect(this.ambientGain); o2.connect(this.ambientGain);
    o1.start(); o2.start();
    this.ambientSource = o1;
  }
}

export const soundEngine = new SoundSynthesizer();
