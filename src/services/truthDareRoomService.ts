/**
 * Truth or Dare Private Multiplayer Room Service
 * KING & QUEEN — STEP 18.2
 *
 * Dedicated service layer for private Truth or Dare multiplayer rooms.
 * Uses dedicated Firestore collection: truthDareRooms/{roomId}
 * Isolated completely from Chess game logic.
 */

import {
  doc,
  collection,
  setDoc,
  getDoc,
  query,
  where,
  limit,
  getDocs,
  runTransaction,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  TruthDareRoom,
  TruthDarePlayer,
  TruthDareSession,
  TruthDareMode,
  TruthDareCategory,
  TruthDareDifficulty,
  UserProfile,
} from '../types';
import {
  selectAuthoritativeCard,
  getRandomTruthCardId,
  getRandomDareCardId,
} from '../lib/truthDareCards';

/**
 * Character set for Truth or Dare room codes
 * Avoids confusing characters: O, 0, I, 1
 */
export const TD_ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const TD_ACTIVE_ROOM_STORAGE_KEY = 'kq_truth_dare_room_id';
export const TD_LEGACY_ROOM_STORAGE_KEY = 'kq_truth_dare_active_room_id';

export const setStoredTruthDareRoomId = (roomId: string) => {
  try {
    localStorage.setItem(TD_ACTIVE_ROOM_STORAGE_KEY, roomId);
    localStorage.setItem(TD_LEGACY_ROOM_STORAGE_KEY, roomId);
  } catch {}
};

export const getStoredTruthDareRoomId = (): string | null => {
  try {
    return (
      localStorage.getItem(TD_ACTIVE_ROOM_STORAGE_KEY) ||
      localStorage.getItem(TD_LEGACY_ROOM_STORAGE_KEY)
    );
  } catch {
    return null;
  }
};

export const clearStoredTruthDareRoomId = () => {
  try {
    localStorage.removeItem(TD_ACTIVE_ROOM_STORAGE_KEY);
    localStorage.removeItem(TD_LEGACY_ROOM_STORAGE_KEY);
  } catch {}
};

/**
 * Normalizes input room code:
 * - Trims whitespace
 * - Uppercases
 * - Ensures 'TD-' prefix
 */
export const normalizeTruthDareRoomCode = (rawCode: string): string => {
  if (!rawCode) return '';
  let cleaned = rawCode.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned.startsWith('TD-')) {
    if (cleaned.startsWith('TD')) {
      cleaned = 'TD-' + cleaned.slice(2);
    } else {
      cleaned = 'TD-' + cleaned;
    }
  }
  return cleaned;
};

/**
 * Validates Truth or Dare room code format (e.g. TD-A7K9 or TD-7K9P)
 */
export const validateTruthDareRoomCode = (code: string): boolean => {
  const normalized = normalizeTruthDareRoomCode(code);
  const regex = /^TD-[A-HJ-NP-Z2-9]{4,6}$/;
  return regex.test(normalized);
};

/**
 * Generates a random, human-friendly 4-character room code suffix
 */
export const generateRandomTDSuffix = (length = 4): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * TD_ROOM_CODE_CHARS.length);
    result += TD_ROOM_CODE_CHARS[randomIndex];
  }
  return result;
};

/**
 * Generates a unique Room Code verified against active Firestore rooms in truthDareRooms
 */
export const generateTruthDareRoomCode = async (maxAttempts = 10): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const suffix = generateRandomTDSuffix(4);
    const candidateCode = `TD-${suffix}`;

    try {
      const q = query(
        collection(db, 'truthDareRooms'),
        where('roomCode', '==', candidateCode),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return candidateCode;
      }
    } catch (err: any) {
      if (import.meta.env?.DEV) {
        console.warn('[TruthDareRoom] Code collision check query failed or retrying', err);
      }
      // If Firestore is offline or during testing, return valid candidate
      if (attempt === maxAttempts - 1) {
        return candidateCode;
      }
    }
  }

  throw new Error('UNABLE_TO_GENERATE_ROOM_CODE');
};

/**
 * Create a new private Truth or Dare room
 */
