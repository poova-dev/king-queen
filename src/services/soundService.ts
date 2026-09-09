/**
 * Sound Service — KING & QUEEN Chess Application
 * STEP 17 — PRODUCTION GAME EXPERIENCE & SOUND SYSTEM
 *
 * Implements a procedural Web Audio API chess sound synthesizer with:
 * - Zero external mp3 dependencies (100% reliable, zero network latency or 404s)
 * - Event deduplication (prevents double-playing across Firestore snapshot updates)
 * - Safe browser autoplay unlocking on first user interaction
 * - LocalStorage preference persistence
 */

export type ChessSoundType =
  | 'MOVE'
  | 'CAPTURE'
  | 'CHECK'
  | 'CHECKMATE'
  | 'CASTLE'
  | 'PROMOTION'
  | 'GAME_START'
  | 'VICTORY'
  | 'DEFEAT'
  | 'TIMER_LOW';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private playedEvents: Set<string> = new Set();
  private maxHistorySize = 300;

  constructor() {
    // Read persisted user preference
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('king_queen_sound_enabled');
        this.soundEnabled = stored !== null ? stored === 'true' : true;
      } catch {
        this.soundEnabled = true;
      }

      // Prepare unlock listener for iOS / browser autoplay policies
      const unlockAudio = () => {
        this.ensureAudioContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Check if sound is currently enabled
   */
  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Set sound enabled/disabled with persistence
   */
  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('king_queen_sound_enabled', String(enabled));
      } catch {}
    }
  }

  /**
   * Toggle sound enabled state
   */
  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Check if an event has already been played to avoid duplicates
   */
  public shouldPlay(roomId: string, eventType: ChessSoundType, eventKey?: string | number): boolean {
    if (!this.soundEnabled) return false;
    if (!roomId) return true; // Local play without room id

    const key = `${roomId}_${eventType}_${eventKey ?? 'default'}`;
    if (this.playedEvents.has(key)) {
      return false;
    }

    this.playedEvents.add(key);

    // Evict old events if set gets too large
    if (this.playedEvents.size > this.maxHistorySize) {
      const iter = this.playedEvents.values();
      for (let i = 0; i < 50; i++) {
        const next = iter.next();
        if (next.done) break;
        this.playedEvents.delete(next.value);
      }
    }

    return true;
  }

  /**
   * Clear deduplication history (e.g. on new room / rematch)
   */
  public clearEventHistory(): void {
    this.playedEvents.clear();
  }

  // ====================================================
  // PROCEDURAL AUDIO SYNTHESIZERS
  // ====================================================

  /**
   * Clean, wooden piece tap (low-pitch resonant transient)
   */
  public playMoveSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'MOVE', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Sharp, satisfying capture snap (dual harmonic click)
   */
  public playCaptureSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'CAPTURE', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Transient 1: Sharp strike
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(450, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.11);

      // Transient 2: Deep body thump
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(160, now + 0.01);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.12);
      gain2.gain.setValueAtTime(0.4, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.01);
      osc2.stop(now + 0.13);
    } catch {}
  }

  /**
   * King in check alert ping (two-tone chime)
   */
  public playCheckSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'CHECK', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playTone(587.33, now, 0.18); // D5
      playTone(880.0, now + 0.08, 0.35); // A5
    } catch {}
  }

  /**
   * Resonant checkmate victory chord
   */
  public playCheckmateSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'CHECKMATE', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.75);
      });
    } catch {}
  }

  /**
   * Castling sound: Double wood glide tap
   */
  public playCastleSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'CASTLE', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.09].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 320 : 250, now + delay);
        osc.frequency.exponentialRampToValueAtTime(100, now + delay + 0.07);
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch {}
  }

  /**
   * Pawn promotion: Ascending royal brass shimmer
   */
  public playPromotionSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'PROMOTION', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440.0, 554.37, 659.25, 880.0]; // A4, C#5, E5, A5

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {}
  }

  /**
   * Game start kingdom chime
   */
  public playGameStartSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'GAME_START', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [392.0, 523.25, 659.25]; // G4, C5, E5

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.32, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {}
  }

  /**
   * Victory sound: Royal triumphal fanfare
   */
  public playVictorySound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'VICTORY', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 523.25, 523.25, 659.25, 783.99]; // C5, C5, C5, E5, G5
      const times = [0, 0.1, 0.2, 0.32, 0.5];
      const durations = [0.08, 0.08, 0.1, 0.16, 0.8];

      notes.forEach((freq, i) => {
        const start = now + times[i];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.32, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + durations[i]);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + durations[i] + 0.05);
      });
    } catch {}
  }

  /**
   * Defeat sound: Low melancholic bell gong
   */
  public playDefeatSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'DEFEAT', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [293.66, 261.63, 220.0]; // D4, C4, A3

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.85);
      });
    } catch {}
  }

  /**
   * Low timer warning tick
   */
  public playTimerLowSound(roomId = '', eventKey?: string | number): void {
    if (!this.shouldPlay(roomId, 'TIMER_LOW', eventKey)) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }
}

export const soundService = new SoundService();
