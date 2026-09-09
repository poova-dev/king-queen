import { useState, useCallback, useRef, useEffect } from 'react';
import { GameToastItem, GameToastType } from '../components/chess/GameToastNotification';

export function useGameNotifications(roomId?: string) {
  const [toasts, setToasts] = useState<GameToastItem[]>([]);
  const processedKeysRef = useRef<Set<string>>(new Set());

  const addToast = useCallback(
    (
      type: GameToastType,
      message: string,
      subtext?: string,
      eventKey?: string | number,
      durationMs = 2800
    ) => {
      const dedupeKey = `${roomId || 'local'}_${type}_${eventKey ?? message}`;
      if (processedKeysRef.current.has(dedupeKey)) {
        return;
      }
      processedKeysRef.current.add(dedupeKey);

      const id = `${Date.now()}_${Math.random()}`;
      const newToast: GameToastItem = {
        id,
        type,
        message,
        subtext,
        durationMs,
      };

      setToasts((prev) => [...prev.slice(-2), newToast]); // Keep max 3 at once

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    [roomId]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setToasts([]);
    processedKeysRef.current.clear();
  }, []);

  // Clear when roomId changes
  useEffect(() => {
    processedKeysRef.current.clear();
    setToasts([]);
  }, [roomId]);

  return {
    toasts,
    addToast,
    dismissToast,
    clearNotifications,
  };
}