export const createTruthDareRoom = async (user: UserProfile): Promise<TruthDareRoom> => {
  if (!user || !user.uid) {
    throw new Error('UNAUTHENTICATED');
  }

  if (import.meta.env?.DEV) {
    console.log('[TruthDare] Creating room for', user.displayName);
  }

  const roomCode = await generateTruthDareRoomCode();
  const roomRef = doc(collection(db, 'truthDareRooms'));
  const roomId = roomRef.id;

  const creatorPlayer: TruthDarePlayer = {
    uid: user.uid,
    displayName: user.displayName || 'King',
    photoURL: user.avatar || null,
    identity: user.identity || 'KING',
    role: 'CREATOR',
    ready: false,
    joinedAt: Date.now(),
  };

  const newRoom: TruthDareRoom = {
    id: roomId,
    roomId,
    roomCode,
    gameType: 'TRUTH_DARE',
    gameMode: 'TRUTH_DARE',
    createdBy: user.uid,
    status: 'WAITING',
    maxPlayers: 2,
    players: [creatorPlayer],
    currentRound: 0,
    session: null,
    exitedPlayers: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(roomRef, newRoom);
  setStoredTruthDareRoomId(roomId);

  if (import.meta.env?.DEV) {
    console.log('[TruthDare] Room created:', { roomId, roomCode });
  }

  return {
    ...newRoom,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * Join an existing Truth or Dare room using room code
 */
export const joinTruthDareRoom = async (
  user: UserProfile,
  rawCode: string
): Promise<TruthDareRoom> => {
  if (!user || !user.uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const normalizedCode = normalizeTruthDareRoomCode(rawCode);
  if (!validateTruthDareRoomCode(normalizedCode)) {
    throw new Error('INVALID_ROOM_CODE_FORMAT');
  }

  if (import.meta.env?.DEV) {
    console.log('[TruthDare] Joining room with code:', normalizedCode);
  }

  // 1. Locate the room document
  const q = query(
    collection(db, 'truthDareRooms'),
    where('roomCode', '==', normalizedCode),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('ROOM_NOT_FOUND');
  }

  const targetDoc = snapshot.docs[0];
  const roomRef = doc(db, 'truthDareRooms', targetDoc.id);

  // 2. Perform atomic join validation inside transaction
  const updatedRoom = await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as TruthDareRoom;

    // Reject non-waiting rooms
    if (room.status === 'CLOSED') {
      throw new Error('ROOM_CLOSED');
    }
    if (room.status === 'PLAYING') {
      throw new Error('ROOM_ALREADY_PLAYING');
    }
    if (room.status === 'FINISHED') {
      throw new Error('ROOM_FINISHED');
    }
    if (room.status !== 'WAITING') {
      throw new Error('ROOM_NOT_JOINABLE');
    }

    // Reject if already full
    if (room.players.length >= 2) {
      if (import.meta.env?.DEV) {
        console.log('[TruthDare] Room full');
      }
      throw new Error('ROOM_FULL');
    }

    // Prevent creator joining own room via join code
    if (room.createdBy === user.uid) {
      throw new Error('CANNOT_JOIN_OWN_ROOM');
    }

    // Prevent duplicate player join
    if (room.players.some((p) => p.uid === user.uid)) {
      throw new Error('ALREADY_IN_ROOM');
    }

    const partnerPlayer: TruthDarePlayer = {
      uid: user.uid,
      displayName: user.displayName || 'Queen',
      photoURL: user.avatar || null,
      identity: user.identity || 'QUEEN',
      role: 'PARTNER',
      ready: true,
      joinedAt: Date.now(),
    };

    // Both players ready when partner arrives
    const updatedPlayers = room.players.map((p) => ({ ...p, ready: true }));
    const newPlayers = [...updatedPlayers, partnerPlayer];

    transaction.update(roomRef, {
      players: newPlayers,
      status: 'READY',
      updatedAt: serverTimestamp(),
    });

    return {
      ...room,
      players: newPlayers,
      status: 'READY' as const,
      updatedAt: Date.now(),
    };
  });

  setStoredTruthDareRoomId(targetDoc.id);

  if (import.meta.env?.DEV) {
    console.log('[TruthDare] Partner joined:', updatedRoom.id);
  }

  return updatedRoom;
};

/**
 * Fetch a single Truth or Dare room document by ID
 */
export const getTruthDareRoom = async (roomId: string): Promise<TruthDareRoom | null> => {
  if (!roomId) return null;
  const roomRef = doc(db, 'truthDareRooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return null;
  return snap.data() as TruthDareRoom;
};

/**
 * Real-time listener for a Truth or Dare room
 */
export const subscribeToTruthDareRoom = (
  roomId: string,
  onUpdate: (room: TruthDareRoom) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const roomRef = doc(db, 'truthDareRooms', roomId);

  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const room = snapshot.data() as TruthDareRoom;
        onUpdate(room);
      } else {
        if (onError) onError(new Error('ROOM_NOT_FOUND'));
      }
    },
    (error) => {
      if (import.meta.env?.DEV) {
        console.error('[TruthDareRoom] Snapshot error:', error);
      }
      if (onError) onError(error);
    }
  );
};

