/**
 * useReactions — King & Queen Phase C
 *
 * React hook that manages in-game emoji reactions via Firestore.
 *
 * Features:
 * - Subscribes to rooms/{roomId}/reactions via onSnapshot (real-time)
 * - Ignores historical stale reactions on mount/refresh (createdAt < mountTime - 3000ms)
 * - Deduplicates incoming reactions with a processedIdsRef Set (by unique Firestore doc ID)
 * - Triggers smooth floating animation for each new unique reaction
 * - Auto-cleans floating animations after 2000ms
 * - Exposes sendReaction(emoji) which writes to Firestore
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { sendReaction as apiSendReaction, subscribeToReactions } from '../services/reactionService';
import { FloatingReaction } from '../components/chess/ReactionPicker';

interface UseReactionsOptions {
  roomId: string | null | undefined;
  uid: string;
  isMultiplayer: boolean;
}

interface UseReactionsReturn {
  floatingReactions: FloatingReaction[];
  sendReaction: (emoji: string) => Promise<void>;
}

export const useReactions = ({
  roomId,
  uid,
  isMultiplayer,
}: UseReactionsOptions): UseReactionsReturn => {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Track which Firestore reaction document IDs we've already animated
  const processedIdsRef = useRef<Set<string>>(new Set());
  // Timestamp when this component mounted to filter out old historical reactions on refresh
  const mountTimeRef = useRef<number>(Date.now());

  const addFloatingReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const x = 30 + Math.random() * 40;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  }, []);

  // Subscribe to Firestore reactions when in multiplayer
  useEffect(() => {
    if (!isMultiplayer || !roomId) return;

    const unsubscribe = subscribeToReactions(
      roomId,
      (reactions) => {
        const thresholdTime = mountTimeRef.current - 3000;

        // Process only fresh and unseen reactions
        for (const reaction of reactions) {
          // If reaction was created before this session mounted, mark as processed and ignore
          if (reaction.createdAt && reaction.createdAt < thresholdTime) {
            processedIdsRef.current.add(reaction.id);
            continue;
          }

          if (!processedIdsRef.current.has(reaction.id)) {
            processedIdsRef.current.add(reaction.id);
            addFloatingReaction(reaction.emoji);
          }
        }
      },
      (err) => {
        if (import.meta.env?.DEV) {
          console.warn('[useReactions] Subscription error:', err);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, isMultiplayer, addFloatingReaction]);

  const sendReaction = useCallback(
    async (emoji: string) => {
      if (!isMultiplayer || !roomId) {
        // Local-only mode: just show floating animation for self
        addFloatingReaction(emoji);
        return;
      }

      try {
        await apiSendReaction(roomId, uid, emoji);
        // The onSnapshot listener will pick up our own write and animate it
      } catch (err) {
        if (import.meta.env?.DEV) {
          console.warn('[useReactions] sendReaction error:', err);
        }
        // Fallback: show animation locally if write failed
        addFloatingReaction(emoji);
      }
    },
    [roomId, uid, isMultiplayer, addFloatingReaction]
  );

  return { floatingReactions, sendReaction };
};
