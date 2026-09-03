import { useState } from 'react';
import { motion } from 'motion/react';
import { Button, Card, Avatar } from '../components/UI';
import { UserProfile } from '../types';

interface ProfileSetupScreenProps {
  onComplete: (profile: UserProfile) => void;
}

export const ProfileSetupScreen = ({ onComplete }: ProfileSetupScreenProps) => {
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    identity: 'KING',
  });

  const isValid = profile.username && profile.displayName;

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 bg-[var(--background)]">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-3xl font-display">Create Your Identity</h1>
        <p className="text-[var(--text-muted)]">This is how your opponent will see you.</p>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <Avatar size="xl" className="border-4 border-[var(--primary)]" />
          <button className="text-[var(--primary)] text-sm font-medium">Change Avatar</button>
        </div>

        {/* Form Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text"
              placeholder="@username"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 focus:border-[var(--primary)] outline-none transition-all"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Display Name</label>
            <input 
              type="text"
              placeholder="Your Name"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 focus:border-[var(--primary)] outline-none transition-all"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest ml-1">Short Bio</label>
            <textarea 
              placeholder="Tell something about yourself..."
              maxLength={80}
              rows={2}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 focus:border-[var(--primary)] outline-none transition-all resize-none"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            <span className="text-[10px] text-right text-[var(--text-muted)]">{profile.bio.length}/80</span>
          </div>
        </div>

        {/* Identity Selector */}
        <div className="flex flex-col gap-4 mt-4">
          <p className="text-sm font-medium text-center text-[var(--text-muted)]">Choose the identity you want to play as.</p>
          <div className="grid grid-cols-2 gap-4">
            <Card 
              active={profile.identity === 'KING'}
              onClick={() => setProfile({ ...profile, identity: 'KING' })}
              className="flex flex-col items-center gap-3 py-8"
            >
              <span className="text-4xl">♔</span>
              <span className="font-display tracking-widest text-sm">KING</span>
            </Card>
            <Card 
              active={profile.identity === 'QUEEN'}
              onClick={() => setProfile({ ...profile, identity: 'QUEEN' })}
              className="flex flex-col items-center gap-3 py-8"
            >
              <span className="text-4xl">♕</span>
              <span className="font-display tracking-widest text-sm">QUEEN</span>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-12 pb-8">
        <Button 
          disabled={!isValid} 
          onClick={() => onComplete(profile)}
          className="w-full h-16"
        >
          CONTINUE
        </Button>
      </div>
    </div>
  );
};
