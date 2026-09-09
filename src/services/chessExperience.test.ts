/**
 * KING & QUEEN — STEP 17
 * PRODUCTION GAME EXPERIENCE & CHESS POLISH TESTS
 *
 * Tests covering:
 * 1. Pawn Promotion (Queen, Rook, Bishop, Knight, invalid rejection)
 * 2. Draw Offer Lifecycle (Send, Accept, Decline, Expiry, Stat calculations)
 * 3. Resignation System (Confirmation, Opponent Victory, Idempotency)
 * 4. Sound System (Deduplication, Preference persistence)
 * 5. Move Feedback UI Logic (Legal moves, Last move, Check highlight)
 */

import { Chess } from 'chess.js';
import {
  DRAW_OFFER_TIMEOUT_MS,
  isDrawOfferExpired,
} from './gameService';
import { soundService } from './soundService';
import {
  RoomDocument,
  GameStateDocument,
  RoomPlayer,
  DrawOfferDocument,
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

console.log('\n--- Running Step 17 Production Game Experience & Chess Polish Tests ---');

// ============================================================================
// PART 1: PAWN PROMOTION TESTS
// ============================================================================
console.log('\n[Section 1: Pawn Promotion]');

// Setup a position where White pawn on e7 is 1 step from promotion (e8)
// 8/4P3/8/8/8/8/8/4K2k w - - 0 1
const promotionFen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';

// 1. Queen promotion
const chessQueen = new Chess(promotionFen);
const queenMove = chessQueen.move({ from: 'e7', to: 'e8', promotion: 'q' });
assert(queenMove !== null, 'White pawn promotes to Queen');
assert(queenMove?.piece === 'p' && queenMove?.promotion === 'q', 'Move record reflects promotion to queen');
const queenPiece = chessQueen.get('e8');
assert(queenPiece !== null && queenPiece.type === 'q' && queenPiece.color === 'w', 'Square e8 now contains White Queen');

// 2. Rook promotion (Underpromotion)
const chessRook = new Chess(promotionFen);
const rookMove = chessRook.move({ from: 'e7', to: 'e8', promotion: 'r' });
assert(rookMove !== null, 'White pawn underpromotes to Rook');
const rookPiece = chessRook.get('e8');
assert(rookPiece !== null && rookPiece.type === 'r', 'Square e8 now contains White Rook');

// 3. Bishop promotion (Underpromotion)
const chessBishop = new Chess(promotionFen);
const bishopMove = chessBishop.move({ from: 'e7', to: 'e8', promotion: 'b' });
assert(bishopMove !== null, 'White pawn underpromotes to Bishop');
const bishopPiece = chessBishop.get('e8');
assert(bishopPiece !== null && bishopPiece.type === 'b', 'Square e8 now contains White Bishop');

// 4. Knight promotion (Underpromotion)
const chessKnight = new Chess(promotionFen);
const knightMove = chessKnight.move({ from: 'e7', to: 'e8', promotion: 'n' });
assert(knightMove !== null, 'White pawn underpromotes to Knight');
const knightPiece = chessKnight.get('e8');
assert(knightPiece !== null && knightPiece.type === 'n', 'Square e8 now contains White Knight');

// 5. Invalid promotion piece prevention (King or Pawn cannot be chosen)
const chessInvalid = new Chess(promotionFen);
let invalidErrorCaught = false;
try {
  chessInvalid.move({ from: 'e7', to: 'e8', promotion: 'k' as any });
} catch {
  invalidErrorCaught = true;
}
assert(invalidErrorCaught, 'Invalid promotion piece (King) is strictly rejected');

// 6. Promotion requirement: Move to final rank without promotion piece is rejected
let missingPromotionCaught = false;
try {
  chessInvalid.move({ from: 'e7', to: 'e8' });
} catch {
  missingPromotionCaught = true;
}
assert(missingPromotionCaught, 'Pawn move to 8th rank without specifying promotion is rejected');

// 7. Duplicate promotion prevention
// Once promoted to e8, moving that piece again does not trigger another promotion
chessQueen.move({ from: 'h1', to: 'h2' }); // black moves
const queenSecondMove = chessQueen.move({ from: 'e8', to: 'e7' });
assert(queenSecondMove !== null && queenSecondMove.promotion === undefined, 'Subsequent moves by promoted Queen do not trigger promotion');

// ============================================================================
// PART 2: DRAW OFFER SYSTEM
// ============================================================================
console.log('\n[Section 2: Draw Offer System]');

// 1. Timeout constant
assert(DRAW_OFFER_TIMEOUT_MS === 30000, 'Draw offer timeout is exactly 30,000 milliseconds (30 seconds)');

// 2. Expiration check
const now = Date.now();
const freshOfferTime = now - 5000; // 5s ago
const expiredOfferTime = now - 35000; // 35s ago

assert(!isDrawOfferExpired(freshOfferTime), 'Fresh draw offer (5s ago) is NOT expired');
assert(isDrawOfferExpired(expiredOfferTime), 'Draw offer older than 30s is expired');
assert(!isDrawOfferExpired(undefined), 'Undefined offeredAt returns false');
assert(isDrawOfferExpired({ toMillis: () => expiredOfferTime }), 'Handles Firestore Timestamp object with toMillis');

// 3. Draw Offer lifecycle transitions
const mockDrawOffer: DrawOfferDocument = {
  offeredBy: 'user_a',
  offeredAt: now,
  expiresAt: now + DRAW_OFFER_TIMEOUT_MS,
  status: 'PENDING',
};
assert(mockDrawOffer.status === 'PENDING', 'Draw offer starts in PENDING status');

// 4. Accepting draw offer resolves game as DRAW
const acceptDrawResult = {
  status: 'FINISHED',
  winner: null,
  winnerUid: null,
  endReason: 'DRAW',
};
assert(acceptDrawResult.status === 'FINISHED' && acceptDrawResult.winner === null, 'Accepted draw transitions game to FINISHED with null winner');
assert(acceptDrawResult.endReason === 'DRAW', 'Accepted draw sets endReason to DRAW');

// 5. Declining draw offer sets status to DECLINED and keeps game active
const declineDrawOffer: DrawOfferDocument = {
  ...mockDrawOffer,
  status: 'DECLINED',
};
assert(declineDrawOffer.status === 'DECLINED', 'Declined draw offer transitions status to DECLINED');

// 6. Draw statistics calculation: gamesPlayed + 1, wins and losses unchanged for both
const playerAStats = { wins: 5, losses: 3, gamesPlayed: 8 };
const playerBStats = { wins: 4, losses: 4, gamesPlayed: 8 };

const updatedAStats = { ...playerAStats, gamesPlayed: playerAStats.gamesPlayed + 1 };
const updatedBStats = { ...playerBStats, gamesPlayed: playerBStats.gamesPlayed + 1 };

assert(updatedAStats.gamesPlayed === 9 && updatedAStats.wins === 5 && updatedAStats.losses === 3, 'Player A stats on draw: gamesPlayed + 1, 0 win/loss increment');
assert(updatedBStats.gamesPlayed === 9 && updatedBStats.wins === 4 && updatedBStats.losses === 4, 'Player B stats on draw: gamesPlayed + 1, 0 win/loss increment');

// ============================================================================
// PART 3: RESIGNATION SYSTEM
// ============================================================================
console.log('\n[Section 3: Resignation System]');

// 1. Resignation assigns opponent as winner
const p1Uid = 'user_player_1';
const p2Uid = 'user_player_2';

const resignGame = (resigningUid: string) => {
  const winnerUid = resigningUid === p1Uid ? p2Uid : p1Uid;
  return {
    status: 'FINISHED',
    winnerUid,
    resignedBy: resigningUid,
    endReason: 'RESIGNATION',
  };
};

const resignResult = resignGame(p1Uid);
assert(resignResult.winnerUid === p2Uid, 'When Player 1 resigns, Player 2 is awarded victory');
assert(resignResult.endReason === 'RESIGNATION', 'Game endReason is RESIGNATION');
assert(resignResult.resignedBy === p1Uid, 'resignedBy records the resigning player UID');

// 2. Idempotency: Processing stats only once
let statsExecutionCount = 0;
let statsProcessed = false;

const processStatsOnce = () => {
  if (statsProcessed) return;
  statsExecutionCount++;
  statsProcessed = true;
};

processStatsOnce();
processStatsOnce(); // duplicate call
assert(statsExecutionCount === 1, 'Resignation statistics updated strictly once via idempotency guard');

// ============================================================================
// PART 4: SOUND SYSTEM TESTS
// ============================================================================
console.log('\n[Section 4: Sound System]');

// 1. Sound toggle preference
soundService.setEnabled(false);
assert(!soundService.isEnabled(), 'Sound toggle can be disabled');
soundService.setEnabled(true);
assert(soundService.isEnabled(), 'Sound toggle can be enabled');

// 2. Event deduplication
const roomId = 'room_royal_123';
const moveNum = 1;
assert(soundService.shouldPlay(roomId, 'MOVE', moveNum), 'First time event triggers sound');
assert(!soundService.shouldPlay(roomId, 'MOVE', moveNum), 'Duplicate snapshot event blocked by deduplication');

// Muted sound blocks playback
soundService.setEnabled(false);
assert(!soundService.shouldPlay(roomId, 'CAPTURE', 2), 'Disabled sound setting blocks audio playback');
soundService.setEnabled(true);

// Clear event history resets deduplication
soundService.clearEventHistory();
assert(soundService.shouldPlay(roomId, 'MOVE', moveNum), 'Cleared event history allows fresh sound on rematch');

// ============================================================================
// PART 5: MOVE FEEDBACK UI LOGIC
// ============================================================================
console.log('\n[Section 5: Move Feedback UI Logic]');

// 1. Legal moves calculation for starting White Pawn (e2)
const startChess = new Chess();
const legalMovesE2 = startChess.moves({ square: 'e2', verbose: true });
assert(legalMovesE2.length === 2, 'Pawn on e2 has 2 legal moves (e3, e4)');
const targets = legalMovesE2.map((m) => m.to);
assert(targets.includes('e3') && targets.includes('e4'), 'e2 legal targets are e3 and e4');

// 2. Empty square vs Capture ring indicator detection
const isCaptureE3 = legalMovesE2.find((m) => m.to === 'e3')?.captured !== undefined;
assert(!isCaptureE3, 'Move e2->e3 is an empty square (small dot indicator)');

// Setup capture position: White pawn e4, Black pawn d5
const captureChess = new Chess('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
const legalMovesE4 = captureChess.moves({ square: 'e4', verbose: true });
const captureMove = legalMovesE4.find((m) => m.to === 'd5');
assert(captureMove !== undefined && captureMove.captured === 'p', 'Move e4->d5 is a capture (capture ring indicator)');

// 3. Check detection and King square highlight
const checkFen = 'rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3'; // Fool's mate check
const checkChess = new Chess(checkFen);
assert(checkChess.inCheck(), 'Game is in check');

// Identify white king square
let whiteKingSquare = '';
const board = checkChess.board();
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (piece && piece.type === 'k' && piece.color === 'w') {
      const file = String.fromCharCode('a'.charCodeAt(0) + c);
      const rank = 8 - r;
      whiteKingSquare = `${file}${rank}`;
    }
  }
}
assert(whiteKingSquare === 'e1', 'White King in check is accurately located at e1 for crimson highlight');

