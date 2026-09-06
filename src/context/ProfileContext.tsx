import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FirestoreUserProfile, PlayerIdentity, UserProfile } from '../types';
import {
  getUserProfile,
  createUserProfile as apiCreateUserProfile,
  updateUserProfile as apiUpdateUserProfile,
  toUserProfile,
  mapFirestoreError,
} from '../services/profileService';

export interface ProfileContextType {
  profile: FirestoreUserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileExists: boolean;
  error: string | null;
  createProfile: (data: {
    displayName: string;
    identity: PlayerIdentity;
    photoURL?: string | null;
    bio?: string;
  }) => Promise<FirestoreUserProfile>;
  updateProfile: (updates: {
    displayName?: string;
    identity?: PlayerIdentity;
    bio?: string;
    photoURL?: string | null;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load Firestore profile whenever authenticated user changes
  const fetchProfile = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);

    try {
      const existingProfile = await getUserProfile(uid);
      if (existingProfile) {
        setProfile(existingProfile);
        setProfileExists(true);
      } else {
        setProfile(null);
        setProfileExists(false);
      }
    } catch (err) {
      const friendly = mapFirestoreError(err);
      setError(friendly);
      setProfile(null);
      setProfileExists(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (authUser?.uid) {
      fetchProfile(authUser.uid);
    } else {
      setProfile(null);
      setProfileExists(false);
      setLoading(false);
      setError(null);
    }
  }, [authUser?.uid, authLoading, fetchProfile]);

  const createProfile = async (data: {
    displayName: string;
    identity: PlayerIdentity;
    photoURL?: string | null;
    bio?: string;
  }): Promise<FirestoreUserProfile> => {
    if (!authUser?.uid) {
      throw new Error('Authentication required to create a royal profile.');
    }

    setLoading(true);
    setError(null);

    try {
      const newProfile = await apiCreateUserProfile({
        uid: authUser.uid,
        displayName: data.displayName,
        email: authUser.email,
        photoURL: data.photoURL ?? authUser.photoURL,
        identity: data.identity,
        bio: data.bio,
      });

      setProfile(newProfile);
      setProfileExists(true);
      return newProfile;
    } catch (err) {
      const friendly = mapFirestoreError(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: {
    displayName?: string;
    identity?: PlayerIdentity;
    bio?: string;
    photoURL?: string | null;
  }): Promise<void> => {
    if (!authUser?.uid) {
      throw new Error('Authentication required to update profile.');
    }

    setLoading(true);
    setError(null);

    try {
      await apiUpdateUserProfile(authUser.uid, updates);

      // Optimistically update local profile state
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...(updates.displayName !== undefined && { displayName: updates.displayName.trim() }),
          ...(updates.identity !== undefined && { identity: updates.identity }),
          ...(updates.bio !== undefined && { bio: updates.bio.trim() }),
          ...(updates.photoURL !== undefined && { photoURL: updates.photoURL }),
          updatedAt: new Date(),
        };
      });
    } catch (err) {
      const friendly = mapFirestoreError(err);
      setError(friendly);
      throw new Error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (authUser?.uid) {
      await fetchProfile(authUser.uid);
    }
  };

  const clearError = () => setError(null);

  const userProfile: UserProfile | null = profile ? toUserProfile(profile) : null;

  const value: ProfileContextType = {
    profile,
    userProfile,
    loading,
    profileExists,
    error,
    createProfile,
    updateProfile,
    refreshProfile,
    clearError,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfileContext = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
