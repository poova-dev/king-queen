import { useState, useEffect } from 'react';
import { Screen, UserProfile, Theme, THEMES } from './types';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { EntryScreen } from './screens/EntryScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { ThemeSelectionScreen } from './screens/ThemeSelectionScreen';
import { HomeDashboard } from './screens/HomeDashboard';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { WaitingRoomScreen } from './screens/WaitingRoomScreen';
import { GamePreviewScreen } from './screens/GamePreviewScreen';
import { ScreenTransition } from './components/UI';
import { BottomNavigation } from './components/BottomNavigation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Apply theme to document root
  useEffect(() => {
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
  }, [theme]);

  const handleProfileComplete = (profile: UserProfile) => {
    setUser(profile);
    setCurrentScreen('THEME_SELECTION');
  };

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setCurrentScreen('HOME');
  };

  const handleCreateRoom = (code: string) => {
    setRoomCode(code);
    setCurrentScreen('WAITING_ROOM');
  };

  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
    setCurrentScreen('WAITING_ROOM');
  };

  const showNav = ['HOME'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] font-sans relative">
      <SplashScreen 
        onComplete={() => setCurrentScreen('ONBOARDING')} 
        isActive={currentScreen === 'SPLASH'} 
      />

      <ScreenTransition isActive={currentScreen === 'ONBOARDING'}>
        <OnboardingScreen onComplete={() => setCurrentScreen('ENTRY')} />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'ENTRY'}>
        <EntryScreen onContinue={() => setCurrentScreen('PROFILE_SETUP')} />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'PROFILE_SETUP'}>
        <ProfileSetupScreen onComplete={handleProfileComplete} />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'THEME_SELECTION'}>
        <ThemeSelectionScreen 
          onSelect={handleThemeSelect} 
          currentTheme={theme} 
        />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'HOME'}>
        {user && (
          <HomeDashboard 
            user={user} 
            onCreateRoom={() => setCurrentScreen('CREATE_ROOM')}
            onJoinRoom={() => setCurrentScreen('JOIN_ROOM')}
            onSettings={() => setCurrentScreen('THEME_SELECTION')}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'CREATE_ROOM'}>
        <CreateRoomScreen 
          onBack={() => setCurrentScreen('HOME')}
          onCreated={handleCreateRoom}
        />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'JOIN_ROOM'}>
        <JoinRoomScreen 
          onBack={() => setCurrentScreen('HOME')}
          onJoin={handleJoinRoom}
        />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'WAITING_ROOM'}>
        {user && roomCode && (
          <WaitingRoomScreen 
            user={user}
            code={roomCode}
            onCancel={() => setCurrentScreen('HOME')}
            onStart={() => setCurrentScreen('GAME_PREVIEW')}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'GAME_PREVIEW'}>
        {user && (
          <GamePreviewScreen 
            user={user}
            onExit={() => setCurrentScreen('HOME')}
          />
        )}
      </ScreenTransition>

      {showNav && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'profile') setCurrentScreen('PROFILE_SETUP');
          }} 
        />
      )}
    </div>
  );
}
