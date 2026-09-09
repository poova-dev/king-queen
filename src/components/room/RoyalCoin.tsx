import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CoinTossChoice } from '../../types';
import { Sparkles } from 'lucide-react';

interface RoyalCoinProps {
  coinResult: CoinTossChoice | null;
  isFlipping: boolean;
  onAnimationComplete?: () => void;
  interactiveChoice?: CoinTossChoice | null;
}

export const RoyalCoin: React.FC<RoyalCoinProps> = ({
  coinResult,
  isFlipping,
  onAnimationComplete,
}) => {
  const [animating, setAnimating] = useState(false);
  const [displayFace, setDisplayFace] = useState<CoinTossChoice>(coinResult || 'HEADS');

  useEffect(() => {
    if (isFlipping) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setAnimating(false);
        if (coinResult) {
          setDisplayFace(coinResult);
        }
        onAnimationComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isFlipping, coinResult, onAnimationComplete]);

  // If coinResult is already resolved, display it directly
  useEffect(() => {
    if (coinResult && !animating) {
      setDisplayFace(coinResult);
    }
  }, [coinResult, animating]);

  const targetRotationY = coinResult === 'TAILS' ? 1980 : 1800;

  return (
    <div className="flex flex-col items-center justify-center relative py-4 sm:py-6 select-none">
      {/* Ambient background glow */}
      <div className="absolute w-44 h-44 rounded-full bg-[var(--primary)]/10 blur-3xl pointer-events-none" />

      {/* 3D Perspective Container */}
      <div className="w-36 h-36 relative [perspective:1000px] flex items-center justify-center">
        <motion.div
          className="w-32 h-32 relative [transform-style:preserve-3d] rounded-full cursor-default"
          animate={
            animating
              ? {
                  rotateY: [0, 720, 1440, targetRotationY],
                  scale: [1, 1.2, 1.05, 1],
                  y: [0, -50, -30, 0],
                }
              : {
                  rotateY: displayFace === 'TAILS' ? 180 : 0,
                  y: [0, -4, 0],
                  scale: 1,
                }
          }
          transition={
            animating
              ? {
                  duration: 2.8,
                  times: [0, 0.4, 0.75, 1],
                  ease: [0.25, 0.1, 0.25, 1],
                }
              : {
                  y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  rotateY: { duration: 0.35 },
                }
          }
        >
          {/* HEADS FACE (Crown) */}
          <div
            className="absolute inset-0 rounded-full [backface-visibility:hidden] flex flex-col items-center justify-center shadow-[0_10px_35px_rgba(184,155,94,0.4)] border-4 border-[#F3E5AB] bg-gradient-to-br from-[#E6CA65] via-[#B89B5E] to-[#7B612C] p-2 select-none"
            style={{ transform: 'rotateY(0deg)' }}
          >
            {/* Inner ring */}
            <div className="w-full h-full rounded-full border-2 border-dashed border-[#F3E5AB]/70 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-black/25 relative">
              <span className="text-3xl sm:text-4xl text-[#FFF8DC] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                ♔
              </span>
              <span className="text-[11px] font-display font-black tracking-[0.25em] text-[#FFF8DC] uppercase mt-0.5 drop-shadow">
                HEADS
              </span>
              <span className="text-[8px] font-bold tracking-widest text-[#F3E5AB]/90 uppercase">
                ROYAL KING
              </span>
            </div>
          </div>

          {/* TAILS FACE (Tiara) */}
          <div
            className="absolute inset-0 rounded-full [backface-visibility:hidden] flex flex-col items-center justify-center shadow-[0_10px_35px_rgba(184,155,94,0.4)] border-4 border-[#F3E5AB] bg-gradient-to-br from-[#E6CA65] via-[#B89B5E] to-[#7B612C] p-2 select-none"
            style={{ transform: 'rotateY(180deg)' }}
          >
            {/* Inner ring */}
            <div className="w-full h-full rounded-full border-2 border-dashed border-[#F3E5AB]/70 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-black/25 relative">
              <span className="text-3xl sm:text-4xl text-[#FFF8DC] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                ♕
              </span>
              <span className="text-[11px] font-display font-black tracking-[0.25em] text-[#FFF8DC] uppercase mt-0.5 drop-shadow">
                TAILS
              </span>
              <span className="text-[8px] font-bold tracking-widest text-[#F3E5AB]/90 uppercase">
                ROYAL QUEEN
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Result Indicator Badge */}
      <AnimatePresence>
        {!animating && coinResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface-light)] border border-[var(--primary)]/50 shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
            <span className="text-xs font-display font-bold tracking-widest text-[var(--primary)] uppercase">
              TOSS RESULT: {coinResult}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
