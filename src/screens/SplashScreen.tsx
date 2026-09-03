import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
  isActive: boolean;
}

export const SplashScreen = ({ onComplete, isActive }: SplashScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && show && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-[100] overflow-hidden"
        >
          <div className="dust-particles" />
          
          {/* Ambient Glow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1.2 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-[400px] h-[400px] rounded-full blur-[100px] bg-gradient-to-tr from-[#A65D67] to-[#B89B5E]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center gap-8"
          >
            <div className="w-32 h-32 relative">
              <img 
                src="/3-snapchat.image.735cef7f-ae52-43c1-b8d0-e15321e19139.Woblo.png" 
                alt="KING & QUEEN Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if logo not found
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400/0E0E10/B89B5E?text=K+%26+Q";
                }}
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-4xl font-display tracking-[0.2em] text-[#F2F0EB]">
                KING & QUEEN
              </h1>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex flex-col items-center"
              >
                <p className="text-[#9B9892] tracking-[0.15em] text-sm font-light">
                  Rule the Board.
                </p>
                <p className="text-[#9B9892] tracking-[0.15em] text-sm font-light">
                  Win the Heart.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
