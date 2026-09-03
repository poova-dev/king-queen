import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/UI';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Your Board. Your Rules.",
    description: "Challenge someone special and make every move count.",
    visual: "♔",
  },
  {
    title: "More Than Just Chess.",
    description: "Compete, win, and unlock a different kind of challenge.",
    visual: "♕",
  },
  {
    title: "One Game. Two Players.",
    description: "Create a private room and invite someone to play.",
    visual: "♡",
  },
];

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(s => s + 1);
    }
  };

  return (
    <div className="flex flex-col h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex justify-end">
        <button 
          onClick={onComplete}
          className="text-[var(--text-muted)] text-sm font-medium hover:text-[var(--text)] transition-colors"
        >
          SKIP
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center gap-8"
          >
            <div className="w-48 h-48 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-6xl shadow-2xl">
              <span className="text-[var(--primary)] opacity-80">{slides[currentSlide].visual}</span>
            </div>
            
            <div className="flex flex-col gap-4 max-w-xs">
              <h2 className="text-3xl font-display tracking-tight leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-[var(--primary)]' : 'w-2 bg-[var(--border)]'}`} 
            />
          ))}
        </div>

        <Button onClick={nextSlide} className="w-full">
          {currentSlide === slides.length - 1 ? 'GET STARTED' : 'NEXT'}
        </Button>
      </div>
    </div>
  );
};
