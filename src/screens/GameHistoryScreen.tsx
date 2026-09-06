import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trophy, Swords, ArrowRight, RotateCw, Loader2, Sparkles } from 'lucide-react';
import { UserProfile, GameHistoryRecord } from '../types';
import { fetchUserGameHistory } from '../services/gameService';
import { GameInspectionModal } from '../components/history/GameInspectionModal';
import { Avatar, Button } from '../components/UI';

interface GameHistoryScreenProps {
  user: UserProfile;
  onBack: () => void;
  onStartGame: () => void;
}

export const GameHistoryScreen: React.FC<GameHistoryScreenProps> = ({
  user,
  onBack,
  onStartGame,
}) => {
  const [games, setGames] = useState<GameHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [limitCount, setLimitCount] = useState<number>(20);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<GameHistoryRecord | null>(null);

  const loadHistory = useCallback(async (count: number) => {
    if (!user.uid) return;
    try {
      const fetched = await fetchUserGameHistory(user.uid, count + 1);
      if (fetched.length > count) {
        setHasMore(true);
        setGames(fetched.slice(0, count));
      } else {
        setHasMore(false);
        setGames(fetched);
      }
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('[GameHistoryScreen Error]', err);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user.uid]);

  useEffect(() => {
    setLoading(true);
    loadHistory(limitCount);
  }, [loadHistory, limitCount]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setLimitCount((prev) => prev + 20);
  };

  // Stats calculation
  const totalGames = user.gamesPlayed || games.length || 0;
  const wins = user.wins || games.filter((g) => g.winnerUid === user.uid).length || 0;
  const losses = user.losses || games.filter((g) => g.winnerUid && g.winnerUid !== user.uid).length || 0;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const formatRelativeDate = (timestamp: any): string => {
    if (!timestamp) return 'Today';
    const date = timestamp?.toDate
      ? timestamp.toDate()
      : typeof timestamp === 'number'
      ? new Date(timestamp)
      : new Date();

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'YESTERDAY';
    if (diffDays < 7) return `${diffDays} DAYS AGO`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen px-4 sm:px-6 py-8 bg-[var(--background)] pb-28 text-[var(--text)]">
      {/* HEADER */}
      <header className="flex flex-col gap-1 mb-6 text-center sm:text-left">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase">
              ROYAL CHRONICLES
            </span>
            <h1 className="text-2xl sm:text-3xl font-display tracking-wider text-[var(--text)]">
              GAME HISTORY
            </h1>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              loadHistory(limitCount);
            }}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
            title="Refresh History"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Every battle leaves a legacy.
        </p>
      </header>

      {/* SUMMARY STATS CARD */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-[var(--surface-light)] via-[var(--surface)] to-[var(--surface)] border border-[var(--primary)]/30 p-4.5 mb-6 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-semibold tracking-wider text-[var(--text)] uppercase">
              Battle Record
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--primary)]">
            Win Rate {winRate}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]/60">
            <span className="text-lg sm:text-xl font-display font-bold text-[var(--text)]">
              {totalGames}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-medium">
              Battles
            </span>
          </div>

          <div className="flex flex-col p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-lg sm:text-xl font-display font-bold text-emerald-400">
              {wins}
            </span>
            <span className="text-[10px] text-emerald-300 tracking-wider uppercase font-medium">
              Victories
            </span>
          </div>

          <div className="flex flex-col p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-lg sm:text-xl font-display font-bold text-rose-400">
              {losses}
            </span>
            <span className="text-[10px] text-rose-300 tracking-wider uppercase font-medium">
              Defeats
            </span>
          </div>
        </div>
      </div>

      {/* BATTLES LIST */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase px-1">
          Recent Encounters
        </span>

        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            <span className="text-xs tracking-wider">Unrolling the royal archives...</span>
          </div>
        ) : games.length === 0 ? (
          /* EMPTY STATE */
          <div className="w-full py-16 px-6 rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-3xl text-[var(--text-muted)] shadow-inner">
              ♟
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <h3 className="text-base font-display tracking-wider text-[var(--text)]">
                NO BATTLES YET
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your kingdom awaits its first royal challenge. Create or join a private room to make history.
              </p>
            </div>
            <Button onClick={onStartGame} variant="primary" className="h-11 px-6 text-xs font-semibold tracking-wider uppercase mt-1">
              START A GAME
            </Button>
          </div>
        ) : (
          <>
            {games.map((game) => {
              const isWin = user.uid && game.winnerUid === user.uid;
              const isLoss = user.uid && game.winnerUid && game.winnerUid !== user.uid;
              const isDraw = !game.winnerUid;

              const isUserWhite = user.uid === game.whitePlayer.uid;
              const opponent = isUserWhite ? game.blackPlayer : game.whitePlayer;
              const userColor = isUserWhite ? 'WHITE' : 'BLACK';

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full rounded-2xl p-4 transition-all border flex flex-col gap-3 ${
                    isWin
                      ? 'bg-gradient-to-r from-emerald-950/20 via-[var(--surface)] to-[var(--surface)] border-emerald-500/40 hover:border-emerald-500/60'
                      : isLoss
                      ? 'bg-gradient-to-r from-rose-950/20 via-[var(--surface)] to-[var(--surface)] border-rose-500/40 hover:border-rose-500/60'
                      : 'bg-gradient-to-r from-[var(--primary)]/10 via-[var(--surface)] to-[var(--surface)] border-[var(--primary)]/30 hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {isWin ? '♔' : isLoss ? '♚' : '⚖️'}
                      </span>
                      <span
                        className={`text-[11px] font-bold tracking-widest uppercase ${
                          isWin
                            ? 'text-emerald-400'
                            : isLoss
                            ? 'text-rose-400'
                            : 'text-[var(--primary)]'
                        }`}
                      >
                        {isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
                      {formatRelativeDate(game.completedAt || game.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" src={opponent.photoURL || undefined} />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[var(--text)]">
                          vs {opponent.displayName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {userColor} • {game.result} • {game.totalMoves} Moves
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedGame(game)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--surface-light)] hover:bg-[var(--primary)]/20 border border-[var(--border)] text-[10px] font-bold text-[var(--primary)] tracking-wider uppercase transition-colors flex items-center gap-1"
                    >
                      VIEW GAME <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {hasMore && (
              <div className="w-full pt-2 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] tracking-wider uppercase transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                      LOADING...
                    </>
                  ) : (
                    'LOAD MORE BATTLES'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* READ-ONLY BOARD INSPECTION MODAL */}
      <GameInspectionModal
        game={selectedGame}
        currentUserId={user.uid}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
};
