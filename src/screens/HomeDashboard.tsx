import { Settings, Plus, LogIn, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { Button, Card, Avatar } from '../components/UI';
import { UserProfile } from '../types';

interface HomeDashboardProps {
  user: UserProfile;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSettings: () => void;
}

export const HomeDashboard = ({ user, onCreateRoom, onJoinRoom, onSettings }: HomeDashboardProps) => {
  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-[var(--background)] pb-28">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <Avatar size="sm" src={user.avatar} className="border border-[var(--primary)]" />
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{user.username}</span>
            <span className="text-[10px] text-[var(--primary)] font-bold tracking-[0.2em]">{user.identity}</span>
          </div>
        </div>
        <button 
          onClick={onSettings}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Hero */}
      <div className="flex flex-col gap-2 mb-10">
        <p className="text-[var(--text-muted)] font-medium">Welcome back, {user.displayName}</p>
        <h1 className="text-3xl font-display leading-tight">Ready for your next move?</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Challenge your partner to a match of hearts and minds.</p>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col gap-4">
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
    </div>
  );
};
