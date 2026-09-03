import React from 'react';

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

/**
 * Clean, standard vector chess pieces (SVG).
 * No emojis, no cartoon aesthetics.
 * Crisp stroke & fill with subtle luxury shading.
 */
export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // Styling for pieces
  const fill = isWhite ? '#F8F8F6' : '#1A1A1D';
  const stroke = isWhite ? '#2C2C30' : '#E8E8EC';
  const accentShading = isWhite ? '#E5E2DA' : '#2A2A30';

  switch (type) {
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Cross */}
            <path d="M 22.5,11.5 L 22.5,4.5" strokeLinejoin="miter" />
            <path d="M 20,7.5 L 25,7.5" strokeLinejoin="miter" />
            {/* Crown Head */}
            <path
              d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24.5,12 21.5,12 20.5,14.5 C 19,17.5 22.5,25 22.5,25"
              fill={fill}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d="M 11.5,37 C 17,40.5 27,40.5 33.5,37 C 36.5,30 36.5,26.5 35,21.5 C 33.5,16.5 28.5,15.5 22.5,15.5 C 16.5,15.5 11.5,16.5 10,21.5 C 8.5,26.5 8.5,30 11.5,37 z"
              fill={fill}
            />
            {/* Jewels / Collar */}
            <path d="M 11.5,30 C 17,27 28,27 33.5,30" fill="none" />
            <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" fill="none" />
            <path d="M 11.5,37 C 17,34 28,34 33.5,37" fill="none" />
            {/* Base */}
            <path
              d="M 9.5,41 C 11.5,41 33.5,41 35.5,41 C 37,41 37.5,40.5 37.5,39.5 C 37.5,38.5 36.5,38 35.5,38 C 33.5,38 11.5,38 9.5,38 C 8.5,38 7.5,38.5 7.5,39.5 C 7.5,40.5 8,41 9.5,41 z"
              fill={fill}
            />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Crown spheres */}
            <circle cx="6" cy="12" r="2" fill={fill} />
            <circle cx="14" cy="9" r="2" fill={fill} />
            <circle cx="22.5" cy="8" r="2" fill={fill} />
            <circle cx="31" cy="9" r="2" fill={fill} />
            <circle cx="39" cy="12" r="2" fill={fill} />
            {/* Crown Body */}
            <path
              d="M 9,26 C 17.5,34.5 27.5,34.5 36,26 C 38.5,13.5 39,13.5 39,13.5 C 39,13.5 33.5,24 31,10.5 C 28.5,24 23.5,9.5 22.5,9.5 C 21.5,9.5 16.5,24 14,10.5 C 11.5,24 6,13.5 6,13.5 C 6,13.5 6.5,13.5 9,26 z"
              fill={fill}
              strokeLinecap="butt"
            />
            {/* Middle body */}
            <path
              d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 11,37 C 17,40.5 28,40.5 34,37 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26"
              fill={fill}
            />
            <path d="M 11.5,30 C 17,27.5 28,27.5 33.5,30" fill="none" />
            <path d="M 12,33.5 C 17,31 28,31 33,33.5" fill="none" />
            {/* Base */}
            <path
              d="M 9.5,41 C 11.5,41 33.5,41 35.5,41 C 37,41 37.5,40.5 37.5,39.5 C 37.5,38.5 36.5,38 35.5,38 C 33.5,38 11.5,38 9.5,38 C 8.5,38 7.5,38.5 7.5,39.5 C 7.5,40.5 8,41 9.5,41 z"
              fill={fill}
            />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Battlement top */}
            <path
              d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"
              fill={fill}
              strokeLinecap="butt"
            />
            <path
              d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"
              fill={fill}
              strokeLinecap="butt"
            />
            <path
              d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
              fill={fill}
              strokeLinecap="butt"
            />
            {/* Waist */}
            <path
              d="M 34,14 L 31,17 L 14,17 L 11,14"
              fill={fill}
            />
            {/* Pillar */}
            <path
              d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"
              fill={fill}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
            <path
              d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5"
              fill={fill}
            />
            {/* Base */}
            <path
              d="M 9.5,41 C 11.5,41 33.5,41 35.5,41 C 37,41 37.5,40.5 37.5,39.5 C 37.5,38.5 36.5,38 35.5,38 C 33.5,38 11.5,38 9.5,38 C 8.5,38 7.5,38.5 7.5,39.5 C 7.5,40.5 8,41 9.5,41 z"
              fill={fill}
            />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="8.5" r="1.5" fill={fill} />
            <path
              d="M 9,36 C 12.39,35 15,35 18,36.5 C 18.33,34.5 19.5,33 22.5,33 C 25.5,33 26.67,34.5 27,36.5 C 30,35 32.61,35 36,36 C 36,36 37.65,36.54 39,38 C 38.33,38.5 36.67,39 35,39 C 27,39 18,39 10,39 C 8.33,39 6.67,38.5 6,38 C 7.35,36.54 9,36 9,36 z"
              fill={fill}
            />
            <path
              d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"
              fill={fill}
            />
            <path d="M 25 8 A 2.5 2.5 0 0 1  22.5 10.5 A 2.5 2.5 0 0 1  20 8 A 2.5 2.5 0 0 1  25 8 z" fill={fill} />
            <path d="M 17.5,26 L 27.5,26" fill="none" />
            <path d="M 15,30 L 30,30" fill="none" />
            {/* Cut line */}
            <path d="M 21.5,15.5 L 26,20" fill="none" />
            {/* Base */}
            <path
              d="M 9.5,41 C 11.5,41 33.5,41 35.5,41 C 37,41 37.5,40.5 37.5,39.5 C 37.5,38.5 36.5,38 35.5,38 C 33.5,38 11.5,38 9.5,38 C 8.5,38 7.5,38.5 7.5,39.5 C 7.5,40.5 8,41 9.5,41 z"
              fill={fill}
            />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
              fill={fill}
              strokeLinecap="butt"
            />
            <path
              d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.03,5.06 20,7.5 C 20,7.5 21.61,9.08 22,10 z"
              fill={fill}
            />
            <circle cx="15.5" cy="16.5" r="1.5" fill={stroke} />
            {/* Mane & Nostril */}
            <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill={stroke} />
            <path d="M 24.5,10.5 C 27,9.5 32,13 32,17" fill="none" />
            <path d="M 27.5,13.5 C 29,13 33.5,16.5 33,21" fill="none" />
            {/* Base */}
            <path
              d="M 9.5,41 C 11.5,41 33.5,41 35.5,41 C 37,41 37.5,40.5 37.5,39.5 C 37.5,38.5 36.5,38 35.5,38 C 33.5,38 11.5,38 9.5,38 C 8.5,38 7.5,38.5 7.5,39.5 C 7.5,40.5 8,41 9.5,41 z"
              fill={fill}
            />
          </g>
        </svg>
      );

    case 'p': // Pawn
    default:
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill="none" fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M 22.5,9 C 19.5,9 19.5,13.5 22.5,13.5 C 25.5,13.5 25.5,9 22.5,9 z"
              fill={fill}
              strokeLinecap="butt"
            />
            <path
              d="M 22.5,13.5 C 21.5,16.5 18,17 18,22 C 18,25 21,27 22.5,27 C 24,27 27,25 27,22 C 27,17 23.5,16.5 22.5,13.5 z"
              fill={fill}
              strokeLinecap="butt"
            />
            <path
              d="M 12.5,32 C 17.5,31 27.5,31 32.5,32 C 34.5,34 35,36 34,37 C 32,38 13,38 11,37 C 10,36 10.5,34 12.5,32 z"
              fill={fill}
            />
            {/* Base */}
            <path
              d="M 9.5,41 C 11.5,41 33.5,41 35.5,41 C 37,41 37.5,40.5 37.5,39.5 C 37.5,38.5 36.5,38 35.5,38 C 33.5,38 11.5,38 9.5,38 C 8.5,38 7.5,38.5 7.5,39.5 C 7.5,40.5 8,41 9.5,41 z"
              fill={fill}
            />
          </g>
        </svg>
      );
  }
};
