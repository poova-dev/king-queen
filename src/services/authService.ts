import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthUser } from '../types';

/**
 * Extracts sanitized AuthUser data from Firebase User instance.
 * Avoids storing duplicate authentication properties.
 */
export const extractAuthUser = (user: FirebaseUser): AuthUser => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

/**
 * Sign in with Google using a popup.
 * Instantiates GoogleAuthProvider per call as required.
 * Modular structure allows easy extension with redirect-based login for mobile/Capacitor.
 */
export const signInWithGooglePopup = async (): Promise<AuthUser> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return extractAuthUser(result.user);
};

/**
 * Alternative redirect-based Google login for mobile environments (Capacitor / mobile web)
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
};

/**
 * Register a new user with email and password, updating their displayName
 */
export const signUpWithEmail = async (
  name: string,
  email: string,
  pass: string
): Promise<AuthUser> => {
  const trimmedEmail = email.trim();
  const trimmedName = name.trim();

  const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
  
  if (trimmedName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, {
        displayName: trimmedName,
      });
    } catch (profileErr) {
      console.warn('[AuthService] Could not update displayName:', profileErr);
    }
  }

  return extractAuthUser(userCredential.user);
};

/**
 * Sign in with existing email and password
 */
export const signInWithEmail = async (
  email: string,
  pass: string
): Promise<AuthUser> => {
  const trimmedEmail = email.trim();
  const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
  return extractAuthUser(userCredential.user);
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  const trimmedEmail = email.trim();
  await sendPasswordResetEmail(auth, trimmedEmail);
};

/**
 * Log out the current user and end the persistent session
 */
export const logOutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Convert Firebase error codes into professional, user-friendly messages.
 * Logs error.code and error.message in development mode without exposing sensitive secrets.
 */
export const getFriendlyAuthErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  // Log error code and message during development for transparent debugging
  if (import.meta.env?.DEV) {
    console.error('[FirebaseAuthError]', {
      code: err.code,
      message: err.message,
    });
  }

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In was cancelled.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In provider is not enabled.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already connected using another sign-in method.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid or not configured. Check your .env file.';
    case 'auth/email-already-in-use':
      return 'This email is already connected to an account.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup request was cancelled.';
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please try again.';
    default:
      if (code) {
        return `Authentication error (${code.replace('auth/', '')}). Please try again.`;
      }
      if (err.message) {
        const cleaned = err.message.replace(/^Firebase:\s*Error\s*\(([^)]+)\)\.?/i, '').trim();
        if (cleaned) return cleaned;
      }
      return 'Unable to authenticate. Please check your details and try again.';
  }
};
