import { motion } from 'motion/react';
import { Button, Avatar } from '../components/UI';
import { UserProfile } from '../types';

interface GamePreviewScreenProps {
  user: UserProfile;
  onExit: () => void;
}

export const GamePreviewScreen = ({ user, onExit }: GamePreviewScreenProps) => {
  const opponent: UserProfile = {
    username: '@opponent',
    displayName: 'Royal Adversary',
    bio: 'Looking for a good match.',
    avatar: '',
    identity: user.identity === 'KING' ? 'QUEEN' : 'KING',
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] overflow-hidden">
      {/* Game Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <Avatar size="sm" className="border border-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase">Opponent</p>
            <p className="text-sm font-medium">{opponent.displayName}</p>
          </div>
        </div>
        <div className="text-xl font-display italic text-[var(--primary)] opacity-40">VS</div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase">You</p>
            <p className="text-sm font-medium">{user.displayName}</p>
          </div>
          <Avatar size="sm" className="border border-[var(--primary)]" />
        </div>
      </div>

      {/* Chess Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-[var(--surface)]/50">
        <div className="w-full aspect-square max-w-md relative">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 border-2 border-[var(--border)] rounded-sm overflow-hidden shadow-2xl shadow-black/50">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isDark = (row + col) % 2 === 1;
              return (
                <div 
                  key={i} 
                  className={`w-full h-full transition-colors ${isDark ? 'bg-[var(--surface-light)]' : 'bg-[var(--surface)] opacity-50'}`} 
                />
              );
            })}
          </div>
          
          {/* Central Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-[2px]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-[var(--primary)] opacity-20 animate-pulse" />
                <div className="text-6xl text-[var(--primary)] relative z-10 font-light opacity-80">
                  {user.identity === 'KING' ? '♔' : '♕'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-display tracking-[0.2em] uppercase text-[var(--text)]">Chess Engine</h2>
                <p className="text-sm text-[var(--text-muted)] tracking-widest uppercase font-bold opacity-60">Coming Next</p>
              </div>
              <div className="w-12 h-[1px] bg-[var(--primary)] opacity-30" />
              <p className="text-xs text-[var(--text-muted)] max-w-[200px] leading-relaxed italic opacity-80">
                "The board is set, the pieces are moving. Soon, the game begins."
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="px-8 py-8 flex flex-col gap-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <Button onClick={onExit} variant="secondary" className="w-full">
          EXIT MATCH
        </Button>
      </div>
    </div>
  );
};
