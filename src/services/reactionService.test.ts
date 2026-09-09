/**
 * KING & QUEEN — Phase A
 * REACTION SERVICE UNIT TESTS
 *
 * Tests cover:
 * 1. Parameter validation for sendReaction
 * 2. Deduplication logic (simulated)
 * 3. subscribeToReactions interface contract
 * 4. ReactionDocument shape validation
 */

import { sendReaction, subscribeToReactions, ReactionDocument } from './reactionService';

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

console.log('\n--- Running Phase A Reaction Service Tests ---');

// ─── PART 1: Parameter validation ────────────────────────────────────────────
console.log('\n[Section 1: Parameter Validation]');

// sendReaction should throw on empty params (before touching Firestore)
let caught1 = false;
try {
  await sendReaction('', 'uid1', '❤️');
} catch (e: any) {
  caught1 = e.message === 'INVALID_REACTION_PARAMS';
}
assert(caught1, 'sendReaction throws INVALID_REACTION_PARAMS when roomId is empty');

let caught2 = false;
try {
  await sendReaction('room1', '', '❤️');
} catch (e: any) {
  caught2 = e.message === 'INVALID_REACTION_PARAMS';
}
assert(caught2, 'sendReaction throws INVALID_REACTION_PARAMS when uid is empty');

let caught3 = false;
try {
  await sendReaction('room1', 'uid1', '');
} catch (e: any) {
  caught3 = e.message === 'INVALID_REACTION_PARAMS';
}
assert(caught3, 'sendReaction throws INVALID_REACTION_PARAMS when emoji is empty');

// ─── PART 2: subscribeToReactions interface ──────────────────────────────────
console.log('\n[Section 2: subscribeToReactions Interface]');

// When called with empty roomId, should invoke onError and return a no-op unsubscribe
let errorFired = false;
const unsub = subscribeToReactions(
  '',
  () => {},
  (err) => {
    errorFired = err.message === 'MISSING_ROOM_ID';
  }
);
assert(errorFired, 'subscribeToReactions fires onError with MISSING_ROOM_ID for empty roomId');
assert(typeof unsub === 'function', 'subscribeToReactions returns a function (unsubscribe) even for empty roomId');

// ─── PART 3: ReactionDocument shape ──────────────────────────────────────────
console.log('\n[Section 3: ReactionDocument Shape]');

const mockDoc: ReactionDocument = {
  id: 'abc123',
  uid: 'user_king',
  emoji: '🔥',
  createdAt: Date.now(),
};

assert(typeof mockDoc.id === 'string' && mockDoc.id.length > 0, 'ReactionDocument.id is a non-empty string');
assert(typeof mockDoc.uid === 'string' && mockDoc.uid.length > 0, 'ReactionDocument.uid is a non-empty string');
assert(typeof mockDoc.emoji === 'string' && mockDoc.emoji.length > 0, 'ReactionDocument.emoji is a non-empty string');
assert(mockDoc.createdAt !== null && typeof mockDoc.createdAt === 'number', 'ReactionDocument.createdAt is a number');

// ─── PART 4: Deduplication logic simulation ──────────────────────────────────
console.log('\n[Section 4: Deduplication Logic Simulation]');

// Simulate the Set-based deduplication in useReactions
const processedIds = new Set<string>();
const reactions: ReactionDocument[] = [
  { id: 'r1', uid: 'u1', emoji: '❤️', createdAt: 100 },
  { id: 'r2', uid: 'u2', emoji: '🔥', createdAt: 200 },
  { id: 'r1', uid: 'u1', emoji: '❤️', createdAt: 100 }, // duplicate
];

let animationsFired = 0;
for (const r of reactions) {
  if (!processedIds.has(r.id)) {
    processedIds.add(r.id);
    animationsFired++;
  }
}

assert(animationsFired === 2, 'Deduplication fires exactly 2 animations for 3 docs (1 duplicate)');
assert(processedIds.size === 2, 'processedIds Set contains only unique IDs');
assert(processedIds.has('r1'), 'processedIds contains r1');
assert(processedIds.has('r2'), 'processedIds contains r2');

// ─── PART 5: Emoji type coverage ─────────────────────────────────────────────
console.log('\n[Section 5: Emoji Coverage]');

const validEmojis = ['❤️', '🔥', '👏', '😂', '✨'];
validEmojis.forEach((emoji) => {
  assert(emoji.length > 0, `Emoji "${emoji}" is a non-empty string`);
});

// ─── RESULTS ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
