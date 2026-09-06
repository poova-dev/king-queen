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
import {
  RoomDocument,
  RoomPlayer,
  CoinTossChoice,
  ChessSide,
} from '../types';
import {
  createRoom as apiCreateRoom,
  joinRoom as apiJoinRoom,
  subscribeToRoom,
  setPartnerTossChoice as apiSetPartnerTossChoice,
  flipRoyalCoin as apiFlipRoyalCoin,
  assignChessColors as apiAssignChessColors,
  setPlayerReady as apiSetPlayerReady,
  leaveRoom as apiLeaveRoom,
  leaveCompletedGame as apiLeaveCompletedGame,
  findActiveRoomForUser,
  mapCreateRoomError,
  mapJoinRoomError,
  mapRoomError,
} from '../services/roomService';
import { Unsubscribe } from 'firebase/firestore';

export interface RoomContextType {
  currentRoom: RoomDocument | null;
  roomLoading: boolean;
  roomError: string | null;
  isInRoom: boolean;
  isCreator: boolean;
  isJoiningPlayer: boolean;
  currentPlayer: RoomPlayer | null;
  opponent: RoomPlayer | null;
  myChessColor: ChessSide | null;
  tossWinner: RoomPlayer | null;
  createRoom: (settings?: { timer?: string; truthOrDare?: boolean }) => Promise<RoomDocument>;
  joinRoom: (code: string) => Promise<RoomDocument>;
  leaveRoom: () => Promise<void>;
  leaveCompletedGame: () => Promise<void>;
  setTossChoice: (choice: CoinTossChoice) => Promise<void>;
  flipCoin: () => Promise<void>;
  selectChessColor: (color: ChessSide) => Promise<void>;
  setReady: () => Promise<void>;
  clearError: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const ACTIVE_ROOM_KEY = 'kq_active_room_id';

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { userProfile } = useProfile();

