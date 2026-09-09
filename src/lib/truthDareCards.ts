/**
 * Truth or Dare Card Database & Category System — King & Queen Phase D
 *
 * Centralized deck definitions with stable IDs, category mapping,
 * difficulty tiers, and deterministic card selection.
 */

import {
  TruthDareCard,
  TruthDareCategoryDefinition,
  TruthDareMode,
  TruthDareCategory,
  TruthCategory,
  DareCategory,
  TruthDareDifficulty,
} from '../types';

// ─────────────────────────────────────────────────────────────
// CATEGORY DEFINITIONS
// ─────────────────────────────────────────────────────────────

export const TRUTH_CATEGORIES: TruthDareCategoryDefinition[] = [
  {
    id: 'FRIENDSHIP',
    label: 'Friendship',
    description: 'Bonds, memories & mutual trust',
    mode: 'TRUTH',
    icon: '🤝',
  },
  {
    id: 'RELATIONSHIP',
    label: 'Relationship',
    description: 'Romance, affection & future dreams',
    mode: 'TRUTH',
    icon: '❤️',
  },
  {
    id: 'FUNNY',
    label: 'Funny',
    description: 'Hilarious confessions & goofy moments',
    mode: 'TRUTH',
    icon: '😂',
  },
  {
    id: 'DEEP',
    label: 'Deep',
    description: 'Vulnerabilities, philosophy & inner thoughts',
    mode: 'TRUTH',
    icon: '🧠',
  },
  {
    id: 'COLLEGE',
    label: 'College',
    description: 'Youth memories, campus stories & nostalgia',
    mode: 'TRUTH',
    icon: '🎓',
  },
  {
    id: 'PERSONAL',
    label: 'Personal',
    description: 'Habits, secrets & personal reflections',
    mode: 'TRUTH',
    icon: '🗝️',
  },
];

export const DARE_CATEGORIES: TruthDareCategoryDefinition[] = [
  {
    id: 'FUNNY',
    label: 'Funny',
    description: 'Goofy acts, impressions & instant laughter',
    mode: 'DARE',
    icon: '😂',
  },
  {
    id: 'ACTING',
    label: 'Acting',
    description: 'Dramatic scenes & movie characters',
    mode: 'DARE',
    icon: '🎭',
  },
  {
    id: 'SOCIAL',
    label: 'Social',
    description: 'Texts, voice notes & playful calls',
    mode: 'DARE',
    icon: '📱',
  },
  {
    id: 'CREATIVE',
    label: 'Creative',
    description: 'Rhymes, impromptu songs & royal poetry',
    mode: 'DARE',
    icon: '🎨',
  },
  {
    id: 'FRIENDSHIP',
    label: 'Friendship',
    description: 'Heartfelt appreciation & royal pledges',
    mode: 'DARE',
    icon: '🤝',
  },
  {
    id: 'CHALLENGE',
    label: 'Challenge',
    description: 'Quick reactions, memory & verbal agility',
    mode: 'DARE',
    icon: '⚡',
  },
];

export const ALL_CATEGORIES: TruthDareCategoryDefinition[] = [
  ...TRUTH_CATEGORIES,
  ...DARE_CATEGORIES,
];

export const getCategoryDefinitions = (
  mode?: TruthDareMode | null
): TruthDareCategoryDefinition[] => {
  if (mode === 'TRUTH') return TRUTH_CATEGORIES;
  if (mode === 'DARE') return DARE_CATEGORIES;
  return ALL_CATEGORIES;
};

// ─────────────────────────────────────────────────────────────
// BUILT-IN TRUTH CARDS
// ─────────────────────────────────────────────────────────────

