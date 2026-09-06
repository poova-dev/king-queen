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
  | 'GAME_HISTORY';

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
}

export type MultiplayerGameStatus =
  | 'PLAYING'
  | 'CHECK'
  | 'CHECKMATE'
  | 'DRAW'
  | 'STALEMATE';

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

export interface GameHistoryRecord {
  id: string;
  roomId: string;
  whitePlayer: GameHistoryPlayer;
  blackPlayer: GameHistoryPlayer;
  playerUids: string[];
  winnerUid: string | null;
  result: 'CHECKMATE' | 'RESIGNATION' | 'DRAW' | 'STALEMATE';
  totalMoves: number;
  finalFen: string;
  startedAt?: any;
  completedAt?: any;
  rematchNumber: number;
  createdAt?: any;
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
    truthOrDare: roomDoc.truthOrDare ?? true,
    opponent: opponentUser,
    creatorChessSide: currentSide,
    opponentChessSide: opponentSide,
  };
};
