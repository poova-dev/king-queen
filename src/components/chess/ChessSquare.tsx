import React from 'react';
import { motion } from 'motion/react';
import { ChessPiece, PieceType, PieceColor } from './ChessPiece';

export interface SquareData {
  row: number;
  col: number;
  notation: string; // e.g., 'e4'
  piece?: {
    type: PieceType;
    color: PieceColor;
  };
}

/**
 * Calculates the relative CSS translation offsets (deltaX, deltaY)
 * between the origin square (lastMove.from) and target square (lastMove.to).
 * Enables GPU-accelerated 60fps piece motion without polling or layout thrashing.
 */
export const calculateMoveDelta = (
  fromNotation: string,
  toNotation: string,
  isFlipped: boolean
): { deltaX: string; deltaY: string } => {
  if (!fromNotation || !toNotation || fromNotation === toNotation) {
    return { deltaX: '0%', deltaY: '0%' };
  }

  const fromCol = fromNotation.charCodeAt(0) - 97; // 'a' -> 0, 'h' -> 7
  const fromRow = 8 - parseInt(fromNotation[1], 10); // '8' -> 0, '1' -> 7

  const toCol = toNotation.charCodeAt(0) - 97;
  const toRow = 8 - parseInt(toNotation[1], 10);

  const displayFromCol = isFlipped ? 7 - fromCol : fromCol;
  const displayFromRow = isFlipped ? 7 - fromRow : fromRow;

  const displayToCol = isFlipped ? 7 - toCol : toCol;
  const displayToRow = isFlipped ? 7 - toRow : toRow;

  const deltaX = `${(displayFromCol - displayToCol) * 100}%`;
  const deltaY = `${(displayFromRow - displayToRow) * 100}%`;

  return { deltaX, deltaY };
};

interface ChessSquareProps {
  square: SquareData;
  isDark: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  isLastMove: boolean;
  isCheckSquare?: boolean;
  showCoordinates?: boolean;
  lastMoveOrigin?: string | null;
  lastMoveDestination?: string | null;
  isFlipped?: boolean;
  onSquareClick: (square: SquareData) => void;
}

export const ChessSquare: React.FC<ChessSquareProps> = ({
  square,
  isDark,
  isSelected,
  isPossibleMove,
  isLastMove,
  isCheckSquare = false,
  showCoordinates = true,
  lastMoveOrigin = null,
  lastMoveDestination = null,
  isFlipped = false,
  onSquareClick,
}) => {
  const { row, col, piece, notation } = square;

  const fileLetter = notation[0];
  const rankNumber = notation[1];
  const showFile = row === 7;
  const showRank = col === 0;

  const isDestinationSquare = lastMoveDestination === notation && Boolean(lastMoveOrigin);
  const moveDelta = isDestinationSquare && lastMoveOrigin
    ? calculateMoveDelta(lastMoveOrigin, notation, isFlipped)
    : null;

  return (
    <div
      onClick={() => onSquareClick(square)}
      aria-label={`Square ${notation}${piece ? `, ${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}` : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSquareClick(square);
        }
      }}
      className="relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-colors duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      style={{
        backgroundColor: isDark 
          ? 'var(--board-dark, #18181B)' 
          : 'var(--board-light, #27272C)',
      }}
    >
      {/* 1. Last Move Highlight (Persists on FROM & TO squares until next move) */}
      {isLastMove && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            backgroundColor: 'var(--primary, #B89B5E)',
            opacity: 0.28,
            boxShadow: 'inset 0 0 10px rgba(184, 155, 94, 0.35)',
          }}
        />
      )}

      {/* 2. Capture / Move Landing Pulse Effect */}
      {isDestinationSquare && (
        <motion.div
          initial={{ scale: 0.75, opacity: 0.8 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute inset-0 rounded-xl border-2 border-[var(--primary)] pointer-events-none z-15"
        />
      )}

      {/* 3. King in Check Highlight - Muted crimson glow */}
      {isCheckSquare && (
        <div 
          className="absolute inset-0 z-5 transition-opacity duration-300 pointer-events-none animate-pulse"
          style={{
            backgroundColor: '#A65D67',
            opacity: 0.45,
            boxShadow: 'inset 0 0 16px rgba(166, 93, 103, 0.9)',
          }}
        />
      )}

      {/* 4. Selected Square Highlight (Gold outline + inner glow) */}
      {isSelected && (
        <div 
          className="absolute inset-0 z-10 border-2 pointer-events-none transition-all duration-200"
          style={{
            borderColor: 'var(--primary, #B89B5E)',
            backgroundColor: 'var(--primary, #B89B5E)',
            opacity: 0.38,
            boxShadow: 'inset 0 0 12px rgba(184, 155, 94, 0.4)',
          }}
        />
      )}

      {/* 5. Legal Move: Empty Square Target Dot */}
      {isPossibleMove && !piece && (
        <div 
          className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full z-10 pointer-events-none transition-transform duration-200 group-hover:scale-125 shadow-sm"
          style={{
            backgroundColor: 'var(--primary, #B89B5E)',
            opacity: 0.75,
            boxShadow: '0 0 6px rgba(184, 155, 94, 0.5)',
          }}
        />
      )}

      {/* 6. Legal Move: Capture Target Ring */}
      {isPossibleMove && piece && (
        <div 
          className="absolute inset-0.5 sm:inset-1 rounded-full z-10 border-2 pointer-events-none animate-pulse"
          style={{
            borderColor: 'var(--primary, #B89B5E)',
            opacity: 0.9,
            boxShadow: '0 0 8px rgba(184, 155, 94, 0.4)',
          }}
        />
      )}

      {/* 7. Render Chess Piece with Smooth Translate Animation */}
      {piece && (
        <motion.div
          key={`${piece.color}_${piece.type}_${isDestinationSquare ? lastMoveOrigin : notation}`}
          initial={
            isDestinationSquare && moveDelta
              ? { x: moveDelta.deltaX, y: moveDelta.deltaY, scale: 1.05 }
              : { scale: 0.88, opacity: 0.95 }
          }
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          transition={{
            duration: 0.22,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="relative z-20 w-[84%] h-[84%] flex items-center justify-center filter drop-shadow-md transition-transform active:scale-95 motion-reduce:transition-none motion-reduce:animate-none"
        >
          <ChessPiece type={piece.type} color={piece.color} />
        </motion.div>
      )}

      {/* 8. Board coordinate labels */}
      {showCoordinates && (
        <>
          {showRank && (
            <span
              className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-mono select-none pointer-events-none leading-none opacity-40 font-bold"
              style={{
                color: isDark ? 'var(--board-light, #27272C)' : 'var(--board-dark, #18181B)',
              }}
            >
              {rankNumber}
            </span>
          )}
          {showFile && (
            <span
              className="absolute bottom-0.5 right-1 text-[8px] sm:text-[9px] font-mono select-none pointer-events-none leading-none opacity-40 font-bold"
              style={{
                color: isDark ? 'var(--board-light, #27272C)' : 'var(--board-dark, #18181B)',
              }}
            >
              {fileLetter}
            </span>
          )}
        </>
      )}
    </div>
  );
};
