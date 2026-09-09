import React, { useState, useEffect } from 'react';
import { Settings, Plus, LogIn, Globe, ArrowRight, History, Sparkles } from 'lucide-react';
import { Button, Card, Avatar } from '../components/UI';
import { UserProfile, GameHistoryRecord } from '../types';
import { fetchUserGameHistory } from '../services/gameService';

interface HomeDashboardProps {
  user: UserProfile;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSettings: () => void;
  onViewHistory?: () => void;
  onPlayTruthDare?: () => void;
}

export const HomeDashboard = ({
  user,
  onCreateRoom,
  onJoinRoom,
  onSettings,
  onViewHistory,
  onPlayTruthDare,
}: HomeDashboardProps) => {
  const [recentBattles, setRecentBattles] = useState<GameHistoryRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (user.uid) {
      fetchUserGameHistory(user.uid, 3).then((games) => {
        if (isMounted) {
          setRecentBattles(games);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user.uid]);

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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-[var(--background)] pb-28">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Avatar size="sm" src={user.avatar} className="border border-[var(--primary)]" />
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{user.username}</span>
            <span className="text-[10px] text-[var(--primary)] font-bold tracking-[0.2em]">{user.identity}</span>
          </div>
        </div>

        {/* Royal Brand Emblem */}
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="King & Queen"
            className="w-10 h-10 object-contain filter drop-shadow-[0_2px_12px_rgba(184,155,94,0.4)]"
          />
        </div>

        <button 
          onClick={onSettings}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Hero */}
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-[var(--text-muted)] font-medium">Welcome back, {user.displayName}</p>
        <h1 className="text-3xl font-display leading-tight">Ready for your next move?</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Challenge your partner to a match of hearts and minds.</p>
      </div>

      {/* PLAY WITH YOUR PARTNER SECTION */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            PLAY WITH YOUR PARTNER
          </span>
        </div>

        {/* 2 Game Mode Cards: responsive grid (1-col on mobile, 2-col on md+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GAME MODE CARD 1: ROYAL CHESS */}
          <div
            onClick={onCreateRoom}
            className="relative overflow-hidden rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/60 transition-all p-6 flex flex-col justify-between gap-6 cursor-pointer group shadow-sm hover:shadow-[0_4px_25px_rgba(184,155,94,0.12)]"
          >
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-2xl text-[var(--primary)] shadow-sm">
                  ♟
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[var(--primary)]/80 uppercase">
                  CLASSIC STRATEGY
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-display tracking-wide text-[var(--text)] uppercase">
                  ROYAL CHESS
                </h3>
                <p className="text-xs font-semibold text-[var(--primary)] tracking-wide">
                  Strategy. Patience. Victory.
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                  Challenge your partner in a real-time battle of strategy.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => onCreateRoom()}
                className="w-full h-12 text-xs font-display tracking-widest uppercase"
              >
                PLAY CHESS
              </Button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinRoom();
                }}
                className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] text-center py-1 transition-colors"
              >
                Have a room code? <span className="text-[var(--primary)] underline font-semibold">Join Game</span>
              </button>
            </div>

            {/* Subtle background royal chess watermark */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-3 -translate-y-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform select-none">
              <span className="text-8xl">♚</span>
            </div>
          </div>

          {/* GAME MODE CARD 2: TRUTH OR DARE */}
          <div
            onClick={onPlayTruthDare}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#140C12] to-[var(--surface)] border border-rose-900/40 hover:border-rose-600/70 transition-all p-6 flex flex-col justify-between gap-6 cursor-pointer group shadow-sm hover:shadow-[0_4px_30px_rgba(225,29,72,0.15)]"
          >
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-center shadow-sm">
                  <div className="flex flex-col items-center leading-none text-[8px] font-serif font-black tracking-widest text-rose-300">
                    <span>T</span>
                    <span className="text-[6px] text-rose-500 font-sans my-0.5">OR</span>
                    <span>D</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-[9px] font-bold text-rose-300 tracking-widest uppercase animate-pulse shadow-sm">
                  NEW
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-display tracking-wide text-rose-100 uppercase">
                  TRUTH OR DARE
                </h3>
                <p className="text-xs font-semibold text-rose-300/90 tracking-wide">
                  How brave are you?
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                  Discover secrets. Accept challenges. Only the bold survive.
                </p>
              </div>
            </div>

            <div className="relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayTruthDare?.();
                }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border border-rose-500/50 text-rose-100 font-display text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(225,29,72,0.25)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>PLAY NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtle background watermark */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-3 -translate-y-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform select-none text-rose-400">
              <span className="text-8xl font-serif">?</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT BATTLES SECTION */}
      {recentBattles.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[var(--primary)]" />
              Recent Battles
            </span>
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="text-[11px] font-bold text-[var(--primary)] hover:underline tracking-wide uppercase flex items-center gap-1"
              >
                VIEW ALL HISTORY <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {recentBattles.map((game) => {
              const isWin = user.uid && game.winnerUid === user.uid;
              const isLoss = user.uid && game.winnerUid && game.winnerUid !== user.uid;
              const opponent = user.uid === game.whitePlayer.uid ? game.blackPlayer : game.whitePlayer;

              return (
                <div
                  key={game.id}
                  onClick={onViewHistory}
                  className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/40 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {isWin ? '♔' : isLoss ? '♚' : '⚖️'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--text)]">
                        {isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw'} vs {opponent.displayName}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatRelativeDate(game.completedAt || game.createdAt)} • {game.result} • {game.totalMoves} Moves
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Future Feature */}
      <Card className="opacity-60 cursor-default border-dashed">
        <div className="flex flex-col gap-4">
           <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--text-muted)]">
                <Globe className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--surface-light)] text-[10px] font-bold text-[var(--primary)] tracking-widest border border-[var(--border)]">
                COMING SOON
              </span>
           </div>
           <div className="flex flex-col gap-1">
              <h3 className="text-lg font-display text-[var(--text-muted)]">ONLINE MULTIPLAYER</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Random matches, online players and global competition in future updates.
              </p>
           </div>
        </div>
      </Card>
    </div>
  );
};
