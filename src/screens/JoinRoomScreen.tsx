import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/UI';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { useRoom } from '../hooks/useRoom';
import { normalizeRoomCode } from '../services/roomService';

interface JoinRoomScreenProps {
  user: UserProfile;
  onBack: () => void;
  onJoin: (code: string) => void;
}

export const JoinRoomScreen = ({ user, onBack, onJoin }: JoinRoomScreenProps) => {
  const { joinRoom, roomLoading, roomError, clearError } = useRoom();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleJoin = async () => {
    if (status === 'validating' || roomLoading) return;

    const normalized = normalizeRoomCode(code);
    if (!normalized || normalized.length < 5) {
      setStatus('error');
      setErrorMessage('Enter a valid room code.');
      setTimeout(() => setStatus('idle'), 2500);
      return;
    }

    setStatus('validating');
    setErrorMessage(null);
    clearError();

    try {
      await joinRoom(normalized);
      setStatus('success');
      setTimeout(() => {
        onJoin(normalized);
      }, 700);
    } catch (err: any) {
      console.error('[JoinRoom Error]', {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      setStatus('error');
      setErrorMessage(err.message || 'Unable to join the room. Please try again.');
      setTimeout(() => setStatus('idle'), 3500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCode(val);
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  // Extract display suffix (characters after 'KQ-' or raw)
  const displaySuffix = code.startsWith('KQ-')
    ? code.slice(3)
    : code.startsWith('KQ')
    ? code.slice(2)
    : code;

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display">Join Your Partner</h1>
        <p className="text-[var(--text-muted)]">Enter the private 4 to 6-character room code.</p>
      </div>

      <div className="flex flex-col gap-6 flex-1 justify-center -mt-6">
        <div className="flex flex-col items-center gap-5">
          {/* Alphanumeric Input Field with KQ- prefix */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2">
            <label className="text-[10px] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase">
              ENTER ROOM CODE
            </label>
            <div className="w-full relative flex items-center">
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="KQ-AB7X"
                maxLength={9}
                autoFocus
                className={`
                  w-full h-16 rounded-2xl bg-[var(--surface)] border-2 px-6 text-2xl font-display tracking-[0.25em] uppercase text-center transition-all outline-none text-[var(--primary)]
                  ${
                    status === 'error'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : status === 'success'
                      ? 'border-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                      : 'border-[var(--border)] focus:border-[var(--primary)] shadow-md'
                  }
                `}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] tracking-wider">
              Format: KQ-XXXX (e.g. KQ-AB7X, KQ-9MQR)
            </p>
          </div>

          {/* Real-time Status / Error Messages */}
          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[var(--accent)] text-xs flex items-center gap-1.5 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-center max-w-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage || roomError || 'Unable to join the room.'}</span>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-xs flex items-center gap-1.5 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center max-w-sm"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Room verified! Entering the royal lobby...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Numpad / Character Helper */}
          <div className="w-full max-w-xs flex flex-wrap gap-2 justify-center">
            {['7X9P', '9MQR', 'AB7X', 'X7KP'].map((example) => (
              <button
                key={example}
                onClick={() => setCode(`KQ-${example}`)}
                className="px-2.5 py-1 rounded-lg bg-[var(--surface-light)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors"
              >
                KQ-{example}
              </button>
            ))}
          </div>

          {/* Pairing Rule Reminder Notice */}
          <div className="px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] max-w-xs text-center">
            <p className="text-[11px] text-[var(--text-muted)] tracking-wider">
              Maximum 2 players per room. You will be matched as the royal counterpart.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 pb-4">
        <Button
          disabled={code.trim().length === 0 || status === 'validating' || roomLoading}
          onClick={handleJoin}
          className="w-full h-14 font-semibold tracking-wider flex items-center justify-center gap-2"
        >
          {status === 'validating' || roomLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span>VERIFYING ROOM...</span>
            </>
          ) : (
            <>
              <span>ENTER ROOM</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        <button
          onClick={onBack}
          disabled={status === 'validating' || roomLoading}
          className="text-[var(--text-muted)] text-sm font-medium py-1 text-center hover:text-[var(--text)] transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};
