import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChessPiece, PieceType, PieceColor } from './ChessPiece';
import { X } from 'lucide-react';

interface PromotionModalProps {
  isOpen: boolean;
  color: PieceColor;
  onSelect: (pieceType: PieceType) => void;
  onCancel?: () => void;
}

const PROMOTION_PIECES: { type: PieceType; label: string; glyph: string }[] = [
  { type: 'q', label: 'QUEEN', glyph: '♕' },
  { type: 'r', label: 'ROOK', glyph: '♖' },
  { type: 'b', label: 'BISHOP', glyph: '♗' },
  { type: 'n', label: 'KNIGHT', glyph: '♘' },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelect,
  onCancel,
}) => {
  // ESC key cancels promotion
  useEffect(() => {
    if (!isOpen || !onCancel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
      {onCancel && <div className="absolute inset-0" onClick={onCancel} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/60 p-6 sm:p-7 flex flex-col items-center gap-5 shadow-[0_0_50px_rgba(184,155,94,0.3)]"
      >
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Cancel promotion"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)]">
            PROMOTE YOUR PAWN
          </span>
          <h3 className="text-lg font-display text-[var(--text)] tracking-wider mt-1">
            Choose your royal piece
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full">
          {PROMOTION_PIECES.map(({ type, label, glyph }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[var(--primary)] shadow-md"
            >
              <div className="w-12 h-12 flex items-center justify-center filter drop-shadow group-hover:scale-110 transition-transform">
                <ChessPiece type={type} color={color} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold tracking-wider text-[var(--text)] group-hover:text-[var(--primary)]">
                  {label}
                </span>
                <span className="text-xs text-[var(--text-muted)] opacity-60">
                  {glyph}
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
