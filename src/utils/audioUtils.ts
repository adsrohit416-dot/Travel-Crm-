/**
 * Audio utilities for Gemini Live API & TTS
 * - Input: 16kHz 16-bit Mono Little-Endian PCM (audio/pcm;rate=16000)
 * - Output Live: 24kHz 16-bit Mono Little-Endian PCM (audio/pcm;rate=24000)
 * - Output TTS: Standard RIFF WAV (audio/wav)
 */

/**
 * Converts a Float32Array from Web Audio API (16kHz) to 16-bit PCM Base64 string
 */
export function float32ToPcm16Base64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < input.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, input[i]));
    // Scale to 16-bit signed integer (little-endian)
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a 16-bit PCM Base64 string (24kHz from Gemini Live) to an AudioBuffer
 */
export function pcm16Base64ToAudioBuffer(base64: string, ctx: AudioContext): AudioBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);

  for (let i = 0; i < int16.length; i++) {
    const val = int16[i];
    float32[i] = val < 0 ? val / 32768 : val / 32767;
  }

  // Gemini Live outputs 24000Hz mono audio
  const buffer = ctx.createBuffer(1, float32.length, 24000);
  buffer.copyToChannel(float32, 0);
  return buffer;
}

/**
 * Plays standard RIFF WAV base64 audio via HTML5 Audio element
 */
export function playWavAudio(base64Wav: string, onEnded?: () => void): HTMLAudioElement {
  const binary = atob(base64Wav);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  audio.onended = () => {
    URL.revokeObjectURL(url);
    onEnded?.();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    onEnded?.();
  };
  audio.play().catch((err) => {
    console.warn('[playWavAudio] Auto-play was prevented by browser:', err);
    onEnded?.();
  });
  return audio;
}

/**
 * Robust Queue Manager for Gapless Playback of 24kHz Chunks
 */
export class GaplessAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeNodes: AudioBufferSourceNode[] = [];
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized on first user interaction
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass({ sampleRate: 24000 });
    }
    return this.ctx;
  }

  public async resume(): Promise<void> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (e) {
      console.warn('[GaplessAudioPlayer] Resume notice:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Queue audio chunk for precise gapless playback
   */
  public queueChunk(base64Audio: string, onEnded?: () => void) {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const audioBuffer = pcm16Base64ToAudioBuffer(base64Audio, ctx);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);
      this.activeNodes.push(sourceNode);

      const currentTime = ctx.currentTime;
      // If nextStartTime has fallen behind currentTime, reset it
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      sourceNode.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      sourceNode.onended = () => {
        const index = this.activeNodes.indexOf(sourceNode);
        if (index !== -1) {
          this.activeNodes.splice(index, 1);
        }
        onEnded?.();
      };
    } catch (err) {
      console.error('[GaplessAudioPlayer] Error queuing chunk:', err);
      onEnded?.();
    }
  }

  /**
   * Immediately stops playback and clears all queued chunks
   */
  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Node might have already finished
      }
    });
    this.activeNodes = [];
    if (this.ctx) {
      this.nextStartTime = this.ctx.currentTime;
    }
  }

  public isPlaying(): boolean {
    return this.activeNodes.length > 0;
  }

  public close() {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

/**
 * Synthesizes a futuristic, high-tech JARVIS activation chime
 * (Iron Man style 3-tone electronic chime) using Web Audio API
 */
export function playJarvisActivationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);

    // Tone 3: 1174.66 Hz (D6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1174.66, now + 0.16);
    gain3.gain.setValueAtTime(0.001, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.3, now + 0.18);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.55);

    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') ctx.close();
      } catch {}
    }, 800);
  } catch (err) {
    console.warn('[playJarvisActivationChime] Unable to play chime:', err);
  }
}

/**
 * Authentic Iron-Man JARVIS sleep / standby sound synthesizer
 * Plays a descending 3-tone sci-fi power-down chime (D6 -> A5 -> D5/D4)
 */
export function playJarvisSleepChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: 1174.66 Hz (D6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1174.66, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);

    // Tone 3: 587.33 Hz (D5) -> ramps smoothly down to 293.66 Hz (D4)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(587.33, now + 0.16);
    osc3.frequency.exponentialRampToValueAtTime(293.66, now + 0.5);
    gain3.gain.setValueAtTime(0.001, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.2, now + 0.18);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.55);

    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') ctx.close();
      } catch {}
    }, 800);
  } catch (err) {
    console.warn('[playJarvisSleepChime] Unable to play chime:', err);
  }
}


