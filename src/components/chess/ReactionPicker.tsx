import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Flame, ThumbsUp, Laugh, Sparkles, SmilePlus } from 'lucide-react';

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReaction: (emoji: string) => void;
}

const REACTIONS = [
  { emoji: '😂', label: 'Laugh', ariaLabel: 'Send laughing reaction' },
  { emoji: '❤️', label: 'Love', ariaLabel: 'Send love reaction' },
  { emoji: '🔥', label: 'Fire', ariaLabel: 'Send fire reaction' },
  { emoji: '😈', label: 'Cheeky', ariaLabel: 'Send devilish reaction' },
  { emoji: '👏', label: 'Bravo', ariaLabel: 'Send clapping reaction' },
  { emoji: '😮', label: 'Wow', ariaLabel: 'Send surprised reaction' },
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSendReaction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--primary)]/40 shadow-2xl flex items-center gap-2 max-w-xs overflow-x-auto"
      >
        {REACTIONS.map((r) => (
          <button
            key={r.emoji}
            aria-label={r.ariaLabel}
            onClick={() => {
              onSendReaction(r.emoji);
              onClose();
            }}
            className="w-11 h-11 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--primary)] flex items-center justify-center text-xl transition-all hover:scale-115 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            title={r.label}
          >
            {r.emoji}
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export interface FloatingReaction {
  id: number | string;
  emoji: string;
  x?: number;
}

export const FloatingReactionsContainer: React.FC<{ reactions: FloatingReaction[] }> = ({
  reactions,
}) => {
  // Cap visible reactions to 4 to prevent overlapping clutter
  const visibleReactions = reactions.slice(-4);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {visibleReactions.map((r, index) => {
          // Staggered horizontal offset for multiple concurrent reactions
          const offsetX = r.x ?? (40 + (index % 4) * 7);

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: '65vh', scale: 0.6, x: `${offsetX}%` }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: '22vh',
                scale: [0.6, 1.25, 1.1, 0.9],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.6,
                times: [0, 0.15, 0.75, 1],
                ease: 'easeOut',
              }}
              className="absolute text-4xl sm:text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] select-none motion-reduce:transition-none motion-reduce:animate-none"
            >
              {r.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
