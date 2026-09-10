import { useState } from 'react';
import { Timer, Sword, Heart, AlertCircle, Loader2, Zap } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { UserProfile, getOppositeIdentity, TimeControlType } from '../types';
import { useRoom } from '../hooks/useRoom';
import { TIME_CONTROL_PRESETS } from '../services/timerService';

interface CreateRoomScreenProps {
  user: UserProfile;
  onBack: () => void;
  onCreated: (roomData: any) => void;
}

export const CreateRoomScreen = ({ user, onBack, onCreated }: CreateRoomScreenProps) => {
  const { createRoom, roomLoading, roomError, clearError } = useRoom();
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlType>('RAPID');
  const [truthOrDare, setTruthOrDare] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const timeControlOptions: { type: TimeControlType; label: string; duration: string; icon: string }[] = [
    { type: 'BULLET', label: 'BULLET', duration: '1 MIN', icon: '⚡' },
    { type: 'BLITZ', label: 'BLITZ', duration: '3 MIN', icon: '🔥' },
    { type: 'RAPID', label: 'RAPID', duration: '10 MIN', icon: '♟' },
    { type: 'CLASSIC', label: 'CLASSIC', duration: '15 MIN', icon: '👑' },
  ];

  const creatorRole = user.identity;
  const opponentRole = getOppositeIdentity(creatorRole);

  const handleCreate = async () => {
    if (submitting || roomLoading) return;
    setSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      const chosenControl = TIME_CONTROL_PRESETS[selectedTimeControl];
      const room = await createRoom({
        timer: `${chosenControl.initialTime / 60000} Minutes`,
        timeControl: chosenControl,
        truthOrDare,
      });
      onCreated(room);
    } catch (err: any) {
      console.error('[CreateRoom Error]', {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      setLocalError(err.message || 'Unable to create the room. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display">Create Your Game</h1>
        <p className="text-[var(--text-muted)]">Configure your private two-player room.</p>
      </div>

      {(localError || roomError) && (
        <div className="mb-6 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center gap-2 text-xs text-[var(--accent)]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError || roomError}</span>
        </div>
      )}

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
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                  You
                </span>
                <span className="text-sm font-semibold truncate text-[var(--text)]">
                  {user.displayName || 'You'}
                </span>
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
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                  Opponent
                </span>
                <span className="text-sm font-medium truncate text-[var(--text-muted)] italic">
                  Waiting...
                </span>
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
            Every match pairs exactly one King and one Queen. Opponent will be automatically assigned{' '}
            <strong className="text-[var(--text)]">{opponentRole}</strong>.
          </p>
        </div>

        {/* Game Mode */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">
            Game Mode
          </label>
          <Card active className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Classic Chess</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Standard rules with royal quiet luxury atmosphere.
              </p>
            </div>
          </Card>
        </div>

        {/* Truth or Dare Toggle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest">
              Post-Game Challenge
            </label>
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border transition-colors ${
                truthOrDare
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-[var(--surface-light)] border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              {truthOrDare ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setTruthOrDare(!truthOrDare)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setTruthOrDare(!truthOrDare);
              }
            }}
            className={`
              p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none
              ${
                truthOrDare
                  ? 'bg-[var(--surface)] border-[var(--accent)]/60 shadow-[0_0_15px_rgba(225,29,72,0.12)]'
                  : 'bg-[var(--surface)]/50 border-[var(--border)] opacity-75 hover:opacity-100'
              }
            `}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                  truthOrDare
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-[var(--surface-light)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                <Heart className={`w-5 h-5 ${truthOrDare ? 'fill-rose-500/30' : ''}`} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[var(--text)]">Truth or Dare</h3>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      truthOrDare
                        ? 'bg-rose-950 text-rose-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {truthOrDare ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {truthOrDare
                    ? 'Intimate post-match challenges enabled after game.'
                    : 'Turned off. Play pure classic chess only.'}
                </p>
              </div>
            </div>

            {/* Interactive Switch Element */}
            <button
              type="button"
              role="switch"
              aria-checked={truthOrDare}
              aria-label="Toggle Truth or Dare challenges"
              onClick={(e) => {
                e.stopPropagation();
                setTruthOrDare(!truthOrDare);
              }}
              className={`w-13 h-7 rounded-full p-1 transition-colors flex-shrink-0 relative focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                truthOrDare ? 'bg-rose-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                  truthOrDare ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Time Control Selection */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-[var(--primary)]" />
              Time Control
            </label>
            <span className="text-[10px] text-[var(--primary)] font-semibold tracking-wider uppercase">
              Select Battle Time
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {timeControlOptions.map((option) => {
              const isSelected = selectedTimeControl === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setSelectedTimeControl(option.type)}
                  className={`
                    relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 text-center
                    ${
                      isSelected
                        ? 'bg-[var(--surface-light)] border-[var(--primary)] shadow-[0_0_20px_rgba(184,155,94,0.18)] ring-1 ring-[var(--primary)]/40 text-[var(--text)]'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40'
                    }
                  `}
                >
                  <span className="text-lg mb-1">{option.icon}</span>
                  <span className={`text-xs font-bold tracking-wider uppercase ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                    {option.label}
                  </span>
                  <span className="text-[11px] font-mono font-medium opacity-80 mt-0.5">
                    {option.duration}
                  </span>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-8 pb-4">
        <Button
          onClick={handleCreate}
          disabled={submitting || roomLoading}
          className="w-full h-14 font-semibold tracking-wider flex items-center justify-center gap-2"
        >
          {submitting || roomLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span>CREATING ROYAL ROOM...</span>
            </>
          ) : (
            'CREATE ROOM'
          )}
        </Button>
        <button
          onClick={onBack}
          disabled={submitting || roomLoading}
          className="text-[var(--text-muted)] text-sm font-medium py-2 hover:text-[var(--text)] transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};
