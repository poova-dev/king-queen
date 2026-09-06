import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/UI';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { useAuth } from '../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../services/authService';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const { signInWithGoogle } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      await signInWithGoogle();
      onAuthSuccess?.();
    } catch (err) {
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSuccess = () => {
    setErrorMessage(null);
    onAuthSuccess?.();
  };

  const handleOpenForgotPassword = (email: string) => {
    setForgotPasswordEmail(email);
    setIsForgotPasswordOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col items-center justify-between px-6 py-10 relative overflow-hidden">
      {/* Background ambient lighting and dust particles */}
      <div className="dust-particles pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] bg-[var(--primary)]/10 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] bg-[var(--accent)]/10 pointer-events-none" />

      {/* Header & Royal Branding */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col items-center text-center gap-4 mt-2"
      >
        <div className="w-24 h-24 relative">
          <img
            src="/logo.png"
            alt="KING & QUEEN"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_25px_rgba(184,155,94,0.35)]"
          />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-3xl sm:text-4xl font-display tracking-[0.15em] text-[var(--text)] uppercase">
            KING & QUEEN
          </h1>
          <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[var(--primary)] uppercase font-light">
            <span>Rule the Board</span>
            <span className="text-[var(--border)]">•</span>
            <span>Win the Heart</span>
          </div>
        </div>
      </motion.div>

      {/* Card / Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col gap-6 my-6 z-10"
      >
        {/* Error notification banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs shadow-lg overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-400/70 hover:text-red-400 font-bold ml-1 text-sm"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue with Google */}
        <Button
          variant="primary"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full h-14 relative group font-sans tracking-wide text-sm font-semibold"
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting to Google...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </div>
          )}
        </Button>

        {/* Divider: ──────── OR ──────── */}
        <div className="flex items-center gap-4 my-1">
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
          <span className="text-[var(--text-muted)] text-[11px] font-semibold tracking-widest uppercase">
            OR
          </span>
          <div className="flex-1 h-[1px] bg-[var(--border)]" />
        </div>

        {/* Email Auth Box with Tabs */}
        <div className="bg-[var(--surface)]/80 border border-[var(--border)] rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                authMode === 'signin'
                  ? 'bg-[var(--surface-light)] text-[var(--primary)] border border-[var(--border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                authMode === 'signup'
                  ? 'bg-[var(--surface-light)] text-[var(--primary)] border border-[var(--border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Switcher */}
          <AnimatePresence mode="wait">
            {authMode === 'signin' ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <SignInForm
                  onSuccess={handleSuccess}
                  onError={setErrorMessage}
                  onForgotPassword={handleOpenForgotPassword}
                  isExternalLoading={isGoogleLoading}
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SignUpForm
                  onSuccess={handleSuccess}
                  onError={setErrorMessage}
                  isExternalLoading={isGoogleLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-[var(--text-muted)] text-[11px] text-center max-w-xs leading-relaxed"
      >
        By entering, you commit to chivalry, fair play, and royal honor on the board.
      </motion.p>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialEmail={forgotPasswordEmail}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
