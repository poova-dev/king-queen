import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, HelpCircle, Zap, Users, Shuffle, HeartHandshake, ShieldAlert, Check } from 'lucide-react';
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
  const [selectedModePreview, setSelectedModePreview] = useState<'TRUTH' | 'DARE' | null>(null);

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
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--primary)] uppercase">
              THE CHOICES • TAP TO SELECT
            </span>
            {selectedModePreview && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 uppercase">
                <Check className="w-3 h-3" /> {selectedModePreview} ACTIVE
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD ONE: TRUTH */}
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedModePreview(selectedModePreview === 'TRUTH' ? null : 'TRUTH')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedModePreview(selectedModePreview === 'TRUTH' ? null : 'TRUTH');
                }
              }}
              className={`
                relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 transition-all cursor-pointer select-none
                ${
                  selectedModePreview === 'TRUTH'
                    ? 'bg-gradient-to-b from-[#241c14] to-[var(--surface)] border-2 border-[var(--primary)] shadow-[0_0_30px_rgba(184,155,94,0.3)]'
                    : 'bg-gradient-to-b from-[#181512] to-[var(--surface)] border border-[var(--primary)]/45 hover:border-[var(--primary)]/80 shadow-[0_4px_20px_rgba(184,155,94,0.08)]'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-serif font-bold transition-colors ${
                    selectedModePreview === 'TRUTH'
                      ? 'bg-[var(--primary)] text-black shadow-md'
                      : 'bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)]'
                  }`}
                >
                  ?
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedModePreview === 'TRUTH' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary)] text-black">
                      CHOSEN
                    </span>
                  )}
                  <span className="text-[10px] font-mono tracking-widest text-[var(--primary)]/70 uppercase">
                    HONESTY
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-serif tracking-[0.15em] text-[var(--primary)] uppercase flex items-center gap-2">
                  <span>TRUTH</span>
                  {selectedModePreview === 'TRUTH' && (
                    <Check className="w-4 h-4 text-[var(--primary)]" />
                  )}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Answer honestly. Reveal your hidden desires, sweetest memories, and raw thoughts.
                </p>
              </div>

              {selectedModePreview === 'TRUTH' && (
                <div className="p-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-xs text-[var(--primary)] flex flex-col gap-1 animate-in fade-in zoom-in-95">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-[var(--primary)]/80">
                    Sample Royal Prompt:
                  </span>
                  <p className="italic text-[11px] leading-relaxed">
                    &ldquo;What was the very first moment you felt a spark for your partner?&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>STYLE: ROYAL GOLD</span>
                <span className="text-[var(--primary)] font-bold">TAP TO SELECT</span>
              </div>
            </motion.div>

            {/* CARD TWO: DARE */}
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedModePreview(selectedModePreview === 'DARE' ? null : 'DARE')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedModePreview(selectedModePreview === 'DARE' ? null : 'DARE');
                }
              }}
              className={`
                relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 transition-all cursor-pointer select-none
                ${
                  selectedModePreview === 'DARE'
                    ? 'bg-gradient-to-b from-[#2a131c] to-[var(--surface)] border-2 border-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.35)]'
                    : 'bg-gradient-to-b from-[#1C0F14] to-[var(--surface)] border border-rose-900/60 hover:border-rose-500/70 shadow-[0_4px_20px_rgba(225,29,72,0.08)]'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${
                    selectedModePreview === 'DARE'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-rose-950/60 border border-rose-600/40 text-rose-400'
                  }`}
                >
                  <Zap className={`w-5 h-5 ${selectedModePreview === 'DARE' ? 'fill-white text-white' : 'fill-rose-400/20 text-rose-400'}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedModePreview === 'DARE' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      CHOSEN
                    </span>
                  )}
                  <span className="text-[10px] font-mono tracking-widest text-rose-400/80 uppercase">
                    COURAGE
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-serif tracking-[0.15em] text-rose-300 uppercase flex items-center gap-2">
                  <span>DARE</span>
                  {selectedModePreview === 'DARE' && (
                    <Check className="w-4 h-4 text-rose-400" />
                  )}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Accept the royal challenge. Step out of your comfort zone with thrilling intimacy.
                </p>
              </div>

              {selectedModePreview === 'DARE' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-rose-300">
                    Sample Royal Prompt:
                  </span>
                  <p className="italic text-[11px] leading-relaxed">
                    &ldquo;Whisper an undeniable royal compliment directly into your partner&apos;s ear.&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>STYLE: DEEP CRIMSON</span>
                <span className="text-rose-400 font-bold">TAP TO SELECT</span>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* FLOATING PRIMARY CTA BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent border-t border-[var(--border)]/30 backdrop-blur-sm">
        <div className="max-w-md mx-auto">
          <Button
            variant="primary"
            onClick={onPlayWithPartner}
            className={`w-full h-14 font-display tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(184,155,94,0.3)] hover:shadow-[0_0_40px_rgba(184,155,94,0.45)] ${
              selectedModePreview === 'DARE'
                ? 'bg-gradient-to-r from-rose-900 via-rose-700 to-rose-950 border border-rose-500/50 text-white shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:shadow-[0_0_40px_rgba(225,29,72,0.6)]'
                : ''
            }`}
          >
            {selectedModePreview
              ? `PLAY ${selectedModePreview} WITH PARTNER 👑`
              : 'PLAY WITH PARTNER'}
          </Button>
        </div>
      </footer>
    </div>
  );
};
