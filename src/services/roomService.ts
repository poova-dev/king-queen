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
  RoomDocument,
  RoomPlayer,
  RoomStatus,
  CoinTossChoice,
  ChessSide,
  UserProfile,
  getOppositeCoinChoice,
  getOppositeChessSide,
} from '../types';
import { INITIAL_CHESS_FEN } from './gameService';

/**
 * Character set for room codes
 * Excludes ambiguous characters: O, 0, I, 1
 */
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Normalizes input room code:
 * - Trims whitespace
 * - Uppercases
 * - Ensures 'KQ-' prefix
 */
export const normalizeRoomCode = (rawCode: string): string => {
  if (!rawCode) return '';
  let cleaned = rawCode.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned.startsWith('KQ-')) {
    if (cleaned.startsWith('KQ')) {
      cleaned = 'KQ-' + cleaned.slice(2);
    } else {
      cleaned = 'KQ-' + cleaned;
    }
  }
  return cleaned;
};

/**
 * Validates room code format (e.g. KQ-AB7X or KQ-9MQR)
 */
export const validateRoomCodeFormat = (code: string): boolean => {
  const normalized = normalizeRoomCode(code);
  const regex = /^KQ-[A-HJ-NP-Z2-9]{4,6}$/;
  return regex.test(normalized);
};

/**
 * Generates a random, human-friendly 4-character room code suffix
 */
export const generateRandomCodeSuffix = (length = 4): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    result += ROOM_CODE_CHARS[randomIndex];
  }
  return result;
};

/**
 * Generate a unique Room Code verified against active Firestore rooms
 * Uses a single-field equality check with limit(1) to avoid requiring composite indexes
 */
export const generateUniqueRoomCode = async (maxAttempts = 5): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const suffix = generateRandomCodeSuffix(4);
    const candidateCode = `KQ-${suffix}`;

    try {
      // Single-field query that does not require any composite index
      const q = query(
        collection(db, 'rooms'),
        where('roomCode', '==', candidateCode),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return candidateCode;
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        console.error('[CreateRoom Error]', {
          code: err.code || 'permission-denied',
          message: err.message,
          error: err,
        });
        throw err;
      }
      console.warn('[generateUniqueRoomCode check warning]', {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      return candidateCode;
    }
  }

  // Fallback to 5-character suffix if 4-char collisions occur
  const fallbackSuffix = generateRandomCodeSuffix(5);
  return `KQ-${fallbackSuffix}`;
};

/**
 * Create a new private room
 */