  const [currentRoom, setCurrentRoom] = useState<RoomDocument | null>(null);
  const [roomLoading, setRoomLoading] = useState<boolean>(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Helper to cleanup active subscription
  const cleanupSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Helper to attach real-time room listener
  const attachRoomListener = useCallback(
    (roomId: string) => {
      cleanupSubscription();

      const unsubscribe = subscribeToRoom(
        roomId,
        (updatedRoom) => {
          setCurrentRoom(updatedRoom);
          setRoomError(null);

          // If room was cancelled or closed, clean up stored ID
          if (['CANCELLED', 'CLOSED', 'COMPLETED', 'FINISHED'].includes(updatedRoom.status)) {
            if (updatedRoom.status === 'CANCELLED' || updatedRoom.status === 'CLOSED') {
              try {
                localStorage.removeItem(ACTIVE_ROOM_KEY);
              } catch {
                // Storage restricted
              }
            }
          }
        },
        (error) => {
          const friendly = mapRoomError(error);
          setRoomError(friendly);
          if (error.message === 'ROOM_NOT_FOUND') {
            setCurrentRoom(null);
            try {
              localStorage.removeItem(ACTIVE_ROOM_KEY);
            } catch {
              // Storage restricted
            }
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    },
    [cleanupSubscription]
  );

  // Restore room state on browser refresh
  useEffect(() => {
    if (authLoading || !authUser?.uid) {
      if (!authLoading) {
        cleanupSubscription();
        setCurrentRoom(null);
      }
      return;
    }

    let isMounted = true;

    const restoreRoom = async () => {
      let savedRoomId: string | null = null;
      try {
        savedRoomId = localStorage.getItem(ACTIVE_ROOM_KEY);
      } catch {
        // Storage restricted
      }

      try {
        const activeRoom = await findActiveRoomForUser(authUser.uid, savedRoomId);
        if (isMounted) {
          if (activeRoom) {
            setCurrentRoom(activeRoom);
            attachRoomListener(activeRoom.roomId);
          } else if (savedRoomId) {
            // Stale or completed room in storage: purge it immediately
            if (import.meta.env?.DEV) {
              console.info('[Room] Clearing completed/stale room from storage');
            }
            try {
              localStorage.removeItem(ACTIVE_ROOM_KEY);
            } catch {
              // Storage restricted
            }
          }
        }
      } catch (err) {
        if (import.meta.env?.DEV) {
          console.warn('[RoomContext restoreRoom failed]', err);
        }
      }
    };

    restoreRoom();

    return () => {
      isMounted = false;
      cleanupSubscription();
    };
  }, [authUser?.uid, authLoading, attachRoomListener, cleanupSubscription]);

  // Derived presence states
  const isInRoom = currentRoom !== null && currentRoom.status !== 'CANCELLED' && currentRoom.status !== 'CLOSED';
  const isCreator = Boolean(
    authUser?.uid && currentRoom && currentRoom.createdBy === authUser.uid
  );
  const isJoiningPlayer = Boolean(
    authUser?.uid && currentRoom && currentRoom.players[1]?.uid === authUser.uid
  );

  const currentPlayer: RoomPlayer | null =
    currentRoom?.players.find((p) => p.uid === authUser?.uid) || null;

  const opponent: RoomPlayer | null =
    currentRoom?.players.find((p) => p.uid !== authUser?.uid) || null;

  const myChessColor: ChessSide | null = currentPlayer?.chessColor || null;

  const tossWinner: RoomPlayer | null =
    currentRoom?.players.find((p) => p.uid === currentRoom.tossWinnerUid) || null;

  // Actions
  const createRoomAction = async (settings?: { timer?: string; truthOrDare?: boolean }): Promise<RoomDocument> => {
    if (!userProfile || !userProfile.uid) {
      const authErr = new Error('AUTH_REQUIRED');
      console.error('[CreateRoom Error]', {
        code: 'unauthenticated',
        message: 'Please sign in before creating a room.',
        error: authErr,
      });
      const friendly = mapCreateRoomError(authErr);
      setRoomError(friendly);
      throw new Error(friendly);
    }

    setRoomLoading(true);
    setRoomError(null);

    try {
      const newRoom = await apiCreateRoom(userProfile, settings);
      setCurrentRoom(newRoom);
      try {
        localStorage.setItem(ACTIVE_ROOM_KEY, newRoom.roomId);
      } catch {
        // Storage restricted
      }
      attachRoomListener(newRoom.roomId);
      return newRoom;
    } catch (err: any) {
      console.error('[CreateRoom Error]', {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      const friendly = mapCreateRoomError(err);
      setRoomError(friendly);
      throw new Error(friendly);
    } finally {
      setRoomLoading(false);
    }
  };

  const joinRoomAction = async (code: string): Promise<RoomDocument> => {
    if (!userProfile || !userProfile.uid) {
      const authErr = new Error('AUTH_REQUIRED');
      console.error('[JoinRoom Error]', {
        code: 'unauthenticated',
        message: 'Please sign in before joining a room.',
        error: authErr,
      });
      const friendly = mapJoinRoomError(authErr);
      setRoomError(friendly);
      throw new Error(friendly);
    }

    setRoomLoading(true);
    setRoomError(null);

    try {
      const joinedRoom = await apiJoinRoom(userProfile, code);
      setCurrentRoom(joinedRoom);
      try {
        localStorage.setItem(ACTIVE_ROOM_KEY, joinedRoom.roomId);
      } catch {
        // Storage restricted
      }
      attachRoomListener(joinedRoom.roomId);
      return joinedRoom;
    } catch (err: any) {
      console.error('[JoinRoom Error]', {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      const friendly = mapJoinRoomError(err);
      setRoomError(friendly);
      throw new Error(friendly);
    } finally {
      setRoomLoading(false);
    }
  };

  const leaveRoomAction = async (): Promise<void> => {
    if (!currentRoom || !authUser?.uid) return;

    const roomId = currentRoom.roomId;
    cleanupSubscription();
    setCurrentRoom(null);
    try {
      localStorage.removeItem(ACTIVE_ROOM_KEY);
    } catch {
      // Storage restricted
    }

    try {
      await apiLeaveRoom(roomId, authUser.uid);
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn('[leaveRoom error]', err);
      }
    }
  };

  const leaveCompletedGameAction = async (): Promise<void> => {
    const roomId = currentRoom?.roomId;
    if (import.meta.env?.DEV) {
      console.info(`[Room] Leaving completed game for room ${roomId}`);
    }

    cleanupSubscription();
    setCurrentRoom(null);
    try {
      localStorage.removeItem(ACTIVE_ROOM_KEY);
    } catch {
      // Storage restricted
    }

    if (roomId && authUser?.uid) {
      try {
        await apiLeaveCompletedGame(roomId, authUser.uid);
      } catch (err) {
        if (import.meta.env?.DEV) {
          console.warn('[leaveCompletedGame error]', err);
        }
      }
    }
  };

  const setTossChoiceAction = async (choice: CoinTossChoice): Promise<void> => {
    if (!currentRoom || !authUser?.uid) return;
    setRoomLoading(true);
    setRoomError(null);
    try {
      await apiSetPartnerTossChoice(currentRoom.roomId, authUser.uid, choice);
    } catch (err: any) {
      const friendly = mapRoomError(err);
      setRoomError(friendly);
      throw new Error(friendly);
    } finally {
      setRoomLoading(false);
    }
  };

  const flipCoinAction = async (): Promise<void> => {
    if (!currentRoom || !authUser?.uid) return;
    setRoomLoading(true);
    setRoomError(null);
    try {
      await apiFlipRoyalCoin(currentRoom.roomId, authUser.uid);
    } catch (err: any) {
      const friendly = mapRoomError(err);
      setRoomError(friendly);
      throw new Error(friendly);
    } finally {
      setRoomLoading(false);
    }
  };

  const selectChessColorAction = async (color: ChessSide): Promise<void> => {
    if (!currentRoom || !authUser?.uid) return;
    setRoomLoading(true);
    setRoomError(null);
    try {
      await apiAssignChessColors(currentRoom.roomId, authUser.uid, color);
    } catch (err: any) {
      const friendly = mapRoomError(err);
      setRoomError(friendly);
      throw new Error(friendly);
    } finally {
      setRoomLoading(false);
    }
  };

  const setReadyAction = async (): Promise<void> => {
    if (!currentRoom || !authUser?.uid) return;
    setRoomLoading(true);
    setRoomError(null);
    try {
      await apiSetPlayerReady(currentRoom.roomId, authUser.uid);
    } catch (err: any) {
      const friendly = mapRoomError(err);
      setRoomError(friendly);
      throw new Error(friendly);
    } finally {
      setRoomLoading(false);
    }
  };

  const clearError = () => {
    setRoomError(null);
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        roomLoading,
        roomError,
        isInRoom,
        isCreator,
        isJoiningPlayer,
        currentPlayer,
        opponent,
        myChessColor,
        tossWinner,
        createRoom: createRoomAction,
        joinRoom: joinRoomAction,
        leaveRoom: leaveRoomAction,
        leaveCompletedGame: leaveCompletedGameAction,
        setTossChoice: setTossChoiceAction,
        flipCoin: flipCoinAction,
        selectChessColor: selectChessColorAction,
        setReady: setReadyAction,
        clearError,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = (): RoomContextType => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const useRoom = useRoomContext;

