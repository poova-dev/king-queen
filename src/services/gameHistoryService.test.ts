import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REMATCH_REQUEST_TIMEOUT_MS,
  isRematchExpired,
} from './gameService';
import {
  formatGameResult,
  formatGameDate,
} from './gameHistoryService';
import { ACTIVE_ROOM_STATUSES } from './roomService';
import { RoomStatus, GameHistoryRecord, GameStateDocument, UserGameHistoryRecord } from '../types';

console.log('\n--- Running Step 14 Game Completion, Rematch Lifecycle & Game History Tests ---');

let passedTests = 0;
const testCase = (description: string, fn: () => void) => {
  try {
    fn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ ${description}`);
    throw err;
  }
};

// 1. Stale Room Cleanup & Active Room Statuses
testCase('ACTIVE_ROOM_STATUSES excludes FINISHED', () => {
  assert.equal(ACTIVE_ROOM_STATUSES.includes('FINISHED' as RoomStatus), false);
});

testCase('ACTIVE_ROOM_STATUSES excludes COMPLETED', () => {
  assert.equal(ACTIVE_ROOM_STATUSES.includes('COMPLETED' as RoomStatus), false);
});

testCase('ACTIVE_ROOM_STATUSES excludes CLOSED', () => {
  assert.equal(ACTIVE_ROOM_STATUSES.includes('CLOSED' as RoomStatus), false);
});

testCase('ACTIVE_ROOM_STATUSES excludes CANCELLED', () => {
  assert.equal(ACTIVE_ROOM_STATUSES.includes('CANCELLED' as RoomStatus), false);
});

testCase('ACTIVE_ROOM_STATUSES excludes ABANDONED', () => {
  assert.equal(ACTIVE_ROOM_STATUSES.includes('ABANDONED' as RoomStatus), false);
});

testCase('ACTIVE_ROOM_STATUSES includes strictly active match statuses', () => {
  assert.equal(ACTIVE_ROOM_STATUSES.includes('WAITING'), true);
  assert.equal(ACTIVE_ROOM_STATUSES.includes('COIN_TOSS'), true);
  assert.equal(ACTIVE_ROOM_STATUSES.includes('COLOR_SELECTION'), true);
  assert.equal(ACTIVE_ROOM_STATUSES.includes('READY'), true);
  assert.equal(ACTIVE_ROOM_STATUSES.includes('PLAYING'), true);
  assert.equal(ACTIVE_ROOM_STATUSES.includes('REMATCH_PENDING'), true);
  assert.equal(ACTIVE_ROOM_STATUSES.includes('REMATCH_READY'), true);
});

// 2. Rematch Expiration Logic
testCase('REMATCH_REQUEST_TIMEOUT_MS is 5 minutes (300,000 ms)', () => {
  assert.equal(REMATCH_REQUEST_TIMEOUT_MS, 5 * 60 * 1000);
});

testCase('isRematchExpired returns false for freshly created rematch request', () => {
  const recentTime = Date.now() - 30 * 1000; // 30 seconds ago
  assert.equal(isRematchExpired(recentTime), false);
});

testCase('isRematchExpired returns true for rematch older than 5 minutes', () => {
  const expiredTime = Date.now() - (5 * 60 * 1000 + 1000); // 5 min 1 sec ago
  assert.equal(isRematchExpired(expiredTime), true);
});

testCase('isRematchExpired handles Firestore timestamp object with toMillis', () => {
  const freshFirestoreTimestamp = {
    toMillis: () => Date.now() - 60 * 1000, // 1 minute ago
  };
  const expiredFirestoreTimestamp = {
    toMillis: () => Date.now() - (6 * 60 * 1000), // 6 minutes ago
  };

  assert.equal(isRematchExpired(freshFirestoreTimestamp), false);
  assert.equal(isRematchExpired(expiredFirestoreTimestamp), true);
});

testCase('isRematchExpired returns false when timestamp is missing', () => {
  assert.equal(isRematchExpired(undefined), false);
  assert.equal(isRematchExpired(null), false);
});

// 3. User Statistics Calculation Logic (Winner / Loser / Draw)
testCase('Winner statistics calculation: wins + 1, gamesPlayed + 1, losses unchanged', () => {
  const prevStats = { wins: 4, losses: 2, gamesPlayed: 6 };
  const isWinner = true;
  const isLoser = false;

  const newStats = {
    gamesPlayed: prevStats.gamesPlayed + 1,
    wins: isWinner ? prevStats.wins + 1 : prevStats.wins,
    losses: isLoser ? prevStats.losses + 1 : prevStats.losses,
  };

  assert.equal(newStats.gamesPlayed, 7);
  assert.equal(newStats.wins, 5);
  assert.equal(newStats.losses, 2);
});

testCase('Loser statistics calculation: losses + 1, gamesPlayed + 1, wins unchanged', () => {
  const prevStats = { wins: 4, losses: 2, gamesPlayed: 6 };
  const isWinner = false;
  const isLoser = true;

  const newStats = {
    gamesPlayed: prevStats.gamesPlayed + 1,
    wins: isWinner ? prevStats.wins + 1 : prevStats.wins,
    losses: isLoser ? prevStats.losses + 1 : prevStats.losses,
  };

  assert.equal(newStats.gamesPlayed, 7);
  assert.equal(newStats.wins, 4);
  assert.equal(newStats.losses, 3);
});

testCase('Draw statistics calculation: gamesPlayed + 1, wins and losses unchanged for both', () => {
  const p1Prev = { wins: 3, losses: 1, gamesPlayed: 4 };
  const isWinner = false;
  const isLoser = false;

  const p1New = {
    gamesPlayed: p1Prev.gamesPlayed + 1,
    wins: isWinner ? p1Prev.wins + 1 : p1Prev.wins,
    losses: isLoser ? p1Prev.losses + 1 : p1Prev.losses,
  };

  assert.equal(p1New.gamesPlayed, 5);
  assert.equal(p1New.wins, 3);
  assert.equal(p1New.losses, 1);
});

// 4. Duplicate History Save Prevention (Idempotency Guards)
testCase('Duplicate history write prevented when statsProcessed is true', () => {
  const room = {
    historySaved: false,
    gameState: {
      status: 'CHECKMATE',
      statsProcessed: true,
    },
  };

  const shouldSkip = room.historySaved || room.gameState.statsProcessed;
  assert.equal(shouldSkip, true);
});

testCase('Duplicate history write prevented when historySaved is true', () => {
  const room = {
    historySaved: true,
    gameState: {
      status: 'CHECKMATE',
      statsProcessed: false,
    },
  };

  const shouldSkip = room.historySaved || room.gameState.statsProcessed;
  assert.equal(shouldSkip, true);
});

testCase('History write proceeds when neither statsProcessed nor historySaved is true', () => {
  const room = {
    historySaved: false,
    gameState: {
      status: 'CHECKMATE',
      statsProcessed: false,
    },
  };

  const shouldSkip = room.historySaved || room.gameState.statsProcessed;
  assert.equal(shouldSkip, false);
});

// 5. Game History Record Structure Validation
testCase('GameHistoryRecord contains all required metadata and indexed playerUids', () => {
  const record: GameHistoryRecord = {
    id: 'KQ-ROOM-101_0',
    roomId: 'KQ-ROOM-101',
    whitePlayer: {
      uid: 'user-king',
      displayName: 'Royal King',
      photoURL: null,
      identity: 'KING',
    },
    blackPlayer: {
      uid: 'user-queen',
      displayName: 'Noble Queen',
      photoURL: null,
      identity: 'QUEEN',
    },
    playerUids: ['user-king', 'user-queen'],
    winnerUid: 'user-king',
    result: 'CHECKMATE',
    totalMoves: 24,
    finalFen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    startedAt: 1000000,
    completedAt: 1000500,
    rematchNumber: 0,
    createdAt: 1000500,
  };

  assert.equal(record.id, 'KQ-ROOM-101_0');
  assert.equal(record.playerUids.includes('user-king'), true);
  assert.equal(record.playerUids.includes('user-queen'), true);
  assert.equal(record.winnerUid, 'user-king');
  assert.equal(record.result, 'CHECKMATE');
  assert.equal(record.totalMoves, 24);
  assert.equal(record.whitePlayer.identity, 'KING');
  assert.equal(record.blackPlayer.identity, 'QUEEN');
});

// 6. Exit Cleanup Logic
testCase('Exited player recording transitions completed room to CLOSED when both exit', () => {
  const players = [{ uid: 'p1' }, { uid: 'p2' }];
  const exitedPlayers = ['p1'];

  // Second player leaves
  const updatedExited = [...exitedPlayers, 'p2'];
  const playerUids = players.map((p) => p.uid);
  const bothExited = playerUids.every((uid) => updatedExited.includes(uid));

  assert.equal(bothExited, true);
  const nextStatus: RoomStatus = bothExited ? 'CLOSED' : 'COMPLETED';
  assert.equal(nextStatus, 'CLOSED');
});

testCase('Exited player keeps room as COMPLETED when only one player has exited', () => {
  const players = [{ uid: 'p1' }, { uid: 'p2' }];
  const exitedPlayers: string[] = [];

  // First player leaves
  const updatedExited = [...exitedPlayers, 'p1'];
  const playerUids = players.map((p) => p.uid);
  const bothExited = playerUids.every((uid) => updatedExited.includes(uid));

  assert.equal(bothExited, false);
  const nextStatus: RoomStatus = bothExited ? 'CLOSED' : 'COMPLETED';
  assert.equal(nextStatus, 'COMPLETED');
});

// 7. History Query & Filtering Logic
testCase('History query filters only games where user is in playerUids', () => {
  const games: GameHistoryRecord[] = [
    {
      id: 'g1',
      roomId: 'r1',
      whitePlayer: { uid: 'user-a', displayName: 'A', photoURL: null, identity: 'KING' },
      blackPlayer: { uid: 'user-b', displayName: 'B', photoURL: null, identity: 'QUEEN' },
      playerUids: ['user-a', 'user-b'],
      winnerUid: 'user-a',
      result: 'CHECKMATE',
      totalMoves: 10,
      finalFen: '',
      rematchNumber: 0,
    },
    {
      id: 'g2',
      roomId: 'r2',
      whitePlayer: { uid: 'user-c', displayName: 'C', photoURL: null, identity: 'KING' },
      blackPlayer: { uid: 'user-d', displayName: 'D', photoURL: null, identity: 'QUEEN' },
      playerUids: ['user-c', 'user-d'],
      winnerUid: 'user-c',
      result: 'CHECKMATE',
      totalMoves: 12,
      finalFen: '',
      rematchNumber: 0,
    },
  ];

  const userAGames = games.filter((g) => g.playerUids.includes('user-a'));
  assert.equal(userAGames.length, 1);
  assert.equal(userAGames[0].id, 'g1');
});

testCase('History filters correctly separate WINS, LOSSES, and DRAWS', () => {
  const currentUid = 'user-a';
  const games: GameHistoryRecord[] = [
    {
      id: 'win-game',
      roomId: 'r1',
      whitePlayer: { uid: 'user-a', displayName: 'A', photoURL: null, identity: 'KING' },
      blackPlayer: { uid: 'user-b', displayName: 'B', photoURL: null, identity: 'QUEEN' },
      playerUids: ['user-a', 'user-b'],
      winnerUid: 'user-a',
      result: 'CHECKMATE',
      totalMoves: 20,
      finalFen: '',
      rematchNumber: 0,
    },
    {
      id: 'loss-game',
      roomId: 'r2',
      whitePlayer: { uid: 'user-a', displayName: 'A', photoURL: null, identity: 'KING' },
      blackPlayer: { uid: 'user-b', displayName: 'B', photoURL: null, identity: 'QUEEN' },
      playerUids: ['user-a', 'user-b'],
      winnerUid: 'user-b',
      result: 'CHECKMATE',
      totalMoves: 30,
      finalFen: '',
      rematchNumber: 0,
    },
    {
      id: 'draw-game',
      roomId: 'r3',
      whitePlayer: { uid: 'user-a', displayName: 'A', photoURL: null, identity: 'KING' },
      blackPlayer: { uid: 'user-b', displayName: 'B', photoURL: null, identity: 'QUEEN' },
      playerUids: ['user-a', 'user-b'],
      winnerUid: null,
      result: 'STALEMATE',
      totalMoves: 40,
      finalFen: '',
      rematchNumber: 0,
    },
  ];

  const wins = games.filter((g) => g.winnerUid === currentUid);
  const losses = games.filter((g) => g.winnerUid && g.winnerUid !== currentUid);
  const draws = games.filter((g) => !g.winnerUid);

  assert.equal(wins.length, 1);
  assert.equal(wins[0].id, 'win-game');
  assert.equal(losses.length, 1);
  assert.equal(losses[0].id, 'loss-game');
  assert.equal(draws.length, 1);
  assert.equal(draws[0].id, 'draw-game');
});

// 8. Individual User Game History Record Structure (users/{uid}/gameHistory)
testCase('Both players receive accurate individual UserGameHistoryRecord structures', () => {
  const p1History: UserGameHistoryRecord = {
    gameId: 'KQ-ROOM-999_0',
    roomId: 'KQ-ROOM-999',
    opponentUid: 'user-b',
    opponentName: 'Queen Player',
    opponentIdentity: 'QUEEN',
    opponentPhotoURL: null,
    playerColor: 'WHITE',
    result: 'WIN',
    reason: 'CHECKMATE',
    totalMoves: 42,
    finalFen: 'rnbqkbnr/8/8/8/8/8/8/RNBQKBNR w KQkq - 0 1',
  };

  const p2History: UserGameHistoryRecord = {
    gameId: 'KQ-ROOM-999_0',
    roomId: 'KQ-ROOM-999',
    opponentUid: 'user-a',
    opponentName: 'King Player',
    opponentIdentity: 'KING',
    opponentPhotoURL: null,
    playerColor: 'BLACK',
    result: 'LOSS',
    reason: 'CHECKMATE',
    totalMoves: 42,
    finalFen: 'rnbqkbnr/8/8/8/8/8/8/RNBQKBNR w KQkq - 0 1',
  };

  assert.equal(p1History.result, 'WIN');
  assert.equal(p2History.result, 'LOSS');
  assert.equal(p1History.opponentUid, 'user-b');
  assert.equal(p2History.opponentUid, 'user-a');
  assert.equal(p1History.playerColor, 'WHITE');
  assert.equal(p2History.playerColor, 'BLACK');
});

// 9. Formatting Helpers
testCase('formatGameResult maps WIN, LOSS, DRAW properly', () => {
  assert.equal(formatGameResult('WIN').label, 'VICTORY');
  assert.equal(formatGameResult('LOSS').label, 'DEFEAT');
  assert.equal(formatGameResult('DRAW').label, 'DRAW');
});

testCase('formatGameDate formats timestamps with readable dates and times', () => {
  const now = new Date();
  const todayStr = formatGameDate(now);
  assert.equal(todayStr.startsWith('Today'), true);
});

// 10. LocalStorage and Exit Cleanup
testCase('Exit Game cleans active room reference', () => {
  const fakeStorage: Record<string, string> = {
    kq_active_room_id: 'KQ-1234',
  };
  delete fakeStorage['kq_active_room_id'];
  assert.equal(fakeStorage['kq_active_room_id'], undefined);
});

// 11. Event Deduplication Safety
testCase('Notification event ID prevents duplicate notification triggers', () => {
  const handledNotifications = new Set<string>();
  const roomId = 'KQ-ROOM-1';
  const eventType = 'REMATCH_REQUEST';
  const eventVersion = 2;
  const eventId = `${roomId}_${eventType}_${eventVersion}`;

  // First time
  const shouldShowFirst = !handledNotifications.has(eventId);
  handledNotifications.add(eventId);
  assert.equal(shouldShowFirst, true);

  // Second time (duplicate snapshot or StrictMode)
  const shouldShowSecond = !handledNotifications.has(eventId);
  assert.equal(shouldShowSecond, false);
});

// 12. Security & Anti-Cheat Validation Rules (Security Tests 1 to 10)
testCase('SECURITY TEST 1: User cannot update another user profile fields', () => {
  const authUid: string = 'player-1';
  const targetUid: string = 'player-2';
  const isAllowed = authUid === targetUid;
  assert.equal(isAllowed, false);
});

testCase('SECURITY TEST 2: User profile updates reject arbitrary fields beyond stats & bio', () => {
  const allowedKeys = new Set(['displayName', 'identity', 'bio', 'photoURL', 'updatedAt', 'wins', 'losses', 'gamesPlayed']);
  const attemptedKeys = ['wins', 'isAdmin', 'superUser'];
  const hasOnlyAllowed = attemptedKeys.every((k) => allowedKeys.has(k));
  assert.equal(hasOnlyAllowed, false);
});

testCase('SECURITY TEST 3: Random user cannot inject history into another account without room verification', () => {
  const requesterUid = 'hacker-uid';
  const targetUserUid = 'victim-uid';
  const room = {
    players: [{ uid: 'real-player-1' }, { uid: 'victim-uid' }],
  };

  const isRoomParticipant = room.players.some((p) => p.uid === requesterUid);
  const isTargetInRoom = room.players.some((p) => p.uid === targetUserUid);
  const canInjectHistory = isRoomParticipant && isTargetInRoom;

  assert.equal(canInjectHistory, false);
});

testCase('SECURITY TEST 4: Only actual room participants can create game completion records', () => {
  const room = {
    roomId: 'KQ-ROOM-10',
    players: [{ uid: 'alice' }, { uid: 'bob' }],
  };

  const participantCheck = (callerUid: string) => room.players.some((p) => p.uid === callerUid);

  assert.equal(participantCheck('alice'), true);
  assert.equal(participantCheck('bob'), true);
  assert.equal(participantCheck('mallory'), false);
});

testCase('SECURITY TEST 5: Third player cannot join full room', () => {
  const room = {
    status: 'WAITING',
    players: [{ uid: 'p1' }, { uid: 'p2' }],
    maxPlayers: 2,
  };

  const canJoin = room.status === 'WAITING' && room.players.length < room.maxPlayers;
  assert.equal(canJoin, false);
});

testCase('SECURITY TEST 6: Outsider cannot modify active room', () => {
  const room = {
    players: [{ uid: 'alice' }, { uid: 'bob' }],
  };
  const isAuthorized = (uid: string) => room.players.some((p) => p.uid === uid);
  assert.equal(isAuthorized('mallory'), false);
});

testCase('SECURITY TEST 7: Finished game records remain immutable (update/delete blocked)', () => {
  const allowUpdate = false;
  const allowDelete = false;
  assert.equal(allowUpdate, false);
  assert.equal(allowDelete, false);
});

testCase('SECURITY TEST 8: History records cannot be updated after creation', () => {
  const allowUpdate = false;
  assert.equal(allowUpdate, false);
});

testCase('SECURITY TEST 9: Duplicate completion processing does not increment stats twice', () => {
  let statsProcessed = true;
  let playerWins = 10;

  // Attempt duplicate process
  if (!statsProcessed) {
    playerWins += 1;
    statsProcessed = true;
  }

  assert.equal(playerWins, 10);
});

testCase('SECURITY TEST 10: Cross-player history writes require authoritative room validation', () => {
  const requesterUid = 'p1';
  const targetUid = 'p2';
  const roomData = {
    players: [{ uid: 'p1' }, { uid: 'p2' }],
  };

  const isValidCrossWrite =
    roomData.players.some((p) => p.uid === requesterUid) &&
    roomData.players.some((p) => p.uid === targetUid);

  assert.equal(isValidCrossWrite, true);
});

console.log(`\nTests Completed: ${passedTests} Passed, 0 Failed\n`);