export const createRoom = async (
  user: UserProfile,
  settings?: { timer?: string; truthOrDare?: boolean }
): Promise<RoomDocument> => {
  if (!user.uid) {
    const authErr = new Error('AUTH_REQUIRED');
    console.error('[CreateRoom Error]', {
      code: 'unauthenticated',
      message: 'Please sign in before creating a room.',
      error: authErr,
    });
    throw authErr;
  }

  try {
    const roomCode = await generateUniqueRoomCode();
    const roomRef = doc(collection(db, 'rooms'));

    const creatorPlayer: RoomPlayer = {
      uid: user.uid,
      displayName: user.displayName || 'King Sovereign',
      photoURL: user.avatar || null,
      profileIdentity: user.identity || 'KING',
      roomRole: 'KING', // Room creator is King for room presentation
      tossChoice: null,
      chessColor: null,
      ready: false,
      joinedAt: new Date().toISOString(),
    };

    const newRoomData: Omit<RoomDocument, 'createdAt' | 'updatedAt'> & {
      createdAt: any;
      updatedAt: any;
    } = {
      roomId: roomRef.id,
      roomCode,
      status: 'WAITING',
      createdBy: user.uid,
      players: [creatorPlayer],
      coinResult: null,
      tossWinnerUid: null,
      maxPlayers: 2,
      timer: settings?.timer || 'No Timer',
      truthOrDare: settings?.truthOrDare ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(roomRef, newRoomData);

    return {
      ...newRoomData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('[CreateRoom Error]', {
      code: error?.code,
      message: error?.message,
      error,
    });
    throw error;
  }
};

/**
 * Look up active room by room code
 */
export const findRoomByCode = async (rawCode: string): Promise<RoomDocument | null> => {
  const normalized = normalizeRoomCode(rawCode);
  if (!validateRoomCodeFormat(normalized)) {
    return null;
  }

  const q = query(
    collection(db, 'rooms'),
    where('roomCode', '==', normalized),
    where('status', 'in', ['WAITING', 'COIN_TOSS', 'COLOR_SELECTION', 'READY', 'PLAYING'])
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data() as RoomDocument;
  return {
    ...data,
    roomId: docSnap.id,
  };
};

/**
 * Join an existing room by code using a Firestore transaction
 */
export const joinRoom = async (user: UserProfile, rawCode: string): Promise<RoomDocument> => {
  if (!user.uid) {
    throw new Error('AUTH_REQUIRED');
  }

  const normalized = normalizeRoomCode(rawCode);
  if (!validateRoomCodeFormat(normalized)) {
    throw new Error('INVALID_CODE');
  }

  const existingRoom = await findRoomByCode(normalized);
  if (!existingRoom) {
    throw new Error('ROOM_NOT_FOUND');
  }

  const roomRef = doc(db, 'rooms', existingRoom.roomId);

  const updatedRoom = await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const roomData = roomSnap.data() as RoomDocument;

    // Check room status
    if (roomData.status === 'CANCELLED' || roomData.status === 'FINISHED') {
      throw new Error('ROOM_CANCELLED');
    }
    if (roomData.status === 'PLAYING') {
      throw new Error('GAME_ALREADY_STARTED');
    }
    if (roomData.status !== 'WAITING') {
      throw new Error('ROOM_FULL');
    }

    // Check if user is already inside room
    if (roomData.players.some((p) => p.uid === user.uid)) {
      throw new Error('ALREADY_IN_ROOM');
    }

    // Never trust client-side player count, check inside transaction
    if (roomData.players.length >= 2) {
      throw new Error('ROOM_FULL');
    }

    const partnerPlayer: RoomPlayer = {
      uid: user.uid,
      displayName: user.displayName || 'Queen Sovereign',
      photoURL: user.avatar || null,
      profileIdentity: user.identity,
      roomRole: 'QUEEN', // Joining partner is Queen for room presentation
      tossChoice: null,
      chessColor: null,
      ready: false,
      joinedAt: new Date().toISOString(),
    };

    const newPlayers = [...roomData.players, partnerPlayer];

    transaction.update(roomRef, {
      players: newPlayers,
      status: 'COIN_TOSS',
      updatedAt: serverTimestamp(),
    });

    return {
      ...roomData,
      players: newPlayers,
      status: 'COIN_TOSS' as RoomStatus,
    };
  });

  return updatedRoom;
};

/**
 * Fetch a single room by ID
 */
export const getRoom = async (roomId: string): Promise<RoomDocument | null> => {
  if (!roomId) return null;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return null;
  return {
    ...(roomSnap.data() as RoomDocument),
    roomId: roomSnap.id,
  };
};

/**
 * Real-time listener for room updates using onSnapshot
 */
export const subscribeToRoom = (
  roomId: string,
  onUpdate: (room: RoomDocument) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(
    roomRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RoomDocument;
        onUpdate({
          ...data,
          roomId: docSnap.id,
        });
      } else {
        onError?.(new Error('ROOM_NOT_FOUND'));
      }
    },
    (err) => {
      if (import.meta.env?.DEV) {
        console.error('[subscribeToRoom Error]', err);
      }
      onError?.(err);
    }
  );
};

/**
 * Partner selects HEADS or TAILS.
 * Creator automatically receives the opposite choice.
 * Handled via a Firestore transaction.
 */
