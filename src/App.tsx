import { useState, useEffect } from 'react';
import { Screen, UserProfile, GameRoom, getOppositeIdentity, roomDocumentToGameRoom } from './types';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { ThemeSelectionScreen } from './screens/ThemeSelectionScreen';
import { HomeDashboard } from './screens/HomeDashboard';
import { ProfileScreen } from './screens/ProfileScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { WaitingRoomScreen } from './screens/WaitingRoomScreen';
import { GamePreviewScreen } from './screens/GamePreviewScreen';
import { ChessGameScreen } from './screens/ChessGameScreen';
import { GameHistoryScreen } from './screens/GameHistoryScreen';
import { AuthPage } from './pages/AuthPage';
import { ScreenTransition } from './components/UI';
import { BottomNavigation } from './components/BottomNavigation';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { RoomProvider } from './context/RoomContext';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useRoom } from './hooks/useRoom';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { userProfile, loading: profileLoading, profileExists } = useProfile();
  const { currentRoom, isInRoom, leaveRoom } = useRoom();

  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('HOME');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Route Protection & State Synchronization
  useEffect(() => {
    // Wait until both Auth and initial Profile checks complete to prevent UI flickering
    if (authLoading || (isAuthenticated && profileLoading)) {
      return;
    }

    const protectedScreens: Screen[] = [
      'HOME',
      'PROFILE',
      'CREATE_ROOM',
      'JOIN_ROOM',
      'WAITING_ROOM',
      'GAME_PREVIEW',
      'CHESS_GAME',
      'GAME_HISTORY',
    ];

    // 1. Unauthenticated users cannot access protected screens or profile setup
    if (!isAuthenticated) {
      if (protectedScreens.includes(currentScreen) || currentScreen === 'PROFILE_SETUP') {
        setCurrentScreen('AUTH');
      }
      return;
    }

    // 2. Authenticated users without a Firestore profile MUST complete Profile Setup
    if (isAuthenticated && !profileExists) {
      if (currentScreen !== 'PROFILE_SETUP' && currentScreen !== 'SPLASH') {
        setCurrentScreen('PROFILE_SETUP');
      }
      return;
    }

    // 3. Authenticated returning users with an existing profile advance past Auth/Setup
    if (isAuthenticated && profileExists) {
      if (
        currentScreen === 'AUTH' ||
        currentScreen === 'ENTRY' ||
        (!isEditingProfile && currentScreen === 'PROFILE_SETUP')
      ) {
        setCurrentScreen('HOME');
      }
    }
  }, [
    isAuthenticated,
    authLoading,
    profileLoading,
    profileExists,
    currentScreen,
    isEditingProfile,
  ]);

  // Active Room Lifecycle Synchronization (handles page refresh & real-time room phase changes)
  // Strict rule: Only actively ongoing PLAYING games route to CHESS_GAME. Finished/completed rooms do not.
  useEffect(() => {
    if (!isAuthenticated || !profileExists || !currentRoom) return;

    if (currentRoom.status === 'PLAYING') {
      if (currentScreen !== 'CHESS_GAME') {
        setCurrentScreen('CHESS_GAME');
      }
    } else if (
      ['WAITING', 'COIN_TOSS', 'COLOR_SELECTION', 'READY'].includes(currentRoom.status)
    ) {
      if (['SPLASH', 'HOME', 'CREATE_ROOM', 'JOIN_ROOM'].includes(currentScreen)) {
        setCurrentScreen('WAITING_ROOM');
      }
    } else if (
      currentRoom.status === 'CANCELLED' ||
      currentRoom.status === 'CLOSED'
    ) {
      if (currentScreen === 'WAITING_ROOM' || currentScreen === 'CHESS_GAME') {
        setCurrentScreen('HOME');
      }
    }
  }, [currentRoom?.status, currentRoom, isAuthenticated, profileExists, currentScreen]);

  const handleSplashComplete = () => {
    if (isAuthenticated) {
      if (profileExists) {
        if (currentRoom && ['WAITING', 'COIN_TOSS', 'COLOR_SELECTION', 'READY'].includes(currentRoom.status)) {
          setCurrentScreen('WAITING_ROOM');
        } else if (currentRoom && currentRoom.status === 'PLAYING') {
          setCurrentScreen('CHESS_GAME');
        } else {
          setCurrentScreen('HOME');
        }
      } else {
        setCurrentScreen('PROFILE_SETUP');
      }
    } else {
      try {
        const hasSeenOnboarding = localStorage.getItem('kq_has_seen_onboarding');
        if (hasSeenOnboarding === 'true') {
          setCurrentScreen('AUTH');
          return;
        }
      } catch {
        // Storage restricted
      }
      setCurrentScreen('ONBOARDING');
    }
  };

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem('kq_has_seen_onboarding', 'true');
    } catch {
      // Storage restricted
    }
    setCurrentScreen('AUTH');
  };

  const handleAuthSuccess = () => {
    if (profileExists) {
      setCurrentScreen('HOME');
    } else {
      setCurrentScreen('PROFILE_SETUP');
    }
  };

  const handleProfileSetupComplete = () => {
    if (isEditingProfile) {
      setIsEditingProfile(false);
      setCurrentScreen('PROFILE');
    } else {
      setPreviousScreen('PROFILE_SETUP');
      setCurrentScreen('THEME_SELECTION');
    }
  };

  const handleThemeSelect = () => {
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

  const handleCreateRoom = () => {
    setCurrentScreen('WAITING_ROOM');
  };

  const handleJoinRoom = () => {
    setCurrentScreen('WAITING_ROOM');
  };

  const handleLogout = () => {
    leaveRoom();
    setActiveRoom(null);
    setIsEditingProfile(false);
    setCurrentScreen('AUTH');
  };

  // Dedicated Loading State to Prevent UI Flickering
  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-[100] overflow-hidden text-center px-6">
        <div className="dust-particles" />
        <div className="w-24 h-24 relative mb-6">
          <img
            src="/logo.png"
            alt="KING & QUEEN"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_25px_rgba(184,155,94,0.4)] animate-pulse"
          />
        </div>
        <h2 className="text-2xl font-display tracking-[0.15em] text-[#F2F0EB] uppercase mb-2">
          KING & QUEEN
        </h2>
        <div className="flex items-center gap-2.5 text-xs tracking-widest text-[var(--primary)] uppercase font-light">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          <span>{authLoading ? 'Checking your kingdom...' : 'Loading profile...'}</span>
        </div>
      </div>
    );
  }

  const showNav = ['HOME', 'PROFILE', 'GAME_HISTORY'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] font-sans relative">
      <SplashScreen 
        onComplete={handleSplashComplete} 
        isActive={currentScreen === 'SPLASH'} 
      />

      <ScreenTransition isActive={currentScreen === 'ONBOARDING'}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'AUTH' || currentScreen === 'ENTRY'}>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'PROFILE_SETUP'}>
        <ProfileSetupScreen
          isEditMode={isEditingProfile}
          onCancel={() => {
            setIsEditingProfile(false);
            setCurrentScreen('PROFILE');
          }}
          onComplete={handleProfileSetupComplete}
        />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'THEME_SELECTION'}>
        <ThemeSelectionScreen 
          onSelect={handleThemeSelect} 
          onBack={() => setCurrentScreen(previousScreen || 'HOME')}
          isInitialSetup={previousScreen === 'PROFILE_SETUP'}
        />
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'HOME'}>
        {userProfile && (
          <HomeDashboard 
            user={userProfile} 
            onCreateRoom={() => setCurrentScreen('CREATE_ROOM')}
            onJoinRoom={() => setCurrentScreen('JOIN_ROOM')}
            onSettings={() => navigateToAppearance('HOME')}
            onViewHistory={() => {
              setActiveTab('history');
              setCurrentScreen('GAME_HISTORY');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'GAME_HISTORY'}>
        {userProfile && (
          <GameHistoryScreen
            user={userProfile}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('HOME');
            }}
            onStartGame={() => {
              setActiveTab('home');
              setCurrentScreen('CREATE_ROOM');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'PROFILE'}>
        {userProfile && (
          <ProfileScreen
            user={userProfile}
            onNavigateToAppearance={() => navigateToAppearance('PROFILE')}
            onEditProfile={() => {
              setIsEditingProfile(true);
              setCurrentScreen('PROFILE_SETUP');
            }}
            onLogout={handleLogout}
            onBack={() => {
              setActiveTab('home');
              setCurrentScreen('HOME');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'CREATE_ROOM'}>
        {userProfile && (
          <CreateRoomScreen 
            user={userProfile}
            onBack={() => setCurrentScreen('HOME')}
            onCreated={handleCreateRoom}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'JOIN_ROOM'}>
        {userProfile && (
          <JoinRoomScreen 
            user={userProfile}
            onBack={() => setCurrentScreen('HOME')}
            onJoin={handleJoinRoom}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'WAITING_ROOM'}>
        {userProfile && (
          <WaitingRoomScreen 
            user={userProfile}
            room={currentRoom}
            onCancel={() => {
              setActiveRoom(null);
              setCurrentScreen('HOME');
            }}
            onStart={() => {
              setCurrentScreen('CHESS_GAME');
            }}
          />
        )}
      </ScreenTransition>

      <ScreenTransition isActive={currentScreen === 'GAME_PREVIEW'}>
        {userProfile && (
          <GamePreviewScreen 
            user={userProfile}
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
        {userProfile && (
          <ChessGameScreen 
            user={userProfile}
            room={
              currentRoom && userProfile.uid
                ? roomDocumentToGameRoom(currentRoom, userProfile.uid)
                : activeRoom
            }
            onExit={() => {
              leaveRoom();
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
            } else if (tab === 'history') {
              setCurrentScreen('GAME_HISTORY');
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
      <AuthProvider>
        <ProfileProvider>
          <RoomProvider>
            <MainApp />
          </RoomProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

