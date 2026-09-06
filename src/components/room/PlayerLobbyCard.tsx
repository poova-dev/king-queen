import React from 'react';
import { RoomPlayer, ChessSide } from '../../types';
import { Avatar } from '../UI';
import { Check, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerLobbyCardProps {
  player: RoomPlayer | null;
  isCurrentUser: boolean;
  expectedRole: 'KING' | 'QUEEN';
  waitingText?: string;
  showReadyStatus?: boolean;
}

export const PlayerLobbyCard: React.FC<PlayerLobbyCardProps> = ({
  player,
  isCurrentUser,
  expectedRole,
  waitingText = 'Waiting for partner...',
  showReadyStatus = false,
}) => {
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] text-center w-full max-w-[180px] shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-2xl text-[var(--text-muted)] animate-pulse">
          {expectedRole === 'KING' ? '♔' : '♕'}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
            {expectedRole}
          </span>
          <span className="text-xs font-medium text-[var(--text-muted)] mt-0.5 italic">
            {waitingText}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--surface-light)] border border-[var(--border)] text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <Clock className="w-3 h-3 animate-spin text-[var(--primary)]" />
          <span>JOINING</span>
        </div>
      </div>
    );
  }

  const roleSymbol = player.roomRole === 'KING' ? '♔' : '♕';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex flex-col items-center gap-3 p-5 rounded-2xl bg-[var(--surface)] border text-center w-full max-w-[190px] shadow-md relative transition-all
        ${isCurrentUser ? 'border-[var(--primary)]/60 bg-[var(--surface-light)]/40' : 'border-[var(--border)]'}
      `}
    >
      {/* Role and You pill */}
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-[9px] uppercase font-extrabold tracking-widest text-[var(--primary)]">
          {roleSymbol} {player.roomRole}
        </span>
        {isCurrentUser && (
          <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30">
            YOU
          </span>
        )}
      </div>

      {/* Avatar with role icon badge */}
      <div className="relative">
        <Avatar
          size="lg"
          src={player.photoURL || undefined}
          className={`border-2 ${isCurrentUser ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}
        />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--primary)] flex items-center justify-center text-xs text-[var(--primary)] shadow-sm">
          {roleSymbol}
        </div>
      </div>

      {/* Name and Identity */}
      <div className="flex flex-col items-center w-full">
        <span className="text-sm font-bold text-[var(--text)] truncate max-w-[140px]">
          {player.displayName}
        </span>
        <span className="text-[9px] font-medium text-[var(--text-muted)] tracking-wider mt-0.5">
          {player.profileIdentity} IDENTITY
        </span>
      </div>

      {/* Dynamic Toss / Color / Ready Badges */}
      <div className="flex flex-col items-center gap-1.5 w-full mt-1">
        {player.tossChoice && (
          <div className="px-2.5 py-0.5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider">
            CALL: {player.tossChoice}
          </div>
        )}

        {player.chessColor && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[var(--surface-light)] border border-[var(--border)] text-[9px] font-bold text-[var(--text)] uppercase tracking-wider">
            <span>{player.chessColor === 'WHITE' ? '♔ WHITE' : '♚ BLACK'}</span>
          </div>
        )}

        {showReadyStatus && (
          <div
            className={`
              flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all
              ${
                player.ready
                  ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                  : 'bg-[var(--surface-light)] border border-[var(--border)] text-[var(--text-muted)]'
              }
            `}
          >
            {player.ready ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span>READY</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 animate-spin text-[var(--text-muted)]" />
                <span>NOT READY</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
