import React from 'react';
import { ScrollText, SlidersHorizontal, Flag, Handshake, Volume2, VolumeX } from 'lucide-react';

interface GameActionsProps {
  onOpenHistory: () => void;
  onOpenReactions: () => void;
  onOpenOptions: () => void;
  onOfferDraw?: () => void;
  isDrawDisabled?: boolean;
  onResign?: () => void;
  isResignDisabled?: boolean;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onOpenHistory,
  onOpenReactions,
  onOpenOptions,
  onOfferDraw,
  isDrawDisabled = false,
  onResign,
  isResignDisabled = false,
  isSoundEnabled = true,
  onToggleSound,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 px-1 sm:px-2">
      {/* Move History Button */}
      <button
        onClick={onOpenHistory}
        className="flex-1 py-2 px-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
        title="View Move History"
      >
        <ScrollText className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span className="hidden xs:inline">Moves</span>
      </button>

      {/* Offer Draw Button */}
      {onOfferDraw && (
        <button
          onClick={onOfferDraw}
          disabled={isDrawDisabled}
          className="flex-1 py-2 px-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Offer Draw to Opponent"
        >
          <Handshake className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="hidden xs:inline">Draw</span>
        </button>
      )}

      {/* Resign Button */}
      {onResign && (
        <button
          onClick={onResign}
          disabled={isResignDisabled}
          className="flex-1 py-2 px-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Surrender this match"
        >
          <Flag className="w-3.5 h-3.5 text-red-400/80" />
          <span className="hidden xs:inline">Resign</span>
        </button>
      )}

      {/* Sound Toggle Button */}
      {onToggleSound && (
        <button
          onClick={onToggleSound}
          className="py-2 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
          title={isSoundEnabled ? 'Mute Battle Sounds' : 'Unmute Battle Sounds'}
          aria-label={isSoundEnabled ? 'Mute Battle Sounds' : 'Unmute Battle Sounds'}
        >
          {isSoundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>
      )}

      {/* More Options Button */}
      <button
        onClick={onOpenOptions}
        className="py-2 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
        title="More Match Options"
        aria-label="More Match Options"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
      </button>
    </div>
  );
};