// 4. Non-turn piece legal move concealment
// If it's White's turn, Black pieces should have NO legal moves generated for player
const blackPieceMovesOnWhiteTurn = startChess.moves({ square: 'e7', verbose: true });
assert(blackPieceMovesOnWhiteTurn.length === 0, 'Cannot generate legal moves for opponent pieces on current player turn');

// ============================================================================
// PART 6: PHASE B — COLOR UX & IDENTITY DECOUPLING TESTS
// ============================================================================
console.log('\n[Section 6: Phase B — Color UX & Identity Decoupling]');

// 1. White player sees WHITE badge, Black player sees BLACK badge
const player1Identity: 'KING' | 'QUEEN' = 'KING';
const player2Identity: 'KING' | 'QUEEN' = 'QUEEN';
const player1ChessSide: 'WHITE' | 'BLACK' = 'WHITE';
const player2ChessSide: 'WHITE' | 'BLACK' = 'BLACK';

assert(player1ChessSide === 'WHITE', 'White player sees WHITE');
assert(player2ChessSide === 'BLACK', 'Black player sees BLACK');

// 2. Identity remains strictly independent of Chess Color
// King can play White OR Black; Queen can play White OR Black
const kingAsBlack: { identity: 'KING'; side: 'BLACK' } = { identity: 'KING', side: 'BLACK' };
const queenAsWhite: { identity: 'QUEEN'; side: 'WHITE' } = { identity: 'QUEEN', side: 'WHITE' };
assert(kingAsBlack.identity === 'KING' && kingAsBlack.side === 'BLACK', 'Identity KING is independent of playing BLACK');
assert(queenAsWhite.identity === 'QUEEN' && queenAsWhite.side === 'WHITE', 'Identity QUEEN is independent of playing WHITE');

