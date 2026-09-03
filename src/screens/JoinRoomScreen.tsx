import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/UI';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile, getOppositeIdentity } from '../types';

interface JoinRoomScreenProps {
  user: UserProfile;
  onBack: () => void;
  onJoin: (code: string) => void;
}

export const JoinRoomScreen = ({ user, onBack, onJoin }: JoinRoomScreenProps) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');

  const handleJoin = () => {
    if (code.length < 4) return;
    
    setStatus('validating');
    
    // Simulate validation
    setTimeout(() => {
      // Allow any 4-digit code in demo, or standard codes 8472 / 1234
      if (code.length === 4) {
        setStatus('success');
        setTimeout(() => onJoin(`KQ-${code}`), 1000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display">Join Your Opponent</h1>
        <p className="text-[var(--text-muted)]">Enter the private 4-digit room code.</p>
      </div>

      <div className="flex flex-col gap-8 flex-1 justify-center -mt-10">
        <div className="flex flex-col items-center gap-5">
          {/* Code Input Display */}
          <div className="flex items-center gap-3 text-3xl font-display tracking-[0.2em]">
            <span className="text-[var(--text-muted)] opacity-50 text-2xl">KQ</span>
            <span className="text-[var(--border)]">-</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`
                    w-12 h-14 rounded-xl border-2 flex items-center justify-center transition-all text-xl font-display
                    ${status === 'error' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 
                      status === 'success' ? 'border-green-500 bg-green-500/5' :
                      code.length > i ? 'border-[var(--primary)] bg-[var(--surface-light)] text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-transparent'}
                  `}
                >
                  {code[i] || '•'}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {status === 'error' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[var(--accent)] text-xs flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" /> Invalid room code
              </motion.p>
            )}
            {status === 'success' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Room found! Matching identities...
              </motion.p>
            )}
          </AnimatePresence>

          {/* Pairing Rule Reminder Notice */}
          <div className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] max-w-xs text-center">
            <p className="text-[10px] text-[var(--text-muted)] tracking-wider">
              Opposite Identity pairing rule applies. You will be matched as the royal counterpart.
            </p>
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => code.length < 4 && setCode(c => c + n)}
              className="h-14 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-lg font-medium active:bg-[var(--surface-light)] active:scale-95 transition-all text-[var(--text)] hover:border-[var(--primary)]/40"
            >
              {n}
            </button>
          ))}
          <button 
            onClick={() => setCode('')}
            className="h-14 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text)] tracking-wider"
          >
            CLEAR
          </button>
          <button
            onClick={() => code.length < 4 && setCode(c => c + '0')}
            className="h-14 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-lg font-medium active:bg-[var(--surface-light)] active:scale-95 transition-all text-[var(--text)] hover:border-[var(--primary)]/40"
          >
            0
          </button>
          <button
            onClick={() => setCode(c => c.slice(0, -1))}
            aria-label="Backspace"
            className="h-14 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 pb-4">
        <Button 
          disabled={code.length < 4 || status === 'validating'} 
          onClick={handleJoin}
          className="w-full h-14 font-semibold tracking-wider"
        >
          {status === 'validating' ? 'VERIFYING CODE...' : 'ENTER ROOM'}
        </Button>
        <button 
          onClick={onBack} 
          className="text-[var(--text-muted)] text-sm font-medium py-1 text-center hover:text-[var(--text)] transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};
