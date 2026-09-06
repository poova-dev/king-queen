import React, { useState, useCallback } from 'react';
import { Heart, RotateCcw, AlertTriangle } from 'lucide-react';
import { GameRoom, UserProfile, getOppositeIdentity, ChessSide, RematchState } from '../types';
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
import { useRoom } from '../hooks/useRoom';
import { useMultiplayerChess } from '../hooks/useMultiplayerChess';

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
  const { currentRoom, leaveRoom } = useRoom();
  const isMultiplayer = Boolean(currentRoom);

  // Fallback local engine (active when offline / local pass-and-play)
  const localChess = useChessGame('w');

  // Real-time authoritative Multiplayer Engine
  const multiChess = useMultiplayerChess({
    roomId: currentRoom?.roomId,
    userUid: user.uid,
    room: currentRoom,
  });

  // Player identities (King vs Queen - invariant across rematches)
  const userRole = room ? room.creatorRole : user.identity;
  const opponentRole = room ? room.opponentRole : getOppositeIdentity(user.identity);

  const opponent: UserProfile = room?.opponent || {
    username: '@alex',
    displayName: 'Alex',
    bio: 'Looking for a royal game.',
    avatar: '',
    identity: opponentRole,
  };

  // Chess piece sides (dynamically derived from authoritative Firestore state in multiplayer)
  const currentUserSide: ChessSide = isMultiplayer
    ? multiChess.myChessColor || room?.creatorChessSide || 'WHITE'
    : room?.creatorChessSide || 'WHITE';

  const currentOpponentSide: ChessSide = isMultiplayer
    ? multiChess.opponentChessColor || room?.opponentChessSide || 'BLACK'
    : room?.opponentChessSide || 'BLACK';

  // Board orientation: White is normal (Rank 8 top, Rank 1 bottom), Black is rotated (Rank 1 top, Rank 8 bottom)
  const isFlipped = currentUserSide === 'BLACK';

  // Unified game state bindings
  const board = isMultiplayer ? multiChess.board : localChess.board;
  const turn = isMultiplayer
    ? multiChess.turn === 'WHITE'
      ? 'w'
      : 'b'
    : localChess.turn;
  const isGameOver = isMultiplayer ? multiChess.isGameOver : localChess.isGameOver;
  const winner = isMultiplayer ? multiChess.winner : localChess.winner;
  const isCheck = isMultiplayer
    ? multiChess.gameStatus === 'CHECK'
    : localChess.isCheck;
  const isCheckmate = isMultiplayer
    ? multiChess.gameStatus === 'CHECKMATE'
    : localChess.isCheckmate;
  const isDraw = isMultiplayer
    ? multiChess.gameStatus === 'DRAW'
    : localChess.isDraw;
  const isStalemate = isMultiplayer
    ? multiChess.gameStatus === 'STALEMATE'
    : localChess.isStalemate;
  const checkSquare = isMultiplayer ? multiChess.checkSquare : localChess.checkSquare;
  const selectedSquare = isMultiplayer ? multiChess.selectedSquare : localChess.selectedSquare;
  const legalMoves = isMultiplayer ? multiChess.legalMoves : localChess.legalMoves;
  const lastMove = isMultiplayer ? multiChess.lastMove : localChess.lastMove;
  const moveHistory = isMultiplayer ? multiChess.moveHistory : localChess.moveHistory;
  const capturedByWhite = isMultiplayer ? multiChess.capturedByWhite : localChess.capturedByWhite;
  const capturedByBlack = isMultiplayer ? multiChess.capturedByBlack : localChess.capturedByBlack;
  const pendingPromotion = isMultiplayer ? multiChess.pendingPromotion : localChess.pendingPromotion;
  const handleSquareClick = isMultiplayer ? multiChess.handleSquareClick : localChess.handleSquareClick;
  const completePromotion = isMultiplayer ? multiChess.completePromotion : localChess.completePromotion;

  // Turn evaluation
  const isMyTurn = isMultiplayer
    ? multiChess.isMyTurn
    : turn === (currentUserSide === 'WHITE' ? 'w' : 'b') && !isGameOver;
  const isOpponentTurn = !isMyTurn && !isGameOver;

  const boardDisabled = isMultiplayer
    ? !multiChess.isMyTurn || multiChess.isGameOver || multiChess.isSubmittingMove
    : isGameOver;

  // Modals & UI overlays
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState(false);
  const [resignedBy, setResignedBy] = useState<'YOU' | 'OPPONENT' | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Local fallback rematch hook
  const handleLocalRematchSuccess = useCallback(() => {
    setResignedBy(null);
    setIsGameOverDismissed(false);
    localChess.resetGame();
  }, [localChess]);

  const localRematch = useRematch({
    onRematchSuccess: handleLocalRematchSuccess,
    transitionDurationMs: 850,
  });

  // Rematch status evaluation
  const isRematchRequestedByMe = Boolean(
    multiChess.rematchRequest && multiChess.rematchRequest.requestedBy === user.uid
  );
  const isRematchRequestedByOpponent = Boolean(
    multiChess.rematchRequest &&
      multiChess.rematchRequest.requestedBy &&
      multiChess.rematchRequest.requestedBy !== user.uid &&
      multiChess.rematchRequest.status === 'PENDING'
  );
  const isRematchDeclined = multiChess.rematchRequest?.status === 'DECLINED';

  const rematchState: RematchState = isMultiplayer
    ? {
        playerOneConfirmed: isRematchRequestedByMe,
        playerTwoConfirmed: isRematchRequestedByOpponent,
        rematchStarted: false,
        declinedBy: isRematchDeclined ? 'playerTwo' : null,
      }
    : localRematch.rematchState;

  // Floating Reactions
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

  // Match Action Handlers
  const handleOfferDraw = () => {
    // Reserved for draw proposal
  };

  const handleResign = () => {
    setResignedBy('YOU');
    setIsGameOverDismissed(false);
  };

  const handlePlayAgain = () => {
    if (isMultiplayer) {
      if (isRematchRequestedByOpponent) {
        multiChess.respondToRematch(true);
      } else {
        multiChess.requestRematch();
      }
    } else {
      localRematch.confirmRematch('playerOne');
    }
  };

  const handleExitGame = async () => {
    if (isMultiplayer) {
      if (isRematchRequestedByOpponent) {
        multiChess.respondToRematch(false).catch(() => {});
      }
      try {
        await leaveRoom();
      } catch (err) {
        console.warn('[leaveRoom Error]', err);
      }
    }
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
        roomCode={room?.code || currentRoom?.roomCode || 'KQ-ROYAL'}
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
            wins={opponent.wins || 0}
            avatar={opponent.avatar}
            isTurn={isOpponentTurn}
            position="top"
            timeRemaining={room?.timer || 'No Timer'}
          />

          {/* Captured Pieces by Opponent */}
          <div className="flex items-center justify-between px-1 text-xs">
            <CapturedPieces
              pieces={currentUserSide === 'WHITE' ? capturedByBlack : capturedByWhite}
              label="Opponent Took"
              alignment="left"
            />

            {/* Versus / Score connector */}
            <div className="flex items-center gap-1.5 opacity-60 text-[9px] font-bold tracking-widest text-[var(--text-muted)]">
              <span>{opponent.wins || 0} WINS</span>
              <Heart className="w-2.5 h-2.5 text-[var(--primary)] fill-[var(--primary)] opacity-70" />
              <span>{user.wins || 0} WINS</span>
            </div>
          </div>
        </div>

        {/* CHECK BANNER */}
        {isCheck && !isGameOver && !resignedBy && (
          <GameStatusBanner status="CHECK" />
        )}

        {/* MOVE ERROR ALERT */}
        {multiChess.moveError && (
          <div className="w-full px-3 py-2 rounded-xl bg-red-950/80 border border-red-500/60 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{multiChess.moveError}</span>
            </div>
            <button
              onClick={multiChess.clearError}
              className="text-red-400 hover:text-red-100 font-bold ml-2 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* CURRENT TURN STATUS */}
        <div className="w-full flex items-center justify-center py-1">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${
              isMyTurn
                ? 'bg-[var(--primary)]/15 border-[var(--primary)] shadow-[0_0_15px_rgba(184,155,94,0.18)]'
                : 'bg-[var(--surface)] border-[var(--border)]'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: turn === 'w' ? '#F8F8F6' : '#1A1A1D' }}
            />
            <span className="text-xs font-semibold tracking-wider text-[var(--text)] uppercase">
              {isGameOver
                ? 'GAME CONCLUDED'
                : isMyTurn
                ? 'YOUR TURN'
                : "WAITING FOR OPPONENT..."}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono border-l border-[var(--border)] pl-2">
              {turn === 'w' ? 'White' : 'Black'}
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
            isFlipped={isFlipped}
            disabled={boardDisabled}
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
            wins={user.wins || 0}
            avatar={user.avatar}
            isTurn={isMyTurn}
            position="bottom"
            timeRemaining={room?.timer || 'No Timer'}
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
          {isGameOver || resignedBy !== null ? (
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
        isResetting={localRematch.isResetting}
        onPlayAgain={handlePlayAgain}
        onViewGame={() => setIsGameOverDismissed(true)}
        onExit={handleExitGame}
      />
    </div>
  );
};