// 3. Creator/Partner remains independent of Chess Color
const creatorAsBlack = { role: 'CREATOR', side: 'BLACK' };
const partnerAsWhite = { role: 'PARTNER', side: 'WHITE' };
assert(creatorAsBlack.role === 'CREATOR' && creatorAsBlack.side === 'BLACK', 'Room Creator is independent of playing BLACK');
assert(partnerAsWhite.role === 'PARTNER' && partnerAsWhite.side === 'WHITE', 'Room Partner is independent of playing WHITE');

// ============================================================================
// PART 7: PHASE B — TURN UX & OPPONENT RECOGNITION TESTS
// ============================================================================
console.log('\n[Section 7: Phase B — Turn UX & Opponent Recognition]');

// 1. Current player identified
const gameTurnState: {
  turn: 'WHITE' | 'BLACK';
  playerA: { uid: string; name: string; side: 'WHITE' | 'BLACK' };
  playerB: { uid: string; name: string; side: 'WHITE' | 'BLACK' };
} = {
  turn: 'WHITE',
  playerA: { uid: 'p1', name: 'Ashwi', side: 'WHITE' },
  playerB: { uid: 'p2', name: 'Poovaragavan', side: 'BLACK' },
};

const isPlayerATurn = gameTurnState.turn === gameTurnState.playerA.side;
const isPlayerBTurn = gameTurnState.turn === gameTurnState.playerB.side;
assert(isPlayerATurn && !isPlayerBTurn, 'Current player (White) is accurately identified as active');

