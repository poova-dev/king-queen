import { motion, AnimatePresence } from 'motion/react';
import { ReactNode } from 'react';

interface ScreenTransitionProps {
  children: ReactNode;
  isActive: boolean;
  className?: string;
}

export const ScreenTransition = ({ children, isActive, className = '' }: ScreenTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full h-full min-h-screen ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  type = 'button'
}: ButtonProps) => {
  const baseStyles = "px-6 py-4 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[var(--primary)] text-[var(--background)] hover:bg-[var(--primary-light)] shadow-[0_0_20px_rgba(184,155,94,0.2)]",
    secondary: "bg-[var(--surface-light)] text-[var(--text)] hover:bg-[var(--surface)]",
    outline: "border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
    ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export const Card = ({ children, className = '', onClick, active = false }: CardProps) => {
  return (
    <motion.div
      whileHover={onClick ? { y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        bg-[var(--surface)] border-2 rounded-2xl p-6 transition-all cursor-pointer
        ${active ? 'border-[var(--primary)] shadow-[0_0_15px_rgba(184,155,94,0.15)]' : 'border-[var(--border)]'}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export const Avatar = ({ src, size = 'md', className = '' }: { src?: string, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--surface-light)] flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </div>
  );
};