export const BUILT_IN_TRUTH_CARDS: TruthDareCard[] = [
  // ── FRIENDSHIP ──
  {
    id: 'truth_001',
    type: 'TRUTH',
    category: 'FRIENDSHIP',
    difficulty: 'EASY',
    text: 'What was your very first impression when we first met?',
    intensity: 'SOFT',
  },
  {
    id: 'truth_002',
    type: 'TRUTH',
    category: 'FRIENDSHIP',
    difficulty: 'MEDIUM',
    text: 'What is one quality in our friendship that you value the most?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_003',
    type: 'TRUTH',
    category: 'FRIENDSHIP',
    difficulty: 'HARD',
    text: 'Was there ever a moment where you felt disappointed by me but stayed silent?',
    intensity: 'SPICY',
  },
  {
    id: 'truth_004',
    type: 'TRUTH',
    category: 'FRIENDSHIP',
    difficulty: 'EXTREME',
    text: 'If you had to tell me one brutal truth about how I carry myself, what would it be?',
    intensity: 'SPICY',
  },

  // ── RELATIONSHIP ──
  {
    id: 'truth_005',
    type: 'TRUTH',
    category: 'RELATIONSHIP',
    difficulty: 'EASY',
    text: 'What is one habit of mine that you secretly find endearing?',
    intensity: 'SOFT',
  },
  {
    id: 'truth_006',
    type: 'TRUTH',
    category: 'RELATIONSHIP',
    difficulty: 'MEDIUM',
    text: 'What is the most romantic memory we have shared so far?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_007',
    type: 'TRUTH',
    category: 'RELATIONSHIP',
    difficulty: 'HARD',
    text: 'What is one unspoken expectation you have for our future together?',
    intensity: 'SPICY',
  },
  {
    id: 'truth_008',
    type: 'TRUTH',
    category: 'RELATIONSHIP',
    difficulty: 'EXTREME',
    text: 'What is your deepest vulnerability when it comes to trusting someone fully?',
    intensity: 'SPICY',
  },

  // ── FUNNY ──
  {
    id: 'truth_009',
    type: 'TRUTH',
    category: 'FUNNY',
    difficulty: 'EASY',
    text: 'What is the most ridiculous lie you have told with a straight face?',
    intensity: 'SOFT',
  },
  {
    id: 'truth_010',
    type: 'TRUTH',
    category: 'FUNNY',
    difficulty: 'MEDIUM',
    text: 'What is the most embarrassing fashion trend or hairstyle you used to rock?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_011',
    type: 'TRUTH',
    category: 'FUNNY',
    difficulty: 'HARD',
    text: 'What is the silliest reason you have ever started an argument with someone?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_012',
    type: 'TRUTH',
    category: 'FUNNY',
    difficulty: 'EXTREME',
    text: 'Describe the most catastrophic awkward silence or date you have ever survived.',
    intensity: 'SPICY',
  },

  // ── DEEP ──
  {
    id: 'truth_013',
    type: 'TRUTH',
    category: 'DEEP',
    difficulty: 'EASY',
    text: 'If you could master any skill overnight, what would you choose and why?',
    intensity: 'SOFT',
  },
  {
    id: 'truth_014',
    type: 'TRUTH',
    category: 'DEEP',
    difficulty: 'MEDIUM',
    text: 'What life lesson did you have to learn the hard way?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_015',
    type: 'TRUTH',
    category: 'DEEP',
    difficulty: 'HARD',
    text: 'What is a personal fear you rarely say out loud to anyone?',
    intensity: 'SPICY',
  },
  {
    id: 'truth_016',
    type: 'TRUTH',
    category: 'DEEP',
    difficulty: 'EXTREME',
    text: 'What part of your past do you still wish you could rewrite?',
    intensity: 'SPICY',
  },

  // ── COLLEGE ──
  {
    id: 'truth_017',
    type: 'TRUTH',
    category: 'COLLEGE',
    difficulty: 'EASY',
    text: 'What was your favourite hangout spot or late-night food run during college/school?',
    intensity: 'SOFT',
  },
  {
    id: 'truth_018',
    type: 'TRUTH',
    category: 'COLLEGE',
    difficulty: 'MEDIUM',
    text: 'Who was your most memorable crush or professor, and why?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_019',
    type: 'TRUTH',
    category: 'COLLEGE',
    difficulty: 'HARD',
    text: 'What was the wildest risk or spontaneous decision you took in your student years?',
    intensity: 'SPICY',
  },
  {
    id: 'truth_020',
    type: 'TRUTH',
    category: 'COLLEGE',
    difficulty: 'EXTREME',
    text: 'What secret from your student life did you keep hidden from your family?',
    intensity: 'SPICY',
  },

  // ── PERSONAL ──
  {
    id: 'truth_021',
    type: 'TRUTH',
    category: 'PERSONAL',
    difficulty: 'EASY',
    text: 'What is your absolute biggest guilty pleasure movie or song?',
    intensity: 'SOFT',
  },
  {
    id: 'truth_022',
    type: 'TRUTH',
    category: 'PERSONAL',
    difficulty: 'MEDIUM',
    text: 'What is one habit you want to build this year that you have been putting off?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_023',
    type: 'TRUTH',
    category: 'PERSONAL',
    difficulty: 'HARD',
    text: 'What is a misconception people often have about you when they first meet you?',
    intensity: 'MEDIUM',
  },
  {
    id: 'truth_024',
    type: 'TRUTH',
    category: 'PERSONAL',
    difficulty: 'EXTREME',
    text: 'What is the hardest truth you have ever had to accept about yourself?',
    intensity: 'SPICY',
  },
];

// ─────────────────────────────────────────────────────────────
// BUILT-IN DARE CARDS
// ─────────────────────────────────────────────────────────────