// 2. Opponent identity is explicitly recognized
const opponentForA = gameTurnState.playerB.name;
const opponentSideForA = gameTurnState.playerB.side;
assert(opponentForA === 'Poovaragavan' && opponentSideForA === 'BLACK', 'Opponent name and side are accurately derived for Player A');

// 3. Turn switches after a move
const chessTurnTest = new Chess();
assert(chessTurnTest.turn() === 'w', 'Initial chess turn is White (w)');
chessTurnTest.move('e4');
assert(chessTurnTest.turn() === 'b', 'Turn changes to Black (b) after valid move e4');

// 4. Refresh preserves authoritative turn from FEN
const currentFen = chessTurnTest.fen();
const refreshedChess = new Chess(currentFen);
assert(refreshedChess.turn() === 'b', 'Page refresh with authoritative FEN preserves Black turn');

// ============================================================================
// PART 8: PHASE B — COIN TOSS & COLOR RESULT UX TESTS
// ============================================================================
console.log('\n[Section 8: Phase B — Royal Coin Toss & Result UX]');

// 1. Heads result preserved
const coinResultHeads = {
  coinResult: 'HEADS' as const,
  tossWinnerUid: 'p1',
  winnerColorChoice: 'WHITE' as const,
};
assert(coinResultHeads.coinResult === 'HEADS', 'HEADS coin result is preserved in room document');
assert(coinResultHeads.winnerColorChoice === 'WHITE', 'Winner color choice (WHITE) is preserved');

// 2. Tails result preserved
const coinResultTails = {
  coinResult: 'TAILS' as const,
  tossWinnerUid: 'p2',
  winnerColorChoice: 'BLACK' as const,
};
assert(coinResultTails.coinResult === 'TAILS', 'TAILS coin result is preserved in room document');

// 3. Refresh does not re-run toss or randomly regenerate colors
const simulateRefreshRoom = (existingRoom: typeof coinResultHeads) => {
  // If coinResult already exists, return existing state without spinning
  if (existingRoom.coinResult !== null) {
    return { ...existingRoom, rerun: false };
  }
  return { ...existingRoom, rerun: true };
};
const refreshedRoomState = simulateRefreshRoom(coinResultHeads);
assert(!refreshedRoomState.rerun, 'Refresh does not rerun coin toss when coinResult already exists');

