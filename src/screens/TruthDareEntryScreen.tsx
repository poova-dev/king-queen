import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, HelpCircle, Zap, Users, Shuffle, HeartHandshake, ShieldAlert } from 'lucide-react';
import { Button } from '../components/UI';
import { UserProfile } from '../types';

interface TruthDareEntryScreenProps {
  user: UserProfile;
  onBack: () => void;
  onPlayWithPartner: () => void;
}

export const TruthDareEntryScreen: React.FC<TruthDareEntryScreenProps> = ({
  user,
  onBack,
  onPlayWithPartner,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/40">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors"
          aria-label="Return to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase">
              MULTIPLAYER MODE
            </span>
          </div>
          <h1 className="text-sm font-display tracking-widest uppercase text-[var(--text)]">
            TRUTH OR DARE
          </h1>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="King & Queen"
            className="w-7 h-7 object-contain opacity-70 filter drop-shadow-[0_1px_8px_rgba(184,155,94,0.3)]"
          />
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-6 flex flex-col gap-8 pb-32">
        {/* SUBTITLE */}
        <div className="text-center flex flex-col items-center gap-1">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Two players. No hiding.
          </p>
        </div>

        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)]/60 bg-gradient-to-b from-[#110D13] via-[#0E0B10] to-[#0A0A0C] p-8 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-[var(--primary)]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-rose-900/15 blur-3xl pointer-events-none" />

          {/* Floating Subtle Decorative Elements */}
          <div
            aria-hidden="true"
            className="absolute top-6 left-6 opacity-20 pointer-events-none text-xl font-serif select-none"
          >
            ?
          </div>
          <div
            aria-hidden="true"
            className="absolute bottom-6 right-6 opacity-20 pointer-events-none text-rose-400 select-none"
          >
            ⚡
          </div>
          <div
            aria-hidden="true"
            className="absolute top-8 right-10 opacity-15 pointer-events-none text-sm select-none"
          >
            ♔
          </div>
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-10 opacity-15 pointer-events-none text-sm select-none"
          >
            ♕
          </div>

          {/* Typography Composition: TRUTH vs DARE */}
          <div className="relative z-10 flex flex-col items-center gap-2 py-4">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="font-serif text-4xl sm:text-5xl font-normal tracking-[0.25em] text-[var(--primary)] uppercase drop-shadow-[0_2px_15px_rgba(184,155,94,0.35)]"
            >
              TRUTH
            </motion.span>

            <div className="flex items-center gap-3 my-1">
              <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
              <span className="text-xs font-serif italic tracking-[0.3em] text-[var(--text-muted)] opacity-70">
                VS
              </span>
              <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            </div>

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
              className="font-serif text-4xl sm:text-5xl font-normal tracking-[0.25em] text-rose-300 uppercase drop-shadow-[0_2px_20px_rgba(225,29,72,0.35)]"
            >
              DARE
            </motion.span>
          </div>

          <div className="relative z-10 mt-3 flex items-center gap-2 text-[11px] font-medium tracking-wider text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] opacity-80" />
            <span>Intimate • Unfiltered • Revealing</span>
          </div>
        </div>

        {/* INTRO CARD */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)]/70 p-6 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--primary)] uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Royal Decree</span>
          </div>
          <h2 className="text-lg font-display tracking-wide text-[var(--text)] uppercase">
            READY TO PLAY?
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            A game of secrets, challenges, and unexpected moments. Only you and your partner.
          </p>
        </div>

        {/* HOW IT WORKS SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--primary)] uppercase">
              HOW IT WORKS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 01 */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)]/60 p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--primary)] opacity-80">
                  01
                </span>
                <div className="w-8 h-8 rounded-xl bg-[var(--surface-light)] border border-[var(--border)]/60 flex items-center justify-center text-[var(--text-muted)]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-display tracking-wider text-[var(--text)] uppercase">
                  CONNECT
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Create a private room and invite your partner.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)]/60 p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--primary)] opacity-80">
                  02
                </span>
                <div className="w-8 h-8 rounded-xl bg-[var(--surface-light)] border border-[var(--border)]/60 flex items-center justify-center text-[var(--text-muted)]">
                  <Shuffle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-display tracking-wider text-[var(--text)] uppercase">
                  CHOOSE
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Truth or Dare decides your challenge.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)]/60 p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--primary)] opacity-80">
                  03
                </span>
                <div className="w-8 h-8 rounded-xl bg-[var(--surface-light)] border border-[var(--border)]/60 flex items-center justify-center text-[var(--text-muted)]">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-display tracking-wider text-[var(--text)] uppercase">
                  PLAY
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Take turns and discover something new.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* GAME PREVIEW (TWO LARGE VISUAL CARDS) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--primary)] uppercase">
              THE CHOICES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD ONE: TRUTH */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181512] to-[var(--surface)] border border-[var(--primary)]/45 p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(184,155,94,0.08)]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-xl font-serif font-bold text-[var(--primary)] shadow-sm">
                  ?
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[var(--primary)]/70 uppercase">
                  HONESTY
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-serif tracking-[0.15em] text-[var(--primary)] uppercase">
                  TRUTH
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Answer honestly. No secrets.
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>STYLE: ROYAL GOLD</span>
                <span>AUTHENTIC</span>
              </div>
            </div>

            {/* CARD TWO: DARE */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1C0F14] to-[var(--surface)] border border-rose-900/60 p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(225,29,72,0.08)]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-xl text-rose-400 shadow-sm">
                  <Zap className="w-5 h-5 fill-rose-400/20 text-rose-400" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-rose-400/80 uppercase">
                  COURAGE
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-serif tracking-[0.15em] text-rose-300 uppercase">
                  DARE
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Accept the challenge. Be brave.
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>STYLE: DEEP CRIMSON</span>
                <span>BOLD</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FLOATING PRIMARY CTA BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent border-t border-[var(--border)]/30 backdrop-blur-sm">
        <div className="max-w-md mx-auto">
          <Button
            variant="primary"
            onClick={onPlayWithPartner}
            className="w-full h-14 font-display tracking-widest uppercase shadow-[0_0_30px_rgba(184,155,94,0.3)] hover:shadow-[0_0_40px_rgba(184,155,94,0.45)]"
          >
            PLAY WITH PARTNER
          </Button>
        </div>
      </footer>
    </div>
  );
};
