/**
 * useChessTimer Hook
 * KING & QUEEN — Multiplayer Chess
 *
 * Local reactive timer hook calculating accurate chess clock countdowns
 * based on authoritative Firestore timestamps without polling or repeated writes.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { GameTimerDocument, ChessSide, TimeControl } from '../types';
import {
  calculateCurrentRemainingTime,
  formatChessTime,
  isLowTime,
  isUrgentTime,
  isTimeExpired,
  DEFAULT_TIME_CONTROL,
} from '../services/timerService';

export interface UseChessTimerProps {
  timer: GameTimerDocument | null | undefined;
  timeControl?: TimeControl;
  isGameActive?: boolean;
  onTimeout?: (expiredColor: ChessSide) => void;
}

export interface UseChessTimerReturn {
  whiteTime: number;
  blackTime: number;
  whiteFormatted: string;
  blackFormatted: string;
  activeColor: ChessSide | null;
  isRunning: boolean;
  isPaused: boolean;
  isLowTimeWhite: boolean;
  isLowTimeBlack: boolean;
  isUrgentWhite: boolean;
  isUrgentBlack: boolean;
  isTimeout: boolean;
  timeoutColor: ChessSide | null;
}

export const useChessTimer = ({
  timer,
  timeControl,
  isGameActive = true,
  onTimeout,
}: UseChessTimerProps): UseChessTimerReturn => {
  const initialTime = timeControl?.initialTime || DEFAULT_TIME_CONTROL.initialTime;

  // Track remaining times locally in milliseconds
  const [whiteTime, setWhiteTime] = useState<number>(() => {
    return timer?.whiteTimeRemaining ?? initialTime;
  });
  const [blackTime, setBlackTime] = useState<number>(() => {
    return timer?.blackTimeRemaining ?? initialTime;
  });

  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const hasNotifiedTimeoutRef = useRef<boolean>(false);

  // Recalculate and synchronize when authoritative timer props change
  useEffect(() => {
    const now = Date.now();
    const wTime = calculateCurrentRemainingTime(timer, 'WHITE', now);
    const bTime = calculateCurrentRemainingTime(timer, 'BLACK', now);

    setWhiteTime(wTime);
    setBlackTime(bTime);

    if (timer?.status !== 'RUNNING') {
      hasNotifiedTimeoutRef.current = false;
    }
  }, [
    timer?.whiteTimeRemaining,
    timer?.blackTimeRemaining,
    timer?.activeTimerColor,
    timer?.status,
    timer?.timerStartedAt,
    timer?.timerPausedAt,
    initialTime,
  ]);

  const activeColor = timer?.activeTimerColor || null;
  const isRunning = Boolean(isGameActive && timer?.status === 'RUNNING' && activeColor);
  const isPaused = timer?.status === 'PAUSED';

  // Tick calculation interval
  useEffect(() => {
    if (!isRunning || !activeColor) return;

    // Tick at 100ms when under 10 seconds for smooth tenths display; otherwise 250ms
    const isCurrentUnder10s =
      (activeColor === 'WHITE' && whiteTime < 10_000) ||
      (activeColor === 'BLACK' && blackTime < 10_000);

    const intervalMs = isCurrentUnder10s ? 100 : 250;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const currentRemaining = calculateCurrentRemainingTime(timer, activeColor, now);

      if (activeColor === 'WHITE') {
        setWhiteTime(currentRemaining);
      } else {
        setBlackTime(currentRemaining);
      }

      if (currentRemaining <= 0) {
        clearInterval(intervalId);
        if (!hasNotifiedTimeoutRef.current) {
          hasNotifiedTimeoutRef.current = true;
          if (import.meta.env?.DEV) {
            console.log(`[Timer] Timeout detected for ${activeColor}`);
          }
          onTimeoutRef.current?.(activeColor);
        }
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isRunning, activeColor, timer, whiteTime, blackTime]);

  const isTimeout = isTimeExpired(whiteTime) || isTimeExpired(blackTime);
  const timeoutColor = isTimeExpired(whiteTime)
    ? 'WHITE'
    : isTimeExpired(blackTime)
    ? 'BLACK'
    : null;

  return useMemo(
    () => ({
      whiteTime,
      blackTime,
      whiteFormatted: formatChessTime(whiteTime),
      blackFormatted: formatChessTime(blackTime),
      activeColor,
      isRunning,
      isPaused,
      isLowTimeWhite: isLowTime(whiteTime),
      isLowTimeBlack: isLowTime(blackTime),
      isUrgentWhite: isUrgentTime(whiteTime),
      isUrgentBlack: isUrgentTime(blackTime),
      isTimeout,
      timeoutColor,
    }),
    [whiteTime, blackTime, activeColor, isRunning, isPaused, isTimeout, timeoutColor]
  );
};
