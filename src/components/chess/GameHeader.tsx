import React from 'react';
import { ArrowLeft, MoreHorizontal, ShieldCheck } from 'lucide-react';

interface GameHeaderProps {
  onBack: () => void;
  onOpenMenu: () => void;
  roomCode?: string;
  connectionStatus?: 'connected' | 'reconnecting' | 'offline';
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  onBack,
  onOpenMenu,
  roomCode = 'KQ-8472',
  connectionStatus = 'connected',
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-30">
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
        aria-label="Back to Lobby"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Center: Private Match Header + Code */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase">
            PRIVATE MATCH
          </span>
        </div>
        <span className="text-xs font-mono font-semibold tracking-widest text-[var(--primary)]">
          {roomCode}
        </span>
      </div>

      {/* Menu button */}
      <button
        onClick={onOpenMenu}
        className="w-9 h-9 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
        aria-label="Game Options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </header>
  );
};
