import React from 'react';
import { ChessPiece, PieceType, PieceColor } from './ChessPiece';

interface CapturedPiecesProps {
  pieces: { type: PieceType; color: PieceColor }[];
  label: string;
  alignment?: 'left' | 'right';
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  pieces,
  label,
  alignment = 'left',
}) => {
  return (
    <div className={`flex items-center gap-1.5 h-6 min-h-[24px] ${alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
      <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium mr-1 opacity-70">
        {label}
      </span>
      <div className="flex items-center -space-x-1 overflow-visible">
        {pieces.map((p, idx) => (
          <div
            key={idx}
            className="w-4 h-4 flex items-center justify-center filter drop-shadow-sm transition-transform hover:scale-125 hover:z-10"
            title={`${p.color === 'w' ? 'White' : 'Black'} ${p.type.toUpperCase()}`}
          >
            <ChessPiece type={p.type} color={p.color} />
          </div>
        ))}
        {pieces.length === 0 && (
          <span className="text-[10px] text-[var(--text-muted)] opacity-40 italic">
            None
          </span>
        )}
      </div>
    </div>
  );
};
