import { Theme, THEMES, ThemeId, ThemeColors } from './themes/themes';

export type { Theme, ThemeId, ThemeColors };
export { THEMES };

export type PlayerIdentity = 'KING' | 'QUEEN';
export type ChessSide = 'WHITE' | 'BLACK';

export type UserProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  identity: PlayerIdentity;
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

export type Screen = 
  | 'SPLASH'
  | 'ONBOARDING'
  | 'ENTRY'
  | 'PROFILE_SETUP'
  | 'THEME_SELECTION'
  | 'PROFILE'
  | 'HOME'
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'WAITING_ROOM'
  | 'GAME_PREVIEW'
  | 'CHESS_GAME';

export const getOppositeIdentity = (identity: PlayerIdentity): PlayerIdentity => {
  return identity === 'KING' ? 'QUEEN' : 'KING';
};
