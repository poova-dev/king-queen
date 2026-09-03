import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button, Avatar } from '../components/UI';
import { Copy, Share2 } from 'lucide-react';
import { UserProfile } from '../types';

interface WaitingRoomScreenProps {
  code: string;
  user: UserProfile;
  onCancel: () => void;
  onStart: () => void;
}

export const WaitingRoomScreen = ({ code, user, onCancel, onStart }: WaitingRoomScreenProps) => {
  const [opponentReady, setOpponentReady] = useState(false);
  const [showLobby, setShowLobby] = useState(false);

  useEffect(() => {
    // Simulate opponent joining after 4 seconds
    const timer = setTimeout(() => {
      setShowLobby(true);
      // Simulate opponent ready after 2 more seconds
      setTimeout(() => setOpponentReady(true), 2000);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const opponent: UserProfile = {
    username: '@opponent',
    displayName: 'Royal Adversary',
    bio: 'Looking for a good match.',
    avatar: '',
    identity: user.identity === 'KING' ? 'QUEEN' : 'KING',
  };

  if (!showLobby) {
    return (
      <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-3xl font-display">YOUR GAME IS READY</h1>
          <p className="text-[var(--text-muted)]">Invite your opponent to join.</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-12 -mt-10">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <span className="text-[var(--text-muted)] text-xs font-bold tracking-[0.3em] uppercase">Room Code</span>
              <span className="text-5xl font-display tracking-widest text-[var(--primary)]">{code}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="px-4 py-2 text-sm">
                <Copy className="w-4 h-4" /> COPY
              </Button>
              <Button variant="secondary" className="px-4 py-2 text-sm">
                <Share2 className="w-4 h-4" /> SHARE
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-20 flex items-center justify-center">
               <motion.span 
                animate={{ x: [-20, 20, -20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl absolute opacity-40"
               >♔</motion.span>
               <motion.span 
                animate={{ x: [20, -20, 20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl absolute opacity-40"
               >♕</motion.span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-[var(--text-muted)] font-medium animate-pulse">Waiting for your opponent...</p>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pb-8">
          <button onClick={onCancel} className="w-full text-[var(--text-muted)] text-sm font-medium hover:text-[var(--accent)] transition-colors">CANCEL ROOM</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-12 text-center">
        <h1 className="text-3xl font-display uppercase tracking-widest">Pre-Game Lobby</h1>
        <p className="text-[var(--text-muted)]">Confirm readiness to start the match.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <div className="w-full grid grid-cols-[1fr,auto,1fr] items-center gap-4">
          <div className="flex flex-col items-center gap-4">
             <Avatar size="lg" className="border-2 border-[var(--primary)]" />
             <div className="text-center">
                <p className="text-sm font-bold text-[var(--text)]">{user.displayName}</p>
                <p className="text-[10px] text-[var(--primary)] font-bold tracking-widest">{user.identity}</p>
             </div>
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-green-500 uppercase">READY</span>
             </div>
          </div>

          <div className="text-2xl font-display italic text-[var(--text-muted)] opacity-30 mt-[-40px]">VS</div>

          <div className="flex flex-col items-center gap-4">
             <Avatar size="lg" className="border-2 border-[var(--border)] opacity-80" />
             <div className="text-center">
                <p className="text-sm font-bold text-[var(--text)]">{opponent.displayName}</p>
                <p className="text-[10px] text-[var(--primary)] font-bold tracking-widest">{opponent.identity}</p>
             </div>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all border ${opponentReady ? 'bg-green-500/10 border-green-500/20' : 'bg-[var(--surface-light)] border-[var(--border)]'}`}>
                <motion.div 
                  animate={opponentReady ? {} : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-1.5 h-1.5 rounded-full ${opponentReady ? 'bg-green-500' : 'bg-[var(--text-muted)]'}`} 
                />
                <span className={`text-[10px] font-bold uppercase ${opponentReady ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                  {opponentReady ? 'READY' : 'WAITING'}
                </span>
             </div>
          </div>
        </div>

        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4">
           <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-muted)] uppercase tracking-widest">Match Config</span>
              <span className="text-[var(--primary)] font-bold">CLASSIC CHESS</span>
           </div>
           <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-muted)] uppercase tracking-widest">Truth or Dare</span>
              <span className="text-green-500 font-bold uppercase">ENABLED</span>
           </div>
           <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-muted)] uppercase tracking-widest">Match Timer</span>
              <span className="text-[var(--text)]">NO TIMER</span>
           </div>
        </div>
      </div>

      <div className="mt-12 pb-8">
        <Button 
          disabled={!opponentReady} 
          onClick={onStart}
          className="w-full h-16"
        >
          START MATCH
        </Button>
      </div>
    </div>
  );
};
