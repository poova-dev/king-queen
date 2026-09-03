import { useState } from 'react';
import { motion } from 'motion/react';
import { Button, Card } from '../components/UI';
import { Theme, THEMES } from '../types';

interface ThemeSelectionScreenProps {
  onSelect: (theme: Theme) => void;
  currentTheme: Theme;
}

export const ThemeSelectionScreen = ({ onSelect, currentTheme }: ThemeSelectionScreenProps) => {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme);

  const handlePreview = (theme: Theme) => {
    setSelectedTheme(theme);
    // Apply preview colors to root temporarily
    const root = document.documentElement;
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--surface-light', theme.surfaceLight);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-dark', theme.accentDark);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--border', theme.border);
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 transition-colors duration-700 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl font-display">Choose Your Atmosphere</h1>
        <p className="text-[var(--text-muted)]">Your game. Your visual world.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 pb-32">
        {THEMES.map((theme) => (
          <div key={theme.id}>
            <Card
              active={selectedTheme.id === theme.id}
              onClick={() => handlePreview(theme)}
              className="flex flex-col gap-3 p-5 overflow-hidden group"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h3 className="font-display tracking-wider text-sm">{theme.name}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{theme.tagline}</p>
                </div>
                {selectedTheme.id === theme.id && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]" 
                  />
                )}
              </div>
              
              {/* Theme Visual Preview */}
              <div className="h-24 rounded-lg flex gap-2 p-2 overflow-hidden bg-[var(--surface-light)] border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors">
                <div className="w-1/3 rounded bg-[var(--background)] border border-[var(--border)]" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-1/2 w-full rounded bg-[var(--surface)] border border-[var(--border)]" />
                  <div className="flex gap-2 h-1/3">
                    <div className="flex-1 rounded bg-[var(--primary)] opacity-80" />
                    <div className="flex-1 rounded bg-[var(--accent)] opacity-80" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-12">
        <Button 
          onClick={() => onSelect(selectedTheme)}
          className="w-full h-16"
        >
          APPLY THEME
        </Button>
      </div>
    </div>
  );
};
