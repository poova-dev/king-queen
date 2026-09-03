import { useState } from 'react';
import { Screen, UserProfile, GameRoom, getOppositeIdentity } from './types';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { EntryScreen } from './screens/EntryScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { ThemeSelectionScreen } from './screens/ThemeSelectionScreen';
import { HomeDashboard } from './screens/HomeDashboard';
import { ProfileScreen } from './screens/ProfileScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { WaitingRoomScreen } from './screens/WaitingRoomScreen';
import { GamePreviewScreen } from './screens/GamePreviewScreen';
import { ChessGameScreen } from './screens/ChessGameScreen';
import { ScreenTransition } from './components/UI';
import { BottomNavigation } from './components/BottomNavigation';
import { ThemeProvider } from './context/ThemeContext';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  // Track previous screen to return gracefully from ThemeSelectionScreen
  const [previousScreen, setPreviousScreen] = useState<Screen>('HOME');

  const handleProfileComplete = (profile: UserProfile) => {
    setUser(profile);
    setPreviousScreen('PROFILE');
    setCurrentScreen('THEME_SELECTION');
  };

  const handleThemeSelect = () => {
    // If coming from initial onboarding flow (no profile viewed yet), go to HOME
    if (previousScreen === 'PROFILE_SETUP') {
      setActiveTab('home');
      setCurrentScreen('HOME');
    } else {
      setCurrentScreen(previousScreen || 'HOME');
    }
  };

  const navigateToAppearance = (from: Screen = 'PROFILE') => {
    setPreviousScreen(from);
    setCurrentScreen('THEME_SELECTION');
  };

  const handleCreateRoom = (settings: { code: string; timer: string; truthOrDare: boolean }) => {
    if (!user) return;
    const creatorRole = user.identity;
    const opponentRole = getOppositeIdentity(creatorRole);

    const newRoom: GameRoom = {
      code: settings.code,
      creator: user,
      creatorRole: creatorRole,
      opponentRole: opponentRole, // Enforce Opposite Identity!
      timer: settings.timer,
      truthOrDare: settings.truthOrDare,
      creatorChessSide: 'WHITE',
      opponentChessSide: 'BLACK',
    };

    setActiveRoom(newRoom);
    setCurrentScreen('WAITING_ROOM');
  };

  const handleJoinRoom = (code: string) => {
    if (!user) return;
    // When joining, the other player is the room creator and you take the opposite role
    const opponentRole = getOppositeIdentity(user.identity);

    const joinedRoom: GameRoom = {
      code,
      creator: user,
      creatorRole: user.identity,
      opponentRole: opponentRole,
      timer: 'No Timer',
      truthOrDare: true,
      creatorChessSide: 'WHITE',
      opponentChessSide: 'BLACK',
    };

    setActiveRoom(joinedRoom);
    setCurrentScreen('WAITING_ROOM');
  };

  const showNav = ['HOME', 'PROFILE'].includes(currentScreen);

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
          onBack={() => setCurrentScreen(previousScreen || 'HOME')}
          isInitialSetup={previousScreen === 'PROFILE_SETUP'}
        />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'HOME'}>
        {user && (
          <HomeDashboard 
            user={user} 
            onCreateRoom={() => setCurrentScreen('CREATE_ROOM')}
            onJoinRoom={() => setCurrentScreen('JOIN_ROOM')}
            onSettings={() => navigateToAppearance('HOME')}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'PROFILE'}>
        {user && (
          <ProfileScreen
            user={user}
            onNavigateToAppearance={() => navigateToAppearance('PROFILE')}
            onEditProfile={() => setCurrentScreen('PROFILE_SETUP')}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('HOME');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'CREATE_ROOM'}>
        {user && (
          <CreateRoomScreen 
            user={user}
            onBack={() => setCurrentScreen('HOME')}
            onCreated={handleCreateRoom}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'JOIN_ROOM'}>
        {user && (
          <JoinRoomScreen 
            user={user}
            onBack={() => setCurrentScreen('HOME')}
            onJoin={handleJoinRoom}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'WAITING_ROOM'}>
        {user && activeRoom && (
          <WaitingRoomScreen 
            user={user}
            room={activeRoom}
            onCancel={() => {
              setActiveRoom(null);
              setCurrentScreen('HOME');
            }}
            onStart={(updatedRoom) => {
              setActiveRoom(updatedRoom);
              setCurrentScreen('CHESS_GAME');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'GAME_PREVIEW'}>
        {user && (
          <GamePreviewScreen 
            user={user}
            room={activeRoom}
            onEnterGame={() => setCurrentScreen('CHESS_GAME')}
            onExit={() => {
              setActiveRoom(null);
              setCurrentScreen('HOME');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'CHESS_GAME'}>
        {user && (
          <ChessGameScreen 
            user={user}
            room={activeRoom}
            onExit={() => {
              setActiveRoom(null);
              setCurrentScreen('HOME');
            }}
          />
        )}
      </ScreenTransition>

      {showNav && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'profile') {
              setCurrentScreen('PROFILE');
            } else if (tab === 'home') {
              setCurrentScreen('HOME');
            }
          }} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