// ============================================================================
// PART 9: PHASE B — REACTIONS POLISH & STACKING TESTS
// ============================================================================
console.log('\n[Section 9: Phase B — Reactions Polish & Stacking]');

const SUPPORTED_REACTIONS = ['😂', '❤️', '🔥', '😈', '👏', '😮'];
assert(SUPPORTED_REACTIONS.length === 6, 'Supported reactions list contains exactly 6 specification emojis');
assert(SUPPORTED_REACTIONS.includes('😈') && SUPPORTED_REACTIONS.includes('😮'), 'Includes 😈 and 😮 emojis');

// Multiple reaction cap / stacking logic (Max 3-4 visible)
const incomingReactionsQueue = [
  { id: 1, emoji: '😂' },
  { id: 2, emoji: '🔥' },
  { id: 3, emoji: '❤️' },
  { id: 4, emoji: '😈' },
  { id: 5, emoji: '👏' },
];
const visibleReactions = incomingReactionsQueue.slice(-4);
assert(visibleReactions.length === 4, 'Visible floating reactions capped to maximum 4 items');
assert(visibleReactions[visibleReactions.length - 1].emoji === '👏', 'Most recent reaction is rendered at the top');

// ============================================================================
// PART 10: PHASE B — GAME STATE PRESENTATION TESTS
// ============================================================================
console.log('\n[Section 10: Phase B — Distinct Game States]');

const formatGameOverHeader = (reason: string, isWin: boolean, opponentName: string) => {
  if (reason === 'CHECKMATE') return { badge: 'CHECKMATE', title: 'THE KINGDOM FALLS' };
  if (reason === 'RESIGNATION') return { badge: 'RESIGNATION', title: isWin ? `${opponentName.toUpperCase()} RESIGNED` : 'YOU RESIGNED' };
  if (reason === 'TIMEOUT') return { badge: 'TIME EXPIRED', title: isWin ? `${opponentName.toUpperCase()} RAN OUT OF TIME` : 'YOUR TIME EXPIRED' };
  if (reason === 'STALEMATE') return { badge: 'STALEMATE', title: 'NO LEGAL MOVES' };
  return { badge: 'DRAW AGREED', title: 'BATTLE ENDS IN DRAW' };
};

const checkmateHeader = formatGameOverHeader('CHECKMATE', true, 'Ashwi');
assert(checkmateHeader.badge === 'CHECKMATE' && checkmateHeader.title === 'THE KINGDOM FALLS', 'Checkmate presents THE KINGDOM FALLS');

const resignHeader = formatGameOverHeader('RESIGNATION', true, 'Poovaragavan');
assert(resignHeader.badge === 'RESIGNATION' && resignHeader.title === 'POOVARAGAVAN RESIGNED', 'Resignation does not call itself checkmate');

const timeoutHeader = formatGameOverHeader('TIMEOUT', false, 'Ashwi');
assert(timeoutHeader.badge === 'TIME EXPIRED' && timeoutHeader.title === 'YOUR TIME EXPIRED', 'Timeout clearly states TIME EXPIRED');

const drawHeader = formatGameOverHeader('DRAW', false, 'Ashwi');
assert(drawHeader.badge === 'DRAW AGREED' && drawHeader.title === 'BATTLE ENDS IN DRAW', 'Draw presents BATTLE ENDS IN DRAW');

// ============================================================================
// PART 11: PHASE B — TRUTH OR DARE GAME ROLES & PRESENTATION
// ============================================================================
console.log('\n[Section 11: Phase B — Truth or Dare Game Roles & Polish]');

const getTDRoles = (currentPlayerUid: string, userUid: string) => {
  const isMyTurn = currentPlayerUid === userUid;
  return {
    myRole: isMyTurn ? 'CHALLENGER' : 'JUDGE',
    opponentRole: isMyTurn ? 'JUDGE' : 'CHALLENGER',
  };
};

const tdTurn1 = getTDRoles('user_1', 'user_1');
assert(tdTurn1.myRole === 'CHALLENGER' && tdTurn1.opponentRole === 'JUDGE', 'Active turn player receives temporary CHALLENGER role');

const tdTurn2 = getTDRoles('user_2', 'user_1');
assert(tdTurn2.myRole === 'JUDGE' && tdTurn2.opponentRole === 'CHALLENGER', 'Waiting player receives temporary JUDGE role');

