import React from 'react';
import { ChessSquare, SquareData } from './ChessSquare';

interface ChessBoardProps {
  board: SquareData[][];
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  checkSquare?: string | null;
  isFlipped?: boolean;
  disabled?: boolean;
  onSquareClick: (square: SquareData) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare = null,
  isFlipped = false,
  disabled = false,
  onSquareClick,
}) => {
  const displayBoard = isFlipped
    ? [...board].reverse().map((row) => [...row].reverse())
    : board;

  return (
    <div className={`w-full max-w-[420px] aspect-square mx-auto select-none p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--board-border,var(--border))] shadow-2xl shadow-black/60 transition-all ${disabled ? 'opacity-90 pointer-events-none' : ''}`}>
      <div 
        className="w-full h-full rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 border border-[var(--board-border,var(--border))]"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.35)',
        }}
      >
        {displayBoard.map((row) =>
          row.map((sq) => {
            const isDark = (sq.row + sq.col) % 2 === 1;
            const isSelected = selectedSquare === sq.notation;
            const isPossibleMove = legalMoves.includes(sq.notation);
            const isLastMove = lastMove?.from === sq.notation || lastMove?.to === sq.notation;
            const isCheckSquare = checkSquare === sq.notation;

            return (
              <ChessSquare
                key={sq.notation}
                square={sq}
                isDark={isDark}
                isSelected={isSelected}
                isPossibleMove={isPossibleMove}
                isLastMove={isLastMove}
                isCheckSquare={isCheckSquare}
                showCoordinates={true}
                onSquareClick={onSquareClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
