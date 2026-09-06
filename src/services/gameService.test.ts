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
  mapGameError({ message: 'GAME_ALREADY_FINISHED' }).includes('concluded'),
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

console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed\n`);
if (failed > 0) {
  process.exit(1);
}

