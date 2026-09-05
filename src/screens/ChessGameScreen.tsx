import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, RotateCcw } from 'lucide-react';
import { GameRoom, UserProfile, getOppositeIdentity, ChessSide } from '../types';
import { GameHeader } from '../components/chess/GameHeader';
import { PlayerCard } from '../components/chess/PlayerCard';
import { ChessBoard } from '../components/chess/ChessBoard';
import { CapturedPieces } from '../components/chess/CapturedPieces';
import { GameActions } from '../components/chess/GameActions';
import { MoveHistoryDrawer } from '../components/chess/MoveHistoryDrawer';
import { GameOptionsModal } from '../components/chess/GameOptionsModal';
import { ReactionPicker, FloatingReaction, FloatingReactionsContainer } from '../components/chess/ReactionPicker';
import { GameStatusBanner } from '../components/chess/GameStatusBanner';
import { PromotionModal } from '../components/chess/PromotionModal';
import { GameOverModal } from '../components/chess/GameOverModal';
import { useChessGame } from '../hooks/useChessGame';
import { useRematch } from '../hooks/useRematch';

interface ChessGameScreenProps {
  user: UserProfile;
  room?: GameRoom | null;
  onExit: () => void;
}

export const ChessGameScreen: React.FC<ChessGameScreenProps> = ({
  user,
  room,
  onExit,
}) => {
  // Player identities (King vs Queen - NEVER changes on rematch)
  const userRole = room ? room.creatorRole : user.identity;
  const opponentRole = room ? room.opponentRole : getOppositeIdentity(user.identity);

  const opponent: UserProfile = room?.opponent || {
    username: '@alex',
    displayName: 'Alex',
    bio: 'Looking for a royal game.',
    avatar: '',
    identity: opponentRole,
  };

  // Chess piece sides (separate from royal character)
  // OPTION A: Swap colors on rematch (Game 1: White ↔ Game 2: Black)
  const [currentUserSide, setCurrentUserSide] = useState<ChessSide>(
    () => room?.creatorChessSide || 'WHITE'
  );
  const [currentOpponentSide, setCurrentOpponentSide] = useState<ChessSide>(
    () => room?.opponentChessSide || 'BLACK'
  );

  const playerColor: 'w' | 'b' = currentUserSide === 'WHITE' ? 'w' : 'b';

  // Centralized Chess Game Engine state
  const {
    board,
    turn,
    gameStatus,
    winner,
    isGameOver,
    isCheck,
    isCheckmate,
    isDraw,
    isStalemate,
    checkSquare,
    selectedSquare,
    legalMoves,
    lastMove,
    moveHistory,
    capturedByWhite,
    capturedByBlack,
    pendingPromotion,
    handleSquareClick,
    completePromotion,
    cancelPromotion,
    resetGame,
  } = useChessGame(playerColor);

  // Modals & UI overlays
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState(false);
  const [resignedBy, setResignedBy] = useState<'YOU' | 'OPPONENT' | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // REMATCH SYSTEM & 2-PLAYER CONFIRMATION
  const handleRematchSuccess = useCallback(() => {
    // 1. Swap Chess Sides on Rematch (KING/QUEEN profile identities remain unchanged)
    setCurrentUserSide((prev) => (prev === 'WHITE' ? 'BLACK' : 'WHITE'));
    setCurrentOpponentSide((prev) => (prev === 'WHITE' ? 'BLACK' : 'WHITE'));

    // 2. Complete State Reset across all game parameters
    setResignedBy(null);
    setIsGameOverDismissed(false);
    resetGame();
  }, [resetGame]);

  const {
    rematchState,
    isResetting,
    confirmRematch,
    declineRematch,
    resetRematchState,
  } = useRematch({
    onRematchSuccess: handleRematchSuccess,
    transitionDurationMs: 850,
  });

  // Send Floating Reactions
  const handleSendReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: Date.now(),
      emoji,
      x: 35 + Math.random() * 30,
    };
    setFloatingReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2400);
  };

  // Turn evaluation
  const isUserTurn = turn === playerColor && !isGameOver && !resignedBy;
  const isOpponentTurn = turn !== playerColor && !isGameOver && !resignedBy;

  // Handlers for match actions
  const handleOfferDraw = () => {
    // In local 2-player mode, draw offer accepts and concludes match as Draw
  };

  const handleResign = () => {
    setResignedBy('YOU');
    setIsGameOverDismissed(false);
  };

  // Rematch actions
  const handlePlayAgainUser = () => {
    confirmRematch('playerOne');
  };

  const handlePlayAgainOpponent = () => {
    confirmRematch('playerTwo');
  };

  const handleDeclineOpponent = () => {
    declineRematch('playerTwo');
  };

  const handleExitGame = () => {
    declineRematch('playerOne');
    resetRematchState();
    onExit();
  };

  // Determine game over winner
  const effectiveWinner = resignedBy
    ? resignedBy === 'YOU'
      ? 'OPPONENT'
      : 'YOU'
    : winner;

  const winnerProfile =
    effectiveWinner === 'YOU' ? user : effectiveWinner === 'OPPONENT' ? opponent : null;

  const showGameOverModal =
    (isGameOver || resignedBy !== null) && !isGameOverDismissed;

  const gameOverResultType = resignedBy
    ? 'RESIGNATION'
    : isCheckmate
    ? 'CHECKMATE'
    : isStalemate
    ? 'STALEMATE'
    : 'DRAW';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors duration-400 select-none pb-4">
      {/* Floating Reactions overlay */}
      <FloatingReactionsContainer reactions={floatingReactions} />

      {/* TOP GAME BAR */}
      <GameHeader
        onBack={handleExitGame}
        onOpenMenu={() => setIsOptionsOpen(true)}
        roomCode={room?.code || 'KQ-8472'}
        connectionStatus="connected"
      />

      {/* Main Board Container (Responsive Mobile-first, gracefully centered on Desktop) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-2 flex flex-col justify-between gap-2.5">
        {/* OPPONENT SECTION */}
        <div className="flex flex-col gap-1.5 w-full">
          <PlayerCard
            displayName={opponent.displayName}
            username={opponent.username}
            identity={opponentRole}
            chessSide={currentOpponentSide}
            wins={12}
            avatar={opponent.avatar}
            isTurn={isOpponentTurn}
            position="top"
            timeRemaining="09:42"
          />

          {/* Captured Pieces by Opponent */}
          <div className="flex items-center justify-between px-1 text-xs">
            <CapturedPieces
              pieces={currentUserSide === 'WHITE' ? capturedByBlack : capturedByWhite}
              label="Opponent Took"
              alignment="left"
            />

            {/* Subtle Versus / Relationship connector */}
            <div className="flex items-center gap-1.5 opacity-60 text-[9px] font-bold tracking-widest text-[var(--text-muted)]">
              <span>12 WINS</span>
              <Heart className="w-2.5 h-2.5 text-[var(--primary)] fill-[var(--primary)] opacity-70" />
              <span>18 WINS</span>
            </div>
          </div>
        </div>

        {/* CHECK BANNER */}
        {isCheck && !isGameOver && !resignedBy && (
          <GameStatusBanner status="CHECK" />
        )}

        {/* CURRENT TURN STATUS */}
        <div className="w-full flex items-center justify-center py-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: turn === 'w' ? '#F8F8F6' : '#1A1A1D' }}
            />
            <span className="text-xs font-semibold tracking-wider text-[var(--text)] uppercase">
              {turn === 'w' ? 'White to move' : 'Black to move'}
            </span>
          </div>
        </div>

        {/* CHESS BOARD CENTERPIECE */}
        <div className="w-full flex items-center justify-center my-auto">
          <ChessBoard
            board={board}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            isFlipped={currentUserSide === 'BLACK'}
            disabled={isGameOver || resignedBy !== null}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* PLAYER SECTION */}
        <div className="flex flex-col gap-1.5 w-full">
          {/* Captured Pieces by You */}
          <div className="flex items-center justify-between px-1 text-xs">
            <CapturedPieces
              pieces={currentUserSide === 'WHITE' ? capturedByWhite : capturedByBlack}
              label="You Took"
              alignment="left"
            />
            <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider">
              {room?.timer || 'No Timer'}
            </span>
          </div>

          <PlayerCard
            displayName={user.displayName}
            username={user.username}
            identity={userRole}
            chessSide={currentUserSide}
            wins={18}
            avatar={user.avatar}
            isTurn={isUserTurn}
            position="bottom"
            timeRemaining="08:15"
          />
        </div>

        {/* BOTTOM GAME ACTIONS */}
        <div className="pt-1">
          <GameActions
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenReactions={() => setIsReactionPickerOpen(true)}
            onOpenOptions={() => setIsOptionsOpen(true)}
          />
        </div>

        {/* REIGN INDICATOR / RESET FOOTER */}
        <div className="w-full mt-1.5 pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] px-2">
          <span>
            Moves Played: <strong className="text-[var(--text)]">{moveHistory.length}</strong>
          </span>
          {(isGameOver || resignedBy !== null) ? (
            <button
              onClick={() => setIsGameOverDismissed(false)}
              className="text-[var(--primary)] hover:underline font-semibold tracking-wider uppercase text-[10px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Rematch Menu
            </button>
          ) : (
            <button
              onClick={() => setIsOptionsOpen(true)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] font-medium tracking-wider uppercase text-[10px]"
            >
              Game Options
            </button>
          )}
        </div>
      </main>

      {/* MOVE HISTORY DRAWER */}
      <MoveHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        moves={moveHistory}
      />

      {/* GAME OPTIONS MODAL */}
      <GameOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        onOfferDraw={handleOfferDraw}
        onResign={handleResign}
        onExitGame={handleExitGame}
      />

      {/* REACTION PICKER POPUP */}
      <ReactionPicker
        isOpen={isReactionPickerOpen}
        onClose={() => setIsReactionPickerOpen(false)}
        onSendReaction={handleSendReaction}
      />

      {/* PAWN PROMOTION MODAL */}
      <PromotionModal
        isOpen={pendingPromotion !== null}
        color={pendingPromotion?.color || 'w'}
        onSelect={completePromotion}
      />

      {/* RESULT / GAME OVER MODAL WITH 2-PLAYER REMATCH SYSTEM */}
      <GameOverModal
        isOpen={showGameOverModal}
        resultType={gameOverResultType}
        winner={effectiveWinner}
        winnerIdentity={winnerProfile?.identity}
        winnerName={winnerProfile?.displayName}
        winnerAvatar={winnerProfile?.avatar}
        totalMoves={moveHistory.length}
        userProfile={user}
        opponentProfile={opponent}
        rematchState={rematchState}
        isResetting={isResetting}
        onPlayAgain={handlePlayAgainUser}
        onSimulateOpponentPlayAgain={handlePlayAgainOpponent}
        onSimulateOpponentDecline={handleDeclineOpponent}
        onViewGame={() => setIsGameOverDismissed(true)}
        onExit={handleExitGame}
      />
    </div>
  );
};
