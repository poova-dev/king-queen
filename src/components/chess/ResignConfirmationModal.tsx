import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, X, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '../UI';

export interface ResignConfirmationModalProps {
  isOpen: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResignConfirmationModal: React.FC<ResignConfirmationModalProps> = ({
  isOpen,
  isProcessing = false,
  onClose,
  onConfirm,
}) => {
  // Handle ESC key to dismiss modal when not processing
  useEffect(() => {
    if (!isOpen || isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      {/* Backdrop click dismisses when not processing */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-red-500/40 p-6 sm:p-7 flex flex-col items-center text-center gap-4.5 shadow-[0_0_50px_rgba(0,0,0,0.9)] my-auto"
      >
        {/* Close Icon button */}
        <button
          onClick={() => {
            if (!isProcessing) onClose();
          }}
          disabled={isProcessing}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Close resignation confirmation"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl text-red-400 shadow-inner">
          <Flag className="w-7 h-7 text-red-400" />
        </div>

        {/* Title & Description */}
        <div className="flex flex-col gap-1.5 px-2">
          <span className="text-[10px] font-bold tracking-[0.25em] text-red-400 uppercase flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3" /> RESIGNATION
          </span>
          <h3 className="text-xl font-display text-[var(--text)] tracking-wider">
            ABANDON THE BATTLE?
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
            Are you sure you want to resign this match?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            variant="secondary"
            className="w-full py-3 text-xs font-semibold tracking-wider bg-red-600 hover:bg-red-700 text-white border-red-500/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>RESIGNING...</span>
              </>
            ) : (
              <span>RESIGN GAME</span>
            )}
          </Button>

          <button
            onClick={() => {
              if (!isProcessing) onClose();
            }}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/50 transition-colors font-medium flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            CANCEL
          </button>
        </div>
      </motion.div>
    </div>
  );
};
