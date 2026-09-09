import React, { useState } from 'react';
import { ArrowLeft, KeyRound, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/UI';
import { UserProfile } from '../types';
import { useTruthDareRoom } from '../hooks/useTruthDareRoom';
import { validateTruthDareRoomCode, normalizeTruthDareRoomCode } from '../services/truthDareRoomService';

interface TruthDareJoinRoomScreenProps {
  user: UserProfile;
  onBack: () => void;
  onJoinSuccess: () => void;
}

export const TruthDareJoinRoomScreen: React.FC<TruthDareJoinRoomScreenProps> = ({
  user,
  onBack,
  onJoinSuccess,
}) => {
  const { joinRoom, loading, error, clearError } = useTruthDareRoom();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setLocalError(null);
    let val = e.target.value.toUpperCase().replace(/\s+/g, '');
    if (val && !val.startsWith('TD-')) {
      if (val.startsWith('TD')) {
        val = 'TD-' + val.slice(2);
      } else {
        val = 'TD-' + val;
      }
    }
    setCode(val);
  };

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearError();
    setLocalError(null);

    const normalized = normalizeTruthDareRoomCode(code);
    if (!validateTruthDareRoomCode(normalized)) {
      setLocalError('Please enter a valid room code (e.g. TD-A7K9)');
      return;
    }

    try {
      await joinRoom(normalized);
      onJoinSuccess();
    } catch (err) {
      console.error('[TruthDareJoin] Join failed:', err);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/40">
        <button
          onClick={onBack}
          disabled={loading}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors disabled:opacity-40"
          aria-label="Back to Room Entry"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase">
            INVITATION
          </span>
          <h1 className="text-sm font-display tracking-widest uppercase text-[var(--text)]">
            JOIN ROOM
          </h1>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="King & Queen"
            className="w-7 h-7 object-contain opacity-70 filter drop-shadow-[0_1px_8px_rgba(184,155,94,0.3)]"
          />
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-between gap-6">
        <form onSubmit={handleJoin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase">
              SECRET ACCESS
            </span>
            <h2 className="text-2xl font-display tracking-wide text-[var(--text)] uppercase">
              JOIN YOUR PARTNER 😈
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Enter the secret room code shared by your partner.
            </p>
          </div>

          {/* ERROR BANNER */}
          {displayError && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs shadow-md animate-in fade-in zoom-in-95 duration-150">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1">{displayError}</span>
            </div>
          )}

          {/* CODE INPUT CONTAINER */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="tdRoomCodeInput"
              className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase pl-1"
            >
              Room Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                <KeyRound className="w-5 h-5 text-rose-400/70" />
              </div>
              <input
                id="tdRoomCodeInput"
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="TD-A7K9"
                maxLength={8}
                autoFocus
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] focus:border-rose-500/70 focus:ring-2 focus:ring-rose-500/20 text-center text-xl font-mono tracking-[0.2em] uppercase font-bold text-[var(--text)] placeholder:text-[var(--text-muted)]/40 outline-none transition-all"
              />
            </div>
            <span className="text-[10px] text-center text-[var(--text-muted)]">
              Example format: <strong className="font-mono text-[var(--text)]">TD-XXXX</strong>
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            variant="primary"
            disabled={loading || code.trim().length < 5}
            className="w-full h-14 text-xs font-display tracking-widest uppercase bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border border-rose-500/50 text-rose-100 shadow-[0_0_25px_rgba(225,29,72,0.25)] hover:shadow-[0_0_35px_rgba(225,29,72,0.35)]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>JOINING ROOM...</span>
              </div>
            ) : (
              'JOIN ROOM'
            )}
          </Button>
        </form>

        <div className="text-center pb-4">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span>Only two players can enter this chamber</span>
          </p>
        </div>
      </main>
    </div>
  );
};