/**
 * Toggle or set player ready state.
 * When both players become ready, atomically initializes empty session and sets status to 'PLAYING'.
 */
export const setTruthDarePlayerReady = async (
  roomId: string,
  uid: string,
  ready: boolean
): Promise<void> => {
  if (!roomId || !uid) return;
  const roomRef = doc(db, 'truthDareRooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as TruthDareRoom;
    if (room.status !== 'WAITING' && room.status !== 'READY') {
      throw new Error('INVALID_ROOM_STATUS');
    }

    const playerIndex = room.players.findIndex((p) => p.uid === uid);
    if (playerIndex === -1) {
      throw new Error('PLAYER_NOT_IN_ROOM');
    }

    const updatedPlayers = room.players.map((p) =>
      p.uid === uid ? { ...p, ready } : p
    );

    const bothReady =
      updatedPlayers.length === 2 && updatedPlayers.every((p) => p.ready);

    const updatePayload: Record<string, any> = {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    };

    if (bothReady) {
      if (import.meta.env?.DEV) {
        console.log('[TruthDareRoom] Both players ready. Initializing session...');
      }

      // Safe initialization: Only initialize if session is not already created
      if (!room.session) {
        const initialSession: TruthDareSession = {
          round: 1,
          currentPlayerUid: null,
          phase: 'INITIALIZING',
          selectedMode: null,
          selectedCategory: null,
          selectedDifficulty: null,
          selectedDeckType: 'BUILT_IN',
          selectedDeckId: null,
          selectedCardId: null,
          usedCardIds: [],
          completedRounds: 0,
          startedAt: Date.now(),
        };
        updatePayload.session = initialSession;
        updatePayload.status = 'PLAYING';
      } else {
        updatePayload.status = 'PLAYING';
      }
    } else {
      updatePayload.status = 'WAITING';
    }

    transaction.update(roomRef, updatePayload);
  });
};

/**
 * Starts the Truth or Dare game.
 * Only the room creator can initiate game start when both players are connected.
 */