export const setPartnerTossChoice = async (
  roomId: string,
  partnerUid: string,
  choice: CoinTossChoice
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    if (room.status !== 'COIN_TOSS') {
      throw new Error('NOT_AUTHORIZED');
    }

    // Verify calling user is the Partner (player index 1 or QUEEN role)
    const creator = room.players[0];
    const partner = room.players[1];

    if (!partner || partner.uid !== partnerUid) {
      throw new Error('NOT_AUTHORIZED');
    }

    // Room creator must NOT choose Heads or Tails
    if (creator.uid === partnerUid) {
      throw new Error('NOT_AUTHORIZED');
    }

    // Choice already locked
    if (partner.tossChoice !== null) {
      throw new Error('COIN_ALREADY_CHOSEN');
    }

    const oppositeChoice = getOppositeCoinChoice(choice);

    const updatedPlayers: RoomPlayer[] = [
      {
        ...creator,
        tossChoice: oppositeChoice,
      },
      {
        ...partner,
        tossChoice: choice,
      },
    ];

    transaction.update(roomRef, {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Partner initiates the Royal Coin flip.
 * Coin result is generated exactly once using a Firestore transaction.
 * Winner is calculated and room advances to COLOR_SELECTION.
 */
export const flipRoyalCoin = async (
  roomId: string,
  partnerUid: string
): Promise<{ coinResult: CoinTossChoice; tossWinnerUid: string }> => {
  const roomRef = doc(db, 'rooms', roomId);

  return await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    if (room.status !== 'COIN_TOSS') {
      throw new Error('NOT_AUTHORIZED');
    }

    const creator = room.players[0];
    const partner = room.players[1];

    if (!partner || partner.uid !== partnerUid) {
      throw new Error('NOT_AUTHORIZED');
    }

    // Must have chosen heads or tails first
    if (!partner.tossChoice) {
      throw new Error('NOT_AUTHORIZED');
    }

    // Prevent double flips
    if (room.coinResult !== null) {
      throw new Error('COIN_ALREADY_FLIPPED');
    }

    // Generate single authoritative coin result
    const coinResult: CoinTossChoice = Math.random() < 0.5 ? 'HEADS' : 'TAILS';

    // Determine winner
    const tossWinnerUid =
      partner.tossChoice === coinResult ? partner.uid : creator.uid;

    transaction.update(roomRef, {
      coinResult,
      tossWinnerUid,
      status: 'COLOR_SELECTION',
      updatedAt: serverTimestamp(),
    });

    return { coinResult, tossWinnerUid };
  });
};

/**
 * Toss Winner selects WHITE or BLACK.
 * Opponent automatically receives the opposite color.
 * Handled via a Firestore transaction.
 */
export const assignChessColors = async (
  roomId: string,
  winnerUid: string,
  chosenColor: ChessSide
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    if (room.status !== 'COLOR_SELECTION') {
      throw new Error('NOT_AUTHORIZED');
    }

    // Only toss winner can choose
    if (room.tossWinnerUid !== winnerUid) {
      throw new Error('NOT_AUTHORIZED');
    }

    // Prevent re-selection
    if (room.players.some((p) => p.chessColor !== null)) {
      throw new Error('COLOR_ALREADY_CHOSEN');
    }

    const oppositeColor = getOppositeChessSide(chosenColor);

    const updatedPlayers = room.players.map((player) => {
      if (player.uid === winnerUid) {
        return { ...player, chessColor: chosenColor };
      }
      return { ...player, chessColor: oppositeColor };
    });

    // Validate exactly one WHITE and one BLACK
    const whites = updatedPlayers.filter((p) => p.chessColor === 'WHITE');
    const blacks = updatedPlayers.filter((p) => p.chessColor === 'BLACK');
    if (whites.length !== 1 || blacks.length !== 1) {
      throw new Error('INVALID_COLOR_ASSIGNMENT');
    }

    transaction.update(roomRef, {
      players: updatedPlayers,
      status: 'READY',
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Player sets READY status.
 * If both players are ready, room transitions to 'PLAYING' exactly once.
 * Handled via a Firestore transaction.
 */
export const setPlayerReady = async (roomId: string, uid: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    // If already playing, do nothing
    if (room.status === 'PLAYING') {
      return;
    }

    if (room.status !== 'READY') {
      throw new Error('NOT_AUTHORIZED');
    }

    const playerIndex = room.players.findIndex((p) => p.uid === uid);
    if (playerIndex === -1) {
      throw new Error('NOT_AUTHORIZED');
    }

    const updatedPlayers = room.players.map((p, idx) => {
      if (idx === playerIndex) {
        return { ...p, ready: true };
      }
      return p;
    });

    const bothReady =
      updatedPlayers.length === 2 && updatedPlayers.every((p) => p.ready === true);

    if (bothReady && (!room.gameState || !room.gameState.fen)) {
      transaction.update(roomRef, {
        players: updatedPlayers,
        status: 'PLAYING',
        'gameState.fen': INITIAL_CHESS_FEN,
        'gameState.turn': 'WHITE',
        'gameState.status': 'PLAYING',
        'gameState.checkedColor': null,
        'gameState.lastMove': null,
        'gameState.moveHistory': [],
        'gameState.moveNumber': 0,
        'gameState.version': 0,
        'gameState.winnerUid': null,
        'gameState.statsProcessed': false,
        'gameState.rematchRequest': null,
        'gameState.rematchCount': 0,
        'gameState.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.update(roomRef, {
        players: updatedPlayers,
        status: bothReady ? 'PLAYING' : 'READY',
        updatedAt: serverTimestamp(),
      });
    }
  });
};

/**
 * Leave Room
 * - If creator leaves during lobby stages: status = 'CANCELLED'
 * - If partner leaves: partner removed, toss/color state reset, room status returns to 'WAITING'
 */
export const leaveRoom = async (roomId: string, uid: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const room = roomSnap.data() as RoomDocument;
    if (room.status === 'CANCELLED' || room.status === 'FINISHED') return;

    const isCreator = room.createdBy === uid;
    const isPartner = room.players[1]?.uid === uid;

    if (isCreator) {
      // Room cancelled if host leaves
      transaction.update(roomRef, {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
      });
    } else if (isPartner) {
      // Reset room for creator if partner leaves
      const creator = room.players[0];
      const resetCreator: RoomPlayer = {
        ...creator,
        tossChoice: null,
        chessColor: null,
        ready: false,
      };

      transaction.update(roomRef, {
        players: [resetCreator],
        coinResult: null,
        tossWinnerUid: null,
        status: 'WAITING',
        updatedAt: serverTimestamp(),
      });
    }
  });
};

