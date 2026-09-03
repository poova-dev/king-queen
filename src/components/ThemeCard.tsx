import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Theme } from '../themes/themes';

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: (theme: Theme) => void;
}

export const ThemeCard = ({ theme, isSelected, onSelect }: ThemeCardProps) => {
  const { colors } = theme;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(theme)}
      className={`
        relative rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col gap-4
        bg-[var(--surface)] border-2
        ${isSelected 
          ? 'border-[var(--primary)] shadow-[0_0_25px_rgba(184,155,94,0.18)] ring-1 ring-[var(--primary)]/30' 
          : 'border-[var(--border)] hover:border-[var(--primary)]/50'}
      `}
    >
      {/* Top row: Name, Personality, Selected Badge */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display tracking-wider text-base font-semibold text-[var(--text)]">
              {theme.name}
            </h3>
            {theme.id === 'quiet-royal' && (
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--surface-light)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] tracking-wide">
            {theme.tagline}
          </p>
        </div>

        {/* Selection Indicator */}
        <div 
          className={`
            w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
            ${isSelected 
              ? 'bg-[var(--primary)] text-[var(--background)] shadow-[0_0_12px_var(--primary)]' 
              : 'border border-[var(--border)] bg-[var(--surface-light)]/60 text-transparent'}
          `}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Visual UI Preview Mockup */}
      <div 
        className="rounded-xl p-3.5 border flex flex-col gap-2.5 overflow-hidden transition-colors"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        {/* Mock Header */}
        <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
              style={{ backgroundColor: colors.surfaceLight, color: colors.primary }}
            >
              ♔
            </div>
            <div 
              className="w-16 h-2 rounded-full" 
              style={{ backgroundColor: colors.text, opacity: 0.8 }} 
            />
          </div>
          <div 
            className="w-8 h-2 rounded-full" 
            style={{ backgroundColor: colors.primary, opacity: 0.9 }} 
          />
        </div>

        {/* Mock Card Content with Chessboard feel */}
        <div 
          className="rounded-lg p-2.5 flex items-center justify-between border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Mini 2x2 chess grid */}
          <div 
            className="w-9 h-9 rounded grid grid-cols-2 grid-rows-2 overflow-hidden border flex-shrink-0"
            style={{ borderColor: colors.boardBorder }}
          >
            <div style={{ backgroundColor: colors.boardDark }} />
            <div style={{ backgroundColor: colors.boardLight }} />
            <div style={{ backgroundColor: colors.boardLight }} />
            <div style={{ backgroundColor: colors.boardDark }} />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 px-3">
            <div 
              className="h-2 w-3/4 rounded-full" 
              style={{ backgroundColor: colors.text, opacity: 0.9 }} 
            />
            <div 
              className="h-1.5 w-1/2 rounded-full" 
              style={{ backgroundColor: colors.textMuted, opacity: 0.6 }} 
            />
          </div>

          {/* Mini Action Button */}
          <div 
            className="px-2.5 py-1 rounded text-[9px] font-semibold tracking-wider flex-shrink-0"
            style={{
              backgroundColor: colors.primary,
              color: colors.background,
            }}
          >
            PLAY
          </div>
        </div>

        {/* Mock secondary action */}
        <div className="flex gap-2">
          <div 
            className="flex-1 h-2 rounded-full" 
            style={{ backgroundColor: colors.surfaceLight }} 
          />
          <div 
            className="w-1/4 h-2 rounded-full" 
            style={{ backgroundColor: colors.secondaryAccent, opacity: 0.7 }} 
          />
        </div>
      </div>

      {/* Theme Color Palette Preview */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">
          Palette
        </span>
        <div className="flex items-center gap-1.5">
          <div 
            title={`Background: ${colors.background}`}
            className="w-5 h-5 rounded-full border border-white/10 shadow-sm" 
            style={{ backgroundColor: colors.background }} 
          />
          <div 
            title={`Surface: ${colors.surface}`}
            className="w-5 h-5 rounded-full border border-white/10 shadow-sm" 
            style={{ backgroundColor: colors.surface }} 
          />
          <div 
            title={`Primary: ${colors.primary}`}
            className="w-5 h-5 rounded-full border border-white/10 shadow-sm ring-1 ring-black/20" 
            style={{ backgroundColor: colors.primary }} 
          />
          <div 
            title={`Secondary Accent: ${colors.secondaryAccent}`}
            className="w-5 h-5 rounded-full border border-white/10 shadow-sm" 
            style={{ backgroundColor: colors.secondaryAccent }} 
          />
          {colors.highlightAccent && (
            <div 
              title={`Highlight: ${colors.highlightAccent}`}
              className="w-5 h-5 rounded-full border border-white/10 shadow-sm" 
              style={{ backgroundColor: colors.highlightAccent }} 
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
