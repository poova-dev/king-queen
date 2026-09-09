/**
 * Presence & Reconnection Service
 * KING & QUEEN — Real-time Multiplayer Chess
 *
 * Manages player presence, disconnect grace period (60s), and authoritative
 * victory claims when an opponent abandons the battle.
 */

import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RoomDocument, PlayerConnectionStatus } from '../types';
import { calculateCurrentRemainingTime } from './timerService';

export const DISCONNECT_GRACE_PERIOD = 60_000; // 60 seconds

/**
 * Marks a player ONLINE in the room and cancels any active disconnect grace period
 * if this player was previously marked disconnected.
 */
export const markPlayerOnline = async (roomId: string, uid: string): Promise<void> => {
  if (!roomId || !uid) return;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) return;

      const roomData = roomSnap.data() as RoomDocument;
      const playerIndex = roomData.players.findIndex((p) => p.uid === uid);
      if (playerIndex === -1) return;

      const player = roomData.players[playerIndex];
      const disconnectState = roomData.gameState?.disconnectState;
      const wasDisconnected = disconnectState?.disconnectedUid === uid;

      // Only write if state actually changed to prevent unnecessary writes
      if (player.connectionStatus === 'ONLINE' && !wasDisconnected) {
        return;
      }

      const updatedPlayers = [...roomData.players];
      updatedPlayers[playerIndex] = {
        ...player,
        connectionStatus: 'ONLINE',
        lastSeenAt: Date.now(),
      };

      const updatePayload: Record<string, any> = {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      };

      // If this returning player had an active disconnect state, cancel it
      if (wasDisconnected && roomData.gameState && roomData.gameState.status === 'PLAYING') {
        updatePayload['gameState.disconnectState'] = {
          status: 'NONE',
          disconnectedUid: null,
          disconnectedAt: null,
          graceExpiresAt: null,
        };

        // Resume timer if it was paused for disconnect
        if (roomData.gameState.timer && roomData.gameState.timer.status === 'PAUSED') {
          updatePayload['gameState.timer.status'] = 'RUNNING';
          updatePayload['gameState.timer.timerStartedAt'] = serverTimestamp();
          updatePayload['gameState.timer.timerPausedAt'] = null;
          if (import.meta.env?.DEV) {
            console.log('[Timer] Resumed after reconnect');
          }
        }

        if (import.meta.env?.DEV) {
          console.info(`[Presence] Player ${uid} reconnected. Disconnect state cleared.`);
        }
      }

      transaction.update(roomRef, updatePayload);
    });
  } catch (err: any) {
    if (import.meta.env?.DEV) {
      console.warn('[markPlayerOnline Error]', err?.message || err);
    }
  }
};

/**
 * Marks a player RECONNECTING and initiates the 60-second disconnect grace period
 * if the game is actively playing.
 */
export const markPlayerReconnecting = async (roomId: string, uid: string): Promise<void> => {
  if (!roomId || !uid) return;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) return;

      const roomData = roomSnap.data() as RoomDocument;
      if (roomData.status !== 'PLAYING') return;

      const playerIndex = roomData.players.findIndex((p) => p.uid === uid);
      if (playerIndex === -1) return;

      const updatedPlayers = [...roomData.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        connectionStatus: 'RECONNECTING',
        lastSeenAt: Date.now(),
      };

      const updatePayload: Record<string, any> = {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      };

      // Start grace period if not already running for this player
      const existingDisconnect = roomData.gameState?.disconnectState;
      if (
        roomData.gameState &&
        roomData.gameState.status === 'PLAYING' &&
        (!existingDisconnect || existingDisconnect.status === 'NONE')
      ) {
        const now = Date.now();
        const expiresAt = now + DISCONNECT_GRACE_PERIOD;

        updatePayload['gameState.disconnectState'] = {
          status: 'WAITING_FOR_RECONNECT',
          disconnectedUid: uid,
          disconnectedAt: now,
          graceExpiresAt: expiresAt,
        };

        // Pause timer during disconnect grace period so chess time is not consumed
        const timer = roomData.gameState.timer;
        if (timer && timer.status === 'RUNNING' && timer.activeTimerColor) {
          const remaining = calculateCurrentRemainingTime(timer, timer.activeTimerColor, now);
          if (timer.activeTimerColor === 'WHITE') {
            updatePayload['gameState.timer.whiteTimeRemaining'] = remaining;
          } else {
            updatePayload['gameState.timer.blackTimeRemaining'] = remaining;
          }
          updatePayload['gameState.timer.status'] = 'PAUSED';
          updatePayload['gameState.timer.timerPausedAt'] = serverTimestamp();
          if (import.meta.env?.DEV) {
            console.log('[Timer] Paused for disconnect');
          }
        }

        if (import.meta.env?.DEV) {
          console.info(
            `[Presence] Disconnect grace period started for ${uid}. Expires in ${DISCONNECT_GRACE_PERIOD / 1000}s`
          );
        }
      }

      transaction.update(roomRef, updatePayload);
    });
  } catch (err: any) {
    if (import.meta.env?.DEV) {
      console.warn('[markPlayerReconnecting Error]', err?.message || err);
    }
  }
};

/**
 * Authoritative transaction to start a disconnect grace period for an opponent
 * when a client detects their opponent's connection failure.
 */
