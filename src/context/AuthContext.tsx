import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthUser } from '../types';
import {
  signInWithGooglePopup,
  signInWithEmail as apiSignInWithEmail,
  signUpWithEmail as apiSignUpWithEmail,
  logOutUser as apiLogOutUser,
  sendPasswordReset as apiSendPasswordReset,
  extractAuthUser,
} from '../services/authService';

const PROFILE_COMPLETED_KEY_PREFIX = 'kq_profile_completed_';

export interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirstTimeUser: boolean;
  signInWithGoogle: () => Promise<AuthUser>;
  signInWithEmail: (email: string, pass: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeProfileSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);

  // Helper to determine whether the user is completing profile for the first time
  const evaluateFirstTimeStatus = useCallback((fbUser: FirebaseUser): boolean => {
    try {
      const isCompleted = localStorage.getItem(`${PROFILE_COMPLETED_KEY_PREFIX}${fbUser.uid}`);
      if (isCompleted === 'true') {
        return false;
      }
    } catch {
      // LocalStorage access restricted
    }

    // If never explicitly marked completed in storage, treat as first-time setup
    return true;
  }, []);

  // Listen to persistent Firebase authentication session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentFirebaseUser) => {
      if (currentFirebaseUser) {
        const sanitizedUser = extractAuthUser(currentFirebaseUser);
        setUser(sanitizedUser);
        setFirebaseUser(currentFirebaseUser);
        setIsFirstTimeUser(evaluateFirstTimeStatus(currentFirebaseUser));
      } else {
        setUser(null);
        setFirebaseUser(null);
        setIsFirstTimeUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [evaluateFirstTimeStatus]);

  const signInWithGoogle = async (): Promise<AuthUser> => {
    const authUser = await signInWithGooglePopup();
    setUser(authUser);
    return authUser;
  };

  const signInWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    const authUser = await apiSignInWithEmail(email, pass);
    setUser(authUser);
    return authUser;
  };

  const signUp = async (name: string, email: string, pass: string): Promise<AuthUser> => {
    const authUser = await apiSignUpWithEmail(name, email, pass);
    setUser(authUser);
    setIsFirstTimeUser(true);
    return authUser;
  };

  const logout = async (): Promise<void> => {
    await apiLogOutUser();
    setUser(null);
    setFirebaseUser(null);
    setIsFirstTimeUser(false);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await apiSendPasswordReset(email);
  };

  const completeProfileSetup = useCallback(() => {
    if (user?.uid) {
      try {
        localStorage.setItem(`${PROFILE_COMPLETED_KEY_PREFIX}${user.uid}`, 'true');
      } catch {
        // Storage restricted
      }
    }
    setIsFirstTimeUser(false);
  }, [user]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: Boolean(user),
    isFirstTimeUser,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    logout,
    resetPassword,
    completeProfileSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
