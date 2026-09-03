import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button, Avatar } from '../components/UI';
import { Copy, Share2, Crown, Check, CheckCircle2 } from 'lucide-react';
import { GameRoom, UserProfile, getOppositeIdentity } from '../types';

interface WaitingRoomScreenProps {
  room: GameRoom;
  user: UserProfile;
  onCancel: () => void;
  onStart: (room: GameRoom) => void;
}

export const WaitingRoomScreen = ({ room, user, onCancel, onStart }: WaitingRoomScreenProps) => {
  const [opponentReady, setOpponentReady] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [copied, setCopied] = useState(false);

  // The Opposite Identity rule: exactly one King and one Queen
  const creatorRole = room.creatorRole;
  const opponentRole = room.opponentRole;

  // Simulate opponent joining with the forced opposite identity
  const [joinedOpponent, setJoinedOpponent] = useState<UserProfile>({
    username: '@alex',
    displayName: 'Alex',
    bio: 'Looking for a royal game.',
    avatar: '',
    identity: opponentRole, // Enforce Opposite Identity!
  });

  useEffect(() => {
    // Simulate opponent joining after 4 seconds
    const timer = setTimeout(() => {
      setShowLobby(true);
      // Simulate opponent ready after 2 more seconds
      setTimeout(() => setOpponentReady(true), 2000);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!showLobby) {
    return (
      <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-display">YOUR GAME IS READY</h1>
          <p className="text-[var(--text-muted)]">Invite your partner to join your private room.</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 -mt-6">
          {/* Room Code Box */}
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl">
              <span className="text-[var(--text-muted)] text-[10px] font-bold tracking-[0.3em] uppercase">
                Room Code
              </span>
              <span className="text-4xl font-display tracking-widest text-[var(--primary)] font-semibold">
                {room.code}
              </span>
            </div>
            <div className="flex gap-2.5 w-full">
              <Button 
                variant="secondary" 
                onClick={handleCopyCode}
                className="flex-1 py-3 text-xs tracking-wider font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleCopyCode}
                className="flex-1 py-3 text-xs tracking-wider font-semibold"
              >
                <Share2 className="w-3.5 h-3.5" /> SHARE
              </Button>
            </div>
          </div>

          {/* Opposite Identity Pairing Banner */}
          <div className="w-full max-w-sm rounded-2xl p-4 bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                Match Pairing
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--surface-light)] border border-[var(--border)] text-[var(--primary)]">
                Opposite Rule
              </span>
            </div>

            <div className="flex items-center justify-between">
              {/* Creator Side */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-base text-[var(--primary)]">
                  {creatorRole === 'KING' ? '♔' : '♕'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">YOU</span>
                  <span className="text-xs font-semibold text-[var(--text)]">{user.displayName}</span>
                  <span className="text-[10px] font-bold text-[var(--primary)] tracking-wider">
                    {creatorRole === 'KING' ? '♔ KING' : '♕ QUEEN'}
                  </span>
                </div>
              </div>

              {/* VS */}
              <span className="text-xs font-display italic text-[var(--primary)] opacity-40 px-2">VS</span>

              {/* Opponent Slot */}
              <div className="flex items-center gap-2.5 text-right">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">WAITING FOR</span>
                  <span className="text-xs font-medium text-[var(--text-muted)] italic">Opponent</span>
                  <span className="text-[10px] font-bold text-[var(--primary)]/80 tracking-wider">
                    {opponentRole === 'KING' ? '♔ KING' : '♕ QUEEN'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-light)] border border-dashed border-[var(--border)] flex items-center justify-center text-base text-[var(--text-muted)]">
                  {opponentRole === 'KING' ? '♔' : '♕'}
                </div>
              </div>
            </div>
          </div>

          {/* Animated Waiting indicator */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-16 flex items-center justify-center">
              <motion.span 
                animate={{ x: [-20, 20, -20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl absolute opacity-40"
              >
                ♔
              </motion.span>
              <motion.span 
                animate={{ x: [20, -20, 20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl absolute opacity-40"
              >
                ♕
              </motion.span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-[var(--text-muted)] font-medium animate-pulse tracking-wide">
                Waiting for partner to enter code...
              </p>
              <div className="flex gap-1.5">
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

        <div className="mt-8 pb-4">
          <button 
            onClick={onCancel} 
            className="w-full text-[var(--text-muted)] text-sm font-medium hover:text-[var(--text)] transition-colors py-2"
          >
            CANCEL ROOM
          </button>
        </div>
      </div>
    );
  }

  // Pre-game Match Lobby when opponent joins
  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-10 text-center">
        <h1 className="text-3xl font-display uppercase tracking-widest">Match Lobby</h1>
        <p className="text-[var(--text-muted)]">Opponent joined. Pairing confirmed.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Two Players Head-to-Head */}
        <div className="w-full grid grid-cols-[1fr,auto,1fr] items-center gap-4 max-w-md">
          {/* Creator / You */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar size="lg" className="border-2 border-[var(--primary)]" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--primary)] flex items-center justify-center text-xs text-[var(--primary)]">
                {creatorRole === 'KING' ? '♔' : '♕'}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--text)]">{user.displayName}</p>
              <p className="text-[10px] text-[var(--primary)] font-bold tracking-widest mt-0.5">
                {creatorRole === 'KING' ? '♔ KING' : '♕ QUEEN'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">HOST</span>
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-2xl font-display italic text-[var(--text-muted)] opacity-30 -mt-6">
            VS
          </div>

          {/* Opponent with Opposing Identity */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar size="lg" className="border-2 border-[var(--border)] opacity-90" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--primary)] flex items-center justify-center text-xs text-[var(--primary)]">
                {opponentRole === 'KING' ? '♔' : '♕'}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--text)]">{joinedOpponent.displayName}</p>
              <p className="text-[10px] text-[var(--primary)] font-bold tracking-widest mt-0.5">
                {opponentRole === 'KING' ? '♔ KING' : '♕ QUEEN'}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-all border ${opponentReady ? 'bg-green-500/10 border-green-500/20' : 'bg-[var(--surface-light)] border-[var(--border)]'}`}>
              <motion.div 
                animate={opponentReady ? {} : { opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-1.5 h-1.5 rounded-full ${opponentReady ? 'bg-green-500' : 'bg-[var(--text-muted)]'}`} 
              />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${opponentReady ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                {opponentReady ? 'READY' : 'JOINING'}
              </span>
            </div>
          </div>
        </div>

        {/* Match Settings Info */}
        <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-widest">Royal Pair</span>
            <span className="text-[var(--primary)] font-bold tracking-wider">
              {creatorRole === 'KING' ? '♔ KING vs ♕ QUEEN' : '♕ QUEEN vs ♔ KING'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-widest">Game Mode</span>
            <span className="text-[var(--text)] font-semibold">Classic Chess</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-widest">Truth or Dare</span>
            <span className={room.truthOrDare ? "text-green-400 font-bold" : "text-[var(--text-muted)]"}>
              {room.truthOrDare ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-muted)] uppercase tracking-widest">Match Timer</span>
            <span className="text-[var(--text)] font-medium">{room.timer}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 pb-4 flex flex-col gap-3">
        <Button 
          disabled={!opponentReady} 
          onClick={() => onStart({ ...room, opponent: joinedOpponent })}
          className="w-full h-14 font-semibold tracking-wider"
        >
          START MATCH
        </Button>
        <button 
          onClick={onCancel}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] py-1 transition-colors text-center"
        >
          CANCEL MATCH
        </button>
      </div>
    </div>
  );
};