/**
 * Recovers active room for authenticated user on browser refresh
 */
export const findActiveRoomForUser = async (
  uid: string,
  preferredRoomId?: string | null
): Promise<RoomDocument | null> => {
  if (!uid) return null;

  // 1. Try preferred room ID first (e.g. from localStorage)
  if (preferredRoomId) {
    const room = await getRoom(preferredRoomId);
    if (
      room &&
      ['WAITING', 'COIN_TOSS', 'COLOR_SELECTION', 'READY', 'PLAYING', 'FINISHED'].includes(room.status) &&
      room.players.some((p) => p.uid === uid)
    ) {
      return room;
    }
  }

  // 2. Query Firestore collection for active rooms created by or containing this user
  try {
    const q = query(
      collection(db, 'rooms'),
      where('status', 'in', ['WAITING', 'COIN_TOSS', 'COLOR_SELECTION', 'READY', 'PLAYING', 'FINISHED'])
    );
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const room = docSnap.data() as RoomDocument;
      if (room.players.some((p) => p.uid === uid)) {
        return {
          ...room,
          roomId: docSnap.id,
        };
      }
    }
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[findActiveRoomForUser Error]', err);
    }
  }

  return null;
};

/**
 * Extracts normalized error code from Firebase Error or custom error object
 */