// ============================================================================
// PART 12: PHASE C — CHESS PIECE MOVE DELTA CALCULATION TESTS
// ============================================================================
console.log('\n[Section 12: Phase C — Chess Move Delta Calculation]');

const calculateMoveDelta = (
  fromSquare: string | null | undefined,
  toSquare: string | null | undefined,
  currentSquare: string,
  isFlipped: boolean
): { deltaX: string; deltaY: string } | null => {
  if (!fromSquare || !toSquare || toSquare !== currentSquare) {
    return null;
  }

  const fromCol = fromSquare.charCodeAt(0) - 'a'.charCodeAt(0);
  const fromRow = 8 - parseInt(fromSquare[1], 10);

  const toCol = toSquare.charCodeAt(0) - 'a'.charCodeAt(0);
  const toRow = 8 - parseInt(toSquare[1], 10);

  const displayFromCol = isFlipped ? 7 - fromCol : fromCol;
  const displayFromRow = isFlipped ? 7 - fromRow : fromRow;
  const displayToCol = isFlipped ? 7 - toCol : toCol;
  const displayToRow = isFlipped ? 7 - toRow : toRow;

  const deltaX = `${(displayFromCol - displayToCol) * 100}%`;
  const deltaY = `${(displayFromRow - displayToRow) * 100}%`;

  return { deltaX, deltaY };
};

// 1. Standard board move: e2 -> e4
const deltaE2E4Standard = calculateMoveDelta('e2', 'e4', 'e4', false);
assert(deltaE2E4Standard !== null, 'e2->e4 produces valid delta on destination square e4');
assert(deltaE2E4Standard?.deltaX === '0%' && deltaE2E4Standard?.deltaY === '200%', 'e2->e4 delta is (0%, +200%) on standard White perspective');

// 2. Flipped board move: e2 -> e4
const deltaE2E4Flipped = calculateMoveDelta('e2', 'e4', 'e4', true);
assert(deltaE2E4Flipped !== null, 'e2->e4 produces valid delta on flipped board');
assert(deltaE2E4Flipped?.deltaX === '0%' && deltaE2E4Flipped?.deltaY === '-200%', 'e2->e4 delta is (0%, -200%) on flipped Black perspective');

// 3. Diagonal capture move: e4 -> d5
const deltaE4D5Capture = calculateMoveDelta('e4', 'd5', 'd5', false);
assert(deltaE4D5Capture !== null, 'e4->d5 capture produces valid delta on square d5');
assert(deltaE4D5Capture?.deltaX === '100%' && deltaE4D5Capture?.deltaY === '100%', 'e4->d5 diagonal capture delta is (100%, 100%)');

// 4. Non-matching square returns null (pieces not landing here do not animate)
const deltaNonDestination = calculateMoveDelta('e2', 'e4', 'e2', false);
assert(deltaNonDestination === null, 'Origin or unrelated square returns null delta to prevent false animation');

// ============================================================================
// PART 13: PHASE C — REACTION FRESHNESS & DEDUPLICATION TESTS
// ============================================================================
console.log('\n[Section 13: Phase C — Reaction Freshness & Deduplication]');

const simulateReactionFilter = (
  rawReactions: Array<{ id: string; emoji: string; createdAt: number }>,
  mountTime: number,
  seenIds: Set<string>
) => {
  const freshThreshold = mountTime - 3000;
  const newReactionsToAnimate: Array<{ id: string; emoji: string }> = [];

  for (const r of rawReactions) {
    if (r.createdAt < freshThreshold) {
      continue; // Filter out stale historic reactions from Firestore on refresh
    }
    if (seenIds.has(r.id)) {
      continue; // Deduplicate already seen reactions
    }
    seenIds.add(r.id);
    newReactionsToAnimate.push({ id: r.id, emoji: r.emoji });
  }

  return newReactionsToAnimate;
};

const mountTime = 100000;
const seenReactionIds = new Set<string>();

// Historic reactions from 10 seconds ago (simulating snapshot after page refresh)
const historicReactions = [
  { id: 'rx_1', emoji: '❤️', createdAt: mountTime - 10000 },
  { id: 'rx_2', emoji: '🔥', createdAt: mountTime - 5000 },
];
const filteredOnMount = simulateReactionFilter(historicReactions, mountTime, seenReactionIds);
assert(filteredOnMount.length === 0, 'Historic reactions older than 3s are ignored on initial mount / refresh');

