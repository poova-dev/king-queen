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

/**
 * Derives comprehensive Chess and Truth/Dare statistics from user history and profile
 */
export const calculateUserGameStats = (
  records: UserGameHistoryRecord[],
  profileUser?: { wins?: number; losses?: number; gamesPlayed?: number }
): { chess: import('../types').UserChessStats; truthDare: import('../types').UserTruthDareStats } => {
  // ── Chess Stats ──
  const chessRecords = records.filter((r) => !r.gameType || r.gameType === 'CHESS');

  const chessGamesCount = Math.max(
    chessRecords.length,
    profileUser?.gamesPlayed ?? 0
  );

  let chessWins = profileUser?.wins ?? 0;
  let chessLosses = profileUser?.losses ?? 0;
  let chessDraws = 0;
  let checkmates = 0;
  let resignations = 0;
  let timeouts = 0;
  let totalMoves = 0;

  if (chessRecords.length > 0) {
    let recWins = 0;
    let recLosses = 0;
    let recDraws = 0;

    for (const r of chessRecords) {
      if (r.result === 'WIN') recWins++;
      else if (r.result === 'LOSS') recLosses++;
      else recDraws++;

      if (r.reason === 'CHECKMATE') checkmates++;
      else if (r.reason === 'RESIGNATION') resignations++;
      else if (r.reason === 'TIMEOUT') timeouts++;

      totalMoves += r.totalMoves || 0;
    }

    if (!profileUser?.gamesPlayed || profileUser.gamesPlayed === chessRecords.length) {
      chessWins = recWins;
      chessLosses = recLosses;
      chessDraws = recDraws;
    } else {
      chessDraws = Math.max(0, chessGamesCount - (chessWins + chessLosses));
    }
  } else {
    chessDraws = Math.max(0, chessGamesCount - (chessWins + chessLosses));
  }

  const chessWinRate =
    chessGamesCount > 0 ? Math.round((chessWins / chessGamesCount) * 100) : 0;
  const avgMoves =
    chessRecords.length > 0 ? Math.round(totalMoves / chessRecords.length) : 0;

  // ── Truth / Dare Stats ──
  const tdRecords = records.filter((r) => r.gameType === 'TRUTH_DARE');

  let tdRounds = 0;
  let truthsCount = 0;
  let daresCount = 0;
  let challengesCount = 0;

  const modeCounts: Record<string, number> = { TRUTH: 0, DARE: 0 };
  const categoryCounts: Record<string, number> = {};
  const diffDistribution: Record<import('../types').TruthDareDifficulty, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    EXTREME: 0,
  };

  for (const r of tdRecords) {
    tdRounds += r.roundsPlayed || 0;
    truthsCount += r.truthsCompleted || 0;
    daresCount += r.daresCompleted || 0;
    challengesCount += r.completedChallenges || (r.truthsCompleted || 0) + (r.daresCompleted || 0);

    modeCounts.TRUTH += r.truthsCompleted || 0;
    modeCounts.DARE += r.daresCompleted || 0;
  }

  let favoriteMode: import('../types').TruthDareMode | 'NONE' = 'NONE';
  if (modeCounts.TRUTH > modeCounts.DARE) favoriteMode = 'TRUTH';
  else if (modeCounts.DARE > modeCounts.TRUTH) favoriteMode = 'DARE';
  else if (modeCounts.TRUTH > 0) favoriteMode = 'TRUTH';

  let favoriteCategory: import('../types').TruthDareCategory | 'NONE' = 'NONE';
  let maxCatCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCatCount) {
      maxCatCount = count;
      favoriteCategory = cat as import('../types').TruthDareCategory;
    }
  }

  return {
    chess: {
      gamesPlayed: chessGamesCount,
      wins: chessWins,
      losses: chessLosses,
      draws: chessDraws,
      winRate: chessWinRate,
      checkmates,
      resignations,
      timeouts,
      totalMoves,
      avgMovesPerGame: avgMoves,
    },
    truthDare: {
      gamesPlayed: tdRecords.length,
      roundsPlayed: tdRounds,
      truthsCompleted: truthsCount,
      daresCompleted: daresCount,
      challengesCompleted: challengesCount,
      challengerRounds: Math.ceil(tdRounds / 2),
      judgeRounds: Math.floor(tdRounds / 2),
      favoriteMode,
      favoriteCategory,
      difficultyDistribution: diffDistribution,
    },
  };
};