export const startTruthDareGame = async (roomId: string, uid: string): Promise<void> => {
  if (!roomId || !uid) return;

  if (import.meta.env?.DEV) {
    console.log('[TruthDare] Starting game:', roomId);
  }

  const roomRef = doc(db, 'truthDareRooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as TruthDareRoom;

    if (room.createdBy !== uid) {
      throw new Error('UNAUTHORIZED');
    }

    if (room.players.length < 2) {
      throw new Error('ROOM_NOT_READY');
    }

    if (room.status === 'PLAYING') {
      return;
    }

    const initialSession: TruthDareSession = {
      round: 1,
      currentPlayerUid: room.createdBy,
      phase: 'INITIALIZING',
      selectedMode: null,
      selectedCategory: null,
      selectedDifficulty: null,
      selectedDeckType: 'BUILT_IN',
      selectedDeckId: null,
      selectedCardId: null,
      usedCardIds: [],
      completedRounds: 0,
      startedAt: Date.now(),
    };

    transaction.update(roomRef, {
      status: 'PLAYING',
      session: initialSession,
      currentRound: 1,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Player leaves the room.
 * - If creator leaves while waiting -> room marked CLOSED.
 * - If partner leaves while waiting -> partner removed, room stays WAITING.
 * - If playing -> tracks exited player.
 */
export const leaveTruthDareRoom = async (roomId: string, uid: string): Promise<void> => {
  if (!roomId || !uid) return;

  clearStoredTruthDareRoomId();

  const roomRef = doc(db, 'truthDareRooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const room = roomSnap.data() as TruthDareRoom;
    const isCreator = room.createdBy === uid;

    if (room.status === 'WAITING' || room.status === 'READY') {
      if (isCreator) {
        // Creator leaving closes the room
        transaction.update(roomRef, {
          status: 'CLOSED',
          updatedAt: serverTimestamp(),
        });
      } else {
        // Partner leaving removes partner so another player can join
        const remainingPlayers = room.players.filter((p) => p.uid !== uid);
        transaction.update(roomRef, {
          players: remainingPlayers,
          status: 'WAITING',
          updatedAt: serverTimestamp(),
        });
      }
    } else if (room.status === 'PLAYING') {
      // In-game exit tracking
      const currentExited = room.exitedPlayers || [];
      const updatedExited = currentExited.includes(uid)
        ? currentExited
        : [...currentExited, uid];

      const bothExited =
        updatedExited.length >= 2 ||
        room.players.every((p) => updatedExited.includes(p.uid));

      transaction.update(roomRef, {
        exitedPlayers: updatedExited,
        ...(bothExited ? { status: 'CLOSED' } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  });

  if (import.meta.env?.DEV) {
    console.log('[TruthDare] Player left:', { roomId, uid });
  }
};

/**
 * Closes an active Truth or Dare room
 */
export const closeTruthDareRoom = async (roomId: string): Promise<void> => {
  if (!roomId) return;
  const roomRef = doc(db, 'truthDareRooms', roomId);
  await setDoc(
    roomRef,
    { status: 'CLOSED', updatedAt: serverTimestamp() },
    { merge: true }
  );
  clearStoredTruthDareRoomId();
};

/**
 * Searches for any ongoing active Truth or Dare room for the current user
 */
export const findActiveTruthDareRoomForUser = async (
  uid: string
): Promise<TruthDareRoom | null> => {
  if (!uid) return null;

  try {
    const activeStatuses = ['WAITING', 'READY', 'PLAYING'];
    const q = query(
      collection(db, 'truthDareRooms'),
      where('status', 'in', activeStatuses),
      limit(10)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    for (const d of snapshot.docs) {
      const room = d.data() as TruthDareRoom;
      if (
        room.status !== 'CLOSED' &&
        room.status !== 'FINISHED' &&
        !room.exitedPlayers?.includes(uid) &&
        room.players?.some((p) => p.uid === uid)
      ) {
        return room;
      }
    }
    return null;
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[TruthDare] findActiveTruthDareRoomForUser error:', err);
    }
    return null;
  }
};

/**
 * User-friendly error message mapping
 */
export const mapTruthDareRoomError = (err: any): string => {
  const code = err?.message || err?.code || String(err);

  switch (code) {
    case 'ROOM_NOT_FOUND':
      return 'THIS ROYAL ROOM DOES NOT EXIST';
    case 'ROOM_FULL':
      return 'THIS ROOM ALREADY HAS TWO PLAYERS';
    case 'ROOM_CLOSED':
      return 'THIS ROOM IS NO LONGER AVAILABLE';
    case 'ROOM_ALREADY_PLAYING':
      return 'THIS GAME HAS ALREADY STARTED';
    case 'ROOM_FINISHED':
      return 'THIS MATCH HAS ALREADY CONCLUDED';
    case 'CANNOT_JOIN_OWN_ROOM':
      return 'YOU ARE ALREADY THE ROOM CREATOR';
    case 'ALREADY_IN_ROOM':
      return 'YOU ARE ALREADY IN THIS ROOM';
    case 'INVALID_ROOM_CODE_FORMAT':
      return 'INVALID ROOM CODE FORMAT. USE TD-XXXX';
    case 'UNABLE_TO_GENERATE_ROOM_CODE':
      return 'UNABLE TO CREATE A UNIQUE ROOM. PLEASE TRY AGAIN';
    case 'UNAUTHENTICATED':
      return 'PLEASE SIGN IN TO JOIN A GAME';
    case 'NETWORK_ERROR':
      return 'CONNECTION LOST. PLEASE TRY AGAIN.';
    default:
      return 'SOMETHING WENT WRONG. PLEASE TRY AGAIN.';
  }
};

export interface SelectTruthOrDareOptions {
  mode: TruthDareMode;
  category?: TruthDareCategory | null;
  difficulty?: TruthDareDifficulty | null;
  deckType?: 'BUILT_IN' | 'CUSTOM';
  deckId?: string | null;
}

/**
 * Selects Truth or Dare mode, category, difficulty, and assigns an authoritative card for the round.
 *
 * Transaction guards:
 * - Room must be PLAYING
 * - Caller must be currentPlayerUid (Challenger turn)
 * - Session phase must be CHOOSING (no double-select)
 * - selectedMode must still be null
 *
 * On success, picks a card deterministically inside the transaction
 * and writes: session.selectedMode, session.selectedCategory, session.selectedDifficulty,
 * session.selectedDeckType, session.selectedDeckId, session.selectedCardId,
 * session.usedCardIds, session.phase = 'RESPONDING'
 */
export const selectTruthOrDare = async (
  roomId: string,
  uid: string,
  optionsOrMode: TruthDareMode | SelectTruthOrDareOptions
): Promise<void> => {
  if (!roomId || !uid) return;

  const options: SelectTruthOrDareOptions =
    typeof optionsOrMode === 'string'
      ? { mode: optionsOrMode }
      : optionsOrMode;

  const {
    mode,
    category = null,
    difficulty = null,
    deckType = 'BUILT_IN',
    deckId = null,
  } = options;

  const roomRef = doc(db, 'truthDareRooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as TruthDareRoom;

    if (room.status !== 'PLAYING') {
      throw new Error('ROOM_NOT_PLAYING');
    }

    const session = room.session;
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    if (session.phase !== 'CHOOSING') {
      throw new Error('WRONG_PHASE');
    }

    if (session.currentPlayerUid !== uid) {
      throw new Error('NOT_YOUR_TURN');
    }

    if (session.selectedMode !== null) {
      throw new Error('ALREADY_SELECTED');
    }

    let customCards: any[] | undefined = undefined;
    if (deckType === 'CUSTOM' && deckId) {
      const deckRef = doc(db, 'truthDareDecks', deckId);
      const deckSnap = await transaction.get(deckRef);
      if (deckSnap.exists()) {
        customCards = deckSnap.data()?.cards || [];
      }
    }

    const usedCardIds = session.usedCardIds || [];
    const selectedCard = selectAuthoritativeCard(
      mode,
      category,
      difficulty,
      usedCardIds,
      customCards
    );

    const cardId =
      selectedCard?.id ||
      (mode === 'TRUTH' ? getRandomTruthCardId() : getRandomDareCardId());

    const updatedUsedCardIds = usedCardIds.includes(cardId)
      ? usedCardIds
      : [...usedCardIds, cardId];

    transaction.update(roomRef, {
      'session.selectedMode': mode,
      'session.selectedCategory': category || selectedCard?.category || null,
      'session.selectedDifficulty': difficulty || selectedCard?.difficulty || null,
      'session.selectedDeckType': deckType,
      'session.selectedDeckId': deckId,
      'session.selectedCardId': cardId,
      'session.usedCardIds': updatedUsedCardIds,
      'session.phase': 'RESPONDING',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log(
        `[TruthDare] ${uid} selected ${mode} (category: ${category}, diff: ${difficulty}), cardId=${cardId}`
      );
    }
  });
};

/**
 * Completes the current round and advances to the next.
 *
 * Transaction guards:
 * - Room must be PLAYING
 * - Session phase must be RESPONDING (challenge has been answered/verified)
 *
 * On success:
 * - Records completedBy and completedAt
 * - Increments session.completedRounds and session.round
 * - Switches currentPlayerUid to the other player (Judge becomes Challenger)
 * - Resets selectedMode, selectedCategory, selectedDifficulty, selectedCardId
 * - Sets phase back to CHOOSING
 */
export const completeRound = async (roomId: string, uid: string): Promise<void> => {
  if (!roomId || !uid) return;

  const roomRef = doc(db, 'truthDareRooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as TruthDareRoom;

    if (room.status !== 'PLAYING') {
      throw new Error('ROOM_NOT_PLAYING');
    }

    const session = room.session;
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    if (session.phase !== 'RESPONDING') {
      throw new Error('WRONG_PHASE');
    }

    // Switch to the other player for the next round
    const nextPlayerUid =
      room.players.find((p) => p.uid !== session.currentPlayerUid)?.uid ??
      session.currentPlayerUid;

    transaction.update(roomRef, {
      'session.phase': 'CHOOSING',
      'session.selectedMode': null,
      'session.selectedCategory': null,
      'session.selectedDifficulty': null,
      'session.selectedCardId': null,
      'session.completedBy': uid,
      'session.completedAt': Date.now(),
      'session.currentPlayerUid': nextPlayerUid,
      'session.completedRounds': (session.completedRounds ?? 0) + 1,
      'session.round': (session.round ?? 1) + 1,
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log(
        `[TruthDare] Round ${session.round} completed by ${uid}. Next challenger: ${nextPlayerUid}`
      );
    }
  });
};

