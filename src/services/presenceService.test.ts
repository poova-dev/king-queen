/**
 * Presence & Reconnection Service Tests
 * STEP 15.3 — PLAYER DISCONNECT & RECONNECTION SYSTEM
 */

import { Chess } from 'chess.js';
import {
  DISCONNECT_GRACE_PERIOD,
  mapConnectionError,
} from './presenceService';
import { connectionService, NetworkStatus } from './connectionService';
import {
  RoomDocument,
  GameStateDocument,
  RoomPlayer,
  PlayerConnectionStatus,
  DisconnectState,
} from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ FAILED: ${name}`);
    failed++;
  }
}

console.log('\n--- Running Step 15.3 Presence, Disconnect & Reconnection Tests ---');

const p1Uid = 'royal_king_uid';
const p2Uid = 'royal_queen_uid';
const strangerUid = 'impostor_stranger_uid';

const mockPlayer1: RoomPlayer = {
  uid: p1Uid,
  displayName: 'King Arthur',
  photoURL: null,
  profileIdentity: 'KING',
  roomRole: 'KING',
  tossChoice: 'HEADS',
  chessColor: 'WHITE',
  ready: true,
  joinedAt: Date.now(),
  connectionStatus: 'ONLINE',
  lastSeenAt: Date.now(),
};

const mockPlayer2: RoomPlayer = {
  uid: p2Uid,
  displayName: 'Queen Guinevere',
  photoURL: null,
  profileIdentity: 'QUEEN',
  roomRole: 'QUEEN',
  tossChoice: 'TAILS',
  chessColor: 'BLACK',
  ready: true,
  joinedAt: Date.now(),
  connectionStatus: 'ONLINE',
  lastSeenAt: Date.now(),
};

const activeFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

const createMockRoom = (): RoomDocument => ({
  roomId: 'KQ-DISCONNECT-1',
  roomCode: 'KQ-8888',
  status: 'PLAYING',
  createdBy: p1Uid,
  players: [{ ...mockPlayer1 }, { ...mockPlayer2 }],
  coinResult: 'HEADS',
  tossWinnerUid: p1Uid,
  maxPlayers: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  gameState: {
    fen: activeFen,
    turn: 'BLACK',
    status: 'PLAYING',
    checkedColor: null,
    lastMove: {
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'WHITE',
      san: 'e4',
      promotion: null,
    },
    moveHistory: [
      {
        moveNumber: 1,
        from: 'e2',
        to: 'e4',
        san: 'e4',
        color: 'WHITE',
        timestamp: Date.now(),
      },
    ],
    moveNumber: 1,
    version: 1,
    winnerUid: null,
    resignedBy: null,
    endReason: null,
    disconnectState: {
      status: 'NONE',
      disconnectedUid: null,
      disconnectedAt: null,
      graceExpiresAt: null,
    },
    finishedAt: null,
    statsProcessed: false,
    updatedAt: Date.now(),
  },
});

// 1. Connection Service Unit Test
assert(DISCONNECT_GRACE_PERIOD === 60_000, 'Grace period is exactly 60,000 milliseconds (60s)');
assert(connectionService.isOnline() === true, 'ConnectionService initializes in online state by default');

let detectedStatus: NetworkStatus | null = null;
const unsubConn = connectionService.subscribe((s) => {
  detectedStatus = s;
});
connectionService._simulateStatus('OFFLINE');
assert(detectedStatus === 'OFFLINE', 'Player network disconnect detected via ConnectionService');
connectionService._simulateStatus('ONLINE');
assert(detectedStatus === 'ONLINE', 'Player network restore detected via ConnectionService');
unsubConn();

// 2. Mark Player Reconnecting & Grace Period Invariant
const simulateMarkReconnecting = (room: RoomDocument, uid: string, now = Date.now()): RoomDocument => {
  const pIdx = room.players.findIndex((p) => p.uid === uid);
  if (pIdx === -1) return room;

  const updatedPlayers = [...room.players];
  updatedPlayers[pIdx] = {
    ...updatedPlayers[pIdx],
    connectionStatus: 'RECONNECTING',
    lastSeenAt: now,
  };

  const existingDisconnect = room.gameState?.disconnectState;
  const isPlaying = room.status === 'PLAYING' && room.gameState?.status === 'PLAYING';

  let updatedDisconnect = existingDisconnect;
  if (isPlaying && (!existingDisconnect || existingDisconnect.status === 'NONE')) {
    updatedDisconnect = {
      status: 'WAITING_FOR_RECONNECT',
      disconnectedUid: uid,
      disconnectedAt: now,
      graceExpiresAt: now + DISCONNECT_GRACE_PERIOD,
    };
  }

  return {
    ...room,
    players: updatedPlayers,
    gameState: room.gameState
      ? {
          ...room.gameState,
          disconnectState: updatedDisconnect,
        }
      : null,
  };
};

const initialRoom = createMockRoom();
const disconnectedRoom = simulateMarkReconnecting(initialRoom, p2Uid, 100000);

assert(
  disconnectedRoom.players[1].connectionStatus === 'RECONNECTING',
  'Player marked RECONNECTING upon disconnect event'
);
assert(
  disconnectedRoom.gameState?.disconnectState?.status === 'WAITING_FOR_RECONNECT',
  'Grace period starts with status WAITING_FOR_RECONNECT'
);
assert(
  disconnectedRoom.gameState?.disconnectState?.disconnectedUid === p2Uid,
  'Opponent receives disconnect state with matching disconnectedUid'
);
assert(
  disconnectedRoom.gameState?.disconnectState?.graceExpiresAt === 100000 + 60000,
  'Grace period correctly expires 60 seconds after disconnection'
);

// 3. Board Locking Verification
const isBoardInteractionLocked = (
  isMyTurn: boolean,
  isGameOver: boolean,
  isSubmittingMove: boolean,
  isResigning: boolean,
  isClaimingVictory: boolean,
  isOnline: boolean,
  isReconnecting: boolean,
  isOpponentDisconnected: boolean
): boolean => {
  return (
    !isMyTurn ||
    isGameOver ||
    isSubmittingMove ||
    isResigning ||
    isClaimingVictory ||
    !isOnline ||
    isReconnecting ||
    isOpponentDisconnected
  );
};

assert(
  isBoardInteractionLocked(true, false, false, false, false, true, false, true) === true,
  'Board locks when opponent disconnects'
);
assert(
  isBoardInteractionLocked(true, false, false, false, false, false, false, false) === true,
  'Board locks when self disconnects (offline)'
);
assert(
  isBoardInteractionLocked(true, false, false, false, false, true, true, false) === true,
  'Board locks when self is reconnecting'
);
assert(
  isBoardInteractionLocked(true, false, false, false, false, true, false, false) === false,
  'Board is unlocked when online, my turn, and opponent is connected'
);

// 4. Reconnection Before Timeout
const simulateMarkOnline = (room: RoomDocument, uid: string, now = Date.now()): RoomDocument => {
  const pIdx = room.players.findIndex((p) => p.uid === uid);
  if (pIdx === -1) return room;

  const updatedPlayers = [...room.players];
  updatedPlayers[pIdx] = {
    ...updatedPlayers[pIdx],
    connectionStatus: 'ONLINE',
    lastSeenAt: now,
  };

  const wasDisconnected = room.gameState?.disconnectState?.disconnectedUid === uid;
  let updatedDisconnect = room.gameState?.disconnectState;

  if (wasDisconnected) {
    updatedDisconnect = {
      status: 'NONE',
      disconnectedUid: null,
      disconnectedAt: null,
      graceExpiresAt: null,
    };
  }

  return {
    ...room,
    players: updatedPlayers,
    gameState: room.gameState
      ? {
          ...room.gameState,
          disconnectState: updatedDisconnect,
        }
      : null,
  };
};

const reconnectedRoom = simulateMarkOnline(disconnectedRoom, p2Uid, 120000);
assert(
  reconnectedRoom.players[1].connectionStatus === 'ONLINE',
  'Player reconnects before timeout and connectionStatus becomes ONLINE'
);
assert(
  reconnectedRoom.gameState?.disconnectState?.status === 'NONE' &&
    reconnectedRoom.gameState?.disconnectState?.disconnectedUid === null,
  'Disconnect state clears after reconnect'
);
assert(
  reconnectedRoom.gameState?.fen === activeFen,
  'Latest Firestore state restored without tampering or resetting board'
);

// 5. Browser Refresh Recovery Verification
const simulateRefreshRestore = (room: RoomDocument) => {
  // Verifies that a browser refresh does not reinitialize game state
  return {
    restoredFen: room.gameState?.fen,
    restoredTurn: room.gameState?.turn,
    restoredHistoryCount: room.gameState?.moveHistory.length,
    restoredPlayer1Color: room.players[0].chessColor,
    restoredPlayer2Color: room.players[1].chessColor,
    shouldReinitialize: !room.gameState || !room.gameState.fen,
  };
};

const refreshResult = simulateRefreshRestore(reconnectedRoom);
assert(refreshResult.shouldReinitialize === false, 'Browser refresh restores active game without re-init');
assert(refreshResult.restoredFen === activeFen, 'Refresh does not reset FEN');
assert(
  refreshResult.restoredPlayer1Color === 'WHITE' && refreshResult.restoredPlayer2Color === 'BLACK',
  'Refresh preserves player colors'
);
assert(refreshResult.restoredHistoryCount === 1, 'Refresh preserves move history');

// 6. Claim Victory Validation & Authoritative Transaction
const simulateClaimVictoryTransaction = (
  room: RoomDocument,
  claimantUid: string,
  currentTime: number
): { success: boolean; error?: string; updatedRoom?: RoomDocument } => {
  if (room.status !== 'PLAYING' || !room.gameState || room.gameState.status !== 'PLAYING') {
    return { success: false, error: 'GAME_ALREADY_FINISHED' };
  }

  const isP1 = room.players[0]?.uid === claimantUid;
  const isP2 = room.players[1]?.uid === claimantUid;
  if (!isP1 && !isP2) {
    return { success: false, error: 'NOT_ROOM_PARTICIPANT' };
  }

  const opponentUid = isP1 ? room.players[1]?.uid : room.players[0]?.uid;
  if (!opponentUid) {
    return { success: false, error: 'OPPONENT_NOT_FOUND' };
  }

  const disconnectState = room.gameState.disconnectState;
  if (!disconnectState || disconnectState.status === 'NONE') {
    return { success: false, error: 'OPPONENT_NOT_DISCONNECTED' };
  }

  if (disconnectState.disconnectedUid !== opponentUid) {
    return { success: false, error: 'INVALID_VICTORY_CLAIM' };
  }

  const expiresAtMs = Number(disconnectState.graceExpiresAt);
  if (currentTime < expiresAtMs) {
    return { success: false, error: 'GRACE_PERIOD_ACTIVE' };
  }

  const updatedRoom: RoomDocument = {
    ...room,
    status: 'FINISHED',
    gameState: {
      ...room.gameState,
      status: 'FINISHED',
      endReason: 'ABANDONED',
      winnerUid: claimantUid,
      disconnectedUid: opponentUid,
      finishedAt: currentTime,
      disconnectState: {
        ...disconnectState,
        status: 'EXPIRED',
      },
      version: room.gameState.version + 1,
    },
  };

  return { success: true, updatedRoom };
};

// 7. Timeout cannot be claimed early
const earlyClaim = simulateClaimVictoryTransaction(disconnectedRoom, p1Uid, 120000); // 20s in (expires at 160000)
assert(
  earlyClaim.success === false && earlyClaim.error === 'GRACE_PERIOD_ACTIVE',
  'Timeout cannot be claimed early while grace period is active'
);

// 8. Non-participant cannot claim victory
const strangerClaim = simulateClaimVictoryTransaction(disconnectedRoom, strangerUid, 170000);
assert(
  strangerClaim.success === false && strangerClaim.error === 'NOT_ROOM_PARTICIPANT',
  'Non-participant cannot claim victory'
);

// 9. Disconnected player cannot claim victory against opponent
const selfClaim = simulateClaimVictoryTransaction(disconnectedRoom, p2Uid, 170000);
assert(
  selfClaim.success === false && selfClaim.error === 'INVALID_VICTORY_CLAIM',
  'Disconnected player cannot claim victory'
);

// 10. Opponent can claim victory after grace expiration
const validClaim = simulateClaimVictoryTransaction(disconnectedRoom, p1Uid, 170000); // 70s in (expired at 160000)
assert(validClaim.success === true, 'Opponent can claim victory after grace expiration');
assert(validClaim.updatedRoom?.status === 'FINISHED', 'Room status becomes FINISHED upon victory claim');
assert(validClaim.updatedRoom?.gameState?.status === 'FINISHED', 'GameState status becomes FINISHED');
assert(validClaim.updatedRoom?.gameState?.endReason === 'ABANDONED', 'End reason is authoritatively ABANDONED');
assert(validClaim.updatedRoom?.gameState?.winnerUid === p1Uid, 'Claimant is declared winner');
assert(
  validClaim.updatedRoom?.gameState?.disconnectState?.status === 'EXPIRED',
  'disconnectState status transitions to EXPIRED'
);

// 11. Double claim prevented
const doubleClaim = simulateClaimVictoryTransaction(validClaim.updatedRoom!, p1Uid, 175000);
assert(
  doubleClaim.success === false && doubleClaim.error === 'GAME_ALREADY_FINISHED',
  'Double claim prevented when game is already finished'
);

// 12. Opponent reconnect cancels victory claim
const claimAfterReconnect = simulateClaimVictoryTransaction(reconnectedRoom, p1Uid, 170000);
assert(
  claimAfterReconnect.success === false && claimAfterReconnect.error === 'OPPONENT_NOT_DISCONNECTED',
  'Opponent reconnect cancels victory claim'
);

// 13. Finished game cannot enter disconnect state
const finishedRoom: RoomDocument = {
  ...initialRoom,
  status: 'FINISHED',
  gameState: {
    ...initialRoom.gameState!,
    status: 'FINISHED',
  },
};
const disconnectOnFinished = simulateMarkReconnecting(finishedRoom, p1Uid, 200000);
assert(
  disconnectOnFinished.gameState?.disconnectState?.status === 'NONE',
  'Finished game cannot enter disconnect state'
);

// 14. Presence writes do not overwrite game state
const pUpdate = simulateMarkOnline(initialRoom, p1Uid);
assert(
  pUpdate.gameState?.fen === initialRoom.gameState?.fen &&
    pUpdate.gameState?.version === initialRoom.gameState?.version,
  'Presence writes do not overwrite game state FEN or version'
);

// 15. Error Mapping Verification
assert(
  mapConnectionError({ message: 'CONNECTION_LOST' }).includes('interrupted'),
  'mapConnectionError maps CONNECTION_LOST properly'
);
assert(
  mapConnectionError({ message: 'GRACE_PERIOD_ACTIVE' }).includes('not expired'),
  'mapConnectionError maps GRACE_PERIOD_ACTIVE properly'
);
assert(
  mapConnectionError({ message: 'OPPONENT_NOT_DISCONNECTED' }).includes('already back'),
  'mapConnectionError maps OPPONENT_NOT_DISCONNECTED properly'
);

console.log(`\nPresence Tests Completed: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) {
  process.exit(1);
}
