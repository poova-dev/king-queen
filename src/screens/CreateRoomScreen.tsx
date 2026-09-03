import { useState } from 'react';
import { Timer, Sword, Heart, Crown } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { UserProfile, getOppositeIdentity } from '../types';

interface CreateRoomScreenProps {
  user: UserProfile;
  onBack: () => void;
  onCreated: (settings: { code: string; timer: string; truthOrDare: boolean }) => void;
}

export const CreateRoomScreen = ({ user, onBack, onCreated }: CreateRoomScreenProps) => {
  const [timer, setTimer] = useState('No Timer');
  const [truthOrDare, setTruthOrDare] = useState(true);

  const timers = ['No Timer', '10 Minutes', '15 Minutes', '30 Minutes'];
  const creatorRole = user.identity;
  const opponentRole = getOppositeIdentity(creatorRole);

  const handleCreate = () => {
    // Generate private room code
    const code = `KQ-${Math.floor(1000 + Math.random() * 9000)}`;
    onCreated({ code, timer, truthOrDare });
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display">Create Your Game</h1>
        <p className="text-[var(--text-muted)]">Configure your private two-player room.</p>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Royal Identity Pairing Preview */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest">
              Identity Pairing
            </label>
            <span className="text-[10px] text-[var(--primary)] font-semibold tracking-wider uppercase">
              Opposite Rule Active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-3 shadow-sm">
            {/* Creator side */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-xl text-[var(--primary)] flex-shrink-0">
                {creatorRole === 'KING' ? '♔' : '♕'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">You</span>
                <span className="text-sm font-semibold truncate text-[var(--text)]">{user.displayName || 'You'}</span>
                <span className="text-[10px] font-bold text-[var(--primary)] tracking-widest">
                  {creatorRole === 'KING' ? '♔ KING' : '♕ QUEEN'}
                </span>
              </div>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-xs font-display italic text-[var(--primary)] opacity-40">VS</span>
            </div>

            {/* Opponent side preview */}
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Opponent</span>
                <span className="text-sm font-medium truncate text-[var(--text-muted)] italic">Waiting...</span>
                <span className="text-[10px] font-bold text-[var(--primary)]/80 tracking-widest">
                  {opponentRole === 'KING' ? '♔ KING' : '♕ QUEEN'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[var(--surface-light)] border border-dashed border-[var(--border)] flex items-center justify-center text-xl text-[var(--text-muted)] flex-shrink-0">
                {opponentRole === 'KING' ? '♔' : '♕'}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] ml-1">
            Every match pairs exactly one King and one Queen. Opponent will be automatically assigned <strong className="text-[var(--text)]">{opponentRole}</strong>.
          </p>
        </div>

        {/* Game Mode */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Game Mode</label>
          <Card active className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Classic Chess</h3>
              <p className="text-xs text-[var(--text-muted)]">Standard rules with royal quiet luxury atmosphere.</p>
            </div>
          </Card>
        </div>

        {/* Truth or Dare Toggle */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Post-Game Challenge</label>
          <Card 
            active={truthOrDare}
            onClick={() => setTruthOrDare(!truthOrDare)}
            className="flex items-center justify-between py-4"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${truthOrDare ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--surface-light)] text-[var(--text-muted)]'}`}>
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Truth or Dare</h3>
                <p className="text-xs text-[var(--text-muted)]">Enable intimate post-match challenges.</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${truthOrDare ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${truthOrDare ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </Card>
        </div>

        {/* Timer Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Match Timer</label>
          <div className="grid grid-cols-2 gap-3">
            {timers.map((t) => (
              <button
                key={t}
                onClick={() => setTimer(t)}
                className={`
                  flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all text-xs font-medium
                  ${timer === t ? 'bg-[var(--surface-light)] border-[var(--primary)] text-[var(--text)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'}
                `}
              >
                <Timer className={`w-4 h-4 ${timer === t ? 'text-[var(--primary)]' : 'text-current'}`} />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-8 pb-4">
        <Button onClick={handleCreate} className="w-full h-14 font-semibold tracking-wider">
          CREATE ROOM
        </Button>
        <button onClick={onBack} className="text-[var(--text-muted)] text-sm font-medium py-2 hover:text-[var(--text)] transition-colors">
          CANCEL
        </button>
      </div>
    </div>
  );
};
