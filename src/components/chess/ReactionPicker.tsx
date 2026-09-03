import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Flame, ThumbsUp, Laugh, Sparkles } from 'lucide-react';

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReaction: (emoji: string) => void;
}

const REACTIONS = [
  { emoji: '❤️', label: 'Heart', icon: Heart, color: 'text-rose-400' },
  { emoji: '🔥', label: 'Fire', icon: Flame, color: 'text-amber-400' },
  { emoji: '👏', label: 'Bravo', icon: ThumbsUp, color: 'text-blue-400' },
  { emoji: '😂', label: 'Laugh', icon: Laugh, color: 'text-yellow-400' },
  { emoji: '✨', label: 'Brilliant', icon: Sparkles, color: 'text-purple-400' },
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSendReaction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="relative z-10 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex items-center gap-2"
      >
        {REACTIONS.map((r) => (
          <button
            key={r.label}
            onClick={() => {
              onSendReaction(r.emoji);
              onClose();
            }}
            className="w-11 h-11 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] hover:border-[var(--primary)] flex items-center justify-center text-xl transition-all hover:scale-115 active:scale-95"
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
  id: number;
  emoji: string;
  x: number;
}

export const FloatingReactionsContainer: React.FC<{ reactions: FloatingReaction[] }> = ({
  reactions,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: '70vh', scale: 0.5, x: `${r.x}%` }}
            animate={{ opacity: [0, 1, 1, 0], y: '25vh', scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            className="absolute text-4xl filter drop-shadow-lg"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
