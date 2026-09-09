import React from 'react';
import { ChessSide } from '../../types';

interface PlayerColorBadgeProps {
  side: ChessSide;
  isSelf?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showRoleText?: boolean;
}

export const PlayerColorBadge: React.FC<PlayerColorBadgeProps> = ({
  side,
  isSelf = false,
  size = 'md',
  className = '',
  showRoleText = true,
}) => {
  const isWhite = side === 'WHITE';
  const icon = isWhite ? '♙' : '♟';

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2 font-bold',
  }[size];

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div
      aria-label={`${isSelf ? 'You play' : 'Opponent plays'} ${side}`}
      className={`
        inline-flex items-center rounded-full font-bold tracking-wider uppercase transition-all select-none shadow-sm
        ${
          isWhite
            ? 'bg-[#F5F5F0] text-[#1A1A1D] border border-[#B89B5E]/60 shadow-[0_2px_8px_rgba(255,255,255,0.12)]'
            : 'bg-[#18181B] text-[#F5F5F0] border border-[#B89B5E]/60 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
        }
        ${sizeClasses}
        ${className}
      `}
    >
      <span className={`${iconSizes} leading-none drop-shadow-sm`} aria-hidden="true">
        {icon}
      </span>
      <span className="tracking-widest font-extrabold">{side}</span>
      {showRoleText && (
        <span
          className={`text-[8px] font-semibold tracking-wider uppercase border-l pl-1.5 opacity-80 ${
            isWhite ? 'border-[#1A1A1D]/30 text-[#2C2C30]' : 'border-[#F5F5F0]/30 text-[#D6C29A]'
          }`}
        >
          {isSelf ? 'YOU' : 'OPPONENT'}
        </span>
      )}
    </div>
  );
};
