import {
  normalizeRoomCode,
  validateRoomCodeFormat,
  generateRandomCodeSuffix,
  mapCreateRoomError,
  mapJoinRoomError,
  mapRoomError,
} from './roomService';
import {
  getOppositeCoinChoice,
  getOppositeChessSide,
  CoinTossChoice,
  ChessSide,
} from '../types';

let passed = 0;
let failed = 0;

const assert = (condition: boolean, testName: string) => {
  if (condition) {
    console.log(`✓ ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAILED: ${testName}`);
    failed++;
  }
};

console.log('--- Running Room Service Unit & Logic Tests ---');

// 1. Room Code Normalization Tests
assert(normalizeRoomCode('KQ-AB7X') === 'KQ-AB7X', 'Normalizes standard KQ-AB7X');
assert(normalizeRoomCode('kq-ab7x') === 'KQ-AB7X', 'Uppercases lowercase code');
assert(normalizeRoomCode('  kq-ab7x  ') === 'KQ-AB7X', 'Trims whitespace');
assert(normalizeRoomCode('AB7X') === 'KQ-AB7X', 'Adds KQ- prefix if omitted');
assert(normalizeRoomCode('kqab7x') === 'KQ-AB7X', 'Adds dash if omitted after KQ');

// 2. Room Code Format Validation Tests
assert(validateRoomCodeFormat('KQ-AB7X') === true, 'Accepts valid KQ-AB7X');
assert(validateRoomCodeFormat('KQ-9MQR') === true, 'Accepts valid KQ-9MQR');
assert(validateRoomCodeFormat('KQ-X7KP') === true, 'Accepts valid KQ-X7KP');
assert(validateRoomCodeFormat('ab7x') === true, 'Accepts raw 4 chars that normalize to valid');
assert(validateRoomCodeFormat('KQ-ABO1') === false, 'Rejects code with O/1 confusing characters');
assert(validateRoomCodeFormat('KQ-A0') === false, 'Rejects code too short');
assert(validateRoomCodeFormat('KQ-TOOLONGROOMCODE') === false, 'Rejects code too long');

// 3. Random Suffix Generation
const suffix1 = generateRandomCodeSuffix(4);
const suffix2 = generateRandomCodeSuffix(4);
assert(suffix1.length === 4, 'Generated suffix is exactly 4 characters');
assert(/^[A-HJ-NP-Z2-9]{4}$/.test(suffix1), 'Generated suffix contains only allowed chars (no O/0/I/1)');
assert(suffix1.length === 4 && suffix2.length === 4, 'Successive calls generate valid suffixes');

// 4. Opposites Logic (Royal Coin & Chess Sides)
assert(getOppositeCoinChoice('HEADS') === 'TAILS', 'Opposite of HEADS is TAILS');
assert(getOppositeCoinChoice('TAILS') === 'HEADS', 'Opposite of TAILS is HEADS');
assert(getOppositeChessSide('WHITE') === 'BLACK', 'Opposite of WHITE is BLACK');
assert(getOppositeChessSide('BLACK') === 'WHITE', 'Opposite of BLACK is WHITE');

// 5. Coin Toss Winner Calculation Simulation
const testCoinToss = (partnerChoice: CoinTossChoice, coinResult: CoinTossChoice, partnerUid: string, creatorUid: string) => {
  return partnerChoice === coinResult ? partnerUid : creatorUid;
};
assert(testCoinToss('HEADS', 'HEADS', 'partner-uid', 'creator-uid') === 'partner-uid', 'Partner wins when call matches coin (HEADS/HEADS)');
assert(testCoinToss('TAILS', 'TAILS', 'partner-uid', 'creator-uid') === 'partner-uid', 'Partner wins when call matches coin (TAILS/TAILS)');
assert(testCoinToss('HEADS', 'TAILS', 'partner-uid', 'creator-uid') === 'creator-uid', 'Creator wins when partner call fails (HEADS vs TAILS)');
assert(testCoinToss('TAILS', 'HEADS', 'partner-uid', 'creator-uid') === 'creator-uid', 'Creator wins when partner call fails (TAILS vs HEADS)');

// 6. Chess Color Assignment Simulation
const testColorAssignment = (winnerUid: string, chosenColor: ChessSide, partnerUid: string, creatorUid: string) => {
  const loserUid = winnerUid === partnerUid ? creatorUid : partnerUid;
  const oppositeColor = getOppositeChessSide(chosenColor);
  return {
    [winnerUid]: chosenColor,
    [loserUid]: oppositeColor,
  };
};