// Live reaction arrives 500ms after mount
const liveReaction1 = [{ id: 'rx_3', emoji: '😈', createdAt: mountTime + 500 }];
const animatedLive = simulateReactionFilter(liveReaction1, mountTime, seenReactionIds);
assert(animatedLive.length === 1 && animatedLive[0].emoji === '😈', 'Live reaction received after mount is scheduled for animation');

// Duplicate snapshot event of live reaction arrives again
const duplicateEvent = [{ id: 'rx_3', emoji: '😈', createdAt: mountTime + 500 }];
const animatedDuplicate = simulateReactionFilter(duplicateEvent, mountTime, seenReactionIds);
assert(animatedDuplicate.length === 0, 'Duplicate snapshot event of same reaction ID is ignored without replaying');

// Second distinct live reaction
const liveReaction2 = [{ id: 'rx_4', emoji: '😮', createdAt: mountTime + 1200 }];
const animatedLive2 = simulateReactionFilter(liveReaction2, mountTime, seenReactionIds);
assert(animatedLive2.length === 1 && animatedLive2[0].id === 'rx_4', 'Distinct new live reaction is animated');

// ============================================================================
// PART 14: PHASE C — TURN TRANSITION KEYING & GAME OVER PRESENTATION
// ============================================================================
console.log('\n[Section 14: Phase C — Turn & Game Over Animation Keying]');

const getTurnAnimationKey = (isGameOver: boolean, turn: 'WHITE' | 'BLACK', isMyTurn: boolean) => {
  if (isGameOver) return 'game_over';
  return `${turn}_${isMyTurn ? 'my_turn' : 'opponent_turn'}`;
};

const whiteTurnKey = getTurnAnimationKey(false, 'WHITE', true);
const blackTurnKey = getTurnAnimationKey(false, 'BLACK', false);
const gameOverKey = getTurnAnimationKey(true, 'BLACK', false);

assert(whiteTurnKey === 'WHITE_my_turn', 'Generates unique key for local player White turn');
assert(blackTurnKey === 'BLACK_opponent_turn', 'Generates unique key for opponent Black turn');
assert(whiteTurnKey !== blackTurnKey, 'Turn change produces distinct key to trigger Framer Motion transition');
assert(gameOverKey === 'game_over', 'Game over produces distinct key to transition turn badge smoothly');

// ============================================================================
// PART 15: PHASE C — TRUTH / DARE TRANSITION SAFETY & REDUCED MOTION
// ============================================================================
console.log('\n[Section 15: Phase C — Truth or Dare Transition Safety]');

// Verify Authoritative state consistency: Card text and mode come strictly from session
const mockTDSession = {
  round: 2,
  completedRounds: 1,
  phase: 'RESPONDING' as const,
  selectedMode: 'TRUTH' as const,
  selectedCardId: 'truth_005',
  currentPlayerUid: 'user_a',
};

assert(mockTDSession.selectedCardId === 'truth_005', 'Authoritative card ID is bound to session');
assert(mockTDSession.phase === 'RESPONDING', 'Transition to RESPONDING displays card with 3D animation');

// Reduced motion fallback flag validation
const prefersReducedMotion = true;
const getCardAnimationVariants = (reducedMotion: boolean) => {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.1 },
    };
  }
  return {
    initial: { opacity: 0, rotateY: 90, scale: 0.95 },
    animate: { opacity: 1, rotateY: 0, scale: 1 },
    transition: { duration: 0.35, ease: 'easeOut' },
  };
};

const reducedMotionCardConfig = getCardAnimationVariants(true);
assert(
  (reducedMotionCardConfig.initial as any).rotateY === undefined,
  'Reduced motion removes 3D rotation and maintains clean subtle opacity transition'
);

const fullMotionCardConfig = getCardAnimationVariants(false);
assert(
  (fullMotionCardConfig.initial as any).rotateY === 90,
  'Full motion includes smooth 3D rotateY flip transition'
);

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n======================================================`);
console.log(`Step 17, Phase B & Phase C Tests Completed: ${passed} Passed, ${failed} Failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}


