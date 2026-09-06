/**
 * useConnectionStatus Hook
 * KING & QUEEN — Real-time Multiplayer Chess
 *
 * Monitors network connectivity and manages real-time player presence updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { connectionService, NetworkStatus } from '../services/connectionService';
import { markPlayerOnline, markPlayerReconnecting } from '../services/presenceService';

export interface UseConnectionStatusOptions {
  roomId?: string;
  userUid?: string;
  autoSyncPresence?: boolean;
}

export const useConnectionStatus = (options: UseConnectionStatusOptions = {}) => {
  const { roomId, userUid, autoSyncPresence = true } = options;

  const [connectionStatus, setConnectionStatus] = useState<NetworkStatus>(() =>
    connectionService.getStatus()
  );
  const [lastConnectionChange, setLastConnectionChange] = useState<number>(Date.now());
  const prevStatusRef = useRef<NetworkStatus>(connectionStatus);

  useEffect(() => {
    const unsubscribe = connectionService.subscribe((status) => {
      setConnectionStatus(status);
      setLastConnectionChange(Date.now());

      if (autoSyncPresence && roomId && userUid) {
        if (status === 'ONLINE' && prevStatusRef.current !== 'ONLINE') {
          markPlayerOnline(roomId, userUid).catch(() => {});
        } else if (status === 'OFFLINE' || status === 'RECONNECTING') {
          markPlayerReconnecting(roomId, userUid).catch(() => {});
        }
      }

      prevStatusRef.current = status;
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, userUid, autoSyncPresence]);

  const forceCheckConnection = useCallback(() => {
    const status = connectionService.getStatus();
    setConnectionStatus(status);
    return status;
  }, []);

  return {
    isOnline: connectionStatus === 'ONLINE',
    isReconnecting: connectionStatus === 'RECONNECTING',
    isOffline: connectionStatus === 'OFFLINE',
    connectionStatus,
    lastConnectionChange,
    forceCheckConnection,
  };
};
