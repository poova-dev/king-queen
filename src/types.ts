import { Theme, THEMES, ThemeId, ThemeColors } from './themes/themes';

export type { Theme, ThemeId, ThemeColors };
export { THEMES };

export type PlayerIdentity = 'KING' | 'QUEEN';
export type ChessSide = 'WHITE' | 'BLACK';

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  identity: PlayerIdentity;
  wins: number;
  losses: number;
  gamesPlayed: number;
  bio?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type UserProfile = {
  uid?: string;
  username?: string;
  displayName: string;
  email?: string | null;
  bio?: string;
  avatar: string;
  identity: PlayerIdentity;
  wins?: number;
  losses?: number;
  gamesPlayed?: number;
};

export interface GameRoom {
  code: string;
  creator: UserProfile;
  creatorRole: PlayerIdentity;
  opponentRole: PlayerIdentity;
  timer: string;
  timeControl?: TimeControl;
  truthOrDare: boolean;
  opponent?: UserProfile;
  // Chess piece color assignment is separate from player identity
  creatorChessSide?: ChessSide;
  opponentChessSide?: ChessSide;
}

export interface RematchState {
  playerOneConfirmed: boolean;
  playerTwoConfirmed: boolean;
  rematchStarted: boolean;
  declinedBy?: 'YOU' | 'OPPONENT' | null;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type Screen = 
  | 'SPLASH'
  | 'ONBOARDING'
  | 'ENTRY'
  | 'AUTH'
  | 'PROFILE_SETUP'
  | 'THEME_SELECTION'
  | 'PROFILE'
  | 'HOME'
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'WAITING_ROOM'
  | 'GAME_PREVIEW'
  | 'CHESS_GAME'
  | 'GAME_HISTORY'
  | 'TRUTH_DARE_ENTRY'
  | 'TRUTH_DARE_ROOM_ENTRY'
  | 'TRUTH_DARE_JOIN'
  | 'TRUTH_DARE_LOBBY'
  | 'TRUTH_DARE_WAITING'
  | 'TRUTH_DARE_GAME';

export type RoomStatus =
  | 'WAITING'
  | 'COIN_TOSS'
  | 'COLOR_SELECTION'
  | 'READY'
  | 'PLAYING'
  | 'FINISHED'
  | 'COMPLETED'
  | 'REMATCH_PENDING'
  | 'REMATCH_READY'
  | 'CLOSED'
  | 'CANCELLED'
  | 'ABANDONED';

export type CoinTossChoice = 'HEADS' | 'TAILS';

export type PlayerConnectionStatus = 'ONLINE' | 'RECONNECTING' | 'OFFLINE';

export interface RoomPlayer {
  uid: string;
  displayName: string;
  photoURL: string | null;
  profileIdentity: PlayerIdentity;
  roomRole: PlayerIdentity;
  tossChoice: CoinTossChoice | null;
  chessColor: ChessSide | null;
  ready: boolean;
  joinedAt: any;
  connectionStatus?: PlayerConnectionStatus;
  lastSeenAt?: any;
}

export type MultiplayerGameStatus =
  | 'PLAYING'
  | 'CHECK'
  | 'CHECKMATE'
  | 'DRAW'
  | 'STALEMATE'
  | 'FINISHED';

export interface GameMoveRecord {
  from: string;
  to: string;
  piece: string;
  color: ChessSide;
  san: string;
  promotion: string | null;
  timestamp?: any;
}

export interface MoveHistoryEntry {
  moveNumber: number;
  from: string;
  to: string;
  san: string;
  color: ChessSide;
  timestamp: any;
}

export interface RematchRequestDocument {
  requestedBy: string;
  requestedAt?: any;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
}

export interface GameHistoryPlayer {
  uid: string;
  displayName: string;
  photoURL: string | null;
  identity: PlayerIdentity;
}

export type GameResult = 'WIN' | 'LOSS' | 'DRAW';
export type GameEndReason =
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'THREEFOLD_REPETITION'
  | 'INSUFFICIENT_MATERIAL'
  | 'FIFTY_MOVE_RULE'
  | 'DRAW'
  | 'RESIGNATION'
  | 'TIMEOUT'
  | 'ABANDONED';

export type HistoryGameType = 'CHESS' | 'TRUTH_DARE';

export interface UserGameHistoryRecord {
  gameId: string;
  roomId: string;
  gameType?: HistoryGameType;
  opponentUid: string;
  opponentName: string;
  opponentIdentity: PlayerIdentity | null;
  opponentPhotoURL: string | null;
  playerColor?: ChessSide;
  result: GameResult;
  reason: GameEndReason | string;
  totalMoves?: number;
  finalFen?: string;
  // Truth / Dare specific historical summary fields
  roundsPlayed?: number;
  truthsCompleted?: number;
  daresCompleted?: number;
  completedChallenges?: number;
  deckTitle?: string;
  playedAt?: any;
  createdAt?: any;
}

export interface GameHistoryRecord {
  id: string;
  roomId: string;
  whitePlayer: GameHistoryPlayer;
  blackPlayer: GameHistoryPlayer;
  playerUids: string[];
  winnerUid: string | null;
  result:
    | 'CHECKMATE'
    | 'STALEMATE'
    | 'THREEFOLD_REPETITION'
    | 'INSUFFICIENT_MATERIAL'
    | 'FIFTY_MOVE_RULE'
    | 'DRAW'
    | 'RESIGNATION'
    | 'TIMEOUT'
    | 'ABANDONED';
  totalMoves: number;
  finalFen: string;
  startedAt?: any;
  completedAt?: any;
  rematchNumber: number;
  createdAt?: any;
}

export interface DisconnectState {
  status: 'NONE' | 'WAITING_FOR_RECONNECT' | 'EXPIRED';
  disconnectedUid: string | null;
  disconnectedAt: any;
  graceExpiresAt: any;
}

export type TimeControlType = 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSIC';

export interface TimeControl {
  type: TimeControlType;
  initialTime: number; // in milliseconds (e.g. 600,000 for 10 min)
}

export type GameTimerStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';

export interface GameTimerDocument {
  whiteTimeRemaining: number;
  blackTimeRemaining: number;
  activeTimerColor: ChessSide | null;
  timerStartedAt: any;
  timerPausedAt?: any;
  status: GameTimerStatus;
}

export interface DrawOfferDocument {
  offeredBy: string;
  offeredAt: any;
  expiresAt?: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}

export interface PendingPromotionState {
  playerUid: string;
  from: string;
  to: string;
}

export interface GameStateDocument {
  fen: string;
  turn: ChessSide;
  status: MultiplayerGameStatus;
  checkedColor: ChessSide | null;
  lastMove: GameMoveRecord | null;
  moveHistory: MoveHistoryEntry[];
  moveNumber: number;
  version: number;
  winnerUid: string | null;
  resignedBy?: string | null;
  endReason?: GameEndReason | null;
  disconnectState?: DisconnectState | null;
  disconnectedUid?: string | null;
  timer?: GameTimerDocument | null;
  drawOffer?: DrawOfferDocument | null;
  pendingPromotion?: PendingPromotionState | null;
  finishedAt?: any;
  statsProcessed?: boolean;
  rematchRequest?: RematchRequestDocument | null;
  rematchCount?: number;
  updatedAt: any;
}

export interface RoomDocument {
  roomId: string;
  roomCode: string;
  status: RoomStatus;
  createdBy: string;
  players: RoomPlayer[];
  coinResult: CoinTossChoice | null;
  tossWinnerUid: string | null;
  maxPlayers: 2;
  timer?: string;
  timeControl?: TimeControl;
  truthOrDare?: boolean;
  gameState?: GameStateDocument | null;
  historySaved?: boolean;
  exitedPlayers?: string[];
  createdAt: any;
  updatedAt: any;
}

export const getOppositeIdentity = (identity: PlayerIdentity): PlayerIdentity => {
  return identity === 'KING' ? 'QUEEN' : 'KING';
};

export const getOppositeCoinChoice = (choice: CoinTossChoice): CoinTossChoice => {
  return choice === 'HEADS' ? 'TAILS' : 'HEADS';
};

export const getOppositeChessSide = (side: ChessSide): ChessSide => {
  return side === 'WHITE' ? 'BLACK' : 'WHITE';
};

export const roomDocumentToGameRoom = (roomDoc: RoomDocument, currentUid: string): GameRoom => {
  const creatorPlayer = roomDoc.players[0];
  const partnerPlayer = roomDoc.players[1];

  const creatorUser: UserProfile = {
    uid: creatorPlayer?.uid,
    displayName: creatorPlayer?.displayName || 'Player One',
    avatar: creatorPlayer?.photoURL || '',
    identity: creatorPlayer?.profileIdentity || 'KING',
    username: `@${creatorPlayer?.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player1'}`,
  };

  const opponentPlayer = roomDoc.players.find((p) => p.uid !== currentUid) || partnerPlayer;
  const opponentUser: UserProfile = opponentPlayer
    ? {
        uid: opponentPlayer.uid,
        displayName: opponentPlayer.displayName || 'Partner',
        avatar: opponentPlayer.photoURL || '',
        identity: opponentPlayer.profileIdentity || 'QUEEN',
        username: `@${opponentPlayer.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'partner'}`,
      }
    : {
        displayName: 'Partner',
        avatar: '',
        identity: 'QUEEN',
      };

  const isCurrentCreator = currentUid === creatorPlayer?.uid;
  const currentSide =
    (isCurrentCreator ? creatorPlayer?.chessColor : partnerPlayer?.chessColor) || 'WHITE';
  const opponentSide =
    (isCurrentCreator ? partnerPlayer?.chessColor : creatorPlayer?.chessColor) || 'BLACK';

  return {
    code: roomDoc.roomCode,
    creator: creatorUser,
    creatorRole: creatorPlayer?.profileIdentity || 'KING',
    opponentRole: partnerPlayer?.profileIdentity || 'QUEEN',
    timer: roomDoc.timer || 'No Timer',
    timeControl: roomDoc.timeControl,
    truthOrDare: roomDoc.truthOrDare ?? true,
    opponent: opponentUser,
    creatorChessSide: currentSide,
    opponentChessSide: opponentSide,
  };
};

// ====================================================
// TRUTH OR DARE TYPES (PHASE D)
// ====================================================

export type TruthDareRoomStatus =
  | 'WAITING'
  | 'READY'
  | 'PLAYING'
  | 'FINISHED'
  | 'CLOSED';

export type TruthDarePlayerRole = 'CREATOR' | 'PARTNER';
export type TruthDareGameRole = 'CHALLENGER' | 'JUDGE';

export type TruthDareMode = 'TRUTH' | 'DARE';

export type TruthCategory =
  | 'FRIENDSHIP'
  | 'RELATIONSHIP'
  | 'FUNNY'
  | 'DEEP'
  | 'COLLEGE'
  | 'PERSONAL';

export type DareCategory =
  | 'FUNNY'
  | 'ACTING'
  | 'SOCIAL'
  | 'CREATIVE'
  | 'FRIENDSHIP'
  | 'CHALLENGE';

export type TruthDareCategory = TruthCategory | DareCategory;

export type TruthDareDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

export interface TruthDareCategoryDefinition {
  id: TruthDareCategory;
  label: string;
  description: string;
  mode: TruthDareMode;
  icon: string;
}

export interface TruthDareCard {
  id: string;
  type: TruthDareMode;
  category: TruthDareCategory;
  difficulty: TruthDareDifficulty;
  text: string;
  intensity?: 'SOFT' | 'MEDIUM' | 'SPICY';
  deckId?: string;
  createdAt?: any;
}

export interface TruthDareCustomDeck {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  cards: TruthDareCard[];
  cardsCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface TruthDarePlayer {
  uid: string;
  displayName: string;
  photoURL: string | null;
  identity: 'KING' | 'QUEEN';
  role: TruthDarePlayerRole;
  ready: boolean;
  joinedAt: unknown;
}

export interface TruthDareSession {
  round: number;
  currentPlayerUid: string | null; // Authoritative Challenger UID
  phase: 'INITIALIZING' | 'CHOOSING' | 'RESPONDING' | 'VERIFYING' | 'ROUND_COMPLETE';
  selectedMode: TruthDareMode | null;
  selectedCategory: TruthDareCategory | null;
  selectedDifficulty: TruthDareDifficulty | null;
  selectedDeckType: 'BUILT_IN' | 'CUSTOM';
  selectedDeckId: string | null;
  selectedCardId: string | null;
  usedCardIds: string[];
  completedRounds: number;
  completedBy?: string | null;
  completedAt?: unknown;
  startedAt: unknown;
}

export interface TruthDareRoom {
  id: string;
  roomId?: string;
  roomCode: string;
  gameType: 'TRUTH_DARE';
  gameMode?: 'TRUTH_DARE';
  createdBy: string;
  status: TruthDareRoomStatus;
  maxPlayers: number;
  players: TruthDarePlayer[];
  currentRound?: number;
  session: TruthDareSession | null;
  exitedPlayers?: string[];
  createdAt: unknown;
  updatedAt: unknown;
}

// ====================================================
// EXPANDED GAME STATISTICS TYPES
// ====================================================

export interface UserChessStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  checkmates: number;
  resignations: number;
  timeouts: number;
  totalMoves: number;
  avgMovesPerGame: number;
}

export interface UserTruthDareStats {
  gamesPlayed: number;
  roundsPlayed: number;
  truthsCompleted: number;
  daresCompleted: number;
  challengesCompleted: number;
  challengerRounds: number;
  judgeRounds: number;
  favoriteMode: TruthDareMode | 'NONE';
  favoriteCategory: TruthDareCategory | 'NONE';
  difficultyDistribution: Record<TruthDareDifficulty, number>;
}

export interface UserGameStats {
  chess: UserChessStats;
  truthDare: UserTruthDareStats;
}

