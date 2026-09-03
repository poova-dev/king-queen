export type ThemeId =
  | 'quiet-royal'
  | 'modern-monochrome'
  | 'midnight-royal'
  | 'forest-luxury'
  | 'sunset-elegance'
  | 'neo-cyber';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  primaryLight: string;
  secondaryAccent: string;
  highlightAccent?: string;
  text: string;
  textMuted: string;
  border: string;
  // Chessboard specific styling
  boardLight: string;
  boardDark: string;
  boardBorder: string;
  boardHighlight: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  styleDescription: string;
  tagline: string;
  colors: ThemeColors;
  // For backwards compatibility with existing code:
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
}

export const THEMES: Theme[] = [
  {
    id: 'quiet-royal',
    name: 'QUIET ROYAL',
    styleDescription: 'Elegant, mature, premium, quiet luxury.',
    tagline: 'Elegant • Mature • Premium',
    colors: {
      background: '#0E0E10',
      surface: '#18181B',
      surfaceLight: '#222226',
      primary: '#B89B5E',
      primaryLight: '#D6C29A',
      secondaryAccent: '#A65D67',
      text: '#F2F0EB',
      textMuted: '#9B9892',
      border: '#2C2C30',
      boardLight: '#27272C',
      boardDark: '#18181B',
      boardBorder: '#35353A',
      boardHighlight: '#B89B5E',
    },
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
    styleDescription: 'Minimal, clean, sharp.',
    tagline: 'Minimal • Clean • Sharp',
    colors: {
      background: '#090909',
      surface: '#151515',
      surfaceLight: '#202020',
      primary: '#C8C8C8',
      primaryLight: '#E0E0E0',
      secondaryAccent: '#707070',
      text: '#F5F5F5',
      textMuted: '#A0A0A0',
      border: '#303030',
      boardLight: '#232323',
      boardDark: '#141414',
      boardBorder: '#3A3A3A',
      boardHighlight: '#C8C8C8',
    },
    background: '#090909',
    surface: '#151515',
    surfaceLight: '#202020',
    primary: '#C8C8C8',
    primaryLight: '#E0E0E0',
    accent: '#707070',
    accentDark: '#4A4A4A',
    text: '#F5F5F5',
    textMuted: '#A0A0A0',
    border: '#303030',
  },
  {
    id: 'midnight-royal',
    name: 'MIDNIGHT ROYAL',
    styleDescription: 'Deep, cinematic, sophisticated.',
    tagline: 'Deep • Cinematic • Rich',
    colors: {
      background: '#080B16',
      surface: '#11182A',
      surfaceLight: '#1A2338',
      primary: '#A98B5E',
      primaryLight: '#C8B188',
      secondaryAccent: '#596A9E',
      text: '#F1F2F6',
      textMuted: '#9AA4B5',
      border: '#29334A',
      boardLight: '#1E2840',
      boardDark: '#11182A',
      boardBorder: '#323E5A',
      boardHighlight: '#A98B5E',
    },
    background: '#080B16',
    surface: '#11182A',
    surfaceLight: '#1A2338',
    primary: '#A98B5E',
    primaryLight: '#C8B188',
    accent: '#596A9E',
    accentDark: '#3A476E',
    text: '#F1F2F6',
    textMuted: '#9AA4B5',
    border: '#29334A',
  },
  {
    id: 'forest-luxury',
    name: 'FOREST LUXURY',
    styleDescription: 'Calm, natural, elegant.',
    tagline: 'Natural • Calm • Unique',
    colors: {
      background: '#0B120F',
      surface: '#142019',
      surfaceLight: '#1D2B22',
      primary: '#B59A62',
      primaryLight: '#D4BE8D',
      secondaryAccent: '#52705A',
      text: '#EDF0E9',
      textMuted: '#9CA89E',
      border: '#2A3A2E',
      boardLight: '#213026',
      boardDark: '#142019',
      boardBorder: '#35483A',
      boardHighlight: '#B59A62',
    },
    background: '#0B120F',
    surface: '#142019',
    surfaceLight: '#1D2B22',
    primary: '#B59A62',
    primaryLight: '#D4BE8D',
    accent: '#52705A',
    accentDark: '#394E3E',
    text: '#EDF0E9',
    textMuted: '#9CA89E',
    border: '#2A3A2E',
  },
  {
    id: 'sunset-elegance',
    name: 'SUNSET ELEGANCE',
    styleDescription: 'Warm, sophisticated, soft.',
    tagline: 'Warm • Sophisticated • Soft',
    colors: {
      background: '#17100F',
      surface: '#241817',
      surfaceLight: '#33211F',
      primary: '#C7966B',
      primaryLight: '#E2B591',
      secondaryAccent: '#9B5F58',
      text: '#F3ECE7',
      textMuted: '#B7A49C',
      border: '#44302C',
      boardLight: '#382522',
      boardDark: '#241817',
      boardBorder: '#523B36',
      boardHighlight: '#C7966B',
    },
    background: '#17100F',
    surface: '#241817',
    surfaceLight: '#33211F',
    primary: '#C7966B',
    primaryLight: '#E2B591',
    accent: '#9B5F58',
    accentDark: '#6E403B',
    text: '#F3ECE7',
    textMuted: '#B7A49C',
    border: '#44302C',
  },
  {
    id: 'neo-cyber',
    name: 'NEO CYBER',
    styleDescription: 'Futuristic, modern gaming, controlled energy.',
    tagline: 'Futuristic • Modern • Gaming',
    colors: {
      background: '#090A12',
      surface: '#11121E',
      surfaceLight: '#191B2C',
      primary: '#7C7CFF',
      primaryLight: '#A3A3FF',
      secondaryAccent: '#C05CFF',
      highlightAccent: '#5CCBFF',
      text: '#F0F2FF',
      textMuted: '#989CB5',
      border: '#292D47',
      boardLight: '#1C1F36',
      boardDark: '#11121E',
      boardBorder: '#353A5E',
      boardHighlight: '#7C7CFF',
    },
    background: '#090A12',
    surface: '#11121E',
    surfaceLight: '#191B2C',
    primary: '#7C7CFF',
    primaryLight: '#A3A3FF',
    accent: '#C05CFF',
    accentDark: '#8532B8',
    text: '#F0F2FF',
    textMuted: '#989CB5',
    border: '#292D47',
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'quiet-royal';

export const getThemeById = (id: string): Theme => {
  return THEMES.find((t) => t.id === id) || THEMES[0];
};
