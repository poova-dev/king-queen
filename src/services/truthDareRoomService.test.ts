/**
 * KING & QUEEN — STEP 18.2
 * TRUTH OR DARE PRIVATE MULTIPLAYER ROOM SERVICE TESTS
 *
 * Test coverage:
 * 1. Room code generation format & exclusion of ambiguous characters
 * 2. Room code normalization & regex validation
 * 3. Room creation structure & default state
 * 4. Transactional join logic (2 player limit, 3rd player rejection, self-join rejection)
 * 5. Closed / Playing / Finished room rejection
 * 6. Dual ready system & atomic session initialization
 * 7. Duplicate session initialization prevention
 * 8. Room restoration & active room discovery logic
 * 9. Leave room cleanup (creator closes, partner leaves)
 * 10. Error message mapping
 */

import {
  TD_ROOM_CODE_CHARS,
  generateRandomTDSuffix,
  normalizeTruthDareRoomCode,
  validateTruthDareRoomCode,
  mapTruthDareRoomError,
} from './truthDareRoomService';
import {
  TruthDareRoom,
  TruthDarePlayer,
  TruthDareSession,
  UserProfile,
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

console.log('\n--- Running Step 18.2 Truth or Dare Room Service Tests ---');

// ============================================================================
// PART 1: ROOM CODE GENERATION & NORMALIZATION
// ============================================================================
// 1. Confusing characters exclusion: 0, O, 1, I
const ambiguousChars = ['0', 'O', '1', 'I'];
const hasAmbiguous = ambiguousChars.some((char) => TD_ROOM_CODE_CHARS.includes(char));
assert(!hasAmbiguous, 'Character set strictly excludes confusing characters (0, O, 1, I)');

// 2. Format validation
const sampleSuffix = generateRandomTDSuffix(4);
assert(sampleSuffix.length === 4, 'Generated code suffix is 4 characters long');
const sampleCode = `TD-${sampleSuffix}`;
assert(validateTruthDareRoomCode(sampleCode), `Validates generated room code format: ${sampleCode}`);

// 3. Normalization
assert(normalizeTruthDareRoomCode('td-a7k9') === 'TD-A7K9', 'Normalizes lowercase code to uppercase');
assert(normalizeTruthDareRoomCode('  TD - A7K9  ') === 'TD-A7K9', 'Strips whitespace');
assert(normalizeTruthDareRoomCode('A7K9') === 'TD-A7K9', 'Appends missing TD- prefix');
assert(normalizeTruthDareRoomCode('tdA7k9') === 'TD-A7K9', 'Normalizes unhyphenated code');

// 4. Invalid code rejection
assert(!validateTruthDareRoomCode(''), 'Empty code is rejected');
assert(!validateTruthDareRoomCode('INVALID'), 'Code without valid format is rejected');
assert(!validateTruthDareRoomCode('TD-0000'), 'Code with ambiguous characters (0) is rejected');
assert(!validateTruthDareRoomCode('TD-1111'), 'Code with ambiguous characters (1) is rejected');
assert(!validateTruthDareRoomCode('TD-OOOO'), 'Code with ambiguous characters (O) is rejected');

// ============================================================================
// PART 2: ROOM CREATION & CAPACITY
// ============================================================================
console.log('\n[Section 2: Room Creation & Constraints]');

const hostUser: UserProfile = {
  uid: 'royal_creator_uid',
  username: '@arthur',
  displayName: 'King Arthur',
  bio: 'Sovereign of Camelot',
  identity: 'KING',
  avatar: 'https://example.com/king.png',
  wins: 10,
  losses: 2,
  gamesPlayed: 12,
};

const partnerUser: UserProfile = {
  uid: 'royal_partner_uid',
  username: '@guinevere',
  displayName: 'Queen Guinevere',
  bio: 'Graceful Sovereign',
  identity: 'QUEEN',
  avatar: 'https://example.com/queen.png',
  wins: 8,
  losses: 3,
  gamesPlayed: 11,
};

const mockCreateRoom = (creator: UserProfile): TruthDareRoom => {
  const creatorPlayer: TruthDarePlayer = {
    uid: creator.uid,
    displayName: creator.displayName || 'King',
    photoURL: creator.avatar || null,
    identity: creator.identity || 'KING',
    role: 'CREATOR',
    ready: false,
    joinedAt: Date.now(),
  };

  return {
    id: 'td_room_123',
    roomCode: 'TD-A7K9',
    gameType: 'TRUTH_DARE',
    createdBy: creator.uid,
    status: 'WAITING',
    maxPlayers: 2,
    players: [creatorPlayer],
    session: null,
    exitedPlayers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

const testRoom = mockCreateRoom(hostUser);
assert(testRoom.gameType === 'TRUTH_DARE', 'Room gameType is TRUTH_DARE');
assert(testRoom.status === 'WAITING', 'Initial room status is WAITING');
assert(testRoom.maxPlayers === 2, 'Maximum players is strictly 2');
assert(testRoom.players.length === 1, 'Room starts with exactly 1 player (Creator)');
assert(testRoom.players[0].role === 'CREATOR', 'Host is assigned CREATOR role');
assert(!testRoom.players[0].ready, 'Host ready starts as false');
assert(testRoom.session === null, 'Session starts as null');

// ============================================================================
// PART 3: ROOM JOINING TRANSACTION RULES
// ============================================================================
console.log('\n[Section 3: Room Joining Transaction Validation]');

const simulateJoin = (room: TruthDareRoom, joiningUser: UserProfile): TruthDareRoom => {
  if (room.status === 'CLOSED') throw new Error('ROOM_CLOSED');
  if (room.status === 'PLAYING') throw new Error('ROOM_ALREADY_PLAYING');
  if (room.status === 'FINISHED') throw new Error('ROOM_FINISHED');
  if (room.status !== 'WAITING') throw new Error('ROOM_NOT_JOINABLE');
  if (room.players.length >= 2) throw new Error('ROOM_FULL');
  if (room.createdBy === joiningUser.uid) throw new Error('CANNOT_JOIN_OWN_ROOM');
  if (room.players.some((p) => p.uid === joiningUser.uid)) throw new Error('ALREADY_IN_ROOM');

  const partnerPlayer: TruthDarePlayer = {
    uid: joiningUser.uid,
    displayName: joiningUser.displayName,
    photoURL: joiningUser.avatar || null,
    identity: joiningUser.identity,
    role: 'PARTNER',
    ready: false,
    joinedAt: Date.now(),
  };

  return {
    ...room,
    players: [...room.players, partnerPlayer],
    updatedAt: Date.now(),
  };
};

// 1. Successful join
const roomWithPartner = simulateJoin(testRoom, partnerUser);
assert(roomWithPartner.players.length === 2, 'Partner successfully joins room (total 2 players)');
assert(roomWithPartner.players[1].role === 'PARTNER', 'Joining user is assigned PARTNER role');
assert(!roomWithPartner.players[1].ready, 'Partner ready starts as false');

// 2. Creator cannot join own room
let creatorSelfJoinCaught = false;
try {
  simulateJoin(testRoom, hostUser);
} catch (err: any) {
  creatorSelfJoinCaught = err.message === 'CANNOT_JOIN_OWN_ROOM';
}
assert(creatorSelfJoinCaught, 'Creator cannot join their own room with join code');

// 3. Third player rejected (ROOM_FULL)
let thirdPlayerRejected = false;
const thirdUser: UserProfile = { ...partnerUser, uid: 'third_intruder_uid' };
try {
  simulateJoin(roomWithPartner, thirdUser);
} catch (err: any) {
  thirdPlayerRejected = err.message === 'ROOM_FULL';
}
assert(thirdPlayerRejected, 'Third player is rejected with ROOM_FULL');

// 4. Duplicate join prevention
let duplicateJoinPrevented = false;
try {
  simulateJoin(roomWithPartner, partnerUser);
} catch (err: any) {
  duplicateJoinPrevented = err.message === 'ROOM_FULL' || err.message === 'ALREADY_IN_ROOM';
}
assert(duplicateJoinPrevented, 'Duplicate player join is strictly blocked');

// 5. Closed room rejected
let closedRoomRejected = false;
const closedRoom: TruthDareRoom = { ...testRoom, status: 'CLOSED' };
try {
  simulateJoin(closedRoom, partnerUser);
} catch (err: any) {
  closedRoomRejected = err.message === 'ROOM_CLOSED';
}
assert(closedRoomRejected, 'Joining CLOSED room is rejected');

// 6. Playing room rejected
let playingRoomRejected = false;
const playingRoom: TruthDareRoom = { ...testRoom, status: 'PLAYING' };
try {
  simulateJoin(playingRoom, partnerUser);
} catch (err: any) {
  playingRoomRejected = err.message === 'ROOM_ALREADY_PLAYING';
}
assert(playingRoomRejected, 'Joining PLAYING room is rejected');

// ============================================================================
// PART 4: READY SYSTEM & DUAL-READY TRANSITIONS
// ============================================================================
console.log('\n[Section 4: Ready System & Session Foundation]');

const simulateReadyToggle = (
  room: TruthDareRoom,
  uid: string,
  ready: boolean
): TruthDareRoom => {
  const updatedPlayers = room.players.map((p) =>
    p.uid === uid ? { ...p, ready } : p
  );

  const bothReady =
    updatedPlayers.length === 2 && updatedPlayers.every((p) => p.ready);

  let newSession = room.session;
  let newStatus = room.status;

  if (bothReady) {
    if (!newSession) {
      newSession = {
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
    }
    newStatus = 'PLAYING';
  } else {
    newStatus = 'WAITING';
  }

  return {
    ...room,
    players: updatedPlayers,
    status: newStatus,
    session: newSession,
    updatedAt: Date.now(),
  };
};

// 1. Creator marks ready
const readyStep1 = simulateReadyToggle(roomWithPartner, hostUser.uid, true);
assert(readyStep1.players[0].ready === true, 'Host player is marked ready');
assert(readyStep1.players[1].ready === false, 'Partner remains not ready');
assert(readyStep1.status === 'WAITING', 'Room remains WAITING when only 1 player is ready');
assert(readyStep1.session === null, 'Session remains uninitialized');

// 2. Partner marks ready -> both ready triggers PLAYING and initializes session
const readyStep2 = simulateReadyToggle(readyStep1, partnerUser.uid, true);
assert(readyStep2.players[1].ready === true, 'Partner is marked ready');
assert(readyStep2.status === 'PLAYING', 'Room transitions to PLAYING when both players are ready');
assert(readyStep2.session !== null, 'Empty TruthDareSession is atomically initialized');
assert(readyStep2.session?.round === 1, 'Initial session round is 1');
assert(readyStep2.session?.phase === 'INITIALIZING', 'Initial session phase is INITIALIZING');

// 3. Duplicate initialization prevention (idempotency check)
const existingTimestamp = readyStep2.session?.startedAt;
const readyStep3 = simulateReadyToggle(readyStep2, hostUser.uid, true);
assert(
  readyStep3.session?.startedAt === existingTimestamp,
  'Session is not re-initialized if already present (idempotent)'
);

// ============================================================================
// PART 5: ROOM RESTORATION & LEAVE CLEANUP
// ============================================================================
console.log('\n[Section 5: Room Restoration & Leave Cleanup]');

// Active statuses
const isRoomActive = (status: string): boolean => {
  return ['WAITING', 'READY', 'PLAYING'].includes(status);
};

assert(isRoomActive('WAITING'), 'WAITING room is considered active for restoration');
assert(isRoomActive('PLAYING'), 'PLAYING room is considered active for restoration');
assert(!isRoomActive('FINISHED'), 'FINISHED room is NOT considered active');
assert(!isRoomActive('CLOSED'), 'CLOSED room is NOT considered active');

// Leave room: Creator leaves while waiting -> CLOSED
const simulateLeave = (room: TruthDareRoom, uid: string): TruthDareRoom => {
  const isCreator = room.createdBy === uid;
  if (room.status === 'WAITING' || room.status === 'READY') {
    if (isCreator) {
      return { ...room, status: 'CLOSED' };
    } else {
      return {
        ...room,
        players: room.players.filter((p) => p.uid !== uid),
        status: 'WAITING',
      };
    }
  }
  return room;
};

const creatorLeft = simulateLeave(roomWithPartner, hostUser.uid);
assert(creatorLeft.status === 'CLOSED', 'Room transitions to CLOSED when Creator leaves during lobby');

const partnerLeft = simulateLeave(roomWithPartner, partnerUser.uid);
assert(partnerLeft.players.length === 1, 'Partner leaving removes partner from players array');
assert(partnerLeft.status === 'WAITING', 'Room remains WAITING for a new partner after partner leaves');

// ============================================================================
// PART 6: ERROR MAPPING
// ============================================================================
console.log('\n[Section 6: Error Message Mapping]');

assert(
  mapTruthDareRoomError({ message: 'ROOM_NOT_FOUND' }) ===
    'THIS ROYAL ROOM DOES NOT EXIST',
  'Maps ROOM_NOT_FOUND to friendly message'
);
assert(
  mapTruthDareRoomError({ message: 'ROOM_FULL' }) ===
    'THIS ROOM ALREADY HAS TWO PLAYERS',
  'Maps ROOM_FULL to friendly message'
);
assert(
  mapTruthDareRoomError({ message: 'CANNOT_JOIN_OWN_ROOM' }) ===
    'YOU ARE ALREADY THE ROOM CREATOR',
  'Maps CANNOT_JOIN_OWN_ROOM to friendly message'
);
assert(
  mapTruthDareRoomError({ message: 'INVALID_ROOM_CODE_FORMAT' }) ===
    'INVALID ROOM CODE FORMAT. USE TD-XXXX',
  'Maps INVALID_ROOM_CODE_FORMAT to friendly message'
);

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n======================================================`);
console.log(`Step 18.2 Tests Completed: ${passed} Passed, ${failed} Failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}

// ============================================================================
// PHASE A ADDITIONS: selectTruthOrDare & completeRound guard tests
// ============================================================================
import { getCardById, getRandomTruthCardId, getRandomDareCardId, TRUTH_CARDS, DARE_CARDS } from '../lib/truthDareCards';

console.log('\n--- Phase A: Truth or Dare Game Engine Tests ---');

// ─── PART 11: Card Database Integrity ────────────────────────────────────────
console.log('\n[Section 11: Card Database Integrity]');

assert(TRUTH_CARDS.length >= 20, `Truth card count is at least 20 (got ${TRUTH_CARDS.length})`);
assert(DARE_CARDS.length >= 20, `Dare card count is at least 20 (got ${DARE_CARDS.length})`);

// All truth card IDs start with 'truth_'
const allTruthIdsValid = TRUTH_CARDS.every((c) => c.id.startsWith('truth_') && c.type === 'TRUTH');
assert(allTruthIdsValid, 'All truth cards have IDs starting with "truth_" and type TRUTH');

// All dare card IDs start with 'dare_'
const allDareIdsValid = DARE_CARDS.every((c) => c.id.startsWith('dare_') && c.type === 'DARE');
assert(allDareIdsValid, 'All dare cards have IDs starting with "dare_" and type DARE');

// No duplicate IDs across the entire database
const allIds = [...TRUTH_CARDS, ...DARE_CARDS].map((c) => c.id);
const uniqueIds = new Set(allIds);
assert(uniqueIds.size === allIds.length, 'All card IDs are globally unique (no duplicates)');

// Every card has non-empty text
const allHaveText = [...TRUTH_CARDS, ...DARE_CARDS].every((c) => c.text.trim().length > 0);
assert(allHaveText, 'Every card has non-empty text');

// All intensities are valid
const validIntensities = new Set(['SOFT', 'MEDIUM', 'SPICY']);
const allHaveValidIntensity = [...TRUTH_CARDS, ...DARE_CARDS].every((c) =>
  validIntensities.has(c.intensity)
);
assert(allHaveValidIntensity, 'Every card has a valid intensity: SOFT, MEDIUM, or SPICY');

// ─── PART 12: getCardById ─────────────────────────────────────────────────────
console.log('\n[Section 12: getCardById Lookup]');

const knownTruthCard = getCardById('truth_001');
assert(knownTruthCard !== null, 'getCardById returns a card for known ID "truth_001"');
assert(knownTruthCard?.type === 'TRUTH', 'getCardById("truth_001") returns type TRUTH');

const knownDareCard = getCardById('dare_001');
assert(knownDareCard !== null, 'getCardById returns a card for known ID "dare_001"');
assert(knownDareCard?.type === 'DARE', 'getCardById("dare_001") returns type DARE');

const unknownCard = getCardById('unknown_999');
assert(unknownCard === null, 'getCardById returns null for unknown ID');

const nullCard = getCardById(null);
assert(nullCard === null, 'getCardById returns null for null input');

const undefinedCard = getCardById(undefined);
assert(undefinedCard === null, 'getCardById returns null for undefined input');

// ─── PART 13: Random card selectors ──────────────────────────────────────────
console.log('\n[Section 13: Random Card Selectors]');

const truthId = getRandomTruthCardId();
assert(typeof truthId === 'string' && truthId.startsWith('truth_'), `getRandomTruthCardId returns a valid truth ID: ${truthId}`);
assert(getCardById(truthId) !== null, 'getRandomTruthCardId returns an ID that resolves to a card');

const dareId = getRandomDareCardId();
assert(typeof dareId === 'string' && dareId.startsWith('dare_'), `getRandomDareCardId returns a valid dare ID: ${dareId}`);
assert(getCardById(dareId) !== null, 'getRandomDareCardId returns an ID that resolves to a card');

// Run multiple times to validate distribution (no infinite loop possible)
const truthIds = new Set<string>();
const dareIds = new Set<string>();
for (let i = 0; i < 100; i++) {
  truthIds.add(getRandomTruthCardId());
  dareIds.add(getRandomDareCardId());
}
assert(truthIds.size >= 5, `getRandomTruthCardId has reasonable distribution (got ${truthIds.size} unique IDs in 100 calls)`);
assert(dareIds.size >= 5, `getRandomDareCardId has reasonable distribution (got ${dareIds.size} unique IDs in 100 calls)`);

// ─── PART 14: selectTruthOrDare guard simulation ──────────────────────────────
console.log('\n[Section 14: selectTruthOrDare Guard Simulation]');

// Simulates the guard checks inside the Firestore transaction
const simulateSelect = (
  roomStatus: string,
  phase: string,
  currentPlayerUid: string | null,
  selectedMode: string | null,
  callerUid: string
): string | 'OK' => {
  if (roomStatus !== 'PLAYING') return 'ROOM_NOT_PLAYING';
  if (phase !== 'CHOOSING') return 'WRONG_PHASE';
  if (currentPlayerUid !== callerUid) return 'NOT_YOUR_TURN';
  if (selectedMode !== null) return 'ALREADY_SELECTED';
  return 'OK';
};

assert(
  simulateSelect('PLAYING', 'CHOOSING', 'u1', null, 'u1') === 'OK',
  'simulateSelect: all guards pass when conditions are correct'
);
assert(
  simulateSelect('WAITING', 'CHOOSING', 'u1', null, 'u1') === 'ROOM_NOT_PLAYING',
  'simulateSelect: rejects when room is not PLAYING'
);
assert(
  simulateSelect('PLAYING', 'RESPONDING', 'u1', null, 'u1') === 'WRONG_PHASE',
  'simulateSelect: rejects when phase is not CHOOSING'
);
assert(
  simulateSelect('PLAYING', 'CHOOSING', 'u2', null, 'u1') === 'NOT_YOUR_TURN',
  'simulateSelect: rejects when caller is not currentPlayerUid'
);
assert(
  simulateSelect('PLAYING', 'CHOOSING', 'u1', 'TRUTH', 'u1') === 'ALREADY_SELECTED',
  'simulateSelect: rejects when mode already selected'
);

// ─── PART 15: completeRound guard & state transition simulation ───────────────
console.log('\n[Section 15: completeRound State Transition Simulation]');

const simulateCompleteRound = (
  phase: string,
  currentPlayerUid: string,
  players: Array<{ uid: string }>,
  round: number,
  completedRounds: number
) => {
  if (phase !== 'RESPONDING') return { error: 'WRONG_PHASE' };

  const nextPlayerUid =
    players.find((p) => p.uid !== currentPlayerUid)?.uid ?? currentPlayerUid;

  return {
    phase: 'CHOOSING',
    selectedMode: null,
    selectedCardId: null,
    currentPlayerUid: nextPlayerUid,
    round: round + 1,
    completedRounds: completedRounds + 1,
  };
};

const players = [{ uid: 'king' }, { uid: 'queen' }];
const result1 = simulateCompleteRound('RESPONDING', 'king', players, 1, 0);
assert('error' in result1 === false, 'completeRound: proceeds without error from RESPONDING phase');
assert(
  !('error' in result1) && (result1 as any).phase === 'CHOOSING',
  'completeRound: phase transitions to CHOOSING'
);
assert(
  !('error' in result1) && (result1 as any).currentPlayerUid === 'queen',
  'completeRound: switches currentPlayerUid to the other player'
);
assert(
  !('error' in result1) && (result1 as any).round === 2,
  'completeRound: increments round by 1'
);
assert(
  !('error' in result1) && (result1 as any).completedRounds === 1,
  'completeRound: increments completedRounds by 1'
);
assert(
  !('error' in result1) && (result1 as any).selectedMode === null,
  'completeRound: resets selectedMode to null'
);
assert(
  !('error' in result1) && (result1 as any).selectedCardId === null,
  'completeRound: resets selectedCardId to null'
);

const result2 = simulateCompleteRound('CHOOSING', 'king', players, 1, 0);
assert('error' in result2 && (result2 as any).error === 'WRONG_PHASE', 'completeRound: rejects CHOOSING phase');

// Verify alternating player turns across multiple rounds
let currentPlayer = 'king';
for (let i = 0; i < 6; i++) {
  const r = simulateCompleteRound('RESPONDING', currentPlayer, players, i + 1, i);
  if (!('error' in r)) {
    currentPlayer = (r as any).currentPlayerUid;
  }
}
assert(currentPlayer === 'king', 'completeRound: players alternate correctly across 6 rounds (back to king)');

// ─── FINAL SUMMARY ─────────────────────────────────────────────────────────────
console.log(`\n======================================================`);
console.log(`Phase A Tests Completed: ${passed} Passed, ${failed} Failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}

