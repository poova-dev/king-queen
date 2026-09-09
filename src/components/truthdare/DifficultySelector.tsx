import React from 'react';
import { motion } from 'motion/react';
import { TruthDareDifficulty } from '../../types';

interface DifficultySelectorProps {
  selectedDifficulty: TruthDareDifficulty | null;
  onSelectDifficulty: (difficulty: TruthDareDifficulty) => void;
  disabled?: boolean;
}

interface DifficultyOption {
  id: TruthDareDifficulty;
  label: string;
  badge: string;
  icon: string;
  colorClass: string;
  activeBorderClass: string;
  activeBgClass: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'EASY',
    label: 'Easy',
    badge: '🟢',
    icon: '🟢',
    colorClass: 'text-emerald-400',
    activeBorderClass: 'border-emerald-400',
    activeBgClass: 'bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
  },
  {
    id: 'MEDIUM',
    label: 'Medium',
    badge: '🟡',
    icon: '🟡',
    colorClass: 'text-amber-400',
    activeBorderClass: 'border-amber-400',
    activeBgClass: 'bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
  },
  {
    id: 'HARD',
    label: 'Hard',
    badge: '🔴',
    icon: '🔴',
    colorClass: 'text-rose-400',
    activeBorderClass: 'border-rose-400',
    activeBgClass: 'bg-rose-500/15 shadow-[0_0_12px_rgba(251,113,133,0.2)]',
  },
  {
    id: 'EXTREME',
    label: 'Extreme',
    badge: '👑',
    icon: '👑',
    colorClass: 'text-[var(--primary)]',
    activeBorderClass: 'border-[var(--primary)]',
    activeBgClass: 'bg-[var(--primary)]/15 shadow-[0_0_12px_rgba(212,175,55,0.25)]',
  },
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onSelectDifficulty,
  disabled = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label
          id="difficulty-selector-label"
          className="text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase"
        >
          Select Difficulty
        </label>
        <span className="text-[10px] text-[var(--primary)] font-medium uppercase tracking-wider">
          {selectedDifficulty || 'Optional'}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="difficulty-selector-label"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {DIFFICULTY_OPTIONS.map((opt) => {
          const isSelected = selectedDifficulty === opt.id;

          return (
            <motion.button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Difficulty level: ${opt.label}`}
              disabled={disabled}
              onClick={() => onSelectDifficulty(opt.id)}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.96 }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold tracking-wider uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                isSelected
                  ? `${opt.activeBgClass} ${opt.activeBorderClass} ${opt.colorClass}`
                  : 'bg-[var(--surface)]/70 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]/50 hover:text-[var(--text)]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span aria-hidden="true" className="text-xs">
                {opt.badge}
              </span>
              <span className="font-display">{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
