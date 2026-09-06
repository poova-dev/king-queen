import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreUserProfile, PlayerIdentity, UserProfile } from '../types';

export interface CreateProfileInput {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL?: string | null;
  identity: PlayerIdentity;
  bio?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  identity?: PlayerIdentity;
  bio?: string;
  photoURL?: string | null;
}

/**
 * Validate Display Name
 * - Required
 * - Trim whitespace
 * - 2 to 30 characters
 */
export const validateDisplayName = (name: string): { isValid: boolean; error?: string } => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Display name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters.' };
  }
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Display name cannot exceed 30 characters.' };
  }
  return { isValid: true };
};

/**
 * Validate Player Identity
 * Must be 'KING' or 'QUEEN'
 */
export const validatePlayerIdentity = (identity: string): identity is PlayerIdentity => {
  return identity === 'KING' || identity === 'QUEEN';
};

/**
 * Generates an elegant default avatar based on player identity
 */
export const getDefaultAvatar = (identity: PlayerIdentity): string => {
  if (identity === 'KING') {
    return 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=KingCrown&backgroundColor=18181b';
  }
  return 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=QueenTiara&backgroundColor=18181b';
};

/**
 * Converts a FirestoreUserProfile into the application's UserProfile representation
 */
export const toUserProfile = (profile: FirestoreUserProfile): UserProfile => {
  const defaultPhoto = getDefaultAvatar(profile.identity);
  const avatar = profile.photoURL && profile.photoURL.trim() ? profile.photoURL : defaultPhoto;
  const username = `@${profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player'}`;

  return {
    uid: profile.uid,
    displayName: profile.displayName,
    email: profile.email,
    username,
    bio: profile.bio || '',
    avatar,
    identity: profile.identity,
    wins: profile.wins ?? 0,
    losses: profile.losses ?? 0,
    gamesPlayed: profile.gamesPlayed ?? 0,
  };
};

/**
 * Fetch user profile from Firestore: users/{uid}
 * Returns null if the document does not exist.
 */
export const getUserProfile = async (uid: string): Promise<FirestoreUserProfile | null> => {
  if (!uid) return null;

  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      uid: data.uid || uid,
      displayName: data.displayName || 'Royal Sovereign',
      email: data.email ?? null,
      photoURL: data.photoURL ?? null,
      identity: validatePlayerIdentity(data.identity) ? data.identity : 'KING',
      wins: typeof data.wins === 'number' ? data.wins : 0,
      losses: typeof data.losses === 'number' ? data.losses : 0,
      gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : 0,
      bio: data.bio || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.error('[Firestore getUserProfile Error]', error);
    }
    throw error;
  }
};

/**
 * Create a new user profile in Firestore: users/{uid}
 * Requires explicit completion of onboarding (no auto-creation).
 */
export const createUserProfile = async (
  input: CreateProfileInput
): Promise<FirestoreUserProfile> => {
  if (!input.uid) {
    throw new Error('User UID is required to create a profile.');
  }

  const nameValidation = validateDisplayName(input.displayName);
  if (!nameValidation.isValid) {
    throw new Error(nameValidation.error || 'Invalid display name.');
  }

  if (!validatePlayerIdentity(input.identity)) {
    throw new Error('Identity must be KING or QUEEN.');
  }

  const trimmedName = input.displayName.trim();
  const trimmedBio = input.bio?.trim() || '';

  const newProfileData = {
    uid: input.uid,
    displayName: trimmedName,
    email: input.email || null,
    photoURL: input.photoURL || null,
    identity: input.identity,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    bio: trimmedBio,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, 'users', input.uid);
    await setDoc(docRef, newProfileData);

    return {
      ...newProfileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.error('[Firestore createUserProfile Error]', error);
    }
    throw error;
  }
};

/**
 * Update an existing user profile in Firestore: users/{uid}
 */
export const updateUserProfile = async (
  uid: string,
  updates: UpdateProfileInput
): Promise<void> => {
  if (!uid) {
    throw new Error('User UID is required to update a profile.');
  }

  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.displayName !== undefined) {
    const validation = validateDisplayName(updates.displayName);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid display name.');
    }
    payload.displayName = updates.displayName.trim();
  }

  if (updates.identity !== undefined) {
    if (!validatePlayerIdentity(updates.identity)) {
      throw new Error('Identity must be KING or QUEEN.');
    }
    payload.identity = updates.identity;
  }

  if (updates.bio !== undefined) {
    payload.bio = updates.bio.trim();
  }

  if (updates.photoURL !== undefined) {
    payload.photoURL = updates.photoURL;
  }

  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, payload);
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.error('[Firestore updateUserProfile Error]', error);
    }
    throw error;
  }
};

/**
 * Converts raw Firestore errors into professional, friendly user feedback
 */
export const mapFirestoreError = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'An unexpected storage error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'permission-denied':
      return 'You do not have permission to access or modify this royal profile.';
    case 'unavailable':
      return 'Firestore service is temporarily unavailable. Please check your connection.';
    case 'not-found':
      return 'Profile not found. Please complete profile setup.';
    case 'already-exists':
      return 'A royal profile already exists for this sovereign account.';
    case 'resource-exhausted':
      return 'Quota limit reached. Please wait a moment and try again.';
    case 'cancelled':
      return 'The profile request was cancelled.';
    default:
      if (err.message) {
        const cleaned = err.message.replace(/^FirebaseError:\s*/i, '').trim();
        if (cleaned && !cleaned.includes('Firebase')) {
          return cleaned;
        }
      }
      return 'Unable to save profile changes. Please try again.';
  }
};
