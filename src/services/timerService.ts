/**
 * Authoritative Chess Timer Service
 * KING & QUEEN — Multiplayer Chess
 *
 * Implements timestamp-based timer calculations, time control presets,
 * professional clock formatting, and authoritative timeout victory transactions.
 */

import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  RoomDocument,
  TimeControlType,
  TimeControl,
  GameTimerDocument,
  ChessSide,
} from '../types';

/**
 * Standard Time Control Presets
 */
export const TIME_CONTROL_PRESETS: Record<TimeControlType, TimeControl> = {
  BULLET: {
    type: 'BULLET',
    initialTime: 60 * 1000, // 1 Minute
  },
  BLITZ: {
    type: 'BLITZ',
    initialTime: 3 * 60 * 1000, // 3 Minutes
  },
  RAPID: {
    type: 'RAPID',
    initialTime: 10 * 60 * 1000, // 10 Minutes (Default)
  },
  CLASSIC: {
    type: 'CLASSIC',
    initialTime: 15 * 60 * 1000, // 15 Minutes
  },
};

export const DEFAULT_TIME_CONTROL: TimeControl = TIME_CONTROL_PRESETS.RAPID;

/**
 * Normalizes any timestamp representation (Firestore Timestamp, Date, number, ISO string)
 * to milliseconds since epoch.
 */
export const getTimestampMs = (timestamp: any): number => {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Calculate elapsed milliseconds from a starting timestamp.
 */
export const calculateElapsed = (startedAt: any, nowMs = Date.now()): number => {
  const startMs = getTimestampMs(startedAt);
  if (!startMs) return 0;
  return Math.max(0, nowMs - startMs);
};

/**
 * Calculate the authoritative remaining time in milliseconds for a player color.
 * Pure function: Does NOT perform Firestore writes.
 */
export const calculateCurrentRemainingTime = (
  timer: GameTimerDocument | null | undefined,
  color: ChessSide,
  nowMs = Date.now()
): number => {
  if (!timer) {
    return DEFAULT_TIME_CONTROL.initialTime;
  }

  const storedTime = color === 'WHITE' ? timer.whiteTimeRemaining : timer.blackTimeRemaining;
  const clampedStored = Math.max(0, typeof storedTime === 'number' ? storedTime : DEFAULT_TIME_CONTROL.initialTime);

  // If timer is paused or stopped, or it is not this player's active turn, return stored value
  if (timer.status !== 'RUNNING' || timer.activeTimerColor !== color) {
    return clampedStored;
  }

  // Timer is actively running for this player: subtract elapsed time
  const elapsed = calculateElapsed(timer.timerStartedAt, nowMs);
  return Math.max(0, clampedStored - elapsed);
};

/**
 * Professional Chess Clock Formatter:
 * - >= 1 minute: MM:SS (e.g. "09:42")
 * - < 1 minute: MM:SS (e.g. "00:42")
 * - < 10 seconds: MM:SS.s (e.g. "00:09.8")
 */
export const formatChessTime = (remainingMs: number): string => {
  const safeMs = Math.max(0, Math.floor(remainingMs));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safeMs % 1000) / 100);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (safeMs < 10_000) {
    return `${mm}:${ss}.${tenths}`;
  }

  return `${mm}:${ss}`;
};

/**
 * Low Time Warnings:
 * - Subtle warning when remaining time <= 30 seconds
 * - Urgent warning when remaining time <= 10 seconds
 */
export const isLowTime = (remainingMs: number): boolean => {
  return remainingMs <= 30_000 && remainingMs > 0;
};

export const isUrgentTime = (remainingMs: number): boolean => {
  return remainingMs <= 10_000 && remainingMs > 0;
};

export const isTimeExpired = (remainingMs: number): boolean => {
  return remainingMs <= 0;
};

/**
 * Authoritative timeout victory transaction inside rooms/{roomId}.
 *
 * Validates:
 * 1. Room exists and is in PLAYING status.
 * 2. Timer status is RUNNING.
 * 3. Claimant is a verified room participant.
 * 4. Claimant is the opponent of the active player (cannot claim against self).
 * 5. Opponent's chess clock has legitimately reached 0 (authoritative check against stored timerStartedAt).
 * 6. Game has not already finished.
 *
 * Atomically finishes the game with endReason 'TIMEOUT' and awards victory to the claimant.
 */
