/**
 * Opponent Disconnected Banner
 * KING & QUEEN — Real-time Multiplayer Chess
 *
 * Displays royal connection interrupted alert with smooth countdown progress
 * and controlled authoritative victory claim button when grace period expires.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Crown, Clock, Loader2 } from 'lucide-react';

interface OpponentDisconnectedBannerProps {
  isVisible: boolean;
  secondsRemaining: number;
  opponentName?: string;
  isClaimingVictory: boolean;
  onClaimVictory: () => void;
}

export const OpponentDisconnectedBanner: React.FC<OpponentDisconnectedBannerProps> = ({
  isVisible,
  secondsRemaining,
  opponentName = 'Your opponent',
  isClaimingVictory,
  onClaimVictory,
}) => {
  if (!isVisible) return null;

  const isExpired = secondsRemaining <= 0;
  const formattedTime = `00:${String(Math.max(0, secondsRemaining)).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / 60) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full rounded-2xl bg-[var(--surface)] border border-amber-500/40 p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.65)] flex flex-col gap-3 relative overflow-hidden"
      >
        {/* Ambient Amber Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400 uppercase">
                Connection Interrupted
              </span>
              <h3 className="text-xs sm:text-sm font-semibold text-[var(--text)]">
                {isExpired
                  ? `${opponentName} did not reconnect`
                  : `${opponentName} has temporarily disconnected`}
              </h3>
            </div>
          </div>

          {/* Countdown badge */}
          {!isExpired ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold shrink-0">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{formattedTime}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] font-bold uppercase tracking-wider shrink-0">
              Time Expired
            </div>
          )}
        </div>

        {/* Dynamic subtext & progress */}
        {!isExpired ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Waiting for sovereign to return...
              </span>
              <span className="font-mono text-[10px] text-amber-400/80">
                {secondsRemaining}s remaining
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-[var(--surface-light)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] italic text-center mt-0.5">
              The chessboard is locked while reconnection is in progress.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t border-[var(--border)]/60">
            <p className="text-[11px] text-[var(--text-muted)]">
              The grace period has elapsed. You may claim victory for this battle.
            </p>
            <button
              onClick={onClaimVictory}
              disabled={isClaimingVictory}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-[var(--primary)] to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isClaimingVictory ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Claiming Victory...</span>
                </>
              ) : (
                <>
                  <Crown className="w-3.5 h-3.5" />
                  <span>Claim Victory</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
