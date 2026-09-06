/**
 * Connection Service
 * KING & QUEEN — Real-time Multiplayer Chess
 *
 * Provides resilient browser network monitoring and notification mechanisms.
 */

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export type NetworkListener = (status: NetworkStatus) => void;

class ConnectionService {
  private currentStatus: NetworkStatus = 'ONLINE';
  private listeners: Set<NetworkListener> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.currentStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE';

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.isInitialized = true;
  }

  private handleOnline = () => {
    if (import.meta.env?.DEV) {
      console.info('[Connection] Browser network restored (online)');
    }
    // Briefly mark as RECONNECTING before confirming ONLINE synchronization
    this.currentStatus = 'RECONNECTING';
    this.notifyListeners();

    setTimeout(() => {
      this.currentStatus = 'ONLINE';
      this.notifyListeners();
    }, 400);
  };

  private handleOffline = () => {
    if (import.meta.env?.DEV) {
      console.warn('[Connection] Browser network lost (offline)');
    }
    this.currentStatus = 'OFFLINE';
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentStatus);
      } catch (err) {
        console.error('[Connection] Listener error', err);
      }
    });
  }

  public getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  public isOnline(): boolean {
    return this.currentStatus === 'ONLINE';
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Immediately invoke with current status
    try {
      listener(this.currentStatus);
    } catch {
      // Ignored
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Testing helper
  public _simulateStatus(status: NetworkStatus) {
    this.currentStatus = status;
    this.notifyListeners();
  }

  public cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const connectionService = new ConnectionService();
