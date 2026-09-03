import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 w-full max-w-md bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl p-6 max-h-[70vh] flex flex-col shadow-2xl"
          >
            {/* Grab handle */}
            <div className="w-12 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
              <div>
                <h3 className="text-lg font-display tracking-wide text-[var(--text)]">
                  Move History
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Match algebraic notation
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Move List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="grid grid-cols-[3rem_1fr_1fr] text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-3 py-1.5 border-b border-[var(--border)]/60">
                <span>#</span>
                <span>White</span>
                <span>Black</span>
              </div>

              {moves.map((m) => (
                <div
                  key={m.number}
                  className="grid grid-cols-[3rem_1fr_1fr] items-center text-xs font-mono px-3 py-2 rounded-lg hover:bg-[var(--surface-light)] transition-colors text-[var(--text)]"
                >
                  <span className="text-[var(--text-muted)]">{m.number}.</span>
                  <span className="font-semibold text-[var(--text)]">{m.white}</span>
                  <span className="text-[var(--text-muted)]">{m.black || '...'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
