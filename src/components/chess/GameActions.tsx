import React from 'react';
import { ScrollText, Smile, SlidersHorizontal, Flag, Handshake, AlertTriangle, X } from 'lucide-react';
import { Button } from '../UI';

interface GameActionsProps {
  onOpenHistory: () => void;
  onOpenReactions: () => void;
  onOpenOptions: () => void;
  onResign?: () => void;
  isResignDisabled?: boolean;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onOpenHistory,
  onOpenReactions,
  onOpenOptions,
  onResign,
  isResignDisabled = false,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-2.5 px-2">
      {/* Move History Button */}
      <button
        onClick={onOpenHistory}
        className="flex-1 py-2.5 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
      >
        <ScrollText className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span>Moves</span>
      </button>

      {/* Quick Reaction Button */}
      <button
        onClick={onOpenReactions}
        className="flex-1 py-2.5 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
      >
        <Smile className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span>React</span>
      </button>

      {/* Resign Button */}
      {onResign && (
        <button
          onClick={onResign}
          disabled={isResignDisabled}
          className="flex-1 py-2.5 px-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Surrender this battle"
        >
          <Flag className="w-3.5 h-3.5 text-red-400/80" />
          <span>Resign</span>
        </button>
      )}

      {/* Game Options Button */}
      <button
        onClick={onOpenOptions}
        className="flex-1 py-2.5 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span>Options</span>
      </button>
    </div>
  );
};
