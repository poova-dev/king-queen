import {
  doc,
  collection,
  query,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserGameHistoryRecord, GameResult, GameEndReason } from '../types';

/**
 * Fetch paginated game history for a user from `users/{uid}/gameHistory`
 */
export const getGameHistory = async (
  uid: string,
  limitCount = 20
): Promise<UserGameHistoryRecord[]> => {
  if (!uid) return [];

  try {
    const historyCol = collection(db, 'users', uid, 'gameHistory');
    const q = query(historyCol, orderBy('playedAt', 'desc'), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => d.data() as UserGameHistoryRecord);
  } catch (err) {
    // In-memory fallback if index is not ready
    try {
      const historyCol = collection(db, 'users', uid, 'gameHistory');
      const fallbackQ = query(historyCol, firestoreLimit(limitCount));
      const fallbackSnap = await getDocs(fallbackQ);
      const records = fallbackSnap.docs.map((d) => d.data() as UserGameHistoryRecord);

      records.sort((a, b) => {
        const timeA = a.playedAt?.toMillis ? a.playedAt.toMillis() : 0;
        const timeB = b.playedAt?.toMillis ? b.playedAt.toMillis() : 0;
        return timeB - timeA;
      });

      return records;
    } catch (fallbackErr) {
      if (import.meta.env?.DEV) {
        console.warn('[getGameHistory error]', fallbackErr);
      }
      return [];
    }
  }
};

/**
 * Fetch latest 5 recent games for profile dashboard display
 */
export const getRecentGames = async (uid: string): Promise<UserGameHistoryRecord[]> => {
  return getGameHistory(uid, 5);
};

/**
 * Direct write helper for users/{uid}/gameHistory/{gameId}
 */
export const saveGameHistory = async (
  uid: string,
  record: UserGameHistoryRecord
): Promise<void> => {
  if (!uid || !record.gameId) return;
  const historyDocRef = doc(db, 'users', uid, 'gameHistory', record.gameId);
  await setDoc(historyDocRef, {
    ...record,
    playedAt: record.playedAt || serverTimestamp(),
    createdAt: record.createdAt || serverTimestamp(),
  });
};

/**
 * User-friendly formatting of game outcome
 */
export const formatGameResult = (result: GameResult): { label: string; color: string; icon: string } => {
  switch (result) {
    case 'WIN':
      return { label: 'VICTORY', color: 'text-emerald-400', icon: '♔' };
    case 'LOSS':
      return { label: 'DEFEAT', color: 'text-rose-400', icon: '♚' };
    case 'DRAW':
    default:
      return { label: 'DRAW', color: 'text-[var(--primary)]', icon: '⚖️' };
  }
};

/**
 * Relative or readable date formatting
 */
export const formatGameDate = (timestamp: any): string => {
  if (!timestamp) return 'Today';
  const date = timestamp?.toDate
    ? timestamp.toDate()
    : typeof timestamp === 'number'
    ? new Date(timestamp)
    : new Date();

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago, ${timeStr}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
};
