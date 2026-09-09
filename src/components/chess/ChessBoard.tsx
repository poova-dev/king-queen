import React from 'react';
import { ChessSquare, SquareData } from './ChessSquare';
import { ChessSide } from '../../types';

interface ChessBoardProps {
  board: SquareData[][];
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  checkSquare?: string | null;
  isFlipped?: boolean;
  disabled?: boolean;
  userChessSide?: ChessSide;
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
  userChessSide,
  onSquareClick,
}) => {
  const displayBoard = isFlipped
    ? [...board].reverse().map((row) => [...row].reverse())
    : board;

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center gap-1.5 select-none">
      {/* Visual board frame */}
      <div 
        className={`w-full aspect-square p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--board-border,var(--border))] shadow-2xl shadow-black/70 transition-all ${
          disabled ? 'opacity-90' : ''
        }`}
      >
        <div 
          className="w-full h-full rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 border border-[var(--board-border,var(--border))]"
          style={{
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.45)',
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
                  lastMoveOrigin={lastMove?.from || null}
                  lastMoveDestination={lastMove?.to || null}
                  isFlipped={isFlipped}
                  onSquareClick={onSquareClick}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Board Color Context (Visible on mobile & desktop) */}
      {userChessSide && (
        <div className="w-full flex items-center justify-between px-2 text-[10px] text-[var(--text-muted)] font-mono">
          <span className="flex items-center gap-1 opacity-75">
            <span className="text-[11px]">{userChessSide === 'WHITE' ? '♙' : '♟'}</span>
            <span>YOU ARE PLAYING {userChessSide}</span>
          </span>
          <span className="text-[9px] opacity-60">
            {isFlipped ? 'BLACK PERSPECTIVE' : 'WHITE PERSPECTIVE'}
          </span>
        </div>
      )}
    </div>
  );
};
