export type Theme = {
  id: string;
  name: string;
  tagline: string;
  background: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  text: string;
  textMuted: string;
  border: string;
};

export const THEMES: Theme[] = [
  {
    id: 'quiet-royal',
    name: 'QUIET ROYAL',
    tagline: 'Elegant • Mature • Premium',
    background: '#0E0E10',
    surface: '#18181B',
    surfaceLight: '#222226',
    primary: '#B89B5E',
    primaryLight: '#D6C29A',
    accent: '#A65D67',
    accentDark: '#7F4650',
    text: '#F2F0EB',
    textMuted: '#9B9892',
    border: '#2C2C30',
  },
  {
    id: 'modern-monochrome',
    name: 'MODERN MONOCHROME',
    tagline: 'Minimal • Clean • Sharp',
    background: '#0A0A0A',
    surface: '#121212',
    surfaceLight: '#1C1C1C',
    primary: '#FFFFFF',
    primaryLight: '#E0E0E0',
    accent: '#333333',
    accentDark: '#1A1A1A',
    text: '#F5F5F5',
    textMuted: '#888888',
    border: '#262626',
  },
  {
    id: 'midnight-royal',
    name: 'MIDNIGHT ROYAL',
    tagline: 'Deep • Cinematic • Rich',
    background: '#080810',
    surface: '#10101F',
    surfaceLight: '#1A1A2E',
    primary: '#4ECCA3',
    primaryLight: '#A8E6CF',
    accent: '#FFD700',
    accentDark: '#B8860B',
    text: '#EEEEEE',
    textMuted: '#BDBDBD',
    border: '#1F1F3D',
  },
  {
    id: 'forest-luxury',
    name: 'FOREST LUXURY',
    tagline: 'Natural • Calm • Unique',
    background: '#0D110D',
    surface: '#161D16',
    surfaceLight: '#202A20',
    primary: '#7A9E7A',
    primaryLight: '#B0C4B0',
    accent: '#C4A484',
    accentDark: '#8B7355',
    text: '#E8EBE8',
    textMuted: '#A0AFA0',
    border: '#2A352A',
  },
  {
    id: 'sunset-elegance',
    name: 'SUNSET ELEGANCE',
    tagline: 'Warm • Sophisticated • Soft',
    background: '#140D0D',
    surface: '#1F1515',
    surfaceLight: '#2A1C1C',
    primary: '#E07A5F',
    primaryLight: '#F2CC8F',
    accent: '#81B29A',
    accentDark: '#3D405B',
    text: '#F4F1DE',
    textMuted: '#AFA991',
    border: '#352525',
  },
  {
    id: 'neo-cyber',
    name: 'NEO CYBER',
    tagline: 'Futuristic • Energetic • Gaming',
    background: '#050505',
    surface: '#0D0D0D',
    surfaceLight: '#151515',
    primary: '#00F0FF',
    primaryLight: '#B3F5FF',
    accent: '#FF0055',
    accentDark: '#990033',
    text: '#FFFFFF',
    textMuted: '#707070',
    border: '#1F1F1F',
  },
];

export type UserProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  identity: 'KING' | 'QUEEN';
};

export type Screen = 
  | 'SPLASH'
  | 'ONBOARDING'
  | 'ENTRY'
  | 'PROFILE_SETUP'
  | 'THEME_SELECTION'
  | 'HOME'
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'WAITING_ROOM'
  | 'GAME_PREVIEW';
