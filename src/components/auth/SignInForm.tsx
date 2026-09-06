import { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../UI';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../../services/authService';

interface SignInFormProps {
  onSuccess: () => void;
  onError: (msg: string | null) => void;
  onForgotPassword: (email: string) => void;
  isExternalLoading?: boolean;
}

export const SignInForm = ({
  onSuccess,
  onError,
  onForgotPassword,
  isExternalLoading = false,
}: SignInFormProps) => {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = isSubmitting || isExternalLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      onError('Please enter your email address.');
      return;
    }
    if (!password) {
      onError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    onError(null);

    try {
      await signInWithEmail(trimmedEmail, password);
      onSuccess();
    } catch (err) {
      onError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Email Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider ml-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="sovereign@kingdom.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onError(null);
            }}
            disabled={isLoading}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Password
          </label>
          <button
            type="button"
            onClick={() => onForgotPassword(email)}
            className="text-xs text-[var(--primary)] hover:text-[var(--primary-light)] font-medium transition-colors"
            disabled={isLoading}
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onError(null);
            }}
            disabled={isLoading}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-11 pr-11 py-3.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
        className="w-full h-14 mt-2 font-display tracking-wider uppercase text-sm"
      >
        {isLoading ? (
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </div>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
};
