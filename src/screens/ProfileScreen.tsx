import { Palette, Shield, Volume2, User, ChevronRight, ArrowLeft, LogOut, History, Trophy } from 'lucide-react';
import { Avatar, Card } from '../components/UI';
import { UserProfile } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

interface ProfileScreenProps {
  user: UserProfile;
  onNavigateToAppearance: () => void;
  onEditProfile: () => void;
  onViewHistory?: () => void;
  onBack: () => void;
  onLogout?: () => void;
}

export const ProfileScreen = ({
  user,
  onNavigateToAppearance,
  onEditProfile,
  onViewHistory,
  onBack,
  onLogout,
}: ProfileScreenProps) => {
  const { theme } = useTheme();
  const { logout } = useAuth();

  const gamesPlayed = user.gamesPlayed ?? 0;
  const wins = user.wins ?? 0;
  const losses = user.losses ?? 0;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

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
      <div className="flex flex-col items-center gap-4 py-4 mb-8">
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

        {/* Quick Stats Grid with Win Rate */}
        <div className="w-full grid grid-cols-4 gap-2 mt-4">
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <span className="text-base font-display font-semibold text-[var(--text)]">
              {gamesPlayed}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] text-center font-medium">
              Battles
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-base font-display font-semibold text-emerald-400">
              {wins}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-medium">
              Wins
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-base font-display font-semibold text-rose-400">
              {losses}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-rose-300 font-medium">
              Losses
            </span>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30">
            <span className="text-base font-display font-semibold text-[var(--primary)]">
              {winRate}%
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--primary)] font-medium">
              Win Rate
            </span>
          </div>
        </div>

        {/* View Game History Button */}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--surface-light)] to-[var(--surface)] border border-[var(--primary)]/30 hover:border-[var(--primary)] text-xs font-semibold text-[var(--primary)] tracking-wider uppercase transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-[var(--primary)]" />
              <span>VIEW GAME HISTORY</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-transform" />
          </button>
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
