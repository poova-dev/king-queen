import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, UserCheck, LogOut, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { Avatar, Button } from '../UI';
import { PlayerIdentity, UserProfile, RematchState } from '../../types';

export interface GameOverModalProps {
  isOpen: boolean;
  resultType: 'CHECKMATE' | 'STALEMATE' | 'DRAW' | 'RESIGNATION';
  winner?: 'YOU' | 'OPPONENT' | null;
  winnerIdentity?: PlayerIdentity;
  winnerName?: string;
  winnerAvatar?: string;
  totalMoves: number;
  userProfile?: UserProfile;
  opponentProfile?: UserProfile;
  rematchState: RematchState;
  isResetting?: boolean;
  onPlayAgain: () => void;
  onSimulateOpponentPlayAgain?: () => void;
  onSimulateOpponentDecline?: () => void;
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
  userProfile,
  opponentProfile,
  rematchState,
  isResetting = false,
  onPlayAgain,
  onSimulateOpponentPlayAgain,
  onSimulateOpponentDecline,
  onViewGame,
  onExit,
}) => {
  if (!isOpen) return null;

  const isCheckmate = resultType === 'CHECKMATE';
  const isResignation = resultType === 'RESIGNATION';
  const isDraw = resultType === 'DRAW' || resultType === 'STALEMATE';
  const isWin = winner === 'YOU';

  const roleIcon = winnerIdentity === 'KING' ? '♔' : '♕';

  const userName = userProfile?.displayName || 'You';
  const userRole = userProfile?.identity || 'KING';
  const opponentName = opponentProfile?.displayName || 'Opponent';
  const opponentRole = opponentProfile?.identity || 'QUEEN';

  const { playerOneConfirmed, playerTwoConfirmed, rematchStarted, declinedBy } = rematchState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/40 p-6 sm:p-7 flex flex-col items-center text-center gap-4.5 shadow-[0_0_50px_rgba(0,0,0,0.85)] my-auto"
      >
        {/* Resetting / Rematch Starting Full Transition Overlay */}
        <AnimatePresence>
          {rematchStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 rounded-3xl bg-[var(--surface)]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 gap-3 text-center border border-[var(--primary)]"
            >
              <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin flex items-center justify-center text-lg text-[var(--primary)]">
                ♔
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase animate-pulse">
                  REMATCH STARTING
                </span>
                <p className="text-sm font-display text-[var(--text)] tracking-wider">
                  The Board is Resetting...
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Alternating chess sides for fair play.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emblem or Winner Avatar */}
        {isDraw ? (
          <div className="w-18 h-18 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-3xl text-[var(--primary)] shadow-inner">
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
        <div className="flex flex-col gap-1">
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

          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs mt-0.5">
            {isDraw
              ? 'The position offers no decisive move. Both sovereigns share the honor.'
              : isWin
              ? `Victory belongs to ${winnerName || 'You'}. Sovereign over the board.`
              : `${winnerName || 'Your Opponent'} prevailed in this match.`}
          </p>

          <span className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5 opacity-70">
            Total Moves: {totalMoves}
          </span>
        </div>

        {/* TWO-PLAYER REMATCH CONFIRMATION STATUS CARD */}
        <div className="w-full rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[var(--primary)]" />
              Rematch Status
            </span>
            <span className="text-[9px] font-medium text-[var(--text-muted)]">
              Requires 2 Confirmations
            </span>
          </div>

          {/* Player status indicators */}
          <div className="grid grid-cols-2 gap-2">
            {/* Player 1 (You) */}
            <div
              className={`rounded-xl p-2.5 flex flex-col items-center gap-1 border transition-all ${
                playerOneConfirmed
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--text)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-semibold truncate max-w-full">
                <span className="truncate">{userName}</span>
                <span className="text-[9px] opacity-70">({userRole})</span>
              </div>
              {playerOneConfirmed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] tracking-wider uppercase">
                  <Check className="w-3 h-3" /> READY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase opacity-75">
                  <Clock className="w-3 h-3" /> WAITING
                </span>
              )}
            </div>

            {/* Player 2 (Opponent) */}
            <div
              className={`rounded-xl p-2.5 flex flex-col items-center gap-1 border transition-all ${
                playerTwoConfirmed
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--text)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-semibold truncate max-w-full">
                <span className="truncate">{opponentName}</span>
                <span className="text-[9px] opacity-70">({opponentRole})</span>
              </div>
              {playerTwoConfirmed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] tracking-wider uppercase">
                  <Check className="w-3 h-3" /> READY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase opacity-75">
                  <Clock className="w-3 h-3" /> WAITING
                </span>
              )}
            </div>
          </div>

          {/* Contextual notice */}
          <div className="text-[10px] text-center font-medium">
            {declinedBy ? (
              <span className="text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Opponent left the rematch lobby.
              </span>
            ) : playerOneConfirmed && !playerTwoConfirmed ? (
              <span className="text-[var(--text-muted)] flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 animate-spin text-[var(--primary)]" /> You are ready • Waiting for opponent...
              </span>
            ) : !playerOneConfirmed && playerTwoConfirmed ? (
              <span className="text-[var(--primary)] font-semibold flex items-center justify-center gap-1 animate-pulse">
                <UserCheck className="w-3 h-3" /> Opponent requested a rematch!
              </span>
            ) : (
              <span className="text-[var(--text-muted)] opacity-80">
                Both sovereigns must agree before a new game begins.
              </span>
            )}
          </div>
        </div>

        {/* Local Dev / Pass-and-Play Simulation Controls (for Player 2 testing) */}
        {onSimulateOpponentPlayAgain && !playerTwoConfirmed && !rematchStarted && (
          <div className="w-full flex items-center justify-between px-2 py-1 rounded-lg bg-[var(--surface-light)]/60 border border-[var(--border)]/40 text-[9px]">
            <span className="text-[var(--text-muted)] font-mono">Dev Test:</span>
            <div className="flex gap-1.5">
              <button
                onClick={onSimulateOpponentPlayAgain}
                className="px-2 py-0.5 rounded bg-[var(--primary)]/20 hover:bg-[var(--primary)]/30 text-[var(--primary)] font-semibold tracking-wide transition-colors"
                title="Simulate Opponent confirming Rematch"
              >
                Simulate Opponent Ready
              </button>
              {onSimulateOpponentDecline && (
                <button
                  onClick={onSimulateOpponentDecline}
                  className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold tracking-wide transition-colors"
                  title="Simulate Opponent declining Rematch"
                >
                  Decline
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 mt-1">
          <Button
            onClick={onPlayAgain}
            disabled={playerOneConfirmed || rematchStarted || isResetting}
            className="w-full py-3.5 text-xs font-semibold tracking-wider relative overflow-hidden transition-all disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {playerOneConfirmed ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-[var(--background)]" />
                WAITING FOR OPPONENT...
              </span>
            ) : playerTwoConfirmed ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                ACCEPT REMATCH
              </span>
            ) : (
              'PLAY AGAIN'
            )}
          </Button>

          <div className="flex gap-2">
            <button
              onClick={onViewGame}
              disabled={rematchStarted}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              VIEW GAME
            </button>
            <button
              onClick={onExit}
              disabled={rematchStarted}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]/80 transition-colors font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              EXIT GAME
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
