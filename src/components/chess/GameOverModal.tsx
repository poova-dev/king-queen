import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, UserCheck, LogOut, Eye, Sparkles, AlertCircle, Trophy, Award } from 'lucide-react';
import { Avatar, Button } from '../UI';
import { PlayerIdentity, UserProfile, RematchState, GameEndReason, ChessSide } from '../../types';
import { PlayerColorBadge } from './PlayerColorBadge';

export interface GameOverModalProps {
  isOpen: boolean;
  resultType: 'CHECKMATE' | 'STALEMATE' | 'DRAW' | 'RESIGNATION' | 'TIMEOUT' | 'ABANDONED';
  endReason?: GameEndReason | null;
  winner?: 'YOU' | 'OPPONENT' | null;
  winnerIdentity?: PlayerIdentity;
  winnerName?: string;
  winnerAvatar?: string;
  totalMoves: number;
  userProfile?: UserProfile;
  opponentProfile?: UserProfile;
  userChessSide?: ChessSide;
  opponentChessSide?: ChessSide;
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
  endReason,
  winner,
  winnerIdentity,
  winnerName,
  winnerAvatar,
  totalMoves,
  userProfile,
  opponentProfile,
  userChessSide = 'WHITE',
  opponentChessSide = 'BLACK',
  rematchState,
  isResetting = false,
  onPlayAgain,
  onSimulateOpponentPlayAgain,
  onSimulateOpponentDecline,
  onViewGame,
  onExit,
}) => {
  if (!isOpen) return null;

  const isCheckmate = resultType === 'CHECKMATE' || endReason === 'CHECKMATE';
  const isResignation = resultType === 'RESIGNATION' || endReason === 'RESIGNATION';
  const isAbandoned = resultType === 'ABANDONED' || endReason === 'ABANDONED';
  const isTimeout = resultType === 'TIMEOUT' || endReason === 'TIMEOUT';
  const isStalemate = resultType === 'STALEMATE' || endReason === 'STALEMATE';
  const isDraw =
    isStalemate ||
    resultType === 'DRAW' ||
    (endReason !== undefined &&
      endReason !== null &&
      endReason !== 'CHECKMATE' &&
      endReason !== 'RESIGNATION' &&
      endReason !== 'ABANDONED' &&
      endReason !== 'TIMEOUT');
  const isWin = winner === 'YOU';

  const userName = userProfile?.displayName || 'You';
  const userRole = userProfile?.identity || 'KING';
  const opponentName = opponentProfile?.displayName || 'Opponent';
  const opponentRole = opponentProfile?.identity || 'QUEEN';

  const { playerOneConfirmed, playerTwoConfirmed, rematchStarted, declinedBy } = rematchState;

  // Title & Subtitle copy per requirement
  const getHeaderInfo = () => {
    if (isCheckmate) {
      return {
        badge: 'CHECKMATE',
        title: 'THE KINGDOM FALLS',
        subtitle: isWin ? 'You delivered checkmate.' : `${opponentName} delivered checkmate.`,
      };
    }
    if (isResignation) {
      return {
        badge: 'RESIGNATION',
        title: isWin ? `${opponentName.toUpperCase()} RESIGNED` : 'YOU RESIGNED',
        subtitle: isWin ? `${userName} is victorious.` : `${opponentName} claims victory.`,
      };
    }
    if (isTimeout) {
      return {
        badge: 'TIME EXPIRED',
        title: isWin ? `${opponentName.toUpperCase()} RAN OUT OF TIME` : 'YOUR TIME EXPIRED',
        subtitle: isWin ? `${userName} wins by clock.` : `${opponentName} wins by clock.`,
      };
    }
    if (isAbandoned) {
      return {
        badge: 'ABANDONED',
        title: isWin ? 'OPPONENT DISCONNECTED' : 'MATCH ABANDONED',
        subtitle: isWin ? 'Victory awarded due to disconnect.' : 'You disconnected from the match.',
      };
    }
    if (isStalemate) {
      return {
        badge: 'STALEMATE',
        title: 'NO LEGAL MOVES',
        subtitle: 'The battle ends in a stalemate draw.',
      };
    }
    return {
      badge: 'DRAW AGREED',
      title: 'BATTLE ENDS IN DRAW',
      subtitle: 'Neither kingdom falls today.',
    };
  };

  const header = getHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/40 p-6 sm:p-7 flex flex-col items-center text-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] my-auto"
      >
        {/* Resetting / Rematch Starting Overlay */}
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
                  The Battlefield is Resetting...
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Alternating colors for the next royal round.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Emblem */}
        {isDraw ? (
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-3xl shadow-inner">
            ⚖️
          </div>
        ) : isWin ? (
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/50 flex items-center justify-center text-3xl text-[var(--primary)] shadow-[0_0_20px_rgba(184,155,94,0.3)]">
            🏆
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-3xl text-rose-400 shadow-inner">
            ♟
          </div>
        )}

        {/* Title Header */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-[0.3em] text-[var(--primary)] uppercase">
            {header.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-display text-[var(--text)] tracking-wider">
            {header.title}
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mt-0.5">
            {header.subtitle}
          </p>
        </div>

        {/* Winner / Loser Breakdown (Only when not a draw) */}
        {!isDraw && (
          <div className="w-full grid grid-cols-2 gap-2 text-left">
            {/* Winner Card */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col gap-1">
              <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1">
                <Trophy className="w-3 h-3" /> WINNER
              </span>
              <span className="text-xs font-bold text-[var(--text)] truncate">
                {isWin ? userName : opponentName}
              </span>
              <div className="mt-0.5">
                <PlayerColorBadge
                  side={isWin ? userChessSide : opponentChessSide}
                  isSelf={isWin}
                  size="sm"
                  showRoleText={false}
                />
              </div>
            </div>

            {/* Loser Card */}
            <div className="p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex flex-col gap-1 opacity-80">
              <span className="text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                RUNNER-UP
              </span>
              <span className="text-xs font-semibold text-[var(--text)] truncate">
                {isWin ? opponentName : userName}
              </span>
              <div className="mt-0.5">
                <PlayerColorBadge
                  side={isWin ? opponentChessSide : userChessSide}
                  isSelf={!isWin}
                  size="sm"
                  showRoleText={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Total Moves Indicator */}
        <div className="w-full py-1.5 px-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <span>TOTAL MOVES</span>
          <span className="font-bold text-[var(--text)]">{totalMoves}</span>
        </div>

        {/* TWO-PLAYER REMATCH CONFIRMATION STATUS CARD */}
        <div className="w-full rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[var(--primary)]" />
              Rematch Status
            </span>
            <span className="text-[9px] font-medium text-[var(--text-muted)]">
              2 Confirmations Required
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
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              VIEW GAME
            </button>
            <button
              onClick={onExit}
              disabled={rematchStarted}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]/80 transition-colors font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
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
