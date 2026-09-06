import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Check, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button, Avatar } from '../components/UI';
import { PlayerIdentity } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { getDefaultAvatar, validateDisplayName } from '../services/profileService';

interface ProfileSetupScreenProps {
  onComplete: () => void;
  isEditMode?: boolean;
  onCancel?: () => void;
}

export const ProfileSetupScreen = ({
  onComplete,
  isEditMode = false,
  onCancel,
}: ProfileSetupScreenProps) => {
  const { user: authUser } = useAuth();
  const { profile, createProfile, updateProfile } = useProfile();

  const [displayName, setDisplayName] = useState(
    profile?.displayName || authUser?.displayName || ''
  );
  const [identity, setIdentity] = useState<PlayerIdentity>(
    profile?.identity || 'KING'
  );
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedName = displayName.trim();
  const nameValidation = validateDisplayName(trimmedName);
  const isValid = nameValidation.isValid && Boolean(identity);

  // Determine avatar preview
  const currentPhotoURL = profile?.photoURL || authUser?.photoURL;
  const avatarPreview = currentPhotoURL || getDefaultAvatar(identity);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditMode) {
        await updateProfile({
          displayName: trimmedName,
          identity,
          bio: bio.trim(),
        });
      } else {
        await createProfile({
          displayName: trimmedName,
          identity,
          bio: bio.trim(),
          photoURL: currentPhotoURL,
        });
      }

      onComplete();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-[var(--background)] text-[var(--text)] relative overflow-x-hidden">
      {/* Background ambient lighting and dust particles */}
      <div className="dust-particles pointer-events-none" />
      <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full blur-[100px] bg-[var(--primary)]/10 pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full blur-[100px] bg-[var(--accent)]/10 pointer-events-none" />

      {/* Header / Nav */}
      <div className="flex items-center justify-between mb-8 z-10">
        {isEditMode && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[var(--primary)]">
          <Crown className="w-4 h-4" />
          <span>Royal Sovereign Identity</span>
        </div>

        <div className="w-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center gap-2 mb-8 z-10"
      >
        <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wide">
          {isEditMode ? 'Edit Profile' : 'WELCOME TO KING & QUEEN'}
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
          {isEditMode
            ? 'Update your display name and sovereign player identity.'
            : 'Before you enter the board, choose your identity.'}
        </p>
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="w-full max-w-md mx-auto mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs shadow-lg overflow-hidden z-10"
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

      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-8 z-10">
        {/* Avatar Presentation */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar
              size="xl"
              src={avatarPreview}
              className="border-4 border-[var(--primary)] shadow-[0_0_25px_rgba(184,155,94,0.2)]"
            />
            <div className="absolute -bottom-2 -right-1 w-9 h-9 rounded-full bg-[var(--surface)] border-2 border-[var(--primary)] flex items-center justify-center text-[var(--primary)] text-base shadow-lg">
              {identity === 'KING' ? '♔' : '♕'}
            </div>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {currentPhotoURL ? 'Connected account photo' : `Default ${identity.toLowerCase()} avatar`}
          </span>
        </div>

        {/* Identity Selector */}
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">
            Choose Player Identity
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* KING Card */}
            <button
              type="button"
              onClick={() => setIdentity('KING')}
              disabled={isSubmitting}
              className={`
                relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all cursor-pointer text-left
                ${
                  identity === 'KING'
                    ? 'border-[var(--primary)] bg-[var(--surface)] shadow-[0_0_20px_rgba(184,155,94,0.18)] scale-[1.02]'
                    : 'border-[var(--border)] bg-[var(--surface)]/70 hover:border-[var(--primary)]/40 hover:bg-[var(--surface)] opacity-85'
                }
              `}
            >
              {identity === 'KING' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--background)] flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <span className="text-4xl mb-3 filter drop-shadow">♔</span>
              <span className="font-display text-base tracking-widest uppercase text-[var(--text)] mb-1">
                KING
              </span>
              <span className="text-xs text-[var(--text-muted)] leading-snug">
                Rule with strategy.
              </span>
            </button>

            {/* QUEEN Card */}
            <button
              type="button"
              onClick={() => setIdentity('QUEEN')}
              disabled={isSubmitting}
              className={`
                relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all cursor-pointer text-left
                ${
                  identity === 'QUEEN'
                    ? 'border-[var(--primary)] bg-[var(--surface)] shadow-[0_0_20px_rgba(184,155,94,0.18)] scale-[1.02]'
                    : 'border-[var(--border)] bg-[var(--surface)]/70 hover:border-[var(--primary)]/40 hover:bg-[var(--surface)] opacity-85'
                }
              `}
            >
              {identity === 'QUEEN' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--background)] flex items-center justify-center text-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <span className="text-4xl mb-3 filter drop-shadow">♕</span>
              <span className="font-display text-base tracking-widest uppercase text-[var(--text)] mb-1">
                QUEEN
              </span>
              <span className="text-xs text-[var(--text-muted)] leading-snug">
                Play with power.
              </span>
            </button>
          </div>
          <p className="text-[11px] text-center text-[var(--text-muted)]/70 italic mt-1">
            Identities represent player styles on the board and are open to any sovereign.
          </p>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Display Name <span className="text-[var(--primary)]">*</span>
              </label>
              <span
                className={`text-[10px] ${
                  trimmedName.length > 30 ? 'text-red-400' : 'text-[var(--text-muted)]'
                }`}
              >
                {trimmedName.length}/30
              </span>
            </div>
            <input
              type="text"
              required
              minLength={2}
              maxLength={30}
              placeholder="e.g. Sovereign Alex"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isSubmitting}
              className={`w-full bg-[var(--surface)] border rounded-xl px-4 py-3.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none transition-colors ${
                !nameValidation.isValid && trimmedName.length > 0
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-[var(--border)] focus:border-[var(--primary)]'
              }`}
            />
            {!nameValidation.isValid && trimmedName.length > 0 && (
              <span className="text-[11px] text-red-400 ml-1">{nameValidation.error}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Royal Bio <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-[var(--text-muted)]">{bio.length}/80</span>
            </div>
            <textarea
              placeholder="Share a royal quote or battle strategy..."
              maxLength={80}
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:border-[var(--primary)] focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-3 mt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || isSubmitting}
            className="w-full h-15 font-display tracking-widest uppercase text-sm font-semibold shadow-[0_0_20px_rgba(184,155,94,0.25)]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isEditMode ? 'Saving changes...' : 'Creating your profile...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{isEditMode ? 'SAVE CHANGES' : 'ENTER THE KINGDOM'}</span>
              </div>
            )}
          </Button>

          {isEditMode && onCancel && (
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onCancel}
              className="w-full py-3 text-xs uppercase tracking-wider text-[var(--text-muted)]"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
