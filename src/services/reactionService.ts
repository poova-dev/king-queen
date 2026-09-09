/**
 * Reaction Service — King & Queen Phase A
 *
 * Handles writing and subscribing to in-game emoji reactions.
 * Reactions are stored as ephemeral documents in:
 *   rooms/{roomId}/reactions/{reactionId}
 *
 * Each document: { uid, emoji, createdAt }
 *
 * Design:
 * - Writes use addDoc (no transaction needed; security rules enforce auth)
 * - Listener uses onSnapshot ordered by createdAt desc, limited to 20 docs
 * - Caller is responsible for deduplication (track processed IDs in a Set)
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ReactionDocument {
  id: string;
  uid: string;
  emoji: string;
  createdAt: number | null;
}

/**
 * Send an emoji reaction that will be delivered to both clients in real-time.
 * Writes to: rooms/{roomId}/reactions/{autoId}
 */
export const sendReaction = async (
  roomId: string,
  uid: string,
  emoji: string
): Promise<string> => {
  if (!roomId || !uid || !emoji) {
    throw new Error('INVALID_REACTION_PARAMS');
  }

  const reactionsRef = collection(db, 'rooms', roomId, 'reactions');
  const docRef = await addDoc(reactionsRef, {
    uid,
    emoji,
    createdAt: serverTimestamp(),
  });

  if (import.meta.env?.DEV) {
    console.log(`[Reactions] Sent reaction ${emoji} in room ${roomId}, id=${docRef.id}`);
  }

  return docRef.id;
};

/**
 * Subscribe to the reactions subcollection for a room.
 * Fires onReaction for every new document snapshot.
 * The caller is responsible for deduplication.
 *
 * @returns Unsubscribe function — MUST be called on cleanup
 */
export const subscribeToReactions = (
  roomId: string,
  onReaction: (reactions: ReactionDocument[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  if (!roomId) {
    if (onError) onError(new Error('MISSING_ROOM_ID'));
    return () => {};
  }

  const reactionsRef = collection(db, 'rooms', roomId, 'reactions');
  const q = query(reactionsRef, orderBy('createdAt', 'desc'), limit(20));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs: ReactionDocument[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid as string,
          emoji: data.emoji as string,
          createdAt: data.createdAt?.toMillis?.() ?? null,
        };
      });
      onReaction(docs);
    },
    (error) => {
      if (import.meta.env?.DEV) {
        console.error('[Reactions] Snapshot error:', error);
      }
      if (onError) onError(error);
    }
  );
};
