import React, { useState, useEffect } from 'react';
import { Palette, Shield, Volume2, User, ChevronRight, ArrowLeft, LogOut, History, Trophy, Swords, Loader2, ArrowRight } from 'lucide-react';
import { Avatar, Card, Button } from '../components/UI';
import { UserProfile, UserGameHistoryRecord } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { getRecentGames, formatGameResult, formatGameDate, calculateUserGameStats } from '../services/gameHistoryService';

interface ProfileScreenProps {
  user: UserProfile;
  onNavigateToAppearance: () => void;
  onEditProfile: () => void;
  onViewHistory?: () => void;
  onStartGame?: () => void;
  onBack: () => void;
  onLogout?: () => void;
  /** Increment to force a re-fetch of recent game history (e.g., after a game ends) */
  refreshKey?: number;
}

export const ProfileScreen = ({
  user,
  onNavigateToAppearance,
  onEditProfile,
  onViewHistory,
  onStartGame,
  onBack,
  onLogout,
  refreshKey,
}: ProfileScreenProps) => {
  const { theme } = useTheme();
  const { logout } = useAuth();

  const [recentGames, setRecentGames] = useState<UserGameHistoryRecord[]>([]);
  const [loadingGames, setLoadingGames] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (user.uid) {
      getRecentGames(user.uid)
        .then((games) => {
          if (isMounted) {
            setRecentGames(games);
          }
        })
        .catch((err) => {
          if (import.meta.env?.DEV) {
            console.warn('[ProfileScreen getRecentGames error]', err);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingGames(false);
        });
    } else {
      setLoadingGames(false);
    }
    return () => {
      isMounted = false;
    };
  }, [user.uid, refreshKey]);

  const stats = calculateUserGameStats(recentGames, user);
  const chessStats = stats.chess;
  const tdStats = stats.truthDare;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    onLogout?.();
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-[var(--background)] pb-28">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display tracking-wider uppercase text-[var(--text)]">
          Profile
        </h1>
        <div className="w-10" />
      </header>

      {/* Profile Card */}
      <div className="flex flex-col items-center gap-4 py-4 mb-6">
        <div className="relative">
          <Avatar 
            size="xl" 
            src={user.avatar} 
            className="border-2 border-[var(--primary)] shadow-[0_0_20px_rgba(184,155,94,0.15)]" 
          />
          <div className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] text-sm shadow-md">
            {user.identity === 'KING' ? '♔' : '♕'}
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display text-[var(--text)]">
              {user.displayName || 'Royal Sovereign'}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 tracking-widest uppercase">
              {user.identity}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            {user.username || '@player'}
          </p>
          {user.bio && (
            <p className="text-xs text-[var(--text-muted)] max-w-xs mt-2 italic">
              "{user.bio}"
            </p>
          )}
        </div>

        {/* Quick Overall Summary Grid */}
        <div className="w-full grid grid-cols-4 gap-2 mt-2">
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-base font-display font-semibold text-[var(--text)]">
              {chessStats.gamesPlayed + tdStats.gamesPlayed}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] text-center font-medium">
              Total Games
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-base font-display font-semibold text-emerald-400">
              {chessStats.wins}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-medium">
              Chess Wins
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-base font-display font-semibold text-rose-400">
              {tdStats.challengesCompleted}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-rose-300 font-medium">
              Challenges
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30">
            <span className="text-base font-display font-semibold text-[var(--primary)]">
              {chessStats.winRate}%
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--primary)] font-medium">
              Win Rate
            </span>
          </div>
        </div>

        {/* Detailed Game Statistics Cards */}
        <div className="w-full flex flex-col gap-3 mt-3">
          {/* Chess Stats Card */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">♟</span>
                <h3 className="text-xs font-display font-bold tracking-wider uppercase text-[var(--text)]">
                  Chess Statistics
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                {chessStats.winRate}% Win Rate
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)]/70">
                <span className="font-bold text-[var(--text)]">{chessStats.gamesPlayed}</span>
                <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Battles</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-400">{chessStats.wins}</span>
                <span className="block text-[9px] text-emerald-300 uppercase tracking-wider mt-0.5">Victories</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="font-bold text-rose-400">{chessStats.losses}</span>
                <span className="block text-[9px] text-rose-300 uppercase tracking-wider mt-0.5">Defeats</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/40 px-1">
              <span>Draws: <strong className="text-[var(--text)]">{chessStats.draws}</strong></span>
              <span>Checkmates: <strong className="text-[var(--text)]">{chessStats.checkmates}</strong></span>
              <span>Avg Moves: <strong className="text-[var(--text)]">{chessStats.avgMovesPerGame}</strong></span>
            </div>
          </div>

          {/* Truth / Dare Stats Card */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-rose-500/30 flex flex-col gap-3 shadow-sm bg-gradient-to-br from-[var(--surface)] to-rose-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎭</span>
                <h3 className="text-xs font-display font-bold tracking-wider uppercase text-rose-300">
                  Truth or Dare Statistics
                </h3>
              </div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                {tdStats.challengesCompleted} Challenges
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)]/70">
                <span className="font-bold text-[var(--text)]">{tdStats.gamesPlayed}</span>
                <span className="block text-[9px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Games</span>
              </div>
              <div className="p-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                <span className="font-bold text-[var(--primary)]">{tdStats.truthsCompleted}</span>
                <span className="block text-[9px] text-[var(--primary)] uppercase tracking-wider mt-0.5">Truths</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="font-bold text-rose-400">{tdStats.daresCompleted}</span>
                <span className="block text-[9px] text-rose-300 uppercase tracking-wider mt-0.5">Dares</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-rose-500/20 px-1">
              <span>Rounds: <strong className="text-[var(--text)]">{tdStats.roundsPlayed}</strong></span>
              <span>Challenger: <strong className="text-[var(--text)]">{tdStats.challengerRounds}</strong></span>
              <span>Judge: <strong className="text-[var(--text)]">{tdStats.judgeRounds}</strong></span>
            </div>
          </div>
        </div>

        {/* View Game History Quick Button */}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="w-full mt-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--surface-light)] to-[var(--surface)] border border-[var(--primary)]/30 hover:border-[var(--primary)] text-xs font-semibold text-[var(--primary)] tracking-wider uppercase transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-[var(--primary)]" />
              <span>VIEW ALL HISTORY</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* MATCH HISTORY Section */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center justify-between ml-1 mb-1">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>MATCH HISTORY</span>
          </h3>
          {recentGames.length > 0 && onViewHistory && (
            <button
              onClick={onViewHistory}
              className="text-[11px] font-bold text-[var(--primary)] hover:underline uppercase tracking-wider flex items-center gap-0.5"
            >
              VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loadingGames ? (
          <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            <span className="text-xs tracking-wider">Loading battles...</span>
          </div>
        ) : recentGames.length === 0 ? (
          /* Premium Royal Empty State */
          <div className="w-full py-10 px-6 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-2xl text-[var(--text-muted)] shadow-inner">
              ♜
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <h4 className="text-sm font-display tracking-wider text-[var(--text)]">
                NO BATTLES YET
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your chess legacy begins with your first match.
              </p>
            </div>
            {onStartGame && (
              <Button
                onClick={onStartGame}
                variant="primary"
                className="h-10 px-5 text-xs font-semibold tracking-wider uppercase mt-1"
              >
                START A BATTLE
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentGames.map((game) => {
              const resInfo = formatGameResult(game.result);
              return (
                <div
                  key={game.gameId}
                  className={`w-full rounded-xl p-3.5 border flex flex-col gap-2.5 transition-all ${
                    game.result === 'WIN'
                      ? 'bg-gradient-to-r from-emerald-950/20 via-[var(--surface)] to-[var(--surface)] border-emerald-500/30'
                      : game.result === 'LOSS'
                      ? 'bg-gradient-to-r from-rose-950/20 via-[var(--surface)] to-[var(--surface)] border-rose-500/30'
                      : 'bg-gradient-to-r from-[var(--primary)]/10 via-[var(--surface)] to-[var(--surface)] border-[var(--primary)]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{resInfo.icon}</span>
                      <span className={`text-[11px] font-bold tracking-widest uppercase ${resInfo.color}`}>
                        {resInfo.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {formatGameDate(game.playedAt || game.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" src={game.opponentPhotoURL || undefined} />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[var(--text)]">
                          vs {game.opponentName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {game.gameType === 'TRUTH_DARE'
                            ? `🎭 TRUTH OR DARE • ${game.roundsPlayed || 0} Rounds • ${game.completedChallenges || 0} Challenges`
                            : `${game.playerColor === 'WHITE' ? '♔ WHITE' : '♚ BLACK'} • ${game.reason} • ${game.totalMoves || 0} Moves`}
                        </span>
                      </div>
                    </div>
                    {onViewHistory && (
                      <button
                        onClick={onViewHistory}
                        className="px-2.5 py-1 rounded-lg bg-[var(--surface-light)] border border-[var(--border)] text-[10px] font-bold text-[var(--primary)] tracking-wider uppercase hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                      >
                        DETAILS <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest ml-1 mb-1">
          Settings
        </h3>

        {/* Appearance Row: Profile -> Settings -> Appearance -> Choose Your Theme */}
        <Card
          onClick={onNavigateToAppearance}
          className="flex items-center justify-between p-4 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] group-hover:scale-105 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text)]">Appearance</span>
              <span className="text-xs text-[var(--text-muted)]">
                Choose Your Theme • <strong className="text-[var(--primary)] font-medium">{theme.name}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] group-hover:text-[var(--text)]">
            {/* Active theme color dots preview */}
            <div className="flex items-center gap-1">
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/20" 
                style={{ backgroundColor: theme.colors.primary }} 
              />
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/20" 
                style={{ backgroundColor: theme.colors.surfaceLight }} 
              />
            </div>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Card>

        {/* Edit Identity */}
        <Card
          onClick={onEditProfile}
          className="flex items-center justify-between p-4 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text)]">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text)]">Edit Profile</span>
              <span className="text-xs text-[var(--text-muted)]">Update name, avatar, or bio</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        </Card>

        {/* Sound & Haptics (decorative) */}
        <Card className="flex items-center justify-between p-4 cursor-default opacity-85">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text)]">Game Audio</span>
              <span className="text-xs text-[var(--text-muted)]">Chess piece sounds & music</span>
            </div>
          </div>
          <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-[var(--surface-light)] text-[var(--primary)] border border-[var(--border)]">
            ENABLED
          </span>
        </Card>

        {/* Fair Play Guarantee */}
        <Card className="flex items-center justify-between p-4 cursor-default opacity-85">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text)]">Fair Play & Privacy</span>
              <span className="text-xs text-[var(--text-muted)]">End-to-end private rooms</span>
            </div>
          </div>
          <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-[var(--surface-light)] text-green-400 border border-[var(--border)]">
            VERIFIED
          </span>
        </Card>

        {/* Sign Out */}
        <Card
          onClick={handleLogout}
          className="flex items-center justify-between p-4 group hover:border-red-500/40 transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-red-400">Sign Out</span>
              <span className="text-xs text-[var(--text-muted)]">End your royal session</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
        </Card>
      </div>
    </div>
  );
};
