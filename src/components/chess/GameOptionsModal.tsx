import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, Handshake, LogOut, X, AlertCircle } from 'lucide-react';
import { Button } from '../UI';

interface GameOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onExitGame: () => void;
}

export const GameOptionsModal: React.FC<GameOptionsModalProps> = ({
  isOpen,
  onClose,
  onOfferDraw,
  onResign,
  onExitGame,
}) => {
  const [confirmAction, setConfirmAction] = React.useState<'draw' | 'resign' | 'exit' | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-base font-display tracking-wider uppercase text-[var(--text)]">
            Match Options
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation prompt if action clicked */}
        {confirmAction ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                {confirmAction === 'draw' && 'Are you sure you want to offer a draw to your opponent?'}
                {confirmAction === 'resign' && 'Are you sure you want to resign the game? This counts as a loss.'}
                {confirmAction === 'exit' && 'Exit match to home? The current match state will be paused.'}
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === 'draw') onOfferDraw();
                  if (confirmAction === 'resign') onResign();
                  if (confirmAction === 'exit') onExitGame();
                  setConfirmAction(null);
                  onClose();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white ${
                  confirmAction === 'resign' ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--primary)] text-[var(--background)]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Draw Offer */}
            <button
              onClick={() => setConfirmAction('draw')}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--primary)]/40 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text)]">Offer Draw</p>
                <p className="text-[10px] text-[var(--text-muted)]">Propose a peaceful conclusion</p>
              </div>
            </button>

            {/* Resign Game */}
            <button
              onClick={() => setConfirmAction('resign')}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-red-500/40 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400">Resign Game</p>
                <p className="text-[10px] text-[var(--text-muted)]">Concede the match with honor</p>
              </div>
            </button>

            {/* Exit Match */}
            <button
              onClick={() => setConfirmAction('exit')}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--text-muted)]/40 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-500/10 text-[var(--text-muted)] flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text)]">Exit Match</p>
                <p className="text-[10px] text-[var(--text-muted)]">Return to main dashboard</p>
              </div>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
