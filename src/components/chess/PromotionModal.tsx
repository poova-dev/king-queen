import React from 'react';
import { motion } from 'motion/react';
import { ChessPiece, PieceType, PieceColor } from './ChessPiece';

interface PromotionModalProps {
  isOpen: boolean;
  color: PieceColor;
  onSelect: (pieceType: PieceType) => void;
}

const PROMOTION_PIECES: PieceType[] = ['q', 'r', 'b', 'n'];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xs rounded-2xl bg-[var(--surface)] border border-[var(--primary)]/50 p-6 flex flex-col items-center gap-4 shadow-2xl"
      >
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)]">
            PAWN PROMOTION
          </span>
          <h3 className="text-base font-display text-[var(--text)] mt-1">
            Choose Your Royal Piece
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2.5 w-full mt-2">
          {PROMOTION_PIECES.map((pieceType) => {
            const label =
              pieceType === 'q'
                ? 'Queen'
                : pieceType === 'r'
                ? 'Rook'
                : pieceType === 'b'
                ? 'Bishop'
                : 'Knight';

            return (
              <button
                key={pieceType}
                onClick={() => onSelect(pieceType)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--primary)] transition-all active:scale-95 group"
              >
                <div className="w-10 h-10 flex items-center justify-center filter drop-shadow group-hover:scale-110 transition-transform">
                  <ChessPiece type={pieceType} color={color} />
                </div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text)]">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