export const BUILT_IN_DARE_CARDS: TruthDareCard[] = [
  // ── FUNNY ──
  {
    id: 'dare_001',
    type: 'DARE',
    category: 'FUNNY',
    difficulty: 'EASY',
    text: 'Describe me using only 5 emojis in the chat. No words allowed!',
    intensity: 'SOFT',
  },
  {
    id: 'dare_002',
    type: 'DARE',
    category: 'FUNNY',
    difficulty: 'MEDIUM',
    text: 'Talk in a royal British accent or radio presenter voice for the next 2 minutes.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_003',
    type: 'DARE',
    category: 'FUNNY',
    difficulty: 'HARD',
    text: 'Imitate my most frequent facial expression and phrase until I laugh.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_004',
    type: 'DARE',
    category: 'FUNNY',
    difficulty: 'EXTREME',
    text: 'Do a 30-second dramatic commercial pitch for an ordinary item in your room.',
    intensity: 'SPICY',
  },

  // ── ACTING ──
  {
    id: 'dare_005',
    type: 'DARE',
    category: 'ACTING',
    difficulty: 'EASY',
    text: 'Reenact an iconic movie line with full dramatic expression.',
    intensity: 'SOFT',
  },
  {
    id: 'dare_006',
    type: 'DARE',
    category: 'ACTING',
    difficulty: 'MEDIUM',
    text: 'Pretend you are a royal king/queen commanding your kingdom for 60 seconds.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_007',
    type: 'DARE',
    category: 'ACTING',
    difficulty: 'HARD',
    text: 'Give a dramatic Shakespearean monologue declaring why you will win this match.',
    intensity: 'SPICY',
  },
  {
    id: 'dare_008',
    type: 'DARE',
    category: 'ACTING',
    difficulty: 'EXTREME',
    text: 'Act out an intense soap-opera breakup with a fictional imaginary character.',
    intensity: 'SPICY',
  },

  // ── SOCIAL ──
  {
    id: 'dare_009',
    type: 'DARE',
    category: 'SOCIAL',
    difficulty: 'EASY',
    text: 'Send a voice note right now saying the most genuine compliment you can think of.',
    intensity: 'SOFT',
  },
  {
    id: 'dare_010',
    type: 'DARE',
    category: 'SOCIAL',
    difficulty: 'MEDIUM',
    text: 'Send a 10-second audio singing the chorus of your current favorite song.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_011',
    type: 'DARE',
    category: 'SOCIAL',
    difficulty: 'HARD',
    text: 'Text a mutual friend a completely random riddle with zero context.',
    intensity: 'SPICY',
  },
  {
    id: 'dare_012',
    type: 'DARE',
    category: 'SOCIAL',
    difficulty: 'EXTREME',
    text: 'Post an obscure two-word mystery status update on your social profile for 1 hour.',
    intensity: 'SPICY',
  },

  // ── CREATIVE ──
  {
    id: 'dare_013',
    type: 'DARE',
    category: 'CREATIVE',
    difficulty: 'EASY',
    text: 'Compose a 4-line royal rhyming poem about our match right now.',
    intensity: 'SOFT',
  },
  {
    id: 'dare_014',
    type: 'DARE',
    category: 'CREATIVE',
    difficulty: 'MEDIUM',
    text: 'Invent a new royal title for both of us and explain the epic lore behind them.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_015',
    type: 'DARE',
    category: 'CREATIVE',
    difficulty: 'HARD',
    text: 'Make up a theme song for the King & Queen championship on the spot.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_016',
    type: 'DARE',
    category: 'CREATIVE',
    difficulty: 'EXTREME',
    text: 'Create a custom royal handshake or signature victory gesture right now.',
    intensity: 'SPICY',
  },

  // ── FRIENDSHIP ──
  {
    id: 'dare_017',
    type: 'DARE',
    category: 'FRIENDSHIP',
    difficulty: 'EASY',
    text: 'List 3 specific things you appreciate about me without hesitating.',
    intensity: 'SOFT',
  },
  {
    id: 'dare_018',
    type: 'DARE',
    category: 'FRIENDSHIP',
    difficulty: 'MEDIUM',
    text: 'Make a meaningful royal promise to me that you will fulfill this month.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_019',
    type: 'DARE',
    category: 'FRIENDSHIP',
    difficulty: 'HARD',
    text: 'Share the song that you feel best represents our connection and explain why.',
    intensity: 'SOFT',
  },
  {
    id: 'dare_020',
    type: 'DARE',
    category: 'FRIENDSHIP',
    difficulty: 'EXTREME',
    text: 'Plan an entire dream day-out itinerary for both of us in 60 seconds.',
    intensity: 'SPICY',
  },

  // ── CHALLENGE ──
  {
    id: 'dare_021',
    type: 'DARE',
    category: 'CHALLENGE',
    difficulty: 'EASY',
    text: 'Spell 5 long words backwards without writing them down.',
    intensity: 'SOFT',
  },
  {
    id: 'dare_022',
    type: 'DARE',
    category: 'CHALLENGE',
    difficulty: 'MEDIUM',
    text: 'Name 10 countries starting with the letter "M" or "S" in under 30 seconds.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_023',
    type: 'DARE',
    category: 'CHALLENGE',
    difficulty: 'HARD',
    text: 'Hold a completely straight poker face for 45 seconds while I try to make you laugh.',
    intensity: 'MEDIUM',
  },
  {
    id: 'dare_024',
    type: 'DARE',
    category: 'CHALLENGE',
    difficulty: 'EXTREME',
    text: 'Do 20 rapid-fire squats or jumping jacks right now while counting aloud in reverse.',
    intensity: 'SPICY',
  },
];

