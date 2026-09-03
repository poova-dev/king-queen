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

interface ChessSquareProps {
  square: SquareData;
  isDark: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  isLastMove: boolean;
  isCheckSquare?: boolean;
  showCoordinates?: boolean;
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
  onSquareClick,
}) => {
  const { row, col, piece, notation } = square;

  // Ranks 1-8 (from bottom to top when viewed by White) and Files a-h
  const fileLetter = notation[0];
  const rankNumber = notation[1];
  const showFile = row === 7;
  const showRank = col === 0;

  return (
    <div
      onClick={() => onSquareClick(square)}
      className="relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-colors duration-300 group"
      style={{
        backgroundColor: isDark 
          ? 'var(--board-dark, #18181B)' 
          : 'var(--board-light, #27272C)',
      }}
    >
      {/* Last move highlight */}
      {isLastMove && (
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundColor: 'var(--primary, #B89B5E)',
            opacity: 0.22,
          }}
        />
      )}

      {/* King in Check highlight - Muted crimson */}
      {isCheckSquare && (
        <div 
          className="absolute inset-0 z-5 transition-opacity duration-300"
          style={{
            backgroundColor: '#A65D67',
            opacity: 0.4,
            boxShadow: 'inset 0 0 12px rgba(166, 93, 103, 0.8)',
          }}
        />
      )}

      {/* Selected square highlight */}
      {isSelected && (
        <motion.div 
          layoutId="selected-square-highlight"
          className="absolute inset-0 z-10 border-2"
          style={{
            borderColor: 'var(--primary, #B89B5E)',
            backgroundColor: 'var(--primary, #B89B5E)',
            opacity: 0.35,
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Possible move dot or capture ring */}
      {isPossibleMove && !piece && (
        <div 
          className="absolute w-3.5 h-3.5 rounded-full z-10 pointer-events-none transition-transform duration-200 group-hover:scale-125"
          style={{
            backgroundColor: 'var(--primary, #B89B5E)',
            opacity: 0.65,
          }}
        />
      )}

      {/* Possible capture ring indicator if square has piece */}
      {isPossibleMove && piece && (
        <div 
          className="absolute inset-1 rounded-full z-10 border-2 pointer-events-none animate-pulse"
          style={{
            borderColor: 'var(--primary, #B89B5E)',
            opacity: 0.85,
          }}
        />
      )}

      {/* Render Piece */}
      {piece && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className={`relative z-20 w-[82%] h-[82%] flex items-center justify-center filter drop-shadow-md ${
            isSelected ? 'scale-105' : ''
          }`}
        >
          <ChessPiece type={piece.type} color={piece.color} />
        </motion.div>
      )}

      {/* Board coordinate labels (Quiet luxury, minimal) */}
      {showCoordinates && (
        <>
          {showRank && (
            <span
              className="absolute top-0.5 left-1 text-[9px] font-mono select-none pointer-events-none leading-none opacity-50"
              style={{
                color: isDark ? 'var(--board-light, #27272C)' : 'var(--board-dark, #18181B)',
              }}
            >
              {rankNumber}
            </span>
          )}
          {showFile && (
            <span
              className="absolute bottom-0.5 right-1 text-[9px] font-mono select-none pointer-events-none leading-none opacity-50"
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
