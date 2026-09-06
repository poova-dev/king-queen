import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import {
  RoomDocument,
  GameStateDocument,
  ChessSide,
  MultiplayerGameStatus,
  GameEndReason,
} from '../types';
import { SquareData } from '../components/chess/ChessSquare';
import { PieceType, PieceColor } from '../components/chess/ChessPiece';
import { ChessMoveItem } from '../components/chess/MoveHistoryDrawer';
import {
  initializeGameState,
  makeMove as apiMakeMove,
  resignGame as apiResignGame,
  processGameStats,
  requestRematch as apiRequestRematch,
  respondToRematch as apiRespondToRematch,
  mapGameError,
  INITIAL_CHESS_FEN,
  isRematchExpired,
} from '../services/gameService';
import {
  claimVictoryForDisconnect,
  mapConnectionError,
} from '../services/presenceService';

export interface UseMultiplayerChessProps {
  roomId: string | undefined;
  userUid: string | undefined;
  room: RoomDocument | null;
}

export interface PendingPromotion {
  from: Square;
  to: Square;
  color: PieceColor;
}

const STARTING_PIECES: Record<PieceType, number> = {
  p: 8,
  r: 2,
  n: 2,
  b: 2,
  q: 1,
  k: 1,
};

export const useMultiplayerChess = ({
  roomId,
  userUid,
  room,
}: UseMultiplayerChessProps) => {
  // Authoritative local chess engine instance
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(() => chessRef.current.fen());
  const [localVersion, setLocalVersion] = useState<number>(-1);

  // UI Selection & Move states
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState<boolean>(false);
  const [isResigning, setIsResigning] = useState<boolean>(false);
  const [isClaimingVictory, setIsClaimingVictory] = useState<boolean>(false);
  const [disconnectSecondsRemaining, setDisconnectSecondsRemaining] = useState<number>(60);
  const [moveError, setMoveError] = useState<string | null>(null);

  const gameState = room?.gameState || null;
  const disconnectState = gameState?.disconnectState || null;

  // Player identity & authorization
  const currentPlayer = useMemo(() => {
    if (!room || !userUid) return null;
    return room.players.find((p) => p.uid === userUid) || null;
  }, [room, userUid]);

  const opponentPlayer = useMemo(() => {
    if (!room || !userUid) return null;
    return room.players.find((p) => p.uid !== userUid) || null;
  }, [room, userUid]);

  const myChessColor: ChessSide | null = currentPlayer?.chessColor || null;
  const opponentChessColor: ChessSide | null = opponentPlayer?.chessColor || null;
  const myPlayerColor: PieceColor | null =
    myChessColor === 'WHITE' ? 'w' : myChessColor === 'BLACK' ? 'b' : null;

  const authoritativeTurn: ChessSide = gameState?.turn || 'WHITE';
  const authoritativeStatus: MultiplayerGameStatus = gameState?.status || 'PLAYING';

  const isGameOver =
    authoritativeStatus === 'FINISHED' ||
    authoritativeStatus === 'CHECKMATE' ||
    authoritativeStatus === 'DRAW' ||
    authoritativeStatus === 'STALEMATE' ||
    room?.status === 'FINISHED' ||
    room?.status === 'COMPLETED';

  const isMyTurn = Boolean(
    myChessColor &&
      authoritativeTurn === myChessColor &&
      !isGameOver &&
      room?.status === 'PLAYING'
  );

  const isOpponentDisconnected = Boolean(
    opponentPlayer &&
      !isGameOver &&
      disconnectState &&
      disconnectState.status === 'WAITING_FOR_RECONNECT' &&
      disconnectState.disconnectedUid === opponentPlayer.uid
  );

  // Synchronize disconnect countdown timer
  useEffect(() => {
    if (!isOpponentDisconnected || !disconnectState?.graceExpiresAt) {
      setDisconnectSecondsRemaining(60);
      return;
    }

    const calcRemaining = () => {
      let expiresAtMs = 0;
      if (typeof disconnectState.graceExpiresAt === 'number') {
        expiresAtMs = disconnectState.graceExpiresAt;
      } else if (disconnectState.graceExpiresAt?.toMillis) {
        expiresAtMs = disconnectState.graceExpiresAt.toMillis();
      } else {
        expiresAtMs = Number(disconnectState.graceExpiresAt) || 0;
      }

      const diffSec = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setDisconnectSecondsRemaining(diffSec);
    };

    calcRemaining();
    const interval = setInterval(calcRemaining, 1000);
    return () => clearInterval(interval);
  }, [isOpponentDisconnected, disconnectState?.graceExpiresAt]);

  const claimVictory = useCallback(async () => {
    if (!roomId || !userUid || isClaimingVictory || isGameOver) return;
    setIsClaimingVictory(true);
    try {
      await claimVictoryForDisconnect(roomId, userUid);
    } catch (err: any) {
      setMoveError(mapConnectionError(err));
    } finally {
      setIsClaimingVictory(false);
    }
  }, [roomId, userUid, isClaimingVictory, isGameOver]);

  const initializationAttemptedRef = useRef<string | null>(null);
  const processedGameEndRef = useRef<string | null>(null);

  // 1. One-time GameState Initialization when room reaches PLAYING
  useEffect(() => {
    if (!roomId || !room) return;

    // If room is already concluded, do not initialize
    if (
      room.status === 'FINISHED' ||
      room.status === 'COMPLETED' ||
      room.status === 'CLOSED'
    ) {
      return;
    }

    // If gameState already exists, mark initialized for this room
    if (room.gameState && room.gameState.fen) {
      initializationAttemptedRef.current = `${roomId}_${room.gameState.rematchCount || 0}`;
      return;
    }

    const currentKey = `${roomId}_${room.gameState?.rematchCount || 0}`;

    if (room.status === 'PLAYING' && !room.gameState) {
      // Guard against duplicate calls from React StrictMode, room reference changes, or re-renders
      if (initializationAttemptedRef.current === currentKey) {
        return;
      }
      initializationAttemptedRef.current = currentKey;

      initializeGameState(roomId).catch((err) => {
        // Recovery logic inside initializeGameState will handle concurrent player inits.
        // Only log during development if not recovered.
        if (import.meta.env?.DEV) {
          console.warn('[initializeGameState handled in hook]', err?.message || err);
        }
      });
    }
  }, [roomId, room?.status, Boolean(room?.gameState), room?.gameState?.rematchCount]);

  // 2. Synchronize authoritative FEN from Firestore
  useEffect(() => {
    if (!gameState || !gameState.fen) return;

    // Detect new version or initial load
    if (gameState.version > localVersion || localVersion === -1) {
      try {
        chessRef.current.load(gameState.fen);
        setFen(gameState.fen);
        setLocalVersion(gameState.version);
        setSelectedSquare(null);
        setLegalMoves([]);
        setMoveError(null);
      } catch (err) {
        console.error('[Error loading authoritative FEN]', err);
      }
    }
  }, [gameState, localVersion]);

  // 3. Trigger one-time player stats processing when game concludes
  useEffect(() => {
    if (!roomId || !gameState) return;
    if (isGameOver && !gameState.statsProcessed) {
      const finishTime = gameState.finishedAt?.toMillis
        ? gameState.finishedAt.toMillis()
        : gameState.finishedAt || 'ended';
      const eventKey = `${roomId}_${gameState.version}_${finishTime}_${gameState.endReason || ''}`;

      // UI event guard preventing duplicate completion calls from re-renders or StrictMode
      if (processedGameEndRef.current === eventKey) {
        return;
      }
      processedGameEndRef.current = eventKey;

      processGameStats(roomId).catch((err) => {
        if (import.meta.env?.DEV) {
          console.warn('[processGameStats Error]', err);
        }
      });
    }
  }, [roomId, isGameOver, gameState?.statsProcessed, gameState?.version, gameState?.finishedAt, gameState?.endReason]);

  // 4. Derived King square in check
  const checkSquare = useMemo((): string | null => {
    const chess = chessRef.current;
    if (!chess.inCheck()) return null;
    const currentTurn = chess.turn();
    const board = chess.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          return `${files[c]}${8 - r}`;
        }
      }
    }
    return null;
  }, [fen]);

  // 5. Board Matrix for rendering
  const boardMatrix = useMemo((): SquareData[][] => {
    const chess = chessRef.current;
    const rawBoard = chess.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const matrix: SquareData[][] = [];

    for (let r = 0; r < 8; r++) {
      const row: SquareData[] = [];
      const rankNum = 8 - r;

      for (let c = 0; c < 8; c++) {
        const notation = `${files[c]}${rankNum}`;
        const pieceObj = rawBoard[r][c];

        let piece: { type: PieceType; color: PieceColor } | undefined = undefined;
        if (pieceObj) {
          piece = {
            type: pieceObj.type as PieceType,
            color: pieceObj.color as PieceColor,
          };
        }

        row.push({
          row: r,
          col: c,
          notation,
          piece,
        });
      }
      matrix.push(row);
    }

    return matrix;
  }, [fen]);

  // 6. Calculate captured pieces dynamically from current board state
  const { capturedByWhite, capturedByBlack } = useMemo(() => {
    const chess = chessRef.current;
    const board = chess.board();
    const currentCounts: Record<PieceColor, Record<PieceType, number>> = {
      w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
      b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    };

    for (const row of board) {
      for (const sq of row) {
        if (sq) {
          currentCounts[sq.color][sq.type as PieceType]++;
        }
      }
    }

    const byWhite: { type: PieceType; color: PieceColor }[] = [];
    const byBlack: { type: PieceType; color: PieceColor }[] = [];

    // White captured Black pieces (missing black pieces)
    (Object.keys(STARTING_PIECES) as PieceType[]).forEach((type) => {
      const missing = STARTING_PIECES[type] - (currentCounts.b[type] || 0);
      for (let i = 0; i < missing; i++) {
        byWhite.push({ type, color: 'b' });
      }
    });

    // Black captured White pieces (missing white pieces)
    (Object.keys(STARTING_PIECES) as PieceType[]).forEach((type) => {
      const missing = STARTING_PIECES[type] - (currentCounts.w[type] || 0);
      for (let i = 0; i < missing; i++) {
        byBlack.push({ type, color: 'w' });
      }
    });

    return { capturedByWhite: byWhite, capturedByBlack: byBlack };
  }, [fen]);

  // 7. Move History formatting
  const formattedMoveHistory = useMemo((): ChessMoveItem[] => {
    if (!gameState?.moveHistory) return [];
    const items: ChessMoveItem[] = [];
    const history = gameState.moveHistory;

    for (let i = 0; i < history.length; i += 2) {
      items.push({
        number: Math.floor(i / 2) + 1,
        white: history[i]?.san || '',
        black: history[i + 1]?.san || '',
      });
    }

    return items;
  }, [gameState?.moveHistory]);

  // 8. Execute Authoritative Move via Firestore Transaction
  const executeMove = useCallback(
    async (from: Square, to: Square, promotion?: PieceType) => {
      if (!roomId || !userUid || isSubmittingMove || isGameOver) return false;

      const chess = chessRef.current;

      // Local optimistic check
      const moves = chess.moves({ square: from, verbose: true });
      const isValidLocal = moves.some(
        (m) => m.to === to && (!promotion || m.promotion === promotion)
      );

      if (!isValidLocal) {
        setMoveError('Illegal move.');
        return false;
      }

      setIsSubmittingMove(true);
      setMoveError(null);

      // Temporary optimistic update
      let rollbackFen = chess.fen();
      try {
        chess.move({ from, to, promotion: promotion || undefined });
        setFen(chess.fen());
        setSelectedSquare(null);
        setLegalMoves([]);
      } catch {
        // Rollback immediately if local move throws
        chess.load(rollbackFen);
        setFen(rollbackFen);
        setIsSubmittingMove(false);
        return false;
      }

      try {
        await apiMakeMove(roomId, userUid, {
          from,
          to,
          promotion: promotion || undefined,
        });
        // Success: Firestore onSnapshot will provide confirmation and increment version
        return true;
      } catch (err: any) {
        // Rollback to authoritative state
        chess.load(gameState?.fen || INITIAL_CHESS_FEN);
        setFen(chess.fen());
        setMoveError(mapGameError(err));
        return false;
      } finally {
        setIsSubmittingMove(false);
      }
    },
    [roomId, userUid, isSubmittingMove, isGameOver, gameState?.fen]
  );

  // 9. Square Click Handler
  const handleSquareClick = useCallback(
    (square: SquareData) => {
      // Reject interactions if not user's turn or during transaction submission or if game is over
      if (!isMyTurn || isSubmittingMove || isGameOver) return;

      const sqNotation = square.notation as Square;
      const chess = chessRef.current;

      // 1. If a piece is already selected, check if target square is a legal destination
      if (selectedSquare) {
        // Deselect if clicking same square
        if (selectedSquare === sqNotation) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        const moves = chess.moves({ square: selectedSquare, verbose: true });
        const targetMove = moves.find((m) => m.to === sqNotation);

        if (targetMove) {
          // Check for pawn promotion (pawn moving to 8th rank for White, 1st rank for Black)
          if (targetMove.flags.includes('p') || targetMove.promotion) {
            setPendingPromotion({
              from: selectedSquare,
              to: sqNotation,
              color: myPlayerColor || 'w',
            });
            return;
          }

          // Execute regular move
          executeMove(selectedSquare, sqNotation);
          return;
        }
      }

      // 2. Select a piece that belongs to the current user
      const pieceOnSquare = chess.get(sqNotation);
      if (pieceOnSquare && pieceOnSquare.color === myPlayerColor) {
        setSelectedSquare(sqNotation);
        const moves = chess.moves({ square: sqNotation, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }

      // 3. Otherwise deselect
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [isMyTurn, isSubmittingMove, isGameOver, selectedSquare, myPlayerColor, executeMove]
  );

  // 10. Promotion Callbacks
  const completePromotion = useCallback(
    (pieceType: PieceType) => {
      if (!pendingPromotion) return;
      executeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
      setPendingPromotion(null);
    },
    [pendingPromotion, executeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // 11. Rematch Handlers
  const requestRematch = useCallback(async () => {
    if (!roomId || !userUid) return;
    try {
      await apiRequestRematch(roomId, userUid);
    } catch (err: any) {
      setMoveError(mapGameError(err));
    }
  }, [roomId, userUid]);

  const respondToRematch = useCallback(
    async (accept: boolean) => {
      if (!roomId || !userUid) return;
      try {
        await apiRespondToRematch(roomId, userUid, accept);
      } catch (err: any) {
        setMoveError(mapGameError(err));
      }
    },
    [roomId, userUid]
  );

  // Authoritative Resign Handler
  const resign = useCallback(async () => {
    if (!roomId || !userUid || isResigning || isGameOver) return;
    setIsResigning(true);
    setMoveError(null);
    try {
      await apiResignGame(roomId, userUid);
    } catch (err: any) {
      setMoveError(mapGameError(err));
    } finally {
      setIsResigning(false);
    }
  }, [roomId, userUid, isResigning, isGameOver]);

  const endReason: GameEndReason | null = gameState?.endReason || null;

  const isDraw: boolean =
    authoritativeStatus === 'DRAW' ||
    authoritativeStatus === 'STALEMATE' ||
    endReason === 'STALEMATE' ||
    endReason === 'THREEFOLD_REPETITION' ||
    endReason === 'INSUFFICIENT_MATERIAL' ||
    endReason === 'FIFTY_MOVE_RULE' ||
    endReason === 'DRAW' ||
    Boolean(isGameOver && gameState?.winnerUid === null);

  // Authoritative perspective winner calculation
  const winner: 'YOU' | 'OPPONENT' | null = useMemo(() => {
    if (!gameState || !userUid) return null;
    if (gameState.winnerUid) {
      return gameState.winnerUid === userUid ? 'YOU' : 'OPPONENT';
    }
    return null;
  }, [gameState, userUid]);

  return {
    board: boardMatrix,
    fen,
    turn: authoritativeTurn,
    gameStatus: authoritativeStatus,
    endReason,
    isDraw,
    myChessColor,
    opponentChessColor,
    isMyTurn,
    isGameOver,
    winner,
    checkSquare,
    selectedSquare,
    legalMoves,
    lastMove: gameState?.lastMove
      ? { from: gameState.lastMove.from, to: gameState.lastMove.to }
      : null,
    moveHistory: formattedMoveHistory,
    capturedByWhite,
    capturedByBlack,
    pendingPromotion,
    isSubmittingMove,
    isResigning,
    isClaimingVictory,
    isOpponentDisconnected,
    disconnectSecondsRemaining,
    disconnectState,
    moveError,
    rematchRequest:
      gameState?.rematchRequest && !isRematchExpired(gameState.rematchRequest.requestedAt)
        ? gameState.rematchRequest
        : null,
    rematchCount: gameState?.rematchCount || 0,
    handleSquareClick,
    completePromotion,
    cancelPromotion,
    requestRematch,
    respondToRematch,
    resign,
    claimVictory,
    clearError: () => setMoveError(null),
  };
};
