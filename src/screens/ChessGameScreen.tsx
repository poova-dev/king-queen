import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, RotateCcw, AlertTriangle, Clock, Sparkles } from 'lucide-react';
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
import { ResignConfirmationModal } from '../components/chess/ResignConfirmationModal';
import { DrawOfferModal } from '../components/chess/DrawOfferModal';
import { MobileGameDrawer } from '../components/chess/MobileGameDrawer';
import { GameToastNotification } from '../components/chess/GameToastNotification';
import { OpponentDisconnectedBanner } from '../components/chess/OpponentDisconnectedBanner';
import { SelfDisconnectedBanner } from '../components/chess/SelfDisconnectedBanner';
import { useChessGame } from '../hooks/useChessGame';
import { useRematch } from '../hooks/useRematch';
import { useRoom } from '../hooks/useRoom';
import { useMultiplayerChess } from '../hooks/useMultiplayerChess';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useGameNotifications } from '../hooks/useGameNotifications';
import { soundService } from '../services/soundService';
import { useReactions } from '../hooks/useReactions';

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
  const { currentRoom, leaveRoom, leaveCompletedGame } = useRoom();
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
    ? multiChess.endReason === 'CHECKMATE' || multiChess.gameStatus === 'CHECKMATE'
    : localChess.isCheckmate;
  const isDraw = isMultiplayer
    ? multiChess.isDraw
    : localChess.isDraw;
  const isStalemate = isMultiplayer
    ? multiChess.endReason === 'STALEMATE' || multiChess.gameStatus === 'STALEMATE'
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

  // Real-time network and presence status
  const { isOnline, isReconnecting, connectionStatus } = useConnectionStatus({
    roomId: currentRoom?.roomId,
    userUid: user.uid,
    autoSyncPresence: isMultiplayer,
  });

  const opponentPlayerDoc = isMultiplayer
    ? currentRoom?.players.find((p) => p.uid !== user.uid)
    : null;
  const opponentConnectionStatus =
    opponentPlayerDoc?.connectionStatus || 'ONLINE';
  const myConnectionStatus = isMultiplayer ? connectionStatus : 'ONLINE';

  // Turn evaluation
  const isMyTurn = isMultiplayer
    ? multiChess.isMyTurn
    : turn === (currentUserSide === 'WHITE' ? 'w' : 'b') && !isGameOver;
  const isOpponentTurn = !isMyTurn && !isGameOver;

  const boardDisabled = isMultiplayer
    ? !multiChess.isMyTurn ||
      multiChess.isGameOver ||
      multiChess.isSubmittingMove ||
      multiChess.isResigning ||
      multiChess.isClaimingVictory ||
      multiChess.isClaimingTimeout ||
      multiChess.isOfferingDraw ||
      multiChess.isRespondingToDraw ||
      pendingPromotion !== null ||
      !isOnline ||
      isReconnecting ||
      multiChess.isOpponentDisconnected ||
      multiChess.isMyTimerExpired
    : isGameOver || pendingPromotion !== null;

  // Sound state
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundService.isEnabled());
  const handleToggleSound = useCallback(() => {
    const next = soundService.toggle();
    setIsSoundEnabled(next);
  }, []);

  // In-Game Toast Notifications
  const { toasts, addToast, dismissToast } = useGameNotifications(currentRoom?.roomId);

  // Turn changes toast
  const prevTurnRef = useRef<string | null>(null);
  useEffect(() => {
    if (multiChess.isGameOver || !currentRoom) return;
    if (prevTurnRef.current && prevTurnRef.current !== multiChess.turn) {
      if (multiChess.isMyTurn) {
        addToast('YOUR TURN', 'Your Turn', 'Command your royal army', multiChess.moveHistory.length);
      }
    }
    prevTurnRef.current = multiChess.turn;
  }, [multiChess.turn, multiChess.isMyTurn, multiChess.isGameOver, currentRoom, addToast, multiChess.moveHistory.length]);

  // Check alert toast
  useEffect(() => {
    if (isCheck && !isGameOver) {
      addToast('CHECK', 'Check!', 'Protect your Sovereign', `check_${multiChess.moveHistory.length}`);
    }
  }, [isCheck, isGameOver, addToast, multiChess.moveHistory.length]);

  // Draw offer decline notification for proposer
  useEffect(() => {
    if (multiChess.isDrawOfferDeclined) {
      addToast('DRAW_OFFER_DECLINED', 'Draw Declined', 'The battle continues for the crown', 'draw_declined');
    }
  }, [multiChess.isDrawOfferDeclined, addToast]);

  // Modals & UI overlays
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState(false);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [resignedBy, setResignedBy] = useState<'YOU' | 'OPPONENT' | null>(null);
  // Real-time reactions via Firestore subcollection (Phase A fix)
  const { floatingReactions, sendReaction: sendFirestoreReaction } = useReactions({
    roomId: currentRoom?.roomId,
    uid: user.uid,
    isMultiplayer,
  });

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

  // Floating Reactions — now backed by Firestore for real-time delivery
  const handleSendReaction = (emoji: string) => {
    sendFirestoreReaction(emoji).catch((err) => {
      if (import.meta.env?.DEV) {
        console.warn('[ChessGameScreen] Reaction send failed:', err);
      }
    });
  };

  // Match Action Handlers
  const handleOfferDraw = async () => {
    setIsOptionsOpen(false);
    if (isMultiplayer) {
      try {
        await multiChess.offerDraw();
        addToast('DRAW_OFFER_SENT', 'Draw Offer Sent...', 'Waiting for opponent response', 'draw_sent');
      } catch (err: any) {
        console.warn('[OfferDraw Error]', err);
      }
    }
  };

  const handleResign = () => {
    setIsOptionsOpen(false);
    setIsResignModalOpen(true);
  };

  const handleConfirmResign = async () => {
    if (isMultiplayer) {
      try {
        await multiChess.resign();
        setIsResignModalOpen(false);
      } catch (err) {
        console.error('[Resign Error]', err);
      }
    } else {
      setResignedBy('YOU');
      setIsGameOverDismissed(false);
      setIsResignModalOpen(false);
    }
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

  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  const handleExitGame = () => {
    if (isGameOver || (!isMultiplayer && resignedBy !== null)) {
      setIsExitConfirmOpen(true);
    } else {
      performImmediateExit();
    }
  };

  const performImmediateExit = async () => {
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

  const confirmLeaveCompleted = async () => {
    setIsExitConfirmOpen(false);
    if (isMultiplayer) {
      if (isRematchRequestedByOpponent) {
        multiChess.respondToRematch(false).catch(() => {});
      }
      try {
        await leaveCompletedGame();
      } catch (err) {
        console.warn('[leaveCompletedGame Error]', err);
      }
    }
    onExit();
  };

  const isResignation = isMultiplayer
    ? multiChess.endReason === 'RESIGNATION'
    : resignedBy !== null;

  // Determine game over winner
  const effectiveWinner = isMultiplayer
    ? multiChess.winner
    : resignedBy
    ? resignedBy === 'YOU'
      ? 'OPPONENT'
      : 'YOU'
    : winner;

  const winnerProfile =
    effectiveWinner === 'YOU' ? user : effectiveWinner === 'OPPONENT' ? opponent : null;

  const showGameOverModal =
    (isGameOver || (!isMultiplayer && resignedBy !== null)) && !isGameOverDismissed;

  const isTimeout = isMultiplayer && multiChess.endReason === 'TIMEOUT';
  const isAbandoned = isMultiplayer && multiChess.endReason === 'ABANDONED';

  const gameOverResultType = isTimeout
    ? 'TIMEOUT'
    : isAbandoned
    ? 'ABANDONED'
    : isResignation
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
        connectionStatus={!isOnline ? 'offline' : isReconnecting ? 'reconnecting' : 'connected'}
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
            timeRemaining={
              isMultiplayer
                ? (currentOpponentSide === 'WHITE'
                    ? multiChess.chessTimer.whiteFormatted
                    : multiChess.chessTimer.blackFormatted)
                : (room?.timer || 'No Timer')
            }
            isLowTime={
              isMultiplayer
                ? (currentOpponentSide === 'WHITE'
                    ? multiChess.chessTimer.isLowTimeWhite
                    : multiChess.chessTimer.isLowTimeBlack)
                : false
            }
            isUrgentTime={
              isMultiplayer
                ? (currentOpponentSide === 'WHITE'
                    ? multiChess.chessTimer.isUrgentWhite
                    : multiChess.chessTimer.isUrgentBlack)
                : false
            }
            connectionStatus={multiChess.isOpponentDisconnected ? 'RECONNECTING' : opponentConnectionStatus}
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

        {/* OPPONENT DISCONNECTED BANNER */}
        <OpponentDisconnectedBanner
          isVisible={isMultiplayer && multiChess.isOpponentDisconnected}
          secondsRemaining={multiChess.disconnectSecondsRemaining}
          opponentName={opponent.displayName}
          isClaimingVictory={multiChess.isClaimingVictory}
          onClaimVictory={multiChess.claimVictory}
        />

        {/* SELF OFFLINE / RECONNECTING BANNER */}
        <SelfDisconnectedBanner
          isVisible={!isOnline || isReconnecting}
          isReconnecting={isReconnecting}
        />

        {/* TIMEOUT BANNERS */}
        {isMultiplayer && multiChess.isMyTimerExpired && !isGameOver && (
          <div className="w-full px-4 py-2.5 rounded-xl bg-rose-950/85 border border-rose-500/60 flex items-center justify-center gap-2 text-xs font-bold text-rose-200 tracking-wider uppercase animate-pulse">
            <Clock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>YOUR TIME HAS EXPIRED</span>
          </div>
        )}

        {isMultiplayer && multiChess.isOpponentTimerExpired && !isGameOver && (
          <div className="w-full px-4 py-2.5 rounded-xl bg-amber-950/85 border border-amber-500/60 flex items-center justify-center gap-2 text-xs font-bold text-amber-200 tracking-wider uppercase animate-pulse">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>OPPONENT TIME EXPIRED</span>
          </div>
        )}

        {/* OPPONENT PROMOTION WAITING BANNER */}
        {isMultiplayer && multiChess.isOpponentChoosingPromotion && !isGameOver && (
          <div className="w-full px-4 py-2.5 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/50 flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] tracking-wider uppercase animate-pulse">
            <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span>OPPONENT IS CHOOSING PROMOTION...</span>
          </div>
        )}

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

        {/* HIERARCHICAL TURN INDICATOR CARD */}
        <div className="w-full flex items-center justify-center py-1">
          <motion.div
            key={isGameOver ? 'game_over' : `${turn}_${isMyTurn}`}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`w-full max-w-sm px-4 py-2 rounded-2xl border transition-all duration-300 shadow-sm motion-reduce:transition-none motion-reduce:animate-none ${
              isGameOver
                ? 'bg-[var(--surface)] border-[var(--border)] text-center'
                : isMyTurn
                ? 'bg-[var(--surface)] border-[var(--primary)] shadow-[0_0_20px_rgba(184,155,94,0.18)] ring-1 ring-[var(--primary)]/30'
                : 'bg-[var(--surface)]/70 border-[var(--border)]'
            }`}
          >
            {isGameOver ? (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] tracking-widest uppercase">
                <span>⚔️ BATTLE CONCLUDED</span>
              </div>
            ) : isMyTurn ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold font-display tracking-wider text-[var(--primary)] uppercase">
                      YOUR TURN
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      You play {currentUserSide} • Make your move
                    </span>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/40 text-[9px] font-bold text-[var(--primary)] uppercase font-mono">
                  {currentUserSide === 'WHITE' ? '♙ WHITE' : '♟ BLACK'}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full border border-amber-400/60 bg-amber-400/30" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold font-display tracking-wider text-[var(--text)] uppercase">
                      OPPONENT'S TURN
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      {opponent.displayName} plays {currentOpponentSide} • Waiting...
                    </span>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[var(--surface-light)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)] uppercase font-mono">
                  {currentOpponentSide === 'WHITE' ? '♙ WHITE' : '♟ BLACK'}
                </div>
              </div>
            )}
          </motion.div>
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
            userChessSide={currentUserSide}
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
              {currentRoom?.timeControl
                ? `${currentRoom.timeControl.initialTime / 60000} MIN ${currentRoom.timeControl.type}`
                : (room?.timer || 'No Timer')}
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
            timeRemaining={
              isMultiplayer
                ? (currentUserSide === 'WHITE'
                    ? multiChess.chessTimer.whiteFormatted
                    : multiChess.chessTimer.blackFormatted)
                : (room?.timer || 'No Timer')
            }
            isLowTime={
              isMultiplayer
                ? (currentUserSide === 'WHITE'
                    ? multiChess.chessTimer.isLowTimeWhite
                    : multiChess.chessTimer.isLowTimeBlack)
                : false
            }
            isUrgentTime={
              isMultiplayer
                ? (currentUserSide === 'WHITE'
                    ? multiChess.chessTimer.isUrgentWhite
                    : multiChess.chessTimer.isUrgentBlack)
                : false
            }
            connectionStatus={myConnectionStatus}
          />
        </div>

        {/* BOTTOM GAME ACTIONS */}
        <div className="pt-1">
          <GameActions
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenReactions={() => setIsReactionPickerOpen(true)}
            onOpenOptions={() => setIsOptionsOpen(true)}
            onOfferDraw={handleOfferDraw}
            isDrawDisabled={
              isGameOver ||
              multiChess.isOfferingDraw ||
              multiChess.isDrawOfferSentByMe ||
              !isOnline ||
              isReconnecting ||
              multiChess.isOpponentDisconnected ||
              (!isMultiplayer && resignedBy !== null)
            }
            onResign={handleResign}
            isResignDisabled={
              isGameOver ||
              multiChess.isResigning ||
              multiChess.isClaimingVictory ||
              !isOnline ||
              isReconnecting ||
              multiChess.isOpponentDisconnected ||
              (!isMultiplayer && resignedBy !== null)
            }
            isSoundEnabled={isSoundEnabled}
            onToggleSound={handleToggleSound}
          />
        </div>

        {/* REIGN INDICATOR / RESET FOOTER */}
        <div className="w-full mt-1.5 pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[10px] text-[var(--text-muted)] px-2">
          <span>
            Moves Played: <strong className="text-[var(--text)]">{moveHistory.length}</strong>
          </span>
          {isGameOver || (!isMultiplayer && resignedBy !== null) ? (
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

      {/* MOBILE GAME OPTIONS DRAWER (BOTTOM SHEET ON MOBILE / CENTERED ON DESKTOP) */}
      <MobileGameDrawer
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        onOfferDraw={handleOfferDraw}
        onResign={handleResign}
        onOpenHistory={() => {
          setIsOptionsOpen(false);
          setIsHistoryOpen(true);
        }}
        onExitGame={handleExitGame}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        isGameOver={isGameOver || (!isMultiplayer && resignedBy !== null)}
        isDrawDisabled={
          isGameOver ||
          multiChess.isOfferingDraw ||
          multiChess.isDrawOfferSentByMe ||
          !isOnline ||
          isReconnecting ||
          multiChess.isOpponentDisconnected ||
          (!isMultiplayer && resignedBy !== null)
        }
        isResignDisabled={
          isGameOver ||
          multiChess.isResigning ||
          multiChess.isClaimingVictory ||
          !isOnline ||
          isReconnecting ||
          multiChess.isOpponentDisconnected ||
          (!isMultiplayer && resignedBy !== null)
        }
      />

      {/* RESIGN CONFIRMATION MODAL */}
      <ResignConfirmationModal
        isOpen={isResignModalOpen}
        isProcessing={multiChess.isResigning}
        onClose={() => setIsResignModalOpen(false)}
        onConfirm={handleConfirmResign}
      />

      {/* DRAW OFFER MODAL FOR OPPONENT */}
      <DrawOfferModal
        isOpen={isMultiplayer && multiChess.isDrawOfferPendingForMe && !isGameOver}
        proposerName={opponent.displayName}
        expiresAt={multiChess.drawOffer?.expiresAt || Date.now() + 30000}
        onAccept={() => multiChess.respondToDraw(true)}
        onDecline={() => multiChess.respondToDraw(false)}
        isResponding={multiChess.isRespondingToDraw}
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
        onCancel={isMultiplayer ? multiChess.cancelPromotion : undefined}
      />

      {/* ROYAL GAME NOTIFICATIONS TOAST */}
      <GameToastNotification
        toasts={toasts}
        onDismiss={dismissToast}
      />

      {/* RESULT / GAME OVER MODAL WITH 2-PLAYER REMATCH SYSTEM */}
      <GameOverModal
        isOpen={showGameOverModal}
        resultType={gameOverResultType}
        endReason={isMultiplayer ? multiChess.endReason : undefined}
        winner={effectiveWinner}
        winnerIdentity={winnerProfile?.identity}
        winnerName={winnerProfile?.displayName}
        winnerAvatar={winnerProfile?.avatar}
        totalMoves={moveHistory.length}
        userProfile={user}
        opponentProfile={opponent}
        userChessSide={currentUserSide}
        opponentChessSide={currentOpponentSide}
        rematchState={rematchState}
        isResetting={localRematch.isResetting}
        onPlayAgain={handlePlayAgain}
        onViewGame={() => setIsGameOverDismissed(true)}
        onExit={handleExitGame}
      />

      {/* LEAVE THE BATTLEFIELD CONFIRMATION MODAL */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xs rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/40 p-6 flex flex-col items-center text-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-light)] border border-[var(--primary)]/30 flex items-center justify-center text-2xl text-[var(--primary)]">
              🏰
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-display text-[var(--text)] tracking-wider">
                LEAVE THE BATTLEFIELD?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The battle will remain in your royal history.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                onClick={confirmLeaveCompleted}
                className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--background)] font-bold text-xs tracking-wider uppercase shadow-md hover:opacity-90 transition-opacity"
              >
                RETURN TO KINGDOM
              </button>
              <button
                onClick={() => setIsExitConfirmOpen(false)}
                className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-medium tracking-wide transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