export const claimTimeoutVictory = async (
  roomId: string,
  claimantUid: string
): Promise<void> => {
  if (!roomId || !claimantUid) {
    throw new Error('INVALID_ARGUMENTS');
  }

  const roomRef = doc(db, 'rooms', roomId);

  if (import.meta.env?.DEV) {
    console.log(`[Timer] Timeout victory claim initiated by ${claimantUid} for room ${roomId}`);
  }

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    // 1. Validate game status is active
    if (room.status !== 'PLAYING' && room.status !== 'READY') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    const gameState = room.gameState;
    if (!gameState) {
      throw new Error('GAME_NOT_INITIALIZED');
    }

    if (
      gameState.status === 'FINISHED' ||
      gameState.status === 'CHECKMATE' ||
      gameState.status === 'DRAW' ||
      gameState.status === 'STALEMATE'
    ) {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    // 2. Validate timer status
    const timer = gameState.timer;
    if (!timer || timer.status !== 'RUNNING' || !timer.activeTimerColor) {
      throw new Error('TIMER_NOT_RUNNING');
    }

    // 3. Validate claimant belongs to room
    const claimant = room.players.find((p) => p.uid === claimantUid);
    if (!claimant || !claimant.chessColor) {
      throw new Error('NOT_ROOM_PARTICIPANT');
    }

    // 4. Validate opponent
    const opponent = room.players.find((p) => p.uid !== claimantUid);
    if (!opponent || !opponent.chessColor) {
      throw new Error('OPPONENT_NOT_FOUND');
    }

    // 5. Prevent claiming victory against oneself
    if (timer.activeTimerColor === claimant.chessColor) {
      throw new Error('CANNOT_CLAIM_OWN_TIMEOUT');
    }

    // 6. Verify opponent is the active player whose turn it is
    if (timer.activeTimerColor !== opponent.chessColor) {
      throw new Error('NOT_OPPONENT_TURN');
    }

    // 7. Authoritatively verify that opponent's time has reached 0
    const now = Date.now();
    const opponentRemaining = calculateCurrentRemainingTime(timer, opponent.chessColor, now);

    if (opponentRemaining > 0) {
      throw new Error('TIMER_NOT_EXPIRED');
    }

    if (import.meta.env?.DEV) {
      console.log(`[Timer] Timeout verified for ${opponent.chessColor} (${opponent.uid}). Awarding win to ${claimantUid}`);
    }

    // 8. Atomically update gameState and room status
    transaction.update(roomRef, {
      'gameState.status': 'FINISHED',
      'gameState.endReason': 'TIMEOUT',
      'gameState.winnerUid': claimantUid,
      'gameState.timer.status': 'STOPPED',
      'gameState.timer.whiteTimeRemaining':
        opponent.chessColor === 'WHITE' ? 0 : timer.whiteTimeRemaining,
      'gameState.timer.blackTimeRemaining':
        opponent.chessColor === 'BLACK' ? 0 : timer.blackTimeRemaining,
      'gameState.finishedAt': serverTimestamp(),
      'gameState.updatedAt': serverTimestamp(),
      status: 'FINISHED',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log('[Timer] Timeout victory claimed');
      console.log('[Timer] Game finished');
    }
  });
};

/**
 * User-friendly mapping for timer-related errors
 */
export const mapTimerError = (error: any): string => {
  const code = error?.message || error?.code || '';

  switch (code) {
    case 'TIME_EXPIRED':
      return 'Your time has expired. You cannot make a move.';
    case 'TIMER_NOT_EXPIRED':
      return 'Opponent clock has not expired yet.';
    case 'CANNOT_CLAIM_OWN_TIMEOUT':
      return 'You cannot claim a timeout victory on your own clock.';
    case 'UNAUTHORIZED_CLAIM':
      return 'Only the opponent can claim timeout victory.';
    case 'NOT_OPPONENT_TURN':
      return "It is not your opponent's turn.";
    case 'GAME_ALREADY_FINISHED':
      return 'This battle has already concluded.';
    case 'NOT_ROOM_PARTICIPANT':
      return 'You are not a participant in this match.';
    default:
      return 'An error occurred with the battle timer.';
  }
};