export const extractErrorCode = (error: any): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;

  const rawCode = error.code ? String(error.code).toLowerCase() : '';
  if (rawCode) {
    return rawCode.replace(/^(firestore|auth)\//, '');
  }

  const rawMsg = error.message ? String(error.message) : '';
  if (
    rawMsg.includes('permission-denied') ||
    rawMsg.includes('Missing or insufficient permissions') ||
    rawMsg.includes('permission')
  ) {
    return 'permission-denied';
  }
  if (rawMsg.includes('requires an index') || rawMsg.includes('failed-precondition')) {
    return 'failed-precondition';
  }
  if (rawMsg.includes('unauthenticated') || rawMsg.includes('sign in')) {
    return 'unauthenticated';
  }
  if (rawMsg.includes('unavailable') || rawMsg.includes('network') || rawMsg.includes('internet')) {
    return 'unavailable';
  }
  if (rawMsg.includes('not-found') || rawMsg.includes('does not exist')) {
    return 'not-found';
  }
  if (rawMsg.includes('already-exists')) {
    return 'already-exists';
  }

  return rawMsg;
};

/**
 * Friendly Error Mapping for Room Creation
 * NEVER returns "Unable to join the room."
 */
export const mapCreateRoomError = (error: any): string => {
  const code = extractErrorCode(error);

  switch (code) {
    case 'permission-denied':
      return 'Room access is not authorized. Check Firestore security rules.';
    case 'unauthenticated':
    case 'AUTH_REQUIRED':
      return 'Please sign in before creating a room.';
    case 'not-found':
    case 'ROOM_NOT_FOUND':
      return 'The requested room was not found.';
    case 'already-exists':
      return 'This room already exists. Please try again.';
    case 'unavailable':
      return 'Connection unavailable. Please check your internet.';
    case 'failed-precondition':
      return 'Room setup is incomplete. Please try again.';
    default:
      return 'Unable to create the room. Please try again.';
  }
};

/**
 * Friendly Error Mapping for Joining Room
 */
export const mapJoinRoomError = (error: any): string => {
  const code = extractErrorCode(error);

  switch (code) {
    case 'permission-denied':
      return 'Room access is not authorized. Check Firestore security rules.';
    case 'unauthenticated':
    case 'AUTH_REQUIRED':
      return 'Please sign in before joining a room.';
    case 'not-found':
    case 'ROOM_NOT_FOUND':
      return 'This room does not exist. Check the code and try again.';
    case 'ROOM_FULL':
      return 'This game already has two players.';
    case 'GAME_ALREADY_STARTED':
      return 'This game has already started.';
    case 'ALREADY_IN_ROOM':
      return 'You are already in this room.';
    case 'INVALID_CODE':
      return 'Enter a valid room code.';
    case 'COIN_ALREADY_FLIPPED':
      return 'The Royal Coin has already spoken.';
    case 'COLOR_ALREADY_CHOSEN':
      return 'The battlefield has already been decided.';
    case 'ROOM_CANCELLED':
      return 'This room is no longer available.';
    case 'PARTNER_LEFT':
      return 'Your partner has left the room.';
    case 'NOT_AUTHORIZED':
      return 'You are not allowed to perform this action.';
    case 'already-exists':
      return 'This room already exists. Please try again.';
    case 'unavailable':
      return 'Connection unavailable. Please check your internet.';
    case 'failed-precondition':
      return 'Room setup is incomplete. Please try again.';
    default:
      return 'Unable to join the room. Please try again.';
  }
};

/**
 * Context-aware Error Mapping
 */
export const mapRoomError = (error: any, context: 'create' | 'join' = 'join'): string => {
  return context === 'create' ? mapCreateRoomError(error) : mapJoinRoomError(error);
};

