import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ShieldAlert, Flag, Award } from 'lucide-react';
import { Button } from '../UI';

export type GameStatusType = 
  | 'YOUR_TURN'
  | 'OPPONENT_TURN'
  | 'CHECK'
  | 'CHECKMATE'
  | 'DRAW';

interface GameStatusBannerProps {
  status: GameStatusType;
  winner?: 'YOU' | 'OPPONENT' | null;
  onRestart?: () => void;
  onExit?: () => void;
}

export const GameStatusBanner: React.FC<GameStatusBannerProps> = ({
  status,
  winner = 'YOU',
  onRestart,
  onExit,
}) => {
  // Check Banner (Muted Crimson)
  if (status === 'CHECK') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-1.5 px-3 rounded-lg bg-[#8E2836]/20 border border-[#A65D67]/40 flex items-center justify-center gap-2 text-center"
      >
        <div className="w-2 h-2 rounded-full bg-[#A65D67] animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#E89BA5]">
          CHECK • KING UNDER ATTACK
        </span>
      </motion.div>
    );
  }

  // Checkmate / Draw Full Overlay (Quiet luxury victory modal)
  if (status === 'CHECKMATE' || status === 'DRAW') {
    const isWin = winner === 'YOU';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/40 p-8 flex flex-col items-center text-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          {/* Royal Emblem */}
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-4xl text-[var(--primary)] shadow-inner">
            {status === 'CHECKMATE' ? (isWin ? '♔' : '♕') : '⚔️'}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[var(--primary)] uppercase">
              {status === 'CHECKMATE' ? 'MATCH CONCLUDED' : 'PEACEFUL RESOLUTION'}
            </span>
            <h2 className="text-3xl font-display text-[var(--text)] tracking-wider">
              {status === 'CHECKMATE' 
                ? (isWin ? 'ROYAL VICTORY' : 'DEFEAT') 
                : 'DRAW'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs mt-1">
              {status === 'CHECKMATE'
                ? (isWin 
                    ? 'Your sovereignty over the board is sealed. Honor and glory prevail.' 
                    : 'A noble effort against a worthy adversary. Regroup and challenge again.')
                : 'Both sovereigns fought to a standstill. Honor remains unbroken.'}
            </p>
          </div>

          <div className="w-full flex flex-col gap-2.5 mt-2">
            {onRestart && (
              <Button onClick={onRestart} className="w-full py-3.5 text-xs font-semibold tracking-wider">
                REPLAY MATCH
              </Button>
            )}
            {onExit && (
              <button
                onClick={onExit}
                className="w-full py-3 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors"
              >
                RETURN TO DASHBOARD
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};
