import { Home, History, User } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavigationProps {
  activeTab: 'home' | 'history' | 'profile';
  onTabChange: (tab: 'home' | 'history' | 'profile') => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--border)] px-6 py-4 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const IsActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center gap-1 min-w-[64px]"
          >
            <tab.icon 
              className={`w-6 h-6 transition-colors ${IsActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} 
            />
            <span className={`text-xs font-medium transition-colors ${IsActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
              {tab.label}
            </span>
            {IsActive && (
              <motion.div
                layoutId="nav-glow"
                className="absolute -top-1 w-8 h-8 bg-[var(--primary)] opacity-10 blur-xl rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
