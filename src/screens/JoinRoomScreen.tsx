import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/UI';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface JoinRoomScreenProps {
  onBack: () => void;
  onJoin: (code: string) => void;
}

export const JoinRoomScreen = ({ onBack, onJoin }: JoinRoomScreenProps) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');

  const handleJoin = () => {
    if (code.length < 4) return;
    
    setStatus('validating');
    
    // Simulate validation
    setTimeout(() => {
      if (code.toUpperCase() === '8472' || code === '1234') {
        setStatus('success');
        setTimeout(() => onJoin(`KQ-${code}`), 1000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-3xl font-display">Join Your Opponent</h1>
        <p className="text-[var(--text-muted)]">Enter the private room code.</p>
      </div>

      <div className="flex flex-col gap-12 flex-1 justify-center -mt-20">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 text-4xl font-display tracking-[0.2em]">
            <span className="text-[var(--text-muted)] opacity-50">KQ</span>
            <span className="text-[var(--border)]">-</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`
                    w-12 h-16 rounded-xl border-2 flex items-center justify-center transition-all
                    ${status === 'error' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 
                      status === 'success' ? 'border-green-500 bg-green-500/5' :
                      code.length > i ? 'border-[var(--primary)] bg-[var(--surface-light)]' : 'border-[var(--border)] bg-[var(--surface)]'}
                  `}
                >
                  {code[i] || ''}
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
                className="text-[var(--accent)] text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> Invalid room code
              </motion.p>
            )}
            {status === 'success' && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-500 text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Room found! Joining...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => code.length < 4 && setCode(c => c + n)}
              className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl font-medium active:bg-[var(--surface-light)] active:scale-95 transition-all"
            >
              {n}
            </button>
          ))}
          <button 
            onClick={() => setCode('')}
            className="w-16 h-16 flex items-center justify-center text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            CLEAR
          </button>
          <button
            onClick={() => code.length < 4 && setCode(c => c + '0')}
            className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl font-medium active:bg-[var(--surface-light)] active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={() => setCode(c => c.slice(0, -1))}
            className="w-16 h-16 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)]"
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-8 pb-8">
        <Button 
          disabled={code.length < 4 || status === 'validating'} 
          onClick={handleJoin}
          className="w-full h-16"
        >
          {status === 'validating' ? 'VALIDATING...' : 'JOIN GAME'}
        </Button>
        <button onClick={onBack} className="text-[var(--text-muted)] text-sm font-medium py-2">CANCEL</button>
      </div>
    </div>
  );
};
