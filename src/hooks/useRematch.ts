import { useState, useCallback, useRef, useEffect } from 'react';
import { RematchState } from '../types';

interface UseRematchOptions {
  onRematchSuccess?: () => void;
  transitionDurationMs?: number;
}

const INITIAL_REMATCH_STATE: RematchState = {
  playerOneConfirmed: false,
  playerTwoConfirmed: false,
  rematchStarted: false,
  declinedBy: null,
};

export const useRematch = (options?: UseRematchOptions) => {
  const { onRematchSuccess, transitionDurationMs = 800 } = options || {};

  const [rematchState, setRematchState] = useState<RematchState>(INITIAL_REMATCH_STATE);
  const isResettingRef = useRef(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // Centralized function to start rematch execution
  const triggerRematchReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      if (onRematchSuccess) {
        onRematchSuccess();
      }
      setRematchState(INITIAL_REMATCH_STATE);
      isResettingRef.current = false;
    }, transitionDurationMs);
  }, [onRematchSuccess, transitionDurationMs]);

  // Player confirms rematch
  const confirmRematch = useCallback(
    (player: 'playerOne' | 'playerTwo') => {
      // Race condition protection: block if reset sequence is already in progress
      if (isResettingRef.current) return;

      setRematchState((prev) => {
        // If already confirmed by this player, do nothing
        if (player === 'playerOne' && prev.playerOneConfirmed) return prev;
        if (player === 'playerTwo' && prev.playerTwoConfirmed) return prev;

        const nextState: RematchState = {
          ...prev,
          playerOneConfirmed: player === 'playerOne' ? true : prev.playerOneConfirmed,
          playerTwoConfirmed: player === 'playerTwo' ? true : prev.playerTwoConfirmed,
          declinedBy: null,
        };

        // If BOTH players have confirmed now
        if (nextState.playerOneConfirmed && nextState.playerTwoConfirmed) {
          nextState.rematchStarted = true;
          isResettingRef.current = true;
          triggerRematchReset();
        }

        return nextState;
      });
    },
    [triggerRematchReset]
  );

  // Player declines or exits during rematch phase
  const declineRematch = useCallback((player: 'playerOne' | 'playerTwo' | 'YOU' | 'OPPONENT') => {
    if (isResettingRef.current) return;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const declinedWho =
      player === 'playerOne' || player === 'YOU' ? 'YOU' : 'OPPONENT';

    setRematchState({
      playerOneConfirmed: false,
      playerTwoConfirmed: false,
      rematchStarted: false,
      declinedBy: declinedWho,
    });
  }, []);

  // Reset rematch state manually (e.g. when opening fresh game)
  const resetRematchState = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    isResettingRef.current = false;
    setRematchState(INITIAL_REMATCH_STATE);
  }, []);

  return {
    rematchState,
    isResetting: isResettingRef.current,
    confirmRematch,
    declineRematch,
    resetRematchState,
  };
};
