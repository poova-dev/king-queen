import {
  validateDisplayName,
  validatePlayerIdentity,
  getDefaultAvatar,
  toUserProfile,
  mapFirestoreError,
} from './profileService';
import { FirestoreUserProfile } from '../types';

function runProfileTests() {
  console.log('--- Running Profile Service Unit & Validation Tests ---');

  // Test 1: Display Name validation
  const emptyName = validateDisplayName('   ');
  if (emptyName.isValid || emptyName.error !== 'Display name is required.') {
    throw new Error('Test 1 failed: Empty display name not rejected.');
  }

  const shortName = validateDisplayName('A');
  if (shortName.isValid || shortName.error !== 'Display name must be at least 2 characters.') {
    throw new Error('Test 1 failed: Short display name (<2 chars) not rejected.');
  }

  const longName = validateDisplayName('A'.repeat(31));
  if (longName.isValid || longName.error !== 'Display name cannot exceed 30 characters.') {
    throw new Error('Test 1 failed: Long display name (>30 chars) not rejected.');
  }

  const validName = validateDisplayName('  Queen Elizabeth  ');
  if (!validName.isValid) {
    throw new Error('Test 1 failed: Valid display name rejected.');
  }
  console.log('✓ Display Name validation rules passed (empty, min 2, max 30, valid)');

  // Test 2: Player Identity validation
  if (!validatePlayerIdentity('KING') || !validatePlayerIdentity('QUEEN')) {
    throw new Error('Test 2 failed: Valid identities not accepted.');
  }
  if (validatePlayerIdentity('KNIGHT') || validatePlayerIdentity('')) {
    throw new Error('Test 2 failed: Invalid identity accepted.');
  }
  console.log('✓ Player Identity validation passed (KING, QUEEN strictly enforced)');

  // Test 3: Default avatar generation
  const kingAvatar = getDefaultAvatar('KING');
  const queenAvatar = getDefaultAvatar('QUEEN');
  if (!kingAvatar || !queenAvatar || kingAvatar === queenAvatar) {
    throw new Error('Test 3 failed: Default avatars not distinct.');
  }
  console.log('✓ Default avatar generation distinct for KING and QUEEN');

  // Test 4: toUserProfile conversion
  const mockFirestoreProfile: FirestoreUserProfile = {
    uid: 'user-xyz-999',
    displayName: 'Royal Knight',
    email: 'knight@kingdom.com',
    photoURL: null,
    identity: 'KING',
    wins: 5,
    losses: 2,
    gamesPlayed: 7,
    bio: 'Defender of the realm.',
  };

  const converted = toUserProfile(mockFirestoreProfile);
  if (
    converted.uid !== 'user-xyz-999' ||
    converted.displayName !== 'Royal Knight' ||
    converted.username !== '@royalknight' ||
    converted.avatar !== kingAvatar ||
    converted.wins !== 5 ||
    converted.losses !== 2 ||
    converted.gamesPlayed !== 7 ||
    converted.bio !== 'Defender of the realm.'
  ) {
    throw new Error(`Test 4 failed: Profile conversion mismatch: ${JSON.stringify(converted)}`);
  }
  console.log('✓ toUserProfile conversion matches data structure exactly');

  // Test 5: Firestore error mapping
  const testErrors: Record<string, string> = {
    'permission-denied': 'You do not have permission to access or modify this royal profile.',
    'unavailable': 'Firestore service is temporarily unavailable. Please check your connection.',
    'not-found': 'Profile not found. Please complete profile setup.',
    'already-exists': 'A royal profile already exists for this sovereign account.',
    'resource-exhausted': 'Quota limit reached. Please wait a moment and try again.',
  };

  for (const [code, expected] of Object.entries(testErrors)) {
    const errorObj = { code, message: `FirebaseError: ${code}` };
    const friendly = mapFirestoreError(errorObj);
    if (friendly !== expected) {
      throw new Error(`Test 5 failed for ${code}: Expected "${expected}", got "${friendly}"`);
    }
  }
  console.log('✓ Firestore error mapping passed (5/5)');

  console.log('--- ALL PROFILE SERVICE TESTS PASSED SUCCESSFULLY ---');
}

runProfileTests();