const assign1 = testColorAssignment('partner-uid', 'WHITE', 'partner-uid', 'creator-uid');
assert(assign1['partner-uid'] === 'WHITE' && assign1['creator-uid'] === 'BLACK', 'Partner WHITE -> Creator BLACK');

const assign2 = testColorAssignment('creator-uid', 'BLACK', 'partner-uid', 'creator-uid');
assert(assign2['creator-uid'] === 'BLACK' && assign2['partner-uid'] === 'WHITE', 'Creator BLACK -> Partner WHITE');

// 7. Ready State Logic Simulation
const testBothReady = (players: { ready: boolean }[]) => {
  return players.length === 2 && players.every(p => p.ready === true);
};
assert(testBothReady([{ ready: true }, { ready: false }]) === false, 'Not both ready when one is false');
assert(testBothReady([{ ready: false }, { ready: false }]) === false, 'Not both ready when both are false');
assert(testBothReady([{ ready: true }, { ready: true }]) === true, 'Both ready when both true');

// 8. Error Mapping Tests - Separate Create vs Join
// Create Room Specific Tests
assert(mapCreateRoomError({ code: 'permission-denied' }) === 'Room access is not authorized. Check Firestore security rules.', 'Create error: permission-denied');
assert(mapCreateRoomError({ message: 'Missing or insufficient permissions.' }) === 'Room access is not authorized. Check Firestore security rules.', 'Create error: permission message');
assert(mapCreateRoomError({ code: 'unauthenticated' }) === 'Please sign in before creating a room.', 'Create error: unauthenticated');
assert(mapCreateRoomError({ code: 'not-found' }) === 'The requested room was not found.', 'Create error: not-found');
assert(mapCreateRoomError({ code: 'already-exists' }) === 'This room already exists. Please try again.', 'Create error: already-exists');
assert(mapCreateRoomError({ code: 'unavailable' }) === 'Connection unavailable. Please check your internet.', 'Create error: unavailable');
assert(mapCreateRoomError({ code: 'failed-precondition' }) === 'Room setup is incomplete. Please try again.', 'Create error: failed-precondition');
assert(mapCreateRoomError({ code: 'unknown' }) === 'Unable to create the room. Please try again.', 'Create error: unknown code default');
assert(!mapCreateRoomError({ code: 'unknown' }).includes('join'), 'Create error NEVER contains "join"');

// Join Room Specific Tests
assert(mapJoinRoomError({ message: 'ROOM_NOT_FOUND' }) === 'This room does not exist. Check the code and try again.', 'Join error: ROOM_NOT_FOUND');
assert(mapJoinRoomError({ message: 'ROOM_FULL' }) === 'This game already has two players.', 'Join error: ROOM_FULL');
assert(mapJoinRoomError({ message: 'GAME_ALREADY_STARTED' }) === 'This game has already started.', 'Join error: GAME_ALREADY_STARTED');
assert(mapJoinRoomError({ message: 'ALREADY_IN_ROOM' }) === 'You are already in this room.', 'Join error: ALREADY_IN_ROOM');
assert(mapJoinRoomError({ message: 'INVALID_CODE' }) === 'Enter a valid room code.', 'Join error: INVALID_CODE');
assert(mapJoinRoomError({ message: 'COIN_ALREADY_FLIPPED' }) === 'The Royal Coin has already spoken.', 'Join error: COIN_ALREADY_FLIPPED');
assert(mapJoinRoomError({ message: 'COLOR_ALREADY_CHOSEN' }) === 'The battlefield has already been decided.', 'Join error: COLOR_ALREADY_CHOSEN');
assert(mapJoinRoomError({ message: 'ROOM_CANCELLED' }) === 'This room is no longer available.', 'Join error: ROOM_CANCELLED');
assert(mapJoinRoomError({ message: 'PARTNER_LEFT' }) === 'Your partner has left the room.', 'Join error: PARTNER_LEFT');
assert(mapJoinRoomError({ message: 'NOT_AUTHORIZED' }) === 'You are not allowed to perform this action.', 'Join error: NOT_AUTHORIZED');
assert(mapJoinRoomError({ message: 'UNKNOWN_NETWORK' }) === 'Unable to join the room. Please try again.', 'Join error: fallback mapping');
assert(mapJoinRoomError({ code: 'permission-denied' }) === 'Room access is not authorized. Check Firestore security rules.', 'Join error: permission-denied');

// Context-aware mapRoomError wrapper
assert(mapRoomError({ code: 'unknown' }, 'create') === 'Unable to create the room. Please try again.', 'mapRoomError context create');
assert(mapRoomError({ code: 'unknown' }, 'join') === 'Unable to join the room. Please try again.', 'mapRoomError context join');

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}

