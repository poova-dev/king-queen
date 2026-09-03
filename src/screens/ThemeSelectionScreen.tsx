import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { Button } from '../components/UI';
import { ThemeCard } from '../components/ThemeCard';
import { Theme } from '../themes/themes';
import { useTheme } from '../hooks/useTheme';

interface ThemeSelectionScreenProps {
  onSelect: (theme: Theme) => void;
  currentTheme?: Theme;
  onBack?: () => void;
  isInitialSetup?: boolean;
}

export const ThemeSelectionScreen = ({ 
  onSelect, 
  onBack,
  isInitialSetup = false 
}: ThemeSelectionScreenProps) => {
  const { theme: activeTheme, setTheme, allThemes } = useTheme();

  // Instant preview & application on tap
  const handleSelectTheme = (theme: Theme) => {
    setTheme(theme);
  };

  const handleApply = () => {
    onSelect(activeTheme);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 transition-colors duration-500 bg-[var(--background)]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-light)] border border-[var(--border)] text-xs text-[var(--primary)] font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active: {activeTheme.name}</span>
        </div>

        <div className="w-10" />
      </div>

      {/* Screen Title & Subtitle */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display tracking-tight text-[var(--text)]">
          Appearance
        </h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Choose your atmosphere.
        </p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 pb-36">
        {allThemes.map((item) => (
          <div key={item.id}>
            <ThemeCard
              theme={item}
              isSelected={activeTheme.id === item.id}
              onSelect={handleSelectTheme}
            />
          </div>
        ))}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/90 to-transparent pt-12 backdrop-blur-[2px] z-40">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <Button 
            onClick={handleApply}
            className="w-full h-14 text-sm font-semibold tracking-wider flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isInitialSetup ? 'CONTINUE TO GAME' : 'APPLY THEME'}
          </Button>
          <p className="text-[11px] text-center text-[var(--text-muted)]">
            Themes apply instantly and are saved across all devices & sessions.
          </p>
        </div>
      </div>
    </div>
  );
};
