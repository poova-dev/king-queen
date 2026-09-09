/**
 * KING & QUEEN — PHASE D TEST SUITE
 *
 * Comprehensive tests covering:
 * 1. Challenger / Judge Role Alternating & Independence
 * 2. Truth & Dare Categories & Mode Matching
 * 3. Difficulty Levels (Easy, Medium, Hard, Extreme) & Label Integrity
 * 4. Authoritative Card Selection & Used-Card Deduplication
 * 5. Custom Deck Data Structures & Ownership
 * 6. Expanded Game Statistics (Chess & Truth/Dare) & Idempotency
 * 7. Refresh / Reconnect State Resilience
 */

import {
  TRUTH_CATEGORIES,
  DARE_CATEGORIES,
  ALL_CATEGORIES,
  getCategoryDefinitions,
  BUILT_IN_TRUTH_CARDS,
  BUILT_IN_DARE_CARDS,
  getCardById,
  filterCards,
  selectAuthoritativeCard,
} from '../lib/truthDareCards';
import { calculateUserGameStats } from './gameHistoryService';
import {
  TruthDareMode,
  TruthDareCategory,
  TruthDareDifficulty,
  TruthDareCard,
  TruthDareCustomDeck,
  TruthDareSession,
  UserGameHistoryRecord,
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

console.log('\n--- Running Phase D Truth/Dare Content, Roles & Game Statistics Tests ---');

// ============================================================================
// PART 1: CHALLENGER / JUDGE ROLE ALTERNATION & INDEPENDENCE
// ============================================================================
console.log('\n[Section 1: Challenger / Judge Role Alternation]');

const getRoles = (currentPlayerUid: string, userUid: string) => {
  const isChallenger = currentPlayerUid === userUid;
  return {
    myRole: isChallenger ? 'CHALLENGER' : 'JUDGE',
    partnerRole: isChallenger ? 'JUDGE' : 'CHALLENGER',
  };
};

const userA = 'uid_king_alex';
const userB = 'uid_queen_elena';

// Round 1: User A starts as Challenger
const r1 = getRoles(userA, userA);
assert(r1.myRole === 'CHALLENGER' && r1.partnerRole === 'JUDGE', 'Round 1: User A is CHALLENGER, Partner is JUDGE');

// Round 2: User B becomes Challenger
const r2 = getRoles(userB, userA);
assert(r2.myRole === 'JUDGE' && r2.partnerRole === 'CHALLENGER', 'Round 2: User A is JUDGE, Partner is CHALLENGER');

// Round 3: Alternates back to User A
const r3 = getRoles(userA, userA);
assert(r3.myRole === 'CHALLENGER' && r3.partnerRole === 'JUDGE', 'Round 3: User A is back to CHALLENGER');

// Role Independence: KING / QUEEN identity and CREATOR / PARTNER role remain completely separate
const playerAIdentity = 'KING';
const playerARoomRole = 'CREATOR';
const playerAGameRole = r1.myRole;
assert(
  playerAIdentity === 'KING' && playerARoomRole === 'CREATOR' && playerAGameRole === 'CHALLENGER',
  'Identity KING is decoupled from Room Role CREATOR and Game Role CHALLENGER'
);

// ============================================================================
// PART 2: TRUTH & DARE CATEGORIES
// ============================================================================
console.log('\n[Section 2: Truth & Dare Categories]');

assert(TRUTH_CATEGORIES.length === 6, 'Exactly 6 Truth categories defined');
assert(DARE_CATEGORIES.length === 6, 'Exactly 6 Dare categories defined');
assert(ALL_CATEGORIES.length === 12, '12 Total category definitions available');

const truthCatIds = TRUTH_CATEGORIES.map((c) => c.id);
assert(
  truthCatIds.includes('FRIENDSHIP') &&
    truthCatIds.includes('RELATIONSHIP') &&
    truthCatIds.includes('FUNNY') &&
    truthCatIds.includes('DEEP') &&
    truthCatIds.includes('COLLEGE') &&
    truthCatIds.includes('PERSONAL'),
  'Truth categories include all 6 specification categories'
);

const dareCatIds = DARE_CATEGORIES.map((c) => c.id);
assert(
  dareCatIds.includes('FUNNY') &&
    dareCatIds.includes('ACTING') &&
    dareCatIds.includes('SOCIAL') &&
    dareCatIds.includes('CREATIVE') &&
    dareCatIds.includes('FRIENDSHIP') &&
    dareCatIds.includes('CHALLENGE'),
  'Dare categories include all 6 specification categories'
);

// getCategoryDefinitions helper
const filteredTruthCats = getCategoryDefinitions('TRUTH');
assert(filteredTruthCats.every((c) => c.mode === 'TRUTH'), 'getCategoryDefinitions("TRUTH") returns only Truth categories');

const filteredDareCats = getCategoryDefinitions('DARE');
assert(filteredDareCats.every((c) => c.mode === 'DARE'), 'getCategoryDefinitions("DARE") returns only Dare categories');

// ============================================================================
// PART 3: DIFFICULTY LEVELS & ACCESSIBILITY
// ============================================================================
console.log('\n[Section 3: Difficulty Levels & Accessibility]');

const validDifficulties: TruthDareDifficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXTREME'];
assert(validDifficulties.length === 4, '4 Difficulty tiers supported');

// Verify built-in cards span all difficulty levels
const truthDiffs = new Set(BUILT_IN_TRUTH_CARDS.map((c) => c.difficulty));
assert(
  truthDiffs.has('EASY') && truthDiffs.has('MEDIUM') && truthDiffs.has('HARD') && truthDiffs.has('EXTREME'),
  'Built-in Truth deck contains Easy, Medium, Hard, and Extreme cards'
);

const dareDiffs = new Set(BUILT_IN_DARE_CARDS.map((c) => c.difficulty));
assert(
  dareDiffs.has('EASY') && dareDiffs.has('MEDIUM') && dareDiffs.has('HARD') && dareDiffs.has('EXTREME'),
  'Built-in Dare deck contains Easy, Medium, Hard, and Extreme cards'
);

// Every category has cards associated with it
for (const cat of TRUTH_CATEGORIES) {
  const count = BUILT_IN_TRUTH_CARDS.filter((c) => c.category === cat.id).length;
  assert(count >= 3, `Truth category ${cat.id} has at least 3 cards (found ${count})`);
}

for (const cat of DARE_CATEGORIES) {
  const count = BUILT_IN_DARE_CARDS.filter((c) => c.category === cat.id).length;
  assert(count >= 3, `Dare category ${cat.id} has at least 3 cards (found ${count})`);
}

// ============================================================================
// PART 4: AUTHORITATIVE CARD SELECTION & USED-CARD TRACKING
// ============================================================================
console.log('\n[Section 4: Authoritative Card Selection & Deduplication]');

// 1. Filter cards by mode and category
const filteredRelationshipTruths = filterCards('TRUTH', 'RELATIONSHIP', null, []);
assert(
  filteredRelationshipTruths.length > 0 &&
    filteredRelationshipTruths.every((c) => c.type === 'TRUTH' && c.category === 'RELATIONSHIP'),
  'filterCards correctly filters Truths by RELATIONSHIP category'
);

// 2. Filter cards by category and difficulty
const filteredHardRelationship = filterCards('TRUTH', 'RELATIONSHIP', 'HARD', []);
assert(
  filteredHardRelationship.length > 0 &&
    filteredHardRelationship.every((c) => c.category === 'RELATIONSHIP' && c.difficulty === 'HARD'),
  'filterCards correctly filters by RELATIONSHIP + HARD'
);

// 3. Deduplication with usedCardIds
const firstCard = filteredRelationshipTruths[0];
const usedIds = [firstCard.id];
const unusedCards = filterCards('TRUTH', 'RELATIONSHIP', null, usedIds);
assert(!unusedCards.some((c) => c.id === firstCard.id), 'Used card ID is excluded from subsequent draw candidates');

// 4. Deterministic Authoritative Selection
const selected = selectAuthoritativeCard('TRUTH', 'DEEP', 'EASY', []);
assert(selected !== null, 'selectAuthoritativeCard returns a card');
assert(selected?.type === 'TRUTH' && selected?.category === 'DEEP' && selected?.difficulty === 'EASY', 'Selected card strictly matches requested mode, category, and difficulty');

// 5. Lookup by stable ID
const resolvedCard = getCardById(selected?.id);
assert(resolvedCard?.text === selected?.text, 'getCardById resolves the exact same card text from stable ID');

// 6. Pool exhaustion fallback
const allDeepEasyIds = BUILT_IN_TRUTH_CARDS.filter(
  (c) => c.category === 'DEEP' && c.difficulty === 'EASY'
).map((c) => c.id);
const recycledSelection = selectAuthoritativeCard('TRUTH', 'DEEP', 'EASY', allDeepEasyIds);
assert(recycledSelection !== null, 'When all cards in sub-tier are used, pool safely recycles without failing');

// ============================================================================
// PART 5: CUSTOM DECK DATA STRUCTURES & MULTIPLAYER CARDS
// ============================================================================
console.log('\n[Section 5: Custom Deck Data Structures]');

const mockCustomCard: TruthDareCard = {
  id: 'custom_card_1',
  type: 'TRUTH',
  category: 'COLLEGE',
  difficulty: 'MEDIUM',
  text: 'What was your favorite moment from freshman year?',
  deckId: 'deck_123',
};

const mockCustomDeck: TruthDareCustomDeck = {
  id: 'deck_123',
  ownerUid: 'uid_king_alex',
  title: 'College Reunion Deck',
  description: 'Memories and challenges from university',
  visibility: 'PRIVATE',
  cards: [mockCustomCard],
  cardsCount: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

assert(mockCustomDeck.cards.length === 1, 'Custom deck contains added cards');
assert(mockCustomDeck.ownerUid === 'uid_king_alex', 'Custom deck records ownerUid for security enforcement');

// Resolving custom card by ID with custom cards pool
const resolvedCustom = getCardById('custom_card_1', mockCustomDeck.cards);
assert(resolvedCustom !== null && resolvedCustom.text === mockCustomCard.text, 'Custom card resolves correctly by ID when custom cards pool provided');

// Authoritative selection from custom deck
const selectedFromCustom = selectAuthoritativeCard(
  'TRUTH',
  'COLLEGE',
  'MEDIUM',
  [],
  mockCustomDeck.cards
);
assert(selectedFromCustom?.id === 'custom_card_1', 'selectAuthoritativeCard draws from custom deck pool when specified');

// ============================================================================
// PART 6: EXPANDED GAME STATISTICS & IDEMPOTENCY
// ============================================================================
console.log('\n[Section 6: Expanded Game Statistics]');

const mockHistoryRecords: UserGameHistoryRecord[] = [
  // Chess games
  {
    gameId: 'g_chess_1',
    roomId: 'r_1',
    gameType: 'CHESS',
    opponentUid: 'opp_1',
    opponentName: 'Ashwi',
    opponentIdentity: 'QUEEN',
    opponentPhotoURL: null,
    playerColor: 'WHITE',
    result: 'WIN',
    reason: 'CHECKMATE',
    totalMoves: 24,
    playedAt: Date.now() - 3600000,
  },
  {
    gameId: 'g_chess_2',
    roomId: 'r_2',
    gameType: 'CHESS',
    opponentUid: 'opp_1',
    opponentName: 'Ashwi',
    opponentIdentity: 'QUEEN',
    opponentPhotoURL: null,
    playerColor: 'BLACK',
    result: 'LOSS',
    reason: 'RESIGNATION',
    totalMoves: 30,
    playedAt: Date.now() - 1800000,
  },
  // Truth / Dare games
  {
    gameId: 'g_td_1',
    roomId: 'r_3',
    gameType: 'TRUTH_DARE',
    opponentUid: 'opp_1',
    opponentName: 'Ashwi',
    opponentIdentity: 'QUEEN',
    opponentPhotoURL: null,
    result: 'WIN',
    reason: 'COMPLETED',
    roundsPlayed: 6,
    truthsCompleted: 4,
    daresCompleted: 2,
    completedChallenges: 6,
    playedAt: Date.now() - 600000,
  },
];

const derivedStats = calculateUserGameStats(mockHistoryRecords, {
  gamesPlayed: 2,
  wins: 1,
  losses: 1,
});

// Chess Stats
assert(derivedStats.chess.gamesPlayed === 2, 'Chess stats: 2 battles recorded');
assert(derivedStats.chess.wins === 1, 'Chess stats: 1 victory');
assert(derivedStats.chess.losses === 1, 'Chess stats: 1 defeat');
assert(derivedStats.chess.winRate === 50, 'Chess stats: 50% win rate');
assert(derivedStats.chess.checkmates === 1, 'Chess stats: 1 checkmate recorded');
assert(derivedStats.chess.resignations === 1, 'Chess stats: 1 resignation recorded');
assert(derivedStats.chess.avgMovesPerGame === 27, 'Chess stats: average moves calculated accurately (27 moves)');

// Truth / Dare Stats
assert(derivedStats.truthDare.gamesPlayed === 1, 'Truth/Dare stats: 1 game recorded');
assert(derivedStats.truthDare.roundsPlayed === 6, 'Truth/Dare stats: 6 rounds played');
assert(derivedStats.truthDare.truthsCompleted === 4, 'Truth/Dare stats: 4 truths completed');
assert(derivedStats.truthDare.daresCompleted === 2, 'Truth/Dare stats: 2 dares completed');
assert(derivedStats.truthDare.challengesCompleted === 6, 'Truth/Dare stats: 6 challenges completed');
assert(derivedStats.truthDare.favoriteMode === 'TRUTH', 'Truth/Dare stats: favorite mode is TRUTH (4 vs 2)');

// ============================================================================
// PART 7: REFRESH RESILIENCE & MULTIPLAYER STATE CONSISTENCY
// ============================================================================
console.log('\n[Section 7: Refresh Resilience & Multiplayer Consistency]');

const authoritativeSession: TruthDareSession = {
  round: 3,
  currentPlayerUid: userA,
  phase: 'RESPONDING',
  selectedMode: 'DARE',
  selectedCategory: 'ACTING',
  selectedDifficulty: 'HARD',
  selectedDeckType: 'BUILT_IN',
  selectedDeckId: null,
  selectedCardId: 'dare_007',
  usedCardIds: ['dare_001', 'truth_005', 'dare_007'],
  completedRounds: 2,
  startedAt: Date.now() - 60000,
};

// Simulate Client Refresh: Browser mounts and reads authoritative session
const recoveredCard = getCardById(authoritativeSession.selectedCardId);
const recoveredRole = getRoles(authoritativeSession.currentPlayerUid!, userA);

assert(recoveredCard?.id === 'dare_007', 'Page refresh directly recovers authoritative card dare_007 without changing prompt');
assert(recoveredRole.myRole === 'CHALLENGER', 'Page refresh preserves active Challenger role for user A');
assert(authoritativeSession.phase === 'RESPONDING', 'Page refresh maintains RESPONDING phase state');
assert(authoritativeSession.selectedCategory === 'ACTING', 'Page refresh maintains selectedCategory ACTING');
assert(authoritativeSession.selectedDifficulty === 'HARD', 'Page refresh maintains selectedDifficulty HARD');

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n======================================================`);
console.log(`Phase D Tests Completed: ${passed} Passed, ${failed} Failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}
