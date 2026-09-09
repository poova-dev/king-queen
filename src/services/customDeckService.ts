/**
 * Custom Deck Service — King & Queen Phase D
 *
 * Provides CRUD operations for user-created custom Truth or Dare decks
 * stored in Firestore under `truthDareDecks/{deckId}`.
 * Enforces ownership and visibility.
 */

import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TruthDareCard, TruthDareCustomDeck } from '../types';

/**
 * Creates a new custom deck for a user.
 */
export const createCustomDeck = async (
  ownerUid: string,
  title: string,
  description: string = '',
  visibility: 'PUBLIC' | 'PRIVATE' = 'PRIVATE',
  initialCards: TruthDareCard[] = []
): Promise<TruthDareCustomDeck> => {
  if (!ownerUid) throw new Error('UNAUTHENTICATED');
  if (!title || title.trim().length === 0) throw new Error('TITLE_REQUIRED');

  const deckCol = collection(db, 'truthDareDecks');
  const newDeckDoc = doc(deckCol);

  const formattedCards: TruthDareCard[] = initialCards.map((c, idx) => ({
    ...c,
    id: c.id || `card_${newDeckDoc.id}_${idx + 1}`,
    deckId: newDeckDoc.id,
    createdAt: Date.now(),
  }));

  const deckData: TruthDareCustomDeck = {
    id: newDeckDoc.id,
    ownerUid,
    title: title.trim(),
    description: description.trim(),
    visibility,
    cards: formattedCards,
    cardsCount: formattedCards.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(newDeckDoc, deckData);

  return deckData;
};

/**
 * Updates basic metadata of a custom deck.
 */
export const updateCustomDeck = async (
  deckId: string,
  ownerUid: string,
  updates: Partial<Pick<TruthDareCustomDeck, 'title' | 'description' | 'visibility'>>
): Promise<void> => {
  if (!deckId || !ownerUid) throw new Error('INVALID_ARGUMENTS');

  const deckRef = doc(db, 'truthDareDecks', deckId);
  const snap = await getDoc(deckRef);

  if (!snap.exists()) throw new Error('DECK_NOT_FOUND');
  const deck = snap.data() as TruthDareCustomDeck;

  if (deck.ownerUid !== ownerUid) throw new Error('UNAUTHORIZED');

  await updateDoc(deckRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Deletes a custom deck.
 */
export const deleteCustomDeck = async (
  deckId: string,
  ownerUid: string
): Promise<void> => {
  if (!deckId || !ownerUid) throw new Error('INVALID_ARGUMENTS');

  const deckRef = doc(db, 'truthDareDecks', deckId);
  const snap = await getDoc(deckRef);

  if (!snap.exists()) throw new Error('DECK_NOT_FOUND');
  const deck = snap.data() as TruthDareCustomDeck;

  if (deck.ownerUid !== ownerUid) throw new Error('UNAUTHORIZED');

  await deleteDoc(deckRef);
};

/**
 * Adds a new card to a custom deck.
 */
export const addCardToDeck = async (
  deckId: string,
  ownerUid: string,
  cardData: Omit<TruthDareCard, 'id' | 'deckId'>
): Promise<TruthDareCard> => {
  if (!deckId || !ownerUid) throw new Error('INVALID_ARGUMENTS');

  const deckRef = doc(db, 'truthDareDecks', deckId);
  const snap = await getDoc(deckRef);

  if (!snap.exists()) throw new Error('DECK_NOT_FOUND');
  const deck = snap.data() as TruthDareCustomDeck;

  if (deck.ownerUid !== ownerUid) throw new Error('UNAUTHORIZED');

  const cardId = `custom_${deckId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newCard: TruthDareCard = {
    ...cardData,
    id: cardId,
    deckId,
    createdAt: Date.now(),
  };

  const updatedCards = [...(deck.cards || []), newCard];

  await updateDoc(deckRef, {
    cards: updatedCards,
    cardsCount: updatedCards.length,
    updatedAt: serverTimestamp(),
  });

  return newCard;
};

/**
 * Updates an existing card inside a custom deck.
 */
export const updateCardInDeck = async (
  deckId: string,
  ownerUid: string,
  cardId: string,
  cardUpdates: Partial<Omit<TruthDareCard, 'id' | 'deckId'>>
): Promise<void> => {
  if (!deckId || !ownerUid || !cardId) throw new Error('INVALID_ARGUMENTS');

  const deckRef = doc(db, 'truthDareDecks', deckId);
  const snap = await getDoc(deckRef);

  if (!snap.exists()) throw new Error('DECK_NOT_FOUND');
  const deck = snap.data() as TruthDareCustomDeck;

  if (deck.ownerUid !== ownerUid) throw new Error('UNAUTHORIZED');

  const cards = deck.cards || [];
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error('CARD_NOT_FOUND');

  cards[cardIndex] = {
    ...cards[cardIndex],
    ...cardUpdates,
  };

  await updateDoc(deckRef, {
    cards,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Removes a card from a custom deck.
 */
export const deleteCardFromDeck = async (
  deckId: string,
  ownerUid: string,
  cardId: string
): Promise<void> => {
  if (!deckId || !ownerUid || !cardId) throw new Error('INVALID_ARGUMENTS');

  const deckRef = doc(db, 'truthDareDecks', deckId);
  const snap = await getDoc(deckRef);

  if (!snap.exists()) throw new Error('DECK_NOT_FOUND');
  const deck = snap.data() as TruthDareCustomDeck;

  if (deck.ownerUid !== ownerUid) throw new Error('UNAUTHORIZED');

  const updatedCards = (deck.cards || []).filter((c) => c.id !== cardId);

  await updateDoc(deckRef, {
    cards: updatedCards,
    cardsCount: updatedCards.length,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Fetches all custom decks created by a user.
 */
export const getUserCustomDecks = async (
  ownerUid: string
): Promise<TruthDareCustomDeck[]> => {
  if (!ownerUid) return [];

  try {
    const deckCol = collection(db, 'truthDareDecks');
    const q = query(deckCol, where('ownerUid', '==', ownerUid));
    const snap = await getDocs(q);

    return snap.docs.map((d) => d.data() as TruthDareCustomDeck);
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[getUserCustomDecks error]', err);
    }
    return [];
  }
};

/**
 * Fetches public custom decks shared with the community.
 */
export const getPublicCustomDecks = async (): Promise<TruthDareCustomDeck[]> => {
  try {
    const deckCol = collection(db, 'truthDareDecks');
    const q = query(deckCol, where('visibility', '==', 'PUBLIC'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => d.data() as TruthDareCustomDeck);
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[getPublicCustomDecks error]', err);
    }
    return [];
  }
};

/**
 * Fetches a single custom deck by its ID.
 */
export const getCustomDeckById = async (
  deckId: string
): Promise<TruthDareCustomDeck | null> => {
  if (!deckId) return null;

  try {
    const deckRef = doc(db, 'truthDareDecks', deckId);
    const snap = await getDoc(deckRef);
    if (!snap.exists()) return null;

    return snap.data() as TruthDareCustomDeck;
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[getCustomDeckById error]', err);
    }
    return null;
  }
};
