import React from 'react';
import { ScrollText, Smile, SlidersHorizontal, Flag, Handshake, AlertTriangle, X } from 'lucide-react';
import { Button } from '../UI';

interface GameActionsProps {
  onOpenHistory: () => void;
  onOpenReactions: () => void;
  onOpenOptions: () => void;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onOpenHistory,
  onOpenReactions,
  onOpenOptions,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-3 px-2">
      {/* Move History Button */}
      <button
        onClick={onOpenHistory}
        className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
      >
        <ScrollText className="w-4 h-4 text-[var(--primary)]" />
        <span>Moves</span>
      </button>

      {/* Quick Reaction Button */}
      <button
        onClick={onOpenReactions}
        className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
      >
        <Smile className="w-4 h-4 text-[var(--primary)]" />
        <span>React</span>
      </button>

      {/* Game Options Button */}
      <button
        onClick={onOpenOptions}
        className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all active:scale-95"
      >
        <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
        <span>Options</span>
      </button>
    </div>
  );
};
