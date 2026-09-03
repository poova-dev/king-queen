import { useState } from 'react';
import { Timer, Sword, Heart } from 'lucide-react';
import { Button, Card } from '../components/UI';

interface CreateRoomScreenProps {
  onBack: () => void;
  onCreated: (code: string) => void;
}

export const CreateRoomScreen = ({ onBack, onCreated }: CreateRoomScreenProps) => {
  const [timer, setTimer] = useState('No Timer');
  const [truthOrDare, setTruthOrDare] = useState(true);

  const timers = ['No Timer', '10 Minutes', '15 Minutes', '30 Minutes'];

  const handleCreate = () => {
    // Simulate generation
    const code = `KQ-${Math.floor(1000 + Math.random() * 9000)}`;
    onCreated(code);
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-3xl font-display">Create Your Game</h1>
        <p className="text-[var(--text-muted)]">Configure your match settings.</p>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {/* Game Mode */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Game Mode</label>
          <Card active className="flex items-center gap-4 py-5">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Classic Chess</h3>
              <p className="text-xs text-[var(--text-muted)]">Standard rules, royal experience.</p>
            </div>
          </Card>
        </div>

        {/* Truth or Dare Toggle */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Fun Interaction</label>
          <Card 
            active={truthOrDare}
            onClick={() => setTruthOrDare(!truthOrDare)}
            className="flex items-center justify-between py-5"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${truthOrDare ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--surface-light)] text-[var(--text-muted)]'}`}>
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Truth or Dare</h3>
                <p className="text-xs text-[var(--text-muted)]">Enable post-game challenges.</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${truthOrDare ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${truthOrDare ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </Card>
        </div>

        {/* Timer Selection */}
        <div className="flex flex-col gap-4">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Match Timer</label>
          <div className="grid grid-cols-2 gap-3">
            {timers.map((t) => (
              <button
                key={t}
                onClick={() => setTimer(t)}
                className={`
                  flex items-center gap-2 px-4 py-4 rounded-xl border transition-all text-sm
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

      <div className="flex flex-col gap-4 mt-12 pb-8">
        <Button onClick={handleCreate} className="w-full h-16">
          CREATE ROOM
        </Button>
        <button onClick={onBack} className="text-[var(--text-muted)] text-sm font-medium py-2">CANCEL</button>
      </div>
    </div>
  );
};
