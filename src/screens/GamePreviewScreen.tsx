import { motion } from 'motion/react';
import { Button, Avatar } from '../components/UI';
import { GameRoom, UserProfile, getOppositeIdentity, ChessSide } from '../types';

interface GamePreviewScreenProps {
  user: UserProfile;
  room?: GameRoom | null;
  onExit: () => void;
  onEnterGame?: () => void;
}

export const GamePreviewScreen = ({ user, room, onExit, onEnterGame }: GamePreviewScreenProps) => {
  // Respect room assignment or compute opposite identity
  const opponentRole = room ? room.opponentRole : getOppositeIdentity(user.identity);
  const userRole = room ? room.creatorRole : user.identity;

  const opponent: UserProfile = room?.opponent || {
    username: '@alex',
    displayName: 'Alex',
    bio: 'Looking for a good match.',
    avatar: '',
    identity: opponentRole,
  };

  // Profile Identity (King/Queen) is completely separate from Chess Side (White/Black)
  // For the match preview, White and Black chess pieces can be assigned fairly:
  const userChessSide: ChessSide = room?.creatorChessSide || 'WHITE';
  const opponentChessSide: ChessSide = room?.opponentChessSide || 'BLACK';

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] overflow-hidden">
      {/* Game Header with Royal Identity & Chess Side indicators */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
        {/* Opponent side */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar size="sm" className="border border-[var(--border)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[9px] text-[var(--text-muted)]">
              {opponentRole === 'KING' ? '♔' : '♕'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase">Opponent</span>
              <span className="text-[9px] font-bold text-[var(--primary)] px-1.5 rounded bg-[var(--surface-light)] border border-[var(--border)]">
                {opponentRole}
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--text)]">{opponent.displayName}</p>
            <span className="text-[9px] text-[var(--text-muted)] font-medium">Pieces: {opponentChessSide}</span>
          </div>
        </div>

        {/* VS Centerpiece */}
        <div className="flex flex-col items-center">
          <span className="text-xl font-display italic text-[var(--primary)] opacity-40">VS</span>
          <span className="text-[8px] font-bold tracking-widest text-[var(--text-muted)] uppercase">ROYAL MATCH</span>
        </div>

        {/* User side */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[9px] font-bold text-[var(--primary)] px-1.5 rounded bg-[var(--surface-light)] border border-[var(--border)]">
                {userRole}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase">You</span>
            </div>
            <p className="text-sm font-medium text-[var(--text)]">{user.displayName}</p>
            <span className="text-[9px] text-[var(--text-muted)] font-medium">Pieces: {userChessSide}</span>
          </div>
          <div className="relative">
            <Avatar size="sm" className="border border-[var(--primary)]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--primary)] flex items-center justify-center text-[9px] text-[var(--primary)]">
              {userRole === 'KING' ? '♔' : '♕'}
            </div>
          </div>
        </div>
      </div>

      {/* Chess Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-[var(--surface)]/50">
        <div className="w-full aspect-square max-w-md relative">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 border-2 rounded-sm overflow-hidden shadow-2xl shadow-black/50 transition-colors" style={{ borderColor: 'var(--board-border, var(--border))' }}>
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isDark = (row + col) % 2 === 1;
              return (
                <div 
                  key={i} 
                  className="w-full h-full transition-colors duration-500" 
                  style={{
                    backgroundColor: isDark 
                      ? 'var(--board-dark, var(--surface-light))' 
                      : 'var(--board-light, var(--surface))'
                  }}
                />
              );
            })}
          </div>
          
          {/* Central Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-[2px]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative flex items-center gap-4">
                <div className="text-5xl text-[var(--primary)] opacity-80">
                  {userRole === 'KING' ? '♔' : '♕'}
                </div>
                <span className="text-2xl font-display text-[var(--text-muted)] italic opacity-50">&</span>
                <div className="text-5xl text-[var(--primary)] opacity-60">
                  {opponentRole === 'KING' ? '♔' : '♕'}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-display tracking-[0.2em] uppercase text-[var(--text)]">
                  Chess Engine
                </h2>
                <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase font-bold opacity-75">
                  {userRole} vs {opponentRole}
                </p>
              </div>

              <div className="w-12 h-[1px] bg-[var(--primary)] opacity-30" />
              <p className="text-xs text-[var(--text-muted)] max-w-[220px] leading-relaxed italic opacity-80">
                "Two players. One King and One Queen. The board is set for your private match."
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="px-8 py-6 flex flex-col gap-3 bg-[var(--surface)] border-t border-[var(--border)]">
        {onEnterGame && (
          <Button onClick={onEnterGame} className="w-full h-14 font-semibold tracking-wider">
            ENTER GAME SCREEN
          </Button>
        )}
        <Button onClick={onExit} variant="secondary" className="w-full h-12">
          EXIT MATCH
        </Button>
      </div>
    </div>
  );
};
