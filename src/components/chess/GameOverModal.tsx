import React from 'react';
import { motion } from 'motion/react';
import { Avatar, Button } from '../UI';
import { PlayerIdentity } from '../../types';

export interface GameOverModalProps {
  isOpen: boolean;
  resultType: 'CHECKMATE' | 'STALEMATE' | 'DRAW' | 'RESIGNATION';
  winner?: 'YOU' | 'OPPONENT' | null;
  winnerIdentity?: PlayerIdentity;
  winnerName?: string;
  winnerAvatar?: string;
  totalMoves: number;
  onPlayAgain: () => void;
  onViewGame: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  resultType,
  winner,
  winnerIdentity,
  winnerName,
  winnerAvatar,
  totalMoves,
  onPlayAgain,
  onViewGame,
  onExit,
}) => {
  if (!isOpen) return null;

  const isCheckmate = resultType === 'CHECKMATE';
  const isResignation = resultType === 'RESIGNATION';
  const isDraw = resultType === 'DRAW' || resultType === 'STALEMATE';
  const isWin = winner === 'YOU';

  const roleIcon = winnerIdentity === 'KING' ? '♔' : '♕';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/40 p-7 flex flex-col items-center text-center gap-5 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        {/* Emblem or Winner Avatar */}
        {isDraw ? (
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-3xl text-[var(--primary)] shadow-inner">
            ⚖️
          </div>
        ) : (
          <div className="relative">
            <Avatar
              size="lg"
              src={winnerAvatar}
              className="border-2 border-[var(--primary)] shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--primary)] flex items-center justify-center text-xs text-[var(--primary)] shadow-md">
              {roleIcon}
            </div>
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.3em] text-[var(--primary)] uppercase">
            {isCheckmate
              ? 'CHECKMATE'
              : isResignation
              ? 'RESIGNATION'
              : resultType === 'STALEMATE'
              ? 'STALEMATE'
              : 'DRAW'}
          </span>

          <h2 className="text-2xl font-display text-[var(--text)] tracking-wider">
            {isDraw
              ? 'PEACEFUL RESOLUTION'
              : isWin
              ? `${roleIcon} ${winnerIdentity || 'KING'} WINS`
              : `${roleIcon} ${winnerIdentity || 'QUEEN'} WINS`}
          </h2>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs mt-1">
            {isDraw
              ? 'The position offers no decisive move. Both sovereigns share the honor.'
              : isWin
              ? `Victory belongs to ${winnerName || 'You'}. Sovereign over the board.`
              : `${winnerName || 'Your Opponent'} prevailed in this match.`}
          </p>

          <span className="text-[11px] font-mono text-[var(--text-muted)] mt-1 opacity-70">
            Total Moves: {totalMoves}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          <Button
            onClick={onPlayAgain}
            className="w-full py-3.5 text-xs font-semibold tracking-wider"
          >
            PLAY AGAIN
          </Button>
          <div className="flex gap-2">
            <button
              onClick={onViewGame}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors font-medium"
            >
              VIEW GAME
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium"
            >
              EXIT
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
