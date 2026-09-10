import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { TruthDareRoom, TruthDarePlayer } from '../types';
import {
  createTruthDareRoom as apiCreateRoom,
  joinTruthDareRoom as apiJoinRoom,
  getTruthDareRoom as apiGetRoom,
  subscribeToTruthDareRoom,
  setTruthDarePlayerReady as apiSetPlayerReady,
  startTruthDareGame as apiStartGame,
  leaveTruthDareRoom as apiLeaveRoom,
  closeTruthDareRoom as apiCloseRoom,
  findActiveTruthDareRoomForUser,
  mapTruthDareRoomError,
  getStoredTruthDareRoomId,
  setStoredTruthDareRoomId,
  clearStoredTruthDareRoomId,
  selectTruthOrDare as apiSelectTruthOrDare,
  completeRound as apiCompleteRound,
} from '../services/truthDareRoomService';
import { Unsubscribe } from 'firebase/firestore';

export interface TruthDareRoomContextType {
  currentRoom: TruthDareRoom | null;
  loading: boolean;
  error: string | null;
  roomId: string | null;
  roomCode: string | null;
  isInRoom: boolean;
  isCreator: boolean;
  myPlayer: TruthDarePlayer | null;
  partnerPlayer: TruthDarePlayer | null;
  isBothReady: boolean;
  createRoom: () => Promise<TruthDareRoom>;
  joinRoom: (rawCode: string) => Promise<TruthDareRoom>;
  leaveRoom: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  closeRoom: () => Promise<void>;
  clearError: () => void;
  restoreActiveRoom: () => Promise<boolean>;
  selectTruthOrDare: (
    optionsOrMode:
      | import('../types').TruthDareMode
      | import('../services/truthDareRoomService').SelectTruthOrDareOptions
  ) => Promise<void>;
  completeRound: () => Promise<void>;
}

const TruthDareRoomContext = createContext<TruthDareRoomContextType | undefined>(undefined);

