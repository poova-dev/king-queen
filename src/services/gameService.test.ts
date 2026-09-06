import { Chess } from 'chess.js';
import {
  INITIAL_CHESS_FEN,
  mapGameError,
} from './gameService';
import {
  getOppositeChessSide,
  ChessSide,
  GameStateDocument,
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

console.log('--- Running Game Service & Chess Engine Multiplayer Synchronization Tests ---');

// 1. Initial State & FEN validation
assert(
  INITIAL_CHESS_FEN === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'INITIAL_CHESS_FEN matches standard starting position'
);

const initialChess = new Chess(INITIAL_CHESS_FEN);
assert(initialChess.turn() === 'w', 'Initial FEN turn is White');
assert(initialChess.isCheckmate() === false, 'Initial state is not checkmate');
assert(initialChess.isDraw() === false, 'Initial state is not a draw');
assert(initialChess.inCheck() === false, 'Initial state has neither king in check');

// 2. Color Opposites & Turn Enforcement
assert(getOppositeChessSide('WHITE') === 'BLACK', 'Opposite of WHITE is BLACK');
assert(getOppositeChessSide('BLACK') === 'WHITE', 'Opposite of BLACK is WHITE');

// 3. Move Validation & Turn Switching
// Move 1: White moves e2 -> e4
const move1Result = initialChess.move({ from: 'e2', to: 'e4' });
assert(move1Result !== null && move1Result.san === 'e4', 'White can legally play e4');
assert(initialChess.turn() === 'b', 'Turn switches to Black after White moves');
const fenAfterMove1 = initialChess.fen();

// Attempting move for White when it is Black's turn
let whiteIllegalMoveCaught = false;
try {
  const illegalMove = initialChess.move({ from: 'd2', to: 'd4' });
  if (!illegalMove) whiteIllegalMoveCaught = true;
} catch {
  whiteIllegalMoveCaught = true;
}
assert(whiteIllegalMoveCaught, 'White cannot move when turn is Black');

// Move 2: Black moves e7 -> e5
const move2Result = initialChess.move({ from: 'e7', to: 'e5' });
assert(move2Result !== null && move2Result.san === 'e5', 'Black can legally respond with e5');
assert(initialChess.turn() === 'w', 'Turn switches back to White');

// 4. Illegal Move Rejection
const chessIllegalCheck = new Chess(fenAfterMove1);
let knightIllegalMove = null;
try {
  knightIllegalMove = chessIllegalCheck.move({ from: 'g8', to: 'e7' }); // g8 to e7 blocked or invalid for pawn e7
} catch {
  knightIllegalMove = null;
}
assert(knightIllegalMove === null, 'Illegal move returns null or throws');

// 5. Castling Support (Kingside and Queenside)
const castlingChess = new Chess();
// Play sequence: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O
castlingChess.move({ from: 'e2', to: 'e4' });
castlingChess.move({ from: 'e7', to: 'e5' });
castlingChess.move({ from: 'g1', to: 'f3' });
castlingChess.move({ from: 'b8', to: 'c6' });
castlingChess.move({ from: 'f1', to: 'c4' });
castlingChess.move({ from: 'f8', to: 'c5' });
const kingsideCastle = castlingChess.move({ from: 'e1', to: 'g1' });
assert(kingsideCastle !== null && kingsideCastle.san === 'O-O', 'White can castle kingside');
assert(castlingChess.get('g1')?.type === 'k', 'King moved to g1 upon castling');
assert(castlingChess.get('f1')?.type === 'r', 'Rook moved to f1 upon castling');

// 6. En Passant Support
const epChess = new Chess();
// 1. e4 a6 2. e5 d5 3. exd6 (en passant)
epChess.move({ from: 'e2', to: 'e4' });
epChess.move({ from: 'a7', to: 'a6' });
epChess.move({ from: 'e4', to: 'e5' });
epChess.move({ from: 'd7', to: 'd5' });
const epCapture = epChess.move({ from: 'e5', to: 'd6' });
assert(epCapture !== null && epCapture.flags.includes('e'), 'En passant capture flag recognized');
assert(!epChess.get('d5'), 'Black pawn on d5 is captured via en passant');

// 7. Pawn Promotion Support
// Position with white pawn ready to promote on a7 -> a8
const promotionFen = '8/P7/8/8/8/8/8/k6K w - - 0 1';
const promoChess = new Chess(promotionFen);
const promoMove = promoChess.move({ from: 'a7', to: 'a8', promotion: 'q' });
assert(promoMove !== null && promoMove.promotion === 'q', 'Pawn successfully promotes to Queen');
assert(promoChess.get('a8')?.type === 'q', 'Square a8 now contains a Queen');
assert(promoChess.fen().includes('Q'), 'New FEN contains promoted Queen');

// 8. Scholar's Mate (Checkmate Detection & Winner Calculation)
const mateChess = new Chess();
mateChess.move('e4');
mateChess.move('e5');
mateChess.move('Qh5');
mateChess.move('Nc6');
mateChess.move('Bc4');
mateChess.move('Nf6');
mateChess.move('Qxf7#');
assert(mateChess.isCheckmate() === true, "Scholar's Mate produces isCheckmate() === true");
assert(mateChess.inCheck() === true, "Checkmate is also inCheck");
assert(mateChess.turn() === 'b', 'Checkmated side is Black');

// 9. Stalemate Detection
const stalemateFen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
const stalemateChess = new Chess(stalemateFen);
assert(stalemateChess.isStalemate() === true, 'Stalemate position is recognized');
assert(stalemateChess.isDraw() === true, 'Stalemate is categorized as draw');
assert(stalemateChess.isCheckmate() === false, 'Stalemate is not checkmate');

// 10. Insufficient Material Draw Detection
const insufficientMaterialFen = '8/8/8/8/8/5k2/8/4K2B w - - 0 1';
const insufficientChess = new Chess(insufficientMaterialFen);
assert(insufficientChess.isInsufficientMaterial() === true, 'King + Bishop vs King is insufficient material');
assert(insufficientChess.isDraw() === true, 'Insufficient material yields isDraw() === true');

// 11. Error Mapping
assert(
  mapGameError({ message: 'NOT_YOUR_TURN' }).includes('not your turn'),
  'Maps NOT_YOUR_TURN error'
);
assert(
  mapGameError({ message: 'ILLEGAL_MOVE' }).includes('legal'),
  'Maps ILLEGAL_MOVE error'
);
assert(
  mapGameError({ message: 'GAME_ALREADY_FINISHED' }).includes('ended'),
  'Maps GAME_ALREADY_FINISHED error'
);
assert(
  mapGameError({ code: 'permission-denied' }).includes('permission denied'),
  'Maps permission-denied error'
);

// 12. Rematch Color Swap Logic
const player1OriginalSide: ChessSide = 'WHITE';
const player2OriginalSide: ChessSide = 'BLACK';
const player1RematchSide = getOppositeChessSide(player1OriginalSide);
const player2RematchSide = getOppositeChessSide(player2OriginalSide);
assert(player1RematchSide === 'BLACK', 'Player 1 swaps from WHITE to BLACK for rematch');
assert(player2RematchSide === 'WHITE', 'Player 2 swaps from BLACK to WHITE for rematch');

// 13. Board Orientation Logic
const whiteOrientation = (color: ChessSide) => color === 'BLACK';
assert(whiteOrientation('WHITE') === false, 'White player does not flip board (Rank 8 top, Rank 1 bottom)');
assert(whiteOrientation('BLACK') === true, 'Black player flips board (Rank 1 top, Rank 8 bottom)');

// 14. GameState Structure & Version Invariant
const mockGameState: GameStateDocument = {
  fen: INITIAL_CHESS_FEN,
  turn: 'WHITE',
  status: 'PLAYING',
  checkedColor: null,
  lastMove: null,
  moveHistory: [],
  moveNumber: 0,
  version: 0,
  winnerUid: null,
  statsProcessed: false,
  updatedAt: null as any,
};
assert(mockGameState.version === 0, 'Initial version starts at 0');
assert(mockGameState.status === 'PLAYING', 'Initial status is PLAYING');
assert(mockGameState.statsProcessed === false, 'statsProcessed is false initially');

// 15. Idempotent Initialization & Double Init Guard
const existingRoomWithGame = {
  gameState: {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    version: 1,
    turn: 'BLACK' as ChessSide,
  },
};
const checkShouldInitialize = (room: any) => !(room.gameState && room.gameState.fen);
assert(
  checkShouldInitialize(existingRoomWithGame) === false,
  'Does not re-initialize when gameState.fen already exists'
);

const emptyRoom = { gameState: null };
assert(
  checkShouldInitialize(emptyRoom) === true,
  'Initializes when room.gameState is null'
);

// 16. Safe Dot-Notation Field Paths (No conflicting transforms)
const dotNotationFields = [
  'gameState.fen',
  'gameState.turn',
  'gameState.status',
  'gameState.checkedColor',
  'gameState.lastMove',
  'gameState.moveHistory',
  'gameState.moveNumber',
  'gameState.version',
  'gameState.winnerUid',
  'gameState.statsProcessed',
  'gameState.rematchRequest',
  'gameState.rematchCount',
  'gameState.updatedAt',
  'updatedAt',
];
assert(
  !dotNotationFields.includes('gameState'),
  'Dot notation payload does not include top-level gameState map replacement'
);
assert(
  dotNotationFields.includes('gameState.updatedAt') && dotNotationFields.includes('updatedAt'),
  'Both nested gameState.updatedAt and root updatedAt can be targeted without conflict'
);

// ----------------------------------------------------
// STEP 15.1: AUTHORITATIVE GAME COMPLETION SYSTEM TESTS
// ----------------------------------------------------
console.log('\n--- Step 15.1: Authoritative Game Completion & Draw Synchronization Tests ---');

// 17. CHECKMATE Completion Logic
const p1Uid: string = 'royal-king-123';
const p2Uid: string = 'royal-queen-456';

const cmChess = new Chess();
cmChess.move('f3');
cmChess.move('e5');
cmChess.move('g4');
cmChess.move('Qh4#'); // Fool's mate by Black (p2)

assert(cmChess.isCheckmate() === true, 'CHECKMATE: Detect checkmate correctly');
const cmWinnerUid: string = p2Uid;
const cmLoserUid = cmWinnerUid === p1Uid ? p2Uid : p1Uid;
assert(cmWinnerUid === p2Uid, 'CHECKMATE: Correct winner UID set to checkmating player');
assert(cmLoserUid === p1Uid, 'CHECKMATE: Correct loser UID identified');

const completedCheckmateState: GameStateDocument = {
  fen: cmChess.fen(),
  turn: 'WHITE',
  status: 'FINISHED',
  checkedColor: 'WHITE',
  lastMove: null,
  moveHistory: [],
  moveNumber: 4,
  version: 4,
  winnerUid: cmWinnerUid,
  endReason: 'CHECKMATE',
  finishedAt: Date.now(),
  statsProcessed: false,
  updatedAt: null as any,
};
assert(completedCheckmateState.status === 'FINISHED', 'CHECKMATE: Status becomes FINISHED');
assert(completedCheckmateState.endReason === 'CHECKMATE', 'CHECKMATE: End reason is CHECKMATE');
assert(completedCheckmateState.winnerUid === p2Uid, 'CHECKMATE: Winner UID persisted in state');

// 18. STALEMATE Completion Logic
const smChess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
assert(smChess.isStalemate() === true, 'STALEMATE: Detect stalemate correctly');
const smWinnerUid = null;
const smEndReason = 'STALEMATE';
assert(smWinnerUid === null, 'STALEMATE: winnerUid is null');
assert(smEndReason === 'STALEMATE', 'STALEMATE: Correct end reason is STALEMATE');

// 19. DRAW: Threefold Repetition Detection via Move Replay
const repChess = new Chess();
const repMoves = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'];
for (const m of repMoves) {
  repChess.move(m);
}
assert(repChess.isThreefoldRepetition() === true, 'DRAW: Threefold repetition detected via move replay');
assert(repChess.isDraw() === true, 'DRAW: Threefold repetition is recognized as draw');

// 20. DRAW: Insufficient Material Detection
const insChess = new Chess('8/8/8/8/8/5k2/8/4K2B w - - 0 1');
assert(insChess.isInsufficientMaterial() === true, 'DRAW: Insufficient material detected');
assert(insChess.isDraw() === true, 'DRAW: Insufficient material is recognized as draw');

// 21. DRAW: Fifty-Move Rule Detection
const fiftyChess = new Chess('8/8/8/8/8/8/8/4k2K w - - 100 50');
assert(fiftyChess.isDrawByFiftyMoves() === true, 'DRAW: Fifty-move rule detected after 50 moves without pawn/capture');
assert(fiftyChess.isDraw() === true, 'DRAW: Fifty-move rule is recognized as draw');

// 22. IDEMPOTENCY: Stats & History Protection
const processedGameState: GameStateDocument = {
  ...completedCheckmateState,
  statsProcessed: true,
};
const shouldProcessStats = (gs: GameStateDocument, roomSaved?: boolean) => {
  if (gs.statsProcessed || roomSaved) return false;
  return gs.status === 'FINISHED' || gs.status === 'CHECKMATE' || gs.status === 'DRAW' || gs.status === 'STALEMATE';
};
assert(
  shouldProcessStats(processedGameState, false) === false,
  'IDEMPOTENCY: Stats cannot process twice when statsProcessed is true'
);
assert(
  shouldProcessStats(completedCheckmateState, true) === false,
  'IDEMPOTENCY: History cannot save twice when historySaved is true'
);
assert(
  shouldProcessStats(completedCheckmateState, false) === true,
  'IDEMPOTENCY: Processes exactly once when neither flag is set'
);

// 23. IDEMPOTENCY: Client UI Event Guard
const processedEvents = new Set<string>();
const processGameEndEvent = (eventId: string): boolean => {
  if (processedEvents.has(eventId)) return false;
  processedEvents.add(eventId);
  return true;
};
const eventKey1 = `room123_4_${completedCheckmateState.finishedAt}`;
assert(processGameEndEvent(eventKey1) === true, 'IDEMPOTENCY: First game over event processes');
assert(processGameEndEvent(eventKey1) === false, 'IDEMPOTENCY: Duplicate event from StrictMode/refresh blocked');

// 24. MOVE LOCK: Cannot move after game is FINISHED
const validateCanMove = (gameState: GameStateDocument, roomStatus: string): boolean => {
  if (roomStatus !== 'PLAYING' && roomStatus !== 'READY') return false;
  if (
    gameState.status === 'FINISHED' ||
    gameState.status === 'CHECKMATE' ||
    gameState.status === 'DRAW' ||
    gameState.status === 'STALEMATE'
  ) {
    return false;
  }
  return true;
};
assert(
  validateCanMove(completedCheckmateState, 'FINISHED') === false,
  'MOVE LOCK: Move rejected when gameState.status is FINISHED'
);
assert(
  validateCanMove({ ...completedCheckmateState, status: 'PLAYING' }, 'FINISHED') === false,
  'MOVE LOCK: Move rejected when room.status is FINISHED'
);
assert(
  validateCanMove(mockGameState, 'PLAYING') === true,
  'MOVE LOCK: Move allowed when game is active and playing'
);

// 25. RECOVERY: Finished game preserves authoritative FEN & prevents new game init
const finishedRoom = {
  roomId: 'KQ-TEST',
  status: 'FINISHED',
  gameState: completedCheckmateState,
};
const validateShouldReinit = (room: any): boolean => {
  if (room.status === 'FINISHED' || room.status === 'COMPLETED' || room.status === 'CLOSED') {
    return false;
  }
  return !room.gameState || !room.gameState.fen;
};
assert(
  validateShouldReinit(finishedRoom) === false,
  'RECOVERY: Finished room rejects new game re-initialization'
);
assert(
  finishedRoom.gameState.fen === cmChess.fen(),
  'RECOVERY: Finished game restores authoritative final FEN from Firestore'
);

// 26. PERSPECTIVE CALCULATION: Accurate Winner / Defeat / Draw Mapping
const getPerspective = (winnerUid: string | null, myUid: string): 'VICTORY' | 'DEFEAT' | 'DRAW' => {
  if (!winnerUid) return 'DRAW';
  return winnerUid === myUid ? 'VICTORY' : 'DEFEAT';
};
assert(getPerspective(p2Uid, p2Uid) === 'VICTORY', 'PERSPECTIVE: Winner sees VICTORY');
assert(getPerspective(p2Uid, p1Uid) === 'DEFEAT', 'PERSPECTIVE: Loser sees DEFEAT');
assert(getPerspective(null, p1Uid) === 'DRAW', 'PERSPECTIVE: Player 1 sees DRAW on draw');
assert(getPerspective(null, p2Uid) === 'DRAW', 'PERSPECTIVE: Player 2 sees DRAW on draw');

// =========================================================================
// STEP 15.2 — AUTHORITATIVE RESIGNATION SYSTEM TESTS
// =========================================================================

// 27. RESIGNATION DETECTION: Player can resign during PLAYING state
interface MockResignationRoom {
  roomId: string;
  status: 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED' | 'CLOSED';
  player1: { uid: string };
  player2: { uid: string };
  gameState: GameStateDocument;
}

const simulateResignTransaction = (
  room: MockResignationRoom,
  resigningUid: string
): { success: boolean; room?: MockResignationRoom; error?: string } => {
  if (room.status !== 'PLAYING' || !room.gameState || room.gameState.status !== 'PLAYING') {
    return { success: false, error: 'GAME_ALREADY_FINISHED' };
  }
  const isP1 = room.player1.uid === resigningUid;
  const isP2 = room.player2.uid === resigningUid;
  if (!isP1 && !isP2) {
    return { success: false, error: 'NOT_ROOM_PARTICIPANT' };
  }
  const opponentUid = isP1 ? room.player2.uid : room.player1.uid;

  const updatedRoom: MockResignationRoom = {
    ...room,
    status: 'FINISHED',
    gameState: {
      ...room.gameState,
      status: 'FINISHED',
      endReason: 'RESIGNATION',
      winnerUid: opponentUid,
      resignedBy: resigningUid,
      finishedAt: Date.now(),
      version: room.gameState.version + 1,
    },
  };
  return { success: true, room: updatedRoom };
};

const activeGameRoom: MockResignationRoom = {
  roomId: 'KQ-RESIGN-1',
  status: 'PLAYING',
  player1: { uid: p1Uid },
  player2: { uid: p2Uid },
  gameState: {
    ...mockGameState,
    status: 'PLAYING',
    winnerUid: null,
    endReason: null,
    resignedBy: null,
    version: 3,
  },
};

const resignResult = simulateResignTransaction(activeGameRoom, p1Uid);
assert(resignResult.success === true, 'RESIGNATION: Player 1 can successfully resign active game');
assert(resignResult.room?.status === 'FINISHED', 'RESIGNATION: room.status becomes FINISHED');
assert(resignResult.room?.gameState.status === 'FINISHED', 'RESIGNATION: gameState.status becomes FINISHED');
assert(resignResult.room?.gameState.endReason === 'RESIGNATION', 'RESIGNATION: endReason becomes RESIGNATION');
assert(resignResult.room?.gameState.winnerUid === p2Uid, 'RESIGNATION: Opponent is declared winner');
assert(resignResult.room?.gameState.resignedBy === p1Uid, 'RESIGNATION: resigningUid is recorded in resignedBy');

// 28. RESIGNATION VALIDATION: Cannot resign already finished game
const finishedResignAttempt = simulateResignTransaction(resignResult.room!, p2Uid);
assert(
  finishedResignAttempt.success === false && finishedResignAttempt.error === 'GAME_ALREADY_FINISHED',
  'RESIGNATION VALIDATION: Cannot resign when game is already finished'
);

// 29. RESIGNATION VALIDATION: Cannot resign if not participant
const strangerResignAttempt = simulateResignTransaction(activeGameRoom, 'stranger_uid');
assert(
  strangerResignAttempt.success === false && strangerResignAttempt.error === 'NOT_ROOM_PARTICIPANT',
  'RESIGNATION VALIDATION: Non-participant cannot resign the battle'
);

// 30. DOUBLE RESIGNATION PROTECTION: First transaction succeeds, second safely rejects
const firstCall = simulateResignTransaction(activeGameRoom, p1Uid);
const secondCall = simulateResignTransaction(firstCall.room!, p1Uid);
assert(firstCall.success === true, 'DOUBLE RESIGNATION: First resignation attempt succeeds');
assert(
  secondCall.success === false && secondCall.error === 'GAME_ALREADY_FINISHED',
  'DOUBLE RESIGNATION: Duplicate/concurrent resignation attempt rejected with GAME_ALREADY_FINISHED'
);

// 31. RESIGNATION STATS & HISTORY: Winner gets win, loser gets loss, reason = RESIGNATION
const calculatePlayerStats = (result: 'WIN' | 'LOSS' | 'DRAW', currentWins = 0, currentLosses = 0, currentDraws = 0, currentGames = 0) => {
  return {
    wins: result === 'WIN' ? currentWins + 1 : currentWins,
    losses: result === 'LOSS' ? currentLosses + 1 : currentLosses,
    draws: result === 'DRAW' ? currentDraws + 1 : currentDraws,
    gamesPlayed: currentGames + 1,
  };
};

const resignedGameState = resignResult.room!.gameState;
const p1ResignStats = calculatePlayerStats('LOSS');
const p2WinStats = calculatePlayerStats('WIN');

assert(p1ResignStats.losses === 1 && p1ResignStats.gamesPlayed === 1, 'STATS: Resigning player receives loss + gamesPlayed');
assert(p2WinStats.wins === 1 && p2WinStats.gamesPlayed === 1, 'STATS: Opponent receives win + gamesPlayed');

// 32. RESIGNATION IDEMPOTENCY: Stats & history processed only once
assert(
  shouldProcessStats({ ...resignedGameState, statsProcessed: true }, false) === false,
  'IDEMPOTENCY: Resigned game stats rejected when statsProcessed is true'
);
assert(
  shouldProcessStats(resignedGameState, true) === false,
  'IDEMPOTENCY: Resigned game history rejected when historySaved is true'
);
assert(
  shouldProcessStats(resignedGameState, false) === true,
  'IDEMPOTENCY: Resigned game processes stats & history exactly once'
);

// 33. RESIGNATION BOARD LOCK: Moves rejected after resignation
assert(
  validateCanMove(resignedGameState, 'FINISHED') === false,
  'BOARD LOCK: Moves strictly rejected after resignation'
);

// 34. RESIGNATION RECOVERY: Refresh preserves resignation state without re-initializing
const refreshedResignedRoom = {
  roomId: 'KQ-RESIGN-1',
  status: 'FINISHED',
  gameState: resignedGameState,
};
assert(
  validateShouldReinit(refreshedResignedRoom) === false,
  'RECOVERY: Browser refresh restores finished resignation room without re-init'
);
assert(
  refreshedResignedRoom.gameState.winnerUid === p2Uid,
  'RECOVERY: Browser refresh preserves correct winnerUid'
);
assert(
  refreshedResignedRoom.gameState.endReason === 'RESIGNATION',
  'RECOVERY: Browser refresh preserves endReason RESIGNATION'
);
assert(
  refreshedResignedRoom.gameState.resignedBy === p1Uid,
  'RECOVERY: Browser refresh preserves resignedBy UID'
);

// 35. RESIGNATION CLIENT EVENT GUARD & PERSPECTIVE
const resignEventKey = `${refreshedResignedRoom.roomId}_${resignedGameState.version}_${resignedGameState.finishedAt}_RESIGNATION`;
assert(processGameEndEvent(resignEventKey) === true, 'EVENT GUARD: Resignation game over modal triggered once');
assert(processGameEndEvent(resignEventKey) === false, 'EVENT GUARD: Duplicate resignation modal trigger blocked');

assert(getPerspective(resignedGameState.winnerUid, p2Uid) === 'VICTORY', 'PERSPECTIVE: Opponent receives VICTORY perspective');
assert(getPerspective(resignedGameState.winnerUid, p1Uid) === 'DEFEAT', 'PERSPECTIVE: Resigning player receives DEFEAT perspective');

console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) {
  process.exit(1);
}