export const startDisconnectGracePeriod = async (
  roomId: string,
  disconnectedUid: string
): Promise<void> => {
  if (!roomId || !disconnectedUid) return;
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) throw new Error('ROOM_NOT_FOUND');

    const room = roomSnap.data() as RoomDocument;
    if (room.status !== 'PLAYING' || !room.gameState || room.gameState.status !== 'PLAYING') {
      return; // Game already concluded
    }

    const currentDisconnect = room.gameState.disconnectState;
    if (currentDisconnect && currentDisconnect.status === 'WAITING_FOR_RECONNECT') {
      return; // Grace period already active
    }

    const now = Date.now();
    const expiresAt = now + DISCONNECT_GRACE_PERIOD;

    const updatePayload: Record<string, any> = {
      'gameState.disconnectState': {
        status: 'WAITING_FOR_RECONNECT',
        disconnectedUid,
        disconnectedAt: now,
        graceExpiresAt: expiresAt,
      },
      updatedAt: serverTimestamp(),
    };

    // Pause timer during disconnect grace period so chess time is not consumed
    const timer = room.gameState.timer;
    if (timer && timer.status === 'RUNNING' && timer.activeTimerColor) {
      const remaining = calculateCurrentRemainingTime(timer, timer.activeTimerColor, now);
      if (timer.activeTimerColor === 'WHITE') {
        updatePayload['gameState.timer.whiteTimeRemaining'] = remaining;
      } else {
        updatePayload['gameState.timer.blackTimeRemaining'] = remaining;
      }
      updatePayload['gameState.timer.status'] = 'PAUSED';
      updatePayload['gameState.timer.timerPausedAt'] = serverTimestamp();
      if (import.meta.env?.DEV) {
        console.log('[Timer] Paused for disconnect');
      }
    }

    transaction.update(roomRef, updatePayload);
  });
};

/**
 * Authoritative transaction allowing a player to claim victory after their opponent
 * has disconnected and the 60-second grace period has fully expired.
 */
export const claimVictoryForDisconnect = async (
  roomId: string,
  claimantUid: string
): Promise<void> => {
  if (!roomId || !claimantUid) throw new Error('INVALID_ARGUMENTS');

  if (import.meta.env?.DEV) {
    console.info(`[Presence] Claiming victory for disconnect in room ${roomId} by ${claimantUid}`);
  }

  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    // 1. Validate room & game playing state
    if (room.status !== 'PLAYING' || !room.gameState || room.gameState.status !== 'PLAYING') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    // 2. Validate claimant is room participant
    const isP1 = room.players[0]?.uid === claimantUid;
    const isP2 = room.players[1]?.uid === claimantUid;
    if (!isP1 && !isP2) {
      throw new Error('NOT_ROOM_PARTICIPANT');
    }

    const opponentUid = isP1 ? room.players[1]?.uid : room.players[0]?.uid;
    if (!opponentUid) {
      throw new Error('OPPONENT_NOT_FOUND');
    }

    // 3. Validate disconnect state exists
    const disconnectState = room.gameState.disconnectState;
    if (!disconnectState || disconnectState.status === 'NONE') {
      throw new Error('OPPONENT_NOT_DISCONNECTED');
    }

    // 4. Validate disconnected user is opponent, not claimant
    if (disconnectState.disconnectedUid !== opponentUid) {
      throw new Error('INVALID_VICTORY_CLAIM');
    }

    // 5. Authoritatively verify grace period has passed
    const now = Date.now();
    let expiresAtMs = 0;
    if (typeof disconnectState.graceExpiresAt === 'number') {
      expiresAtMs = disconnectState.graceExpiresAt;
    } else if (disconnectState.graceExpiresAt?.toMillis) {
      expiresAtMs = disconnectState.graceExpiresAt.toMillis();
    } else if (disconnectState.graceExpiresAt) {
      expiresAtMs = Number(disconnectState.graceExpiresAt);
    }

    if (now < expiresAtMs) {
      throw new Error('GRACE_PERIOD_ACTIVE');
    }

    // 6. Atomically update room and gameState to FINISHED
    transaction.update(roomRef, {
      'gameState.status': 'FINISHED',
      'gameState.endReason': 'ABANDONED',
      'gameState.winnerUid': claimantUid,
      'gameState.disconnectedUid': opponentUid,
      'gameState.disconnectState.status': 'EXPIRED',
      'gameState.timer.status': 'STOPPED',
      'gameState.finishedAt': serverTimestamp(),
      'gameState.updatedAt': serverTimestamp(),
      'room.status': 'FINISHED',
      status: 'FINISHED',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log('[Timer] Game finished');
    }

    if (import.meta.env?.DEV) {
      console.info(
        `[Presence] Victory authoritatively claimed by ${claimantUid} against ${opponentUid} (ABANDONED)`
      );
    }
  });
};

/**
 * User-friendly mapping for presence and connection errors
 */
export const mapConnectionError = (error: any): string => {
  const code = error?.message || error?.code || '';

  switch (code) {
    case 'CONNECTION_LOST':
      return 'Your internet connection was interrupted.';
    case 'RECONNECTION_FAILED':
      return 'Unable to restore the battle connection.';
    case 'OPPONENT_NOT_DISCONNECTED':
      return 'Your opponent is already back online.';
    case 'GRACE_PERIOD_ACTIVE':
      return 'The reconnection period has not expired yet.';
    case 'INVALID_VICTORY_CLAIM':
      return 'You cannot claim victory at this time.';
    case 'GAME_ALREADY_FINISHED':
      return 'This battle has already ended.';
    case 'NOT_ROOM_PARTICIPANT':
      return 'You are not part of this battle.';
    default:
      return 'Network connection issue. Please try again.';
  }
};