export const TruthDareRoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { userProfile } = useProfile();

  const [currentRoom, setCurrentRoom] = useState<TruthDareRoom | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const cleanupSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      if (import.meta.env?.DEV) {
        console.log('[TruthDareRoom] Cleaning up snapshot listener');
      }
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const attachSubscription = useCallback((targetRoomId: string) => {
    cleanupSubscription();

    if (import.meta.env?.DEV) {
      console.log('[TruthDareRoom] Attaching snapshot listener for room:', targetRoomId);
    }

    unsubscribeRef.current = subscribeToTruthDareRoom(
      targetRoomId,
      (updatedRoom) => {
        setCurrentRoom(updatedRoom);
      },
      (err) => {
        console.error('[TruthDareRoom] Subscription error:', err);
        setError(mapTruthDareRoomError(err));
      }
    );
  }, [cleanupSubscription]);

  // Restore active room on mount or refresh
  const restoreActiveRoom = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const storedRoomId = getStoredTruthDareRoomId();
      if (storedRoomId) {
        setLoading(true);
        const fetched = await apiGetRoom(storedRoomId);
        if (
          fetched &&
          fetched.status !== 'CLOSED' &&
          fetched.status !== 'FINISHED' &&
          fetched.players.some((p) => p.uid === user.uid)
        ) {
          if (import.meta.env?.DEV) {
            console.log('[TruthDare] Restoring stored active room:', fetched.id);
          }
          setCurrentRoom(fetched);
          attachSubscription(fetched.id);
          setLoading(false);
          return true;
        } else {
          clearStoredTruthDareRoomId();
        }
      }

      // Query active room in Firestore
      const activeRoom = await findActiveTruthDareRoomForUser(user.uid);
      if (activeRoom) {
        if (import.meta.env?.DEV) {
          console.log('[TruthDare] Discovered active room in Firestore:', activeRoom.id);
        }
        setStoredTruthDareRoomId(activeRoom.id);
        setCurrentRoom(activeRoom);
        attachSubscription(activeRoom.id);
        setLoading(false);
        return true;
      }
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('[TruthDare] Error restoring active room:', err);
      }
    } finally {
      setLoading(false);
    }

    return false;
  }, [user, attachSubscription]);

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (user?.uid) {
      if (!hasRestoredRef.current) {
        hasRestoredRef.current = true;
        restoreActiveRoom();
      }
    } else {
      hasRestoredRef.current = false;
      cleanupSubscription();
      setCurrentRoom(null);
    }
  }, [user?.uid, restoreActiveRoom, cleanupSubscription]);

  const createRoom = useCallback(async (): Promise<TruthDareRoom> => {
    if (!userProfile) {
      throw new Error('UNAUTHENTICATED');
    }

    setLoading(true);
    setError(null);

    try {
      const newRoom = await apiCreateRoom(userProfile);
      setCurrentRoom(newRoom);
      attachSubscription(newRoom.id);
      return newRoom;
    } catch (err: any) {
      const friendly = mapTruthDareRoomError(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  }, [userProfile, attachSubscription]);

  const joinRoom = useCallback(async (rawCode: string): Promise<TruthDareRoom> => {
    if (!userProfile) {
      throw new Error('UNAUTHENTICATED');
    }

    setLoading(true);
    setError(null);

    try {
      const joined = await apiJoinRoom(userProfile, rawCode);
      setCurrentRoom(joined);
      attachSubscription(joined.id);
      return joined;
    } catch (err: any) {
      const friendly = mapTruthDareRoomError(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  }, [userProfile, attachSubscription]);

  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!currentRoom || !user) return;

    const roomIdToLeave = currentRoom.id;
    cleanupSubscription();
    clearStoredTruthDareRoomId();
    setCurrentRoom(null);

    try {
      await apiLeaveRoom(roomIdToLeave, user.uid);
    } catch (err) {
      console.warn('[TruthDareRoom] Error leaving room:', err);
    }
  }, [currentRoom, user, cleanupSubscription]);

  const setReady = useCallback(async (ready: boolean): Promise<void> => {
    if (!currentRoom || !user) return;
    setError(null);

    try {
      await apiSetPlayerReady(currentRoom.id, user.uid, ready);
    } catch (err: any) {
      const friendly = mapTruthDareRoomError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, [currentRoom, user]);

  const startGame = useCallback(async (): Promise<void> => {
    if (!currentRoom || !user) return;
    setError(null);

    try {
      await apiStartGame(currentRoom.id, user.uid);
    } catch (err: any) {
      const friendly = mapTruthDareRoomError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, [currentRoom, user]);

  const closeRoom = useCallback(async (): Promise<void> => {
    if (!currentRoom) return;
    const targetId = currentRoom.id;
    cleanupSubscription();
    clearStoredTruthDareRoomId();
    setCurrentRoom(null);

    try {
      await apiCloseRoom(targetId);
    } catch (err) {
      console.warn('[TruthDare] Error closing room:', err);
    }
  }, [currentRoom, cleanupSubscription]);

  const clearError = useCallback(() => setError(null), []);

  const selectTruthOrDareAction = useCallback(
    async (
      optionsOrMode:
        | import('../types').TruthDareMode
        | import('../services/truthDareRoomService').SelectTruthOrDareOptions
    ): Promise<void> => {
      if (!currentRoom || !user) return;
      setError(null);
      try {
        await apiSelectTruthOrDare(currentRoom.id, user.uid, optionsOrMode);
      } catch (err: any) {
        const friendly = mapTruthDareRoomError(err);
        setError(friendly);
        throw new Error(friendly);
      }
    },
    [currentRoom, user]
  );

  const completeRoundAction = useCallback(async (): Promise<void> => {
    if (!currentRoom || !user) return;
    setError(null);
    try {
      await apiCompleteRound(currentRoom.id, user.uid);
    } catch (err: any) {
      const friendly = mapTruthDareRoomError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, [currentRoom, user]);

  const isInRoom = Boolean(currentRoom && currentRoom.status !== 'CLOSED');
  const isCreator = Boolean(currentRoom && user && currentRoom.createdBy === user.uid);

  const myPlayer =
    currentRoom?.players.find((p) => p.uid === user?.uid) || null;

  const partnerPlayer =
    currentRoom?.players.find((p) => p.uid !== user?.uid) || null;

  const isBothReady = Boolean(
    currentRoom &&
      currentRoom.players.length === 2 &&
      (currentRoom.status === 'READY' || currentRoom.players.every((p) => p.ready))
  );

  return (
    <TruthDareRoomContext.Provider
      value={{
        currentRoom,
        loading,
        error,
        roomId: currentRoom?.id || null,
        roomCode: currentRoom?.roomCode || null,
        isInRoom,
        isCreator,
        myPlayer,
        partnerPlayer,
        isBothReady,
        createRoom,
        joinRoom,
        leaveRoom,
        setReady,
        startGame,
        closeRoom,
        clearError,
        restoreActiveRoom,
        selectTruthOrDare: selectTruthOrDareAction,
        completeRound: completeRoundAction,
      }}
    >
      {children}
    </TruthDareRoomContext.Provider>
  );
};

export const useTruthDareRoom = (): TruthDareRoomContextType => {
  const context = useContext(TruthDareRoomContext);
  if (!context) {
    throw new Error('useTruthDareRoom must be used within a TruthDareRoomProvider');
  }
  return context;
};