export const TRUTH_CARDS = BUILT_IN_TRUTH_CARDS;
export const DARE_CARDS = BUILT_IN_DARE_CARDS;

// ─────────────────────────────────────────────────────────────
// LOOKUP TABLE & SELECTION HELPERS
// ─────────────────────────────────────────────────────────────

const ALL_BUILT_IN_CARDS_MAP = new Map<string, TruthDareCard>([
  ...BUILT_IN_TRUTH_CARDS.map((c): [string, TruthDareCard] => [c.id, c]),
  ...BUILT_IN_DARE_CARDS.map((c): [string, TruthDareCard] => [c.id, c]),
]);

/**
 * Look up a card by its stable ID (checking built-in map first, then optional custom deck).
 */
export const getCardById = (
  id: string | null | undefined,
  customCards?: TruthDareCard[]
): TruthDareCard | null => {
  if (!id) return null;

  const builtIn = ALL_BUILT_IN_CARDS_MAP.get(id);
  if (builtIn) return builtIn;

  if (customCards && customCards.length > 0) {
    const custom = customCards.find((c) => c.id === id);
    if (custom) return custom;
  }

  return null;
};

/**
 * Filters cards matching specified criteria.
 */
export const filterCards = (
  mode: TruthDareMode,
  category?: TruthDareCategory | null,
  difficulty?: TruthDareDifficulty | null,
  usedCardIds: string[] = [],
  customCards?: TruthDareCard[]
): TruthDareCard[] => {
  const pool =
    customCards && customCards.length > 0
      ? customCards.filter((c) => c.type === mode)
      : mode === 'TRUTH'
      ? BUILT_IN_TRUTH_CARDS
      : BUILT_IN_DARE_CARDS;

  let matching = pool;

  if (category) {
    matching = matching.filter((c) => c.category === category);
  }

  if (difficulty) {
    matching = matching.filter((c) => c.difficulty === difficulty);
  }

  // Filter out already used cards if possible
  const unused = matching.filter((c) => !usedCardIds.includes(c.id));
  if (unused.length > 0) {
    return unused;
  }

  // If all matching cards have been used in this session, recycle matching cards
  return matching;
};

/**
 * Selects an authoritative card deterministically from pool.
 */
export const selectAuthoritativeCard = (
  mode: TruthDareMode,
  category?: TruthDareCategory | null,
  difficulty?: TruthDareDifficulty | null,
  usedCardIds: string[] = [],
  customCards?: TruthDareCard[]
): TruthDareCard | null => {
  const candidates = filterCards(
    mode,
    category,
    difficulty,
    usedCardIds,
    customCards
  );

  if (candidates.length === 0) {
    // Fallback to mode pool if strict category/difficulty has no matches in custom deck
    const fallbackPool =
      customCards && customCards.length > 0
        ? customCards.filter((c) => c.type === mode)
        : mode === 'TRUTH'
        ? BUILT_IN_TRUTH_CARDS
        : BUILT_IN_DARE_CARDS;
    if (fallbackPool.length === 0) return null;
    const randIdx = Math.floor(Math.random() * fallbackPool.length);
    return fallbackPool[randIdx];
  }

  const randIdx = Math.floor(Math.random() * candidates.length);
  return candidates[randIdx];
};

/**
 * Backward compatibility helpers
 */
export const getRandomTruthCardId = (): string => {
  const idx = Math.floor(Math.random() * BUILT_IN_TRUTH_CARDS.length);
  return BUILT_IN_TRUTH_CARDS[idx].id;
};

export const getRandomDareCardId = (): string => {
  const idx = Math.floor(Math.random() * BUILT_IN_DARE_CARDS.length);
  return BUILT_IN_DARE_CARDS[idx].id;
};
