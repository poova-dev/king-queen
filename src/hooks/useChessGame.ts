import { useState, useCallback, useMemo } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { SquareData } from '../components/chess/ChessSquare';
import { PieceType, PieceColor } from '../components/chess/ChessPiece';
import { ChessMoveItem } from '../components/chess/MoveHistoryDrawer';

export type GameStatus =
  | 'YOUR_TURN'
  | 'OPPONENT_TURN'
  | 'CHECK'
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'DRAW';

export interface PendingPromotion {
  from: Square;
  to: Square;
  color: PieceColor;
}

export const useChessGame = (playerColor: 'w' | 'b' = 'w') => {
  // Initialize chess.js instance
  const [chess] = useState(() => new Chess());
  // Incrementing version to force re-renders when chess state mutates
  const [fen, setFen] = useState(() => chess.fen());

  // Interactive UI states
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  // Captured pieces state
  const [capturedByWhite, setCapturedByWhite] = useState<{ type: PieceType; color: PieceColor }[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<{ type: PieceType; color: PieceColor }[]>([]);

  // Move History state
  const [moveHistory, setMoveHistory] = useState<ChessMoveItem[]>([]);

  // Turn: 'w' or 'b'
  const turn = chess.turn();

  // King square in check
  const checkSquare = useMemo((): string | null => {
    if (!chess.inCheck()) return null;
    const currentTurn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          return `${files[c]}${8 - r}`;
        }
      }
    }
    return null;
  }, [fen, chess]);

  // Overall game status evaluation from chess.js single source of truth
  const gameStatus = useMemo((): GameStatus => {
    if (chess.isCheckmate()) return 'CHECKMATE';
    if (chess.isStalemate()) return 'STALEMATE';
    if (chess.isDraw()) return 'DRAW';
    if (chess.inCheck()) return 'CHECK';
    return turn === playerColor ? 'YOUR_TURN' : 'OPPONENT_TURN';
  }, [fen, turn, playerColor, chess]);

  // Winner calculation
  const winner = useMemo((): 'YOU' | 'OPPONENT' | null => {
    if (chess.isCheckmate()) {
      // If turn is White and White is checkmated, Black won.
      // If playerColor is White, opponent won.
      return turn === playerColor ? 'OPPONENT' : 'YOU';
    }
    return null;
  }, [fen, turn, playerColor, chess]);

  // Transform 8x8 chess.js board to our custom SquareData[][]
  const boardMatrix = useMemo((): SquareData[][] => {
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
  }, [fen, chess]);

  // Helper to re-build move history from chess.js history
  const updateMoveHistory = useCallback(() => {
    const history = chess.history();
    const formatted: ChessMoveItem[] = [];

    for (let i = 0; i < history.length; i += 2) {
      formatted.push({
        number: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
      });
    }

    setMoveHistory(formatted);
  }, [chess]);

  // Execute a validated move inside chess.js
  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceType) => {
      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotion || undefined,
        });

        if (moveResult) {
          // Track captures
          if (moveResult.captured) {
            const capturedPiece = {
              type: moveResult.captured as PieceType,
              color: (moveResult.color === 'w' ? 'b' : 'w') as PieceColor,
            };

            if (moveResult.color === 'w') {
              // White made the move, captured Black piece
              setCapturedByWhite((prev) => [...prev, capturedPiece]);
            } else {
              // Black made the move, captured White piece
              setCapturedByBlack((prev) => [...prev, capturedPiece]);
            }
          }

          setLastMove({ from, to });
          setSelectedSquare(null);
          setLegalMoves([]);
          setFen(chess.fen());
          updateMoveHistory();
          return true;
        }
      } catch {
        // Illegal move in chess.js
        return false;
      }
      return false;
    },
    [chess, updateMoveHistory]
  );

  // Handle square clicks: selection, legal move indicators, movement, and promotions
  const handleSquareClick = useCallback(
    (square: SquareData) => {
      const sqNotation = square.notation as Square;

      // 1. If a piece is already selected, check if clicked square is a legal destination
      if (selectedSquare) {
        // If clicking the currently selected square, deselect it
        if (selectedSquare === sqNotation) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        // Check if moving to this square is legal
        const moves = chess.moves({ square: selectedSquare, verbose: true });
        const targetMove = moves.find((m) => m.to === sqNotation);

        if (targetMove) {
          // Check if promotion is needed (flag 'p' or 'cp' or promotion property)
          if (targetMove.flags.includes('p') || targetMove.promotion) {
            setPendingPromotion({
              from: selectedSquare,
              to: sqNotation,
              color: (chess.get(selectedSquare)?.color === 'w' ? 'w' : 'b') as PieceColor,
            });
            return;
          }

          // Execute standard move
          makeMove(selectedSquare, sqNotation);
          return;
        }
      }

      // Check piece on square from chess engine state
      const pieceOnSquare = chess.get(sqNotation);

      // 2. If clicking a piece belonging to the current turn, select it and show legal moves
      if (pieceOnSquare && pieceOnSquare.color === turn) {
        setSelectedSquare(sqNotation);
        const moves = chess.moves({ square: sqNotation, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }

      // 3. Otherwise deselect
      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [chess, selectedSquare, turn, makeMove]
  );

  // Complete pending pawn promotion
  const completePromotion = useCallback(
    (pieceType: PieceType) => {
      if (!pendingPromotion) return;
      makeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
      setPendingPromotion(null);
    },
    [pendingPromotion, makeMove]
  );

  // Cancel promotion modal
  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  // Reset / Play Again
  const resetGame = useCallback(() => {
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setPendingPromotion(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMoveHistory([]);
  }, [chess]);

  return {
    board: boardMatrix,
    fen,
    turn,
    gameStatus,
    winner,
    isGameOver: chess.isGameOver(),
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isStalemate: chess.isStalemate(),
    isThreefoldRepetition: chess.isThreefoldRepetition(),
    isInsufficientMaterial: chess.isInsufficientMaterial(),
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
  };
};
