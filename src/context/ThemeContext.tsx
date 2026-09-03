import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeId, THEMES, DEFAULT_THEME_ID, getThemeById } from '../themes/themes';

const STORAGE_KEY = 'kq_user_theme';

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (theme: Theme | ThemeId) => void;
  allThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setCurrentThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return getThemeById(saved);
      }
    } catch {
      // Ignore localStorage access errors (e.g. private browsing)
    }
    return getThemeById(DEFAULT_THEME_ID);
  });

  // Apply theme variables to root document
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = theme;

    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--surface', colors.surface);
    root.style.setProperty('--surface-light', colors.surfaceLight);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-light', colors.primaryLight);
    root.style.setProperty('--accent', colors.secondaryAccent);
    root.style.setProperty('--secondary-accent', colors.secondaryAccent);
    root.style.setProperty('--highlight-accent', colors.highlightAccent || colors.primary);
    root.style.setProperty('--accent-dark', theme.accentDark || colors.secondaryAccent);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--border', colors.border);

    // Chess board styling variables
    root.style.setProperty('--board-light', colors.boardLight);
    root.style.setProperty('--board-dark', colors.boardDark);
    root.style.setProperty('--board-border', colors.boardBorder);
    root.style.setProperty('--board-highlight', colors.boardHighlight);

    // Data theme attribute for scoping if needed
    root.setAttribute('data-theme', theme.id);
  }, [theme]);

  const setTheme = (selected: Theme | ThemeId) => {
    const newTheme = typeof selected === 'string' ? getThemeById(selected) : selected;
    setCurrentThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme.id);
    } catch {
      // Storage unavailable or quota exceeded
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId: theme.id,
        setTheme,
        allThemes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
