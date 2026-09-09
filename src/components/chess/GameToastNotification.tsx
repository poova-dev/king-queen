import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords,
  Crown,
  Handshake,
  AlertTriangle,
  Wifi,
  WifiOff,
  Sparkles,
  RotateCw,
  Trophy,
} from 'lucide-react';

export type GameToastType =
  | 'PLAYER_JOINED'
  | 'GAME_STARTED'
  | 'YOUR_TURN'
  | 'OPPONENT_TURN'
  | 'CHECK'
  | 'DRAW_OFFER_SENT'
  | 'DRAW_OFFER_RECEIVED'
  | 'DRAW_OFFER_DECLINED'
  | 'OPPONENT_RECONNECTED'
  | 'OPPONENT_DISCONNECTED'
  | 'REMATCH_REQUEST'
  | 'GAME_FINISHED';

export interface GameToastItem {
  id: string;
  type: GameToastType;
  message: string;
  subtext?: string;
  durationMs?: number;
}

interface GameToastNotificationProps {
  toasts: GameToastItem[];
  onDismiss: (id: string) => void;
}

export const GameToastNotification: React.FC<GameToastNotificationProps> = ({
  toasts,
  onDismiss,
}) => {
  const getIcon = (type: GameToastType) => {
    switch (type) {
      case 'CHECK':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'YOUR_TURN':
        return <Crown className="w-4 h-4 text-[var(--primary)]" />;
      case 'OPPONENT_TURN':
        return <Swords className="w-4 h-4 text-[var(--text-muted)]" />;
      case 'DRAW_OFFER_SENT':
      case 'DRAW_OFFER_RECEIVED':
      case 'DRAW_OFFER_DECLINED':
        return <Handshake className="w-4 h-4 text-[var(--primary)]" />;
      case 'OPPONENT_RECONNECTED':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'OPPONENT_DISCONNECTED':
        return <WifiOff className="w-4 h-4 text-rose-400" />;
      case 'REMATCH_REQUEST':
        return <RotateCw className="w-4 h-4 text-[var(--primary)]" />;
      case 'GAME_FINISHED':
        return <Trophy className="w-4 h-4 text-[var(--primary)]" />;
      case 'GAME_STARTED':
      case 'PLAYER_JOINED':
      default:
        return <Sparkles className="w-4 h-4 text-[var(--primary)]" />;
    }
  };

  const getBorderColor = (type: GameToastType) => {
    switch (type) {
      case 'CHECK':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-200';
      case 'OPPONENT_DISCONNECTED':
        return 'border-rose-500/50 bg-rose-950/40 text-rose-200';
      case 'OPPONENT_RECONNECTED':
        return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200';
      default:
        return 'border-[var(--primary)]/40 bg-[var(--surface)] text-[var(--text)]';
    }
  };

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none w-full max-w-xs px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => onDismiss(toast.id)}
            className={`pointer-events-auto cursor-pointer rounded-2xl border px-3.5 py-2.5 shadow-xl backdrop-blur-md flex items-center gap-2.5 w-full select-none ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-black/30">
              {getIcon(toast.type)}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-semibold tracking-wide truncate">
                {toast.message}
              </span>
              {toast.subtext && (
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  {toast.subtext}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
