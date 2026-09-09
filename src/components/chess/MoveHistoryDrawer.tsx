import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ScrollText } from 'lucide-react';

export interface ChessMoveItem {
  number: number;
  white: string;
  black?: string;
}

interface MoveHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moves: ChessMoveItem[];
}

export const MoveHistoryDrawer: React.FC<MoveHistoryDrawerProps> = ({
  isOpen,
  onClose,
  moves,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[75vh] flex flex-col shadow-2xl"
          >
            {/* Grab handle */}
            <div className="w-12 h-1 rounded-full bg-[var(--border)] mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold tracking-wide text-[var(--text)] uppercase">
                    Move History
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {moves.length === 0 ? 'No moves recorded yet' : `${moves.length} turns played`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close move history"
                className="w-8 h-8 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Move List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[50vh]">
              <div className="grid grid-cols-[3rem_1fr_1fr] text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-3 py-1.5 border-b border-[var(--border)]/60 sticky top-0 bg-[var(--surface)] z-10">
                <span>#</span>
                <span className="flex items-center gap-1">♙ WHITE</span>
                <span className="flex items-center gap-1">♟ BLACK</span>
              </div>

              {moves.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] italic">
                  Move notation will appear here once the battle begins.
                </div>
              ) : (
                moves.map((m, idx) => {
                  const isLatest = idx === moves.length - 1;
                  return (
                    <div
                      key={m.number}
                      className={`grid grid-cols-[3rem_1fr_1fr] items-center text-xs font-mono px-3 py-2 rounded-xl transition-colors ${
                        isLatest
                          ? 'bg-[var(--primary)]/15 border border-[var(--primary)]/40 text-[var(--text)] shadow-sm'
                          : 'hover:bg-[var(--surface-light)] text-[var(--text-muted)]'
                      }`}
                    >
                      <span className={`font-bold ${isLatest ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                        {m.number}.
                      </span>
                      <span className={`font-semibold ${isLatest && !m.black ? 'text-[var(--primary)] font-bold' : 'text-[var(--text)]'}`}>
                        {m.white}
                      </span>
                      <span className={`${isLatest && m.black ? 'text-[var(--primary)] font-bold' : m.black ? 'text-[var(--text)]' : 'text-[var(--text-muted)]/50'}`}>
                        {m.black || '...'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
