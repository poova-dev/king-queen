import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Handshake, Flag, Volume2, VolumeX, ScrollText, LogOut, X } from 'lucide-react';

interface MobileGameDrawerProps {
  isOpen: boolean;
  isSoundEnabled: boolean;
  isGameOver?: boolean;
  isResignDisabled?: boolean;
  isDrawDisabled?: boolean;
  onClose: () => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onToggleSound: () => void;
  onOpenHistory: () => void;
  onExitGame: () => void;
}

export const MobileGameDrawer: React.FC<MobileGameDrawerProps> = ({
  isOpen,
  isSoundEnabled,
  isGameOver = false,
  isResignDisabled = false,
  isDrawDisabled = false,
  onClose,
  onOfferDraw,
  onResign,
  onToggleSound,
  onOpenHistory,
  onExitGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Card */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[var(--surface)] border-t sm:border border-[var(--primary)]/40 p-5 pb-8 sm:pb-6 shadow-2xl flex flex-col gap-4"
      >
        {/* Handle Bar (Mobile only) */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--border)] mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-3">
          <h3 className="text-sm font-display tracking-widest uppercase text-[var(--text)]">
            Match Options
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Close options"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="flex flex-col gap-2.5">
          {/* Offer Draw */}
          <button
            onClick={() => {
              onClose();
              onOfferDraw();
            }}
            disabled={isDrawDisabled || isGameOver}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text)]">Offer Draw</span>
                <span className="text-[10px] text-[var(--text-muted)]">Propose a peaceful conclusion</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[var(--primary)]">🤝</span>
          </button>

          {/* Resign Game */}
          <button
            onClick={() => {
              onClose();
              onResign();
            }}
            disabled={isResignDisabled || isGameOver}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-red-400">Resign Match</span>
                <span className="text-[10px] text-[var(--text-muted)]">Concede with royal honor</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-red-400">🏳</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text)]">Battle Sounds</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {isSoundEnabled ? 'Sound is currently ON' : 'Sound is muted'}
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                isSoundEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {isSoundEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Move History */}
          <button
            onClick={() => {
              onClose();
              onOpenHistory();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center">
                <ScrollText className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text)]">Move Ledger</span>
                <span className="text-[10px] text-[var(--text-muted)]">View moves played in this match</span>
              </div>
            </div>
            <span className="text-[10px] text-[var(--primary)]">📜</span>
          </button>

          {/* Exit Match */}
          <button
            onClick={() => {
              onClose();
              onExitGame();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-700/30 border border-zinc-700 text-[var(--text-muted)] flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-[var(--text)]">Leave Match</span>
                <span className="text-[10px] text-[var(--text-muted)]">Return to kingdom dashboard</span>
              </div>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">🏰</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
