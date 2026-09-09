import React from 'react';
import { motion } from 'motion/react';
import {
  TruthDareMode,
  TruthDareCategory,
  TruthDareCategoryDefinition,
} from '../../types';
import { getCategoryDefinitions } from '../../lib/truthDareCards';

interface CategorySelectorProps {
  mode: TruthDareMode;
  selectedCategory: TruthDareCategory | null;
  onSelectCategory: (category: TruthDareCategory) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  mode,
  selectedCategory,
  onSelectCategory,
  disabled = false,
}) => {
  const categories = getCategoryDefinitions(mode);

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          id="category-selector-label"
          className="text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase"
        >
          Select Category
        </label>
        <span className="text-[10px] text-[var(--primary)] font-medium uppercase tracking-wider">
          {selectedCategory ? `${selectedCategory}` : 'Required'}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="category-selector-label"
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
      >
        {categories.map((cat: TruthDareCategoryDefinition) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${cat.label} category: ${cat.description}`}
              disabled={disabled}
              onClick={() => onSelectCategory(cat.id)}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.97 }}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                isSelected
                  ? mode === 'TRUTH'
                    ? 'bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border-[var(--primary)] shadow-[0_0_15px_rgba(212,175,55,0.2)] text-[var(--primary)]'
                    : 'bg-gradient-to-br from-rose-500/20 to-rose-500/5 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)] text-rose-300'
                  : 'bg-[var(--surface)]/80 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]/50 hover:text-[var(--text)]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && (
                <div
                  className={`absolute top-0 right-0 w-2 h-2 rounded-bl-md ${
                    mode === 'TRUTH' ? 'bg-[var(--primary)]' : 'bg-rose-400'
                  }`}
                />
              )}

              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg leading-none" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="text-xs font-bold font-display tracking-wider uppercase text-[var(--text)]">
                  {cat.label}
                </span>
              </div>

              <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 leading-tight">
                {cat.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
