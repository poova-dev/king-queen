import { motion } from 'motion/react';
import { Button } from '../components/UI';

interface EntryScreenProps {
  onContinue: (method: 'google' | 'guest') => void;
}

export const EntryScreen = ({ onContinue }: EntryScreenProps) => {
  return (
    <div className="flex flex-col h-screen px-8 py-12 bg-[var(--background)] justify-between">
      <div className="flex flex-col items-center gap-12 mt-20">
        <div className="w-24 h-24 relative opacity-80">
          <img 
            src="/3-snapchat.image.735cef7f-ae52-43c1-b8d0-e15321e19139.Woblo.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x400/0E0E10/B89B5E?text=K+%26+Q";
            }}
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="text-center flex flex-col gap-4">
          <h1 className="text-4xl font-display leading-tight">Welcome to the Game.</h1>
          <p className="text-[var(--text-muted)]">Every great match starts with a single move.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <Button 
          variant="primary" 
          className="w-full h-16"
          onClick={() => onContinue('google')}
        >
          <div className="flex items-center gap-3">
             {/* Google Icon Placeholder */}
             <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            CONTINUE WITH GOOGLE
          </div>
        </Button>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
          <span className="text-[var(--text-muted)] text-xs font-medium tracking-widest">OR</span>
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
        </div>

        <Button 
          variant="secondary" 
          className="w-full"
          onClick={() => onContinue('guest')}
        >
          CONTINUE AS GUEST
        </Button>

        <p className="text-[var(--text-muted)] text-[10px] text-center mt-4 leading-relaxed opacity-60">
          By continuing, you agree to the game experience guidelines.
        </p>
      </div>
    </div>
  );
};
