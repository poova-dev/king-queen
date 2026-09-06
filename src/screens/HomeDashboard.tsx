import React, { useState, useEffect } from 'react';
import { Settings, Plus, LogIn, Globe, ArrowRight, History } from 'lucide-react';
import { Button, Card, Avatar } from '../components/UI';
import { UserProfile, GameHistoryRecord } from '../types';
import { fetchUserGameHistory } from '../services/gameService';

interface HomeDashboardProps {
  user: UserProfile;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSettings: () => void;
  onViewHistory?: () => void;
}

export const HomeDashboard = ({
  user,
  onCreateRoom,
  onJoinRoom,
  onSettings,
  onViewHistory,
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

      {/* Main Actions */}
      <div className="flex flex-col gap-4 mb-8">
        <Card onClick={onCreateRoom} className="relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Plus className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-display">PLAY WITH SOMEONE</h3>
              <p className="text-sm text-[var(--text-muted)]">Create a private room and invite your opponent.</p>
            </div>
            <Button variant="primary" className="w-full h-14 mt-2">CREATE GAME</Button>
          </div>
          {/* Subtle bg pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
             <span className="text-8xl">♔</span>
          </div>
        </Card>

        <Card onClick={onJoinRoom} className="relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--text-muted)]">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-display">JOIN A GAME</h3>
              <p className="text-sm text-[var(--text-muted)]">Already have an invitation code?</p>
            </div>
            <Button variant="secondary" className="w-full h-14 mt-2">JOIN ROOM</Button>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
             <span className="text-8xl">♕</span>
          </div>
        </Card>
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
