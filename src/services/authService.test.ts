import { getFriendlyAuthErrorMessage, extractAuthUser } from './authService';

function runTests() {
  console.log('--- Running Authentication Unit & Logic Tests ---');

  // Test 1: Friendly error translations
  const testErrors: Record<string, string> = {
    'auth/unauthorized-domain': 'This domain is not authorized for Google Sign-In.',
    'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
    'auth/popup-closed-by-user': 'Google Sign-In was cancelled.',
    'auth/operation-not-allowed': 'Google Sign-In provider is not enabled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/account-exists-with-different-credential': 'This email is already connected using another sign-in method.',
    'auth/invalid-api-key': 'Firebase API key is invalid or not configured. Check your .env file.',
    'auth/api-key-not-valid': 'Firebase API key is invalid or not configured. Check your .env file.',
    'auth/email-already-in-use': 'This email is already connected to an account.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please verify your credentials.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
  };

  for (const [code, expected] of Object.entries(testErrors)) {
    const errorObj = { code, message: `Firebase: Error (${code}).` };
    const friendly = getFriendlyAuthErrorMessage(errorObj);
    if (friendly !== expected) {
      throw new Error(`Test failed for ${code}: Expected "${expected}", got "${friendly}"`);
    }
  }
  console.log(`✓ All Firebase error mappings passed (${Object.keys(testErrors).length}/${Object.keys(testErrors).length})`);

  // Test 2: Unknown error and raw message stripping
  const customError = { message: 'Firebase: Error (auth/custom-error).' };
  const cleaned = getFriendlyAuthErrorMessage(customError);
  if (cleaned.includes('Firebase: Error')) {
    throw new Error(`Test failed for raw stripping: ${cleaned}`);
  }
  console.log('✓ Raw technical prefixes properly stripped from custom errors');

  // Test 3: extractAuthUser
  const mockFirebaseUser = {
    uid: 'firebase-uid-12345',
    email: 'king@example.com',
    displayName: 'King Arthur',
    photoURL: 'https://avatar.com/king.png',
    phoneNumber: null,
    providerId: 'firebase',
  } as any;

  const authUser = extractAuthUser(mockFirebaseUser);
  if (
    authUser.uid !== 'firebase-uid-12345' ||
    authUser.email !== 'king@example.com' ||
    authUser.displayName !== 'King Arthur' ||
    authUser.photoURL !== 'https://avatar.com/king.png'
  ) {
    throw new Error(`Test failed for extractAuthUser: ${JSON.stringify(authUser)}`);
  }
  console.log('✓ extractAuthUser correctly extracts only required user identity properties');

  console.log('--- ALL AUTH TESTS PASSED SUCCESSFULLY ---');
}

runTests();
