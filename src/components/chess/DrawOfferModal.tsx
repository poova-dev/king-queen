import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Handshake, X, Loader2, Clock } from 'lucide-react';
import { Button } from '../UI';

export interface DrawOfferModalProps {
  isOpen: boolean;
  isProcessing?: boolean;
  offeredAt?: any;
  onAccept: () => void;
  onDecline: () => void;
}

export const DrawOfferModal: React.FC<DrawOfferModalProps> = ({
  isOpen,
  isProcessing = false,
  offeredAt,
  onAccept,
  onDecline,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(30);
      return;
    }

    const calculateRemaining = () => {
      let offeredTimeMs = Date.now();
      if (typeof offeredAt === 'number') {
        offeredTimeMs = offeredAt;
      } else if (offeredAt?.toMillis) {
        offeredTimeMs = offeredAt.toMillis();
      }

      const elapsedMs = Math.max(0, Date.now() - offeredTimeMs);
      const remainingSec = Math.max(0, Math.ceil((30000 - elapsedMs) / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        onDecline();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isOpen, offeredAt, onDecline]);

  // Handle ESC key to dismiss (decline)
  useEffect(() => {
    if (!isOpen || isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDecline();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onDecline]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isProcessing) onDecline();
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/50 p-6 sm:p-7 flex flex-col items-center text-center gap-4.5 shadow-[0_0_50px_rgba(184,155,94,0.25)] my-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (!isProcessing) onDecline();
          }}
          disabled={isProcessing}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-40"
          aria-label="Decline draw offer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-2xl text-[var(--primary)] shadow-inner">
          <Handshake className="w-7 h-7 text-[var(--primary)]" />
        </div>

        {/* Title & Description */}
        <div className="flex flex-col gap-1.5 px-2">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase">
            <Clock className="w-3 h-3 text-[var(--primary)]" />
            <span>EXPIRES IN {secondsRemaining}S</span>
          </div>
          <h3 className="text-xl font-display text-[var(--text)] tracking-wider">
            DRAW OFFER
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
            Your opponent has offered a peaceful conclusion to this battle.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          <Button
            onClick={onAccept}
            disabled={isProcessing}
            variant="primary"
            className="w-full py-3 text-xs font-semibold tracking-wider flex items-center justify-center gap-2 shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>ACCEPTING DRAW...</span>
              </>
            ) : (
              <span>ACCEPT DRAW</span>
            )}
          </Button>

          <button
            onClick={onDecline}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-colors font-medium flex items-center justify-center disabled:opacity-40"
          >
            DECLINE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
