/**
 * Self Disconnected Banner
 * KING & QUEEN — Real-time Multiplayer Chess
 *
 * Displays royal notification when the current player loses internet connectivity,
 * assuring that match progress is safely preserved in Firestore.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Loader2, ShieldCheck } from 'lucide-react';

interface SelfDisconnectedBannerProps {
  isVisible: boolean;
  isReconnecting?: boolean;
}

export const SelfDisconnectedBanner: React.FC<SelfDisconnectedBannerProps> = ({
  isVisible,
  isReconnecting = false,
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full rounded-2xl bg-[var(--surface)] border border-rose-500/40 p-3.5 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.65)] flex flex-col gap-2.5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/20 via-rose-400 to-rose-500/20" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.2em] text-rose-400 uppercase">
                Offline Mode
              </span>
              <h3 className="text-xs sm:text-sm font-semibold text-[var(--text)]">
                {isReconnecting ? "Restoring Connection..." : "You're Currently Offline"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
            <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
            <span>{isReconnecting ? 'Reconnecting...' : 'Reconnecting...'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]/60 pt-2">
          <span>Connection interrupted. Trying to reconnect to the kingdom...</span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-medium shrink-0 ml-2">
            <ShieldCheck className="w-3 h-3" />
            <span>Progress Saved</span>
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
