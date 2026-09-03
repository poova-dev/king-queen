import React from 'react';
import { motion } from 'motion/react';
import { Avatar } from '../UI';
import { PlayerIdentity, ChessSide } from '../../types';

interface PlayerCardProps {
  displayName: string;
  username: string;
  identity: PlayerIdentity;
  chessSide: ChessSide;
  wins: number;
  avatar?: string;
  isTurn: boolean;
  position: 'top' | 'bottom';
  timeRemaining?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  displayName,
  identity,
  chessSide,
  wins,
  avatar,
  isTurn,
  position,
  timeRemaining = '10:00',
}) => {
  const isKing = identity === 'KING';
  const roleIcon = isKing ? '♔' : '♕';

  return (
    <div
      className={`
        w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-300
        ${
          isTurn
            ? 'bg-[var(--surface)] border-[var(--primary)] shadow-[0_0_20px_rgba(184,155,94,0.14)] ring-1 ring-[var(--primary)]/30'
            : 'bg-[var(--surface)]/60 border-[var(--border)] opacity-85'
        }
      `}
    >
      {/* Left: Avatar + Identity details */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <Avatar
            size="sm"
            src={avatar}
            className={`transition-all duration-300 ${
              isTurn ? 'border-[var(--primary)] shadow-sm' : 'border-[var(--border)]'
            }`}
          />
          {/* Identity Crown Badge */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[9px] text-[var(--primary)]">
            {roleIcon}
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate text-[var(--text)]">
              {displayName}
            </span>
            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded bg-[var(--surface-light)] border border-[var(--border)] text-[var(--primary)]">
              {roleIcon} {identity}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <span>{wins} {wins === 1 ? 'WIN' : 'WINS'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span 
                className="w-2 h-2 rounded-full border border-white/20"
                style={{ backgroundColor: chessSide === 'WHITE' ? '#F8F8F6' : '#1A1A1D' }} 
              />
              {chessSide}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Turn status & Clock */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Turn state indicator */}
        {isTurn ? (
          <motion.div
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest text-[var(--primary)] uppercase">
              {position === 'bottom' ? 'YOUR TURN' : "OPPONENT'S TURN"}
            </span>
          </motion.div>
        ) : (
          <span className="text-[9px] font-medium tracking-widest text-[var(--text-muted)] opacity-60 uppercase">
            WAITING
          </span>
        )}

        {/* Minimal Timer Clock */}
        <span className="font-mono text-xs font-semibold text-[var(--text)] tracking-wider">
          {timeRemaining}
        </span>
      </div>
    </div>
  );
};
