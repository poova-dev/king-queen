import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Swords, Calendar, Clock, Crown } from 'lucide-react';
import { Chess } from 'chess.js';
import { GameHistoryRecord } from '../../types';
import { ChessBoard } from '../chess/ChessBoard';
import { SquareData } from '../chess/ChessSquare';
import { PieceType, PieceColor } from '../chess/ChessPiece';
import { Avatar } from '../UI';

interface GameInspectionModalProps {
  game: GameHistoryRecord | null;
  currentUserId?: string;
  onClose: () => void;
}

export const GameInspectionModal: React.FC<GameInspectionModalProps> = ({
  game,
  currentUserId,
  onClose,
}) => {
  if (!game) return null;

  const boardMatrix = useMemo((): SquareData[][] => {
    try {
      const chess = new Chess(game.finalFen || undefined);
      const rawBoard = chess.board();
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const matrix: SquareData[][] = [];

      for (let r = 0; r < 8; r++) {
        const row: SquareData[] = [];
        const rankNum = 8 - r;

        for (let c = 0; c < 8; c++) {
          const notation = `${files[c]}${rankNum}`;
          const pieceObj = rawBoard[r][c];

          row.push({
            row: r,
            col: c,
            notation,
            piece: pieceObj
              ? {
                  type: pieceObj.type as PieceType,
                  color: pieceObj.color as PieceColor,
                }
              : undefined,
          });
        }
        matrix.push(row);
      }
      return matrix;
    } catch {
      return [];
    }
  }, [game.finalFen]);

  const isWin = currentUserId && game.winnerUid === currentUserId;
  const isLoss = currentUserId && game.winnerUid && game.winnerUid !== currentUserId;
  const isDraw = !game.winnerUid;

  const isUserWhite = currentUserId === game.whitePlayer.uid;
  const isFlipped = currentUserId ? !isUserWhite : false;

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Royal Match';
    const date = timestamp?.toDate
      ? timestamp.toDate()
      : typeof timestamp === 'number'
      ? new Date(timestamp)
      : new Date();
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/30 p-5 sm:p-6 flex flex-col gap-4 shadow-[0_0_50px_rgba(0,0,0,0.85)] my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                  isWin
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isLoss
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                }`}
              >
                {isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'} • {game.result}
              </span>
            </div>

            <h2 className="text-xl font-display tracking-wider text-[var(--text)]">
              {game.whitePlayer.displayName} vs {game.blackPlayer.displayName}
            </h2>

            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                {formatDate(game.completedAt || game.createdAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 opacity-70" />
                {game.totalMoves} Moves
              </span>
            </div>
          </div>

          {/* Player Comparison Card */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)]">
            {/* White Player */}
            <div className="flex flex-col items-center gap-1 text-center p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]/60">
              <div className="relative">
                <Avatar size="sm" src={game.whitePlayer.photoURL || undefined} />
                {game.winnerUid === game.whitePlayer.uid && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] shadow-sm">
                    👑
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-[var(--text)] truncate max-w-full">
                {game.whitePlayer.displayName}
              </span>
              <span className="text-[10px] font-mono text-[var(--primary)] tracking-wider">
                WHITE • {game.whitePlayer.identity}
              </span>
            </div>

            {/* Black Player */}
            <div className="flex flex-col items-center gap-1 text-center p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]/60">
              <div className="relative">
                <Avatar size="sm" src={game.blackPlayer.photoURL || undefined} />
                {game.winnerUid === game.blackPlayer.uid && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] shadow-sm">
                    👑
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-[var(--text)] truncate max-w-full">
                {game.blackPlayer.displayName}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
                BLACK • {game.blackPlayer.identity}
              </span>
            </div>
          </div>

          {/* Read-Only Chess Board */}
          <div className="w-full flex items-center justify-center my-1 pointer-events-none">
            {boardMatrix.length > 0 && (
              <ChessBoard
                board={boardMatrix}
                selectedSquare={null}
                legalMoves={[]}
                lastMove={null}
                isFlipped={isFlipped}
                disabled={true}
                onSquareClick={() => {}}
              />
            )}
          </div>

          {/* Close Action */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--background)] font-bold text-xs tracking-wider uppercase shadow-md hover:opacity-90 transition-opacity mt-1"
          >
            RETURN TO HISTORY
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
