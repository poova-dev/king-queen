import React from 'react';
import { motion } from 'motion/react';
import { Avatar } from '../UI';
import { PlayerIdentity, ChessSide } from '../../types';
import { PlayerColorBadge } from './PlayerColorBadge';

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
  isLowTime?: boolean;
  isUrgentTime?: boolean;
  connectionStatus?: 'ONLINE' | 'RECONNECTING' | 'OFFLINE';
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
  isLowTime = false,
  isUrgentTime = false,
  connectionStatus = 'ONLINE',
}) => {
  const isKing = identity === 'KING';
  const roleIcon = isKing ? '♔' : '♕';
  const isSelf = position === 'bottom';

  return (
    <div
      className={`
        w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border transition-all duration-300
        ${
          isTurn
            ? 'bg-[var(--surface)] border-[var(--primary)] shadow-[0_0_24px_rgba(184,155,94,0.18)] ring-1 ring-[var(--primary)]/40'
            : 'bg-[var(--surface)]/70 border-[var(--border)] opacity-90'
        }
      `}
    >
      {/* Left: Avatar + Identity + Color Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <Avatar
            size="sm"
            src={avatar}
            className={`transition-all duration-300 ${
              isTurn ? 'border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/30' : 'border-[var(--border)]'
            }`}
          />
          {/* Identity Crown Badge */}
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[9px] text-[var(--primary)] shadow-sm"
            title={`${identity} Sovereign`}
          >
            {roleIcon}
          </div>
        </div>

        <div className="flex flex-col min-w-0 gap-0.5">
          {/* Top line: Name + Connection dot + Role */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-semibold truncate text-[var(--text)] max-w-[110px] sm:max-w-[140px]">
              {displayName}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                connectionStatus === 'ONLINE'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                  : connectionStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
              title={`Connection: ${connectionStatus}`}
              aria-label={`Connection: ${connectionStatus}`}
            />
            <span className="text-[8px] sm:text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[var(--surface-light)] border border-[var(--border)] text-[var(--primary)] shrink-0">
              {roleIcon} {identity}
            </span>
          </div>

          {/* Bottom line: Color Badge + Wins */}
          <div className="flex items-center gap-2 mt-0.5">
            <PlayerColorBadge
              side={chessSide}
              isSelf={isSelf}
              size="sm"
              showRoleText={true}
            />
            <span className="text-[9px] text-[var(--text-muted)] font-mono font-medium">
              {wins} {wins === 1 ? 'WIN' : 'WINS'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Turn status & Clock */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
        {/* Turn state indicator */}
        {isTurn ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/50 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-[9px] font-bold tracking-wider text-[var(--primary)] uppercase">
              {isSelf ? 'YOUR TURN' : "THEIR TURN"}
            </span>
          </motion.div>
        ) : (
          <span className="text-[9px] font-medium tracking-wider text-[var(--text-muted)] opacity-60 uppercase">
            WAITING
          </span>
        )}

        {/* Prominent Chess Clock */}
        <div
          aria-label={`Time remaining: ${timeRemaining}`}
          className={`
            px-2.5 py-1 rounded-lg border font-mono text-xs font-bold tracking-wider transition-all duration-200
            ${
              isUrgentTime
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse'
                : isLowTime
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : isTurn
                ? 'bg-[var(--surface-light)] border-[var(--primary)]/60 text-[var(--primary)] shadow-[0_0_10px_rgba(184,155,94,0.15)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
            }
          `}
        >
          {timeRemaining}
        </div>
      </div>
    </div>
  );
};
