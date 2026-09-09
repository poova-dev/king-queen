import React, { useState } from 'react';
import { ArrowLeft, Plus, LogIn, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { UserProfile } from '../types';
import { useTruthDareRoom } from '../hooks/useTruthDareRoom';

interface TruthDareRoomEntryScreenProps {
  user: UserProfile;
  onBack: () => void;
  onCreateSuccess: () => void;
  onNavigateToJoin: () => void;
}

export const TruthDareRoomEntryScreen: React.FC<TruthDareRoomEntryScreenProps> = ({
  user,
  onBack,
  onCreateSuccess,
  onNavigateToJoin,
}) => {
  const { createRoom, loading, error, clearError } = useTruthDareRoom();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    clearError();
    setIsCreating(true);
    try {
      await createRoom();
      onCreateSuccess();
    } catch (err) {
      console.error('[TruthDareRoomEntry] Create failed', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/40">
        <button
          onClick={onBack}
          disabled={isCreating || loading}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors disabled:opacity-40"
          aria-label="Back to Truth or Dare Intro"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase">
              MULTIPLAYER
            </span>
          </div>
          <h1 className="text-sm font-display tracking-widest uppercase text-[var(--text)]">
            PRIVATE ROOM
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
        <div className="flex flex-col gap-6">
          {/* TITLE & DESCRIPTION */}
          <div className="flex flex-col gap-2 text-center">
            <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase">
              TWO PLAYERS • PRIVATE SESSION
            </span>
            <h2 className="text-2xl font-display tracking-wide text-[var(--text)] uppercase">
              CHOOSE YOUR PATH
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Create a secret room for your partner or join an invitation.
            </p>
          </div>

          {/* ERROR NOTIFICATION BANNER */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs shadow-md">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* CHOICE 1: CREATE PRIVATE ROOM */}
          <Card
            onClick={!isCreating && !loading ? handleCreate : undefined}
            className="relative overflow-hidden group bg-gradient-to-b from-[#160E15] to-[var(--surface)] border border-rose-900/40 hover:border-rose-600/70 transition-all p-6 flex flex-col gap-4 shadow-sm"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-300">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[var(--primary)] uppercase">
                HOST
              </span>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
              <h3 className="text-lg font-display tracking-wide text-rose-100 uppercase">
                CREATE PRIVATE ROOM
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Generate a unique room code and wait for your partner to join.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={isCreating || loading}
              className="relative z-10 w-full h-12 text-xs font-display tracking-widest uppercase mt-1 bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border border-rose-500/50 text-rose-100"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CREATING ROOM...</span>
                </div>
              ) : (
                'CREATE ROOM'
              )}
            </Button>

            {/* Subtle background watermark */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-3 -translate-y-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform select-none text-rose-400">
              <span className="text-8xl">👑</span>
            </div>
          </Card>

          {/* CHOICE 2: JOIN PARTNER */}
          <Card
            onClick={!isCreating && !loading ? onNavigateToJoin : undefined}
            className="relative overflow-hidden group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/60 transition-all p-6 flex flex-col gap-4 shadow-sm"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
                <LogIn className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase">
                GUEST
              </span>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
              <h3 className="text-lg font-display tracking-wide text-[var(--text)] uppercase">
                JOIN PARTNER
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Already have an invitation code? Enter your partner&apos;s secret room.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={onNavigateToJoin}
              disabled={isCreating || loading}
              className="relative z-10 w-full h-12 text-xs font-display tracking-widest uppercase mt-1"
            >
              JOIN ROOM
            </Button>

            {/* Subtle background watermark */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-3 -translate-y-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform select-none">
              <span className="text-8xl font-serif">⚡</span>
            </div>
          </Card>
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span>Private end-to-end synchronized session</span>
          </p>
        </div>
      </main>
    </div>
  );
};
