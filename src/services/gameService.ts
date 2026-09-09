import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Chess } from 'chess.js';
import {
  RoomDocument,
  GameStateDocument,
  GameMoveRecord,
  MoveHistoryEntry,
  MultiplayerGameStatus,
  ChessSide,
  RoomStatus,
  GameHistoryRecord,
  getOppositeChessSide,
  GameEndReason,
  GameResult,
} from '../types';
import {
  DEFAULT_TIME_CONTROL,
  calculateCurrentRemainingTime,
} from './timerService';

export const INITIAL_CHESS_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Initialize gameState inside rooms/{roomId} exactly once.
 * Protected by a Firestore transaction against duplicate or simultaneous calls.
 */
export const initializeGameState = async (roomId: string): Promise<GameStateDocument> => {
  const roomRef = doc(db, 'rooms', roomId);

  if (import.meta.env?.DEV) {
    console.log(`[Game] Initializing room: ${roomId}`);
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('ROOM_NOT_FOUND');
      }

      const room = roomSnap.data() as RoomDocument;

      // If gameState already exists, do not overwrite it (preserves refresh & reconnection)
      if (room.gameState && room.gameState.fen) {
        if (import.meta.env?.DEV) {
          console.log('[Game] Existing gameState detected');
        }
        return room.gameState;
      }

      // If room is already in a concluded state, do not re-initialize a new game
      if (
        room.status === 'FINISHED' ||
        room.status === 'COMPLETED' ||
        room.status === 'CLOSED' ||
        room.status === 'CANCELLED' ||
        room.status === 'ABANDONED'
      ) {
        if (import.meta.env?.DEV) {
          console.log('[Game] Room already concluded, skipping initialization');
        }
        if (room.gameState) return room.gameState;
        throw new Error('GAME_ALREADY_FINISHED');
      }

      if (import.meta.env?.DEV) {
        console.log('[Game] Creating initial gameState');
      }

      const initialTime = room.timeControl?.initialTime || DEFAULT_TIME_CONTROL.initialTime;

      const initialGameState: GameStateDocument = {
        fen: INITIAL_CHESS_FEN,
        turn: 'WHITE',
        status: 'PLAYING',
        checkedColor: null,
        lastMove: null,
        moveHistory: [],
        moveNumber: 0,
        version: 0,
        winnerUid: null,
        resignedBy: null,
        endReason: null,
        timer: {
          whiteTimeRemaining: initialTime,
          blackTimeRemaining: initialTime,
          activeTimerColor: 'WHITE',
          timerStartedAt: serverTimestamp(),
          timerPausedAt: null,
          status: 'RUNNING',
        },
        finishedAt: null,
        statsProcessed: false,
        rematchRequest: null,
        rematchCount: 0,
        updatedAt: serverTimestamp(),
      };

      // Use safe field paths with dot-notation to avoid conflicting transforms
      // (replacing ancestor object 'gameState' while applying descendant 'gameState.updatedAt' transform)
      transaction.update(roomRef, {
        'gameState.fen': INITIAL_CHESS_FEN,
        'gameState.turn': 'WHITE',
        'gameState.status': 'PLAYING',
        'gameState.checkedColor': null,
        'gameState.lastMove': null,
        'gameState.moveHistory': [],
        'gameState.moveNumber': 0,
        'gameState.version': 0,
        'gameState.winnerUid': null,
        'gameState.resignedBy': null,
        'gameState.endReason': null,
        'gameState.timer.whiteTimeRemaining': initialTime,
        'gameState.timer.blackTimeRemaining': initialTime,
        'gameState.timer.activeTimerColor': 'WHITE',
        'gameState.timer.timerStartedAt': serverTimestamp(),
        'gameState.timer.timerPausedAt': null,
        'gameState.timer.status': 'RUNNING',
        'gameState.finishedAt': null,
        'gameState.statsProcessed': false,
        'gameState.rematchRequest': null,
        'gameState.rematchCount': 0,
        'gameState.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (import.meta.env?.DEV) {
        console.log('[Timer] Initialized');
      }

      return initialGameState;
    });

    if (import.meta.env?.DEV) {
      console.log('[Game] Game initialization transaction completed');
    }

    return result;
  } catch (error: any) {
    // Handle failed-precondition / concurrency error gracefully:
    // Check if another concurrent client already successfully initialized gameState
    try {
      const freshSnap = await getDoc(roomRef);
      if (freshSnap.exists()) {
        const freshRoom = freshSnap.data() as RoomDocument;
        if (freshRoom.gameState && freshRoom.gameState.fen) {
          if (import.meta.env?.DEV) {
            console.log('[Game] Initialization recovered from concurrent player');
          }
          return freshRoom.gameState;
        }
      }
    } catch (recoveryErr) {
      if (import.meta.env?.DEV) {
        console.warn('[Game] Recovery check failed:', recoveryErr);
      }
    }

    if (import.meta.env?.DEV) {
      console.error(
        '[Game Initialization Error]',
        error?.code || 'unknown',
        error?.message || error
      );
    }

    throw error;
  }
};

/**
 * Execute an atomic chess move inside rooms/{roomId}.
 * Validates player identity, turn order, and legal move rules against
 * a fresh Chess instance created from the authoritative Firestore FEN.
 */
export const makeMove = async (
  roomId: string,
  playerUid: string,
  move: { from: string; to: string; promotion?: string }
): Promise<GameStateDocument> => {
  const roomRef = doc(db, 'rooms', roomId);

  return await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    // Verify room is in an active playing state
    if (room.status !== 'PLAYING' && room.status !== 'READY') {
      throw new Error('GAME_NOT_ACTIVE');
    }

    const currentGameState = room.gameState;
    if (!currentGameState) {
      throw new Error('GAME_NOT_INITIALIZED');
    }

    // Verify game is not already over
    if (
      currentGameState.status === 'FINISHED' ||
      currentGameState.status === 'CHECKMATE' ||
      currentGameState.status === 'DRAW' ||
      currentGameState.status === 'STALEMATE'
    ) {
      if (import.meta.env?.DEV) {
        console.log('[Game] Game already finished');
      }
      throw new Error('GAME_ALREADY_FINISHED');
    }

    // Verify calling user belongs to room
    const player = room.players.find((p) => p.uid === playerUid);
    if (!player || !player.chessColor) {
      throw new Error('NOT_AUTHORIZED');
    }

    // Strict turn enforcement
    if (currentGameState.turn !== player.chessColor) {
      throw new Error('NOT_YOUR_TURN');
    }

    // Authoritative Timer Validation & Deduction
    const initialTime = room.timeControl?.initialTime || DEFAULT_TIME_CONTROL.initialTime;
    const currentTimer = currentGameState.timer || {
      whiteTimeRemaining: initialTime,
      blackTimeRemaining: initialTime,
      activeTimerColor: currentGameState.turn,
      timerStartedAt: currentGameState.updatedAt || new Date(),
      timerPausedAt: null,
      status: 'RUNNING' as const,
    };

    // Calculate remaining time for moving player
    const nowMs = Date.now();
    const remainingTime = calculateCurrentRemainingTime(currentTimer, player.chessColor, nowMs);

    // Reject move if player's clock has expired
    if (remainingTime <= 0) {
      if (import.meta.env?.DEV) {
        console.log(`[Timer] Move rejected: TIME_EXPIRED for ${player.chessColor}`);
      }
      throw new Error('TIME_EXPIRED');
    }

    const updatedWhiteTime =
      player.chessColor === 'WHITE'
        ? remainingTime
        : (currentTimer.whiteTimeRemaining ?? initialTime);
    const updatedBlackTime =
      player.chessColor === 'BLACK'
        ? remainingTime
        : (currentTimer.blackTimeRemaining ?? initialTime);

    // Instantiate authoritative chess engine with move history replay for accurate 3-fold repetition detection
    const chess = new Chess();
    let replaySuccess = true;
    if (currentGameState.moveHistory && currentGameState.moveHistory.length > 0) {
      try {
        for (const entry of currentGameState.moveHistory) {
          chess.move(entry.san);
        }
      } catch {
        replaySuccess = false;
      }
    }
    if (!replaySuccess || !currentGameState.moveHistory?.length) {
      chess.load(currentGameState.fen);
    }

    // Attempt the requested move
    let moveResult = null;
    try {
      moveResult = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || undefined,
      });
    } catch {
      throw new Error('ILLEGAL_MOVE');
    }

    if (!moveResult) {
      throw new Error('ILLEGAL_MOVE');
    }

    // Generate new authoritative FEN & determine next turn
    const newFen = chess.fen();
    const nextTurn: ChessSide = chess.turn() === 'w' ? 'WHITE' : 'BLACK';

    if (import.meta.env?.DEV) {
      console.log('[Game] Evaluating position');
    }

    // Evaluate game status from chess.js
    const isCheckmate = chess.isCheckmate();
    const isStalemate = chess.isStalemate();
    const isThreefoldRepetition = chess.isThreefoldRepetition();
    const isInsufficientMaterial = chess.isInsufficientMaterial();
    const isDrawByFiftyMoves = chess.isDrawByFiftyMoves();
    const isDraw = chess.isDraw();
    const inCheck = chess.inCheck();

    let newStatus: MultiplayerGameStatus = 'PLAYING';
    let checkedColor: ChessSide | null = null;
    let winnerUid: string | null = null;
    let endReason: GameEndReason | null = null;
    let newRoomStatus: RoomStatus = room.status;

    if (isCheckmate) {
      newStatus = 'FINISHED';
      endReason = 'CHECKMATE';
      winnerUid = playerUid; // Current player delivered checkmate
      newRoomStatus = 'FINISHED';
      if (import.meta.env?.DEV) {
        console.log('[Game] Checkmate detected! Winner:', winnerUid);
      }
    } else if (isStalemate) {
      newStatus = 'FINISHED';
      endReason = 'STALEMATE';
      winnerUid = null;
      newRoomStatus = 'FINISHED';
      if (import.meta.env?.DEV) {
        console.log('[Game] Draw detected: STALEMATE');
      }
    } else if (isThreefoldRepetition) {
      newStatus = 'FINISHED';
      endReason = 'THREEFOLD_REPETITION';
      winnerUid = null;
      newRoomStatus = 'FINISHED';
      if (import.meta.env?.DEV) {
        console.log('[Game] Draw detected: THREEFOLD_REPETITION');
      }
    } else if (isInsufficientMaterial) {
      newStatus = 'FINISHED';
      endReason = 'INSUFFICIENT_MATERIAL';
      winnerUid = null;
      newRoomStatus = 'FINISHED';
      if (import.meta.env?.DEV) {
        console.log('[Game] Draw detected: INSUFFICIENT_MATERIAL');
      }
    } else if (isDrawByFiftyMoves) {
      newStatus = 'FINISHED';
      endReason = 'FIFTY_MOVE_RULE';
      winnerUid = null;
      newRoomStatus = 'FINISHED';
      if (import.meta.env?.DEV) {
        console.log('[Game] Draw detected: FIFTY_MOVE_RULE');
      }
    } else if (isDraw) {
      newStatus = 'FINISHED';
      endReason = 'DRAW';
      winnerUid = null;
      newRoomStatus = 'FINISHED';
      if (import.meta.env?.DEV) {
        console.log('[Game] Draw detected: DRAW');
      }
    } else if (inCheck) {
      newStatus = 'CHECK';
      checkedColor = nextTurn;
    }

    if (newStatus === 'FINISHED' && import.meta.env?.DEV) {
      console.log('[Game] Completing game transaction with reason:', endReason);
    }

    const lastMoveRecord: GameMoveRecord = {
      from: move.from,
      to: move.to,
      piece: moveResult.piece,
      color: player.chessColor,
      san: moveResult.san,
      promotion: moveResult.promotion || null,
      timestamp: new Date().toISOString(),
    };

    const historyEntry: MoveHistoryEntry = {
      moveNumber: Math.floor(currentGameState.moveNumber / 2) + 1,
      from: move.from,
      to: move.to,
      san: moveResult.san,
      color: player.chessColor,
      timestamp: new Date().toISOString(),
    };

    // Keep up to last 100 moves to prevent document size explosion
    const updatedHistory = [...(currentGameState.moveHistory || []), historyEntry].slice(-100);

    const nextTimerStatus = newStatus === 'FINISHED' ? 'STOPPED' : 'RUNNING';
    const nextActiveTimerColor = newStatus === 'FINISHED' ? null : nextTurn;

    const updatedGameState: GameStateDocument = {
      ...currentGameState,
      fen: newFen,
      turn: nextTurn,
      status: newStatus,
      checkedColor,
      lastMove: lastMoveRecord,
      moveHistory: updatedHistory,
      moveNumber: currentGameState.moveNumber + 1,
      version: currentGameState.version + 1,
      winnerUid,
      endReason,
      pendingPromotion: null,
      ...(currentGameState.drawOffer?.status === 'PENDING'
        ? { drawOffer: { ...currentGameState.drawOffer, status: 'EXPIRED' as const } }
        : {}),
      timer: {
        whiteTimeRemaining: updatedWhiteTime,
        blackTimeRemaining: updatedBlackTime,
        activeTimerColor: nextActiveTimerColor,
        timerStartedAt: serverTimestamp(),
        timerPausedAt: null,
        status: nextTimerStatus,
      },
      ...(newStatus === 'FINISHED' ? { finishedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    };

    transaction.update(roomRef, {
      gameState: updatedGameState,
      status: newRoomStatus,
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      if (newStatus === 'FINISHED') {
        console.log('[Timer] Game finished');
      } else {
        console.log(`[Timer] Turn switched to ${nextTurn}`);
      }
    }

    return updatedGameState;
  });
};

/**
 * Authoritative resignation transaction inside rooms/{roomId}.
 * Validates player identity, game status, sets opponent as winner,
 * and marks game as FINISHED with endReason RESIGNATION.
 */
export const resignGame = async (
  roomId: string,
  resigningUid: string
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  if (import.meta.env?.DEV) {
    console.log(`[Game] Resignation requested by ${resigningUid} in room ${roomId}`);
  }

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;

    // Verify room is in an active playing state
    if (room.status !== 'PLAYING' && room.status !== 'READY') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    const currentGameState = room.gameState;
    if (!currentGameState) {
      throw new Error('GAME_NOT_INITIALIZED');
    }

    // Verify game is not already concluded
    if (
      currentGameState.status === 'FINISHED' ||
      currentGameState.status === 'CHECKMATE' ||
      currentGameState.status === 'DRAW' ||
      currentGameState.status === 'STALEMATE'
    ) {
      if (import.meta.env?.DEV) {
        console.log('[Game] Game already finished');
      }
      throw new Error('GAME_ALREADY_FINISHED');
    }

    // Verify calling user belongs to room
    const resigningPlayer = room.players.find((p) => p.uid === resigningUid);
    if (!resigningPlayer) {
      throw new Error('NOT_ROOM_PARTICIPANT');
    }

    // Find the opponent who will be awarded victory
    const opponent = room.players.find((p) => p.uid !== resigningUid);
    if (!opponent || !opponent.uid) {
      throw new Error('OPPONENT_NOT_FOUND');
    }

    if (import.meta.env?.DEV) {
      console.log('[Game] Processing resignation transaction');
      console.log(`[Game] Player ${resigningUid} resigned`);
      console.log(`[Game] Opponent ${opponent.uid} declared winner`);
    }

    // Atomically transition gameState & room to FINISHED with RESIGNATION
    // Use dot notation to avoid replacing the complete gameState object
    transaction.update(roomRef, {
      'gameState.status': 'FINISHED',
      'gameState.endReason': 'RESIGNATION',
      'gameState.winnerUid': opponent.uid,
      'gameState.resignedBy': resigningUid,
      'gameState.timer.status': 'STOPPED',
      'gameState.finishedAt': serverTimestamp(),
      'gameState.updatedAt': serverTimestamp(),
      status: 'FINISHED',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log('[Timer] Game finished');
    }
  });
};

/**
 * Draw offer auto-expiration timeout (30 seconds)
 */
export const DRAW_OFFER_TIMEOUT_MS = 30 * 1000;

/**
 * Checks if a pending draw offer has expired (30 seconds)
 */
export const isDrawOfferExpired = (offeredAt?: any): boolean => {
  if (!offeredAt) return false;
  const time =
    typeof offeredAt === 'number'
      ? offeredAt
      : offeredAt?.toMillis
      ? offeredAt.toMillis()
      : typeof offeredAt === 'string'
      ? new Date(offeredAt).getTime()
      : 0;
  if (!time) return false;
  return Date.now() - time > DRAW_OFFER_TIMEOUT_MS;
};

/**
 * Propose a draw to the opponent.
 * Requires:
 * - Room and game status PLAYING
 * - User is a room participant
 * - No active, unexpired draw offer currently pending
 */
export const offerDraw = async (roomId: string, uid: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;
    const gameState = room.gameState;
    if (
      !gameState ||
      !['PLAYING', 'CHECK'].includes(gameState.status) ||
      !['PLAYING', 'CHECK'].includes(room.status as string)
    ) {
      throw new Error('GAME_NOT_PLAYING');
    }

    const isParticipant = room.players.some((p) => p.uid === uid);
    if (!isParticipant) {
      throw new Error('NOT_ROOM_PARTICIPANT');
    }

    // Guard: Only one active unexpired draw offer allowed
    if (gameState.drawOffer && gameState.drawOffer.status === 'PENDING') {
      if (!isDrawOfferExpired(gameState.drawOffer.offeredAt)) {
        throw new Error('DRAW_OFFER_ACTIVE');
      }
    }

    const now = Date.now();
    transaction.update(roomRef, {
      'gameState.drawOffer': {
        offeredBy: uid,
        offeredAt: now,
        expiresAt: now + DRAW_OFFER_TIMEOUT_MS,
        status: 'PENDING',
      },
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log(`[Game] Draw offer proposed by ${uid} in room ${roomId}`);
    }
  });
};

/**
 * Respond to an active draw offer.
 * If accepted: atomically ends the game with endReason = DRAW, stops timer, updates stats & history.
 * If declined: sets drawOffer status = DECLINED.
 */
export const respondToDrawOffer = async (
  roomId: string,
  uid: string,
  accept: boolean
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const room = roomSnap.data() as RoomDocument;
    const gameState = room.gameState;
    if (!gameState) {
      throw new Error('GAME_NOT_FOUND');
    }

    if (gameState.status === 'FINISHED' || room.status === 'FINISHED') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    const isParticipant = room.players.some((p) => p.uid === uid);
    if (!isParticipant) {
      throw new Error('NOT_ROOM_PARTICIPANT');
    }

    const drawOffer = gameState.drawOffer;
    if (!drawOffer || drawOffer.status !== 'PENDING') {
      throw new Error('NO_ACTIVE_DRAW_OFFER');
    }

    // Only the opponent (recipient) can accept or decline
    if (drawOffer.offeredBy === uid) {
      throw new Error('CANNOT_RESPOND_OWN_OFFER');
    }

    // Check 30-second expiration window
    if (isDrawOfferExpired(drawOffer.offeredAt)) {
      transaction.update(roomRef, {
        'gameState.drawOffer.status': 'EXPIRED',
        updatedAt: serverTimestamp(),
      });
      throw new Error('DRAW_OFFER_EXPIRED');
    }

    if (!accept) {
      transaction.update(roomRef, {
        'gameState.drawOffer.status': 'DECLINED',
        updatedAt: serverTimestamp(),
      });
      if (import.meta.env?.DEV) {
        console.log(`[Game] Draw offer declined by ${uid} in room ${roomId}`);
      }
      return;
    }

    // Accepted: Conclude battle peacefully as DRAW
    transaction.update(roomRef, {
      'gameState.status': 'FINISHED',
      'gameState.winnerUid': null,
      'gameState.endReason': 'DRAW',
      'gameState.drawOffer.status': 'ACCEPTED',
      'gameState.timer.status': 'STOPPED',
      'gameState.finishedAt': serverTimestamp(),
      'gameState.updatedAt': serverTimestamp(),
      status: 'FINISHED',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log(`[Game] Draw offer accepted by ${uid}. Match concluded peacefully.`);
    }
  });

  // Idempotently process game history & player stats for draw
  processGameStatsAndHistory(roomId).catch((err) => {
    if (import.meta.env?.DEV) {
      console.warn('[processGameStatsAndHistory Draw Error]', err);
    }
  });
};

/**
 * Updates or clears the pendingPromotion state in Firestore.
 * Allows the opponent to see "Opponent is choosing promotion..." in real time.
 */
export const setPendingPromotionState = async (
  roomId: string,
  uid: string,
  promotionState: { from: string; to: string } | null
): Promise<void> => {
  if (!roomId) return;
  const roomRef = doc(db, 'rooms', roomId);
  const payload = promotionState ? { ...promotionState, playerUid: uid } : null;
  await updateDoc(roomRef, {
    'gameState.pendingPromotion': payload,
    updatedAt: serverTimestamp(),
  }).catch(() => {});
};

/**
 * Rematch expiration timeout (5 minutes)
 */
export const REMATCH_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Checks if a pending rematch request has expired
 */
export const isRematchExpired = (requestedAt?: any): boolean => {
  if (!requestedAt) return false;
  const time =
    typeof requestedAt === 'number'
      ? requestedAt
      : requestedAt?.toMillis
      ? requestedAt.toMillis()
      : typeof requestedAt === 'string'
      ? new Date(requestedAt).getTime()
      : 0;
  if (!time) return false;
  return Date.now() - time > REMATCH_REQUEST_TIMEOUT_MS;
};

/**
 * Transaction-safe stats and history creation when match concludes.
 * Idempotent: creates history record in `games/{gameId}` and increments user stats exactly once.
 */
export const processGameStatsAndHistory = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const room = roomSnap.data() as RoomDocument;
    const gameState = room.gameState;
    if (!gameState) return;

    // Guard: Only process when game is finished and not yet processed
    if (gameState.statsProcessed) {
      if (import.meta.env?.DEV) {
        console.info(`[Game] Stats already processed for room ${roomId}`);
      }
      return;
    }

    if (room.historySaved) {
      if (import.meta.env?.DEV) {
        console.info(`[Game] History already exists for room ${roomId}`);
      }
      return;
    }

    if (
      gameState.status !== 'FINISHED' &&
      gameState.status !== 'CHECKMATE' &&
      gameState.status !== 'DRAW' &&
      gameState.status !== 'STALEMATE' &&
      room.status !== 'FINISHED'
    ) {
      if (import.meta.env?.DEV) {
        console.info(`[Game] Game not in terminal state for room ${roomId}`);
      }
      return;
    }

    if (import.meta.env?.DEV) {
      console.info(`[Game] Completing game transaction: saving history and stats for room ${roomId}`);
    }

    const player1 = room.players[0];
    const player2 = room.players[1];

    if (!player1 || !player2) return;

    const whitePlayer = player1.chessColor === 'WHITE' ? player1 : player2;
    const blackPlayer = player1.chessColor === 'BLACK' ? player1 : player2;

    const rematchNum = gameState.rematchCount || 0;
    const gameId = `${roomId}_${rematchNum}`;
    const gameRef = doc(db, 'games', gameId);

    const reason: GameEndReason =
      gameState.endReason ||
      (gameState.status === 'CHECKMATE'
        ? 'CHECKMATE'
        : gameState.status === 'STALEMATE'
        ? 'STALEMATE'
        : 'DRAW');

    const historyRecord: GameHistoryRecord = {
      id: gameId,
      roomId,
      whitePlayer: {
        uid: whitePlayer.uid,
        displayName: whitePlayer.displayName,
        photoURL: whitePlayer.photoURL,
        identity: whitePlayer.profileIdentity,
      },
      blackPlayer: {
        uid: blackPlayer.uid,
        displayName: blackPlayer.displayName,
        photoURL: blackPlayer.photoURL,
        identity: blackPlayer.profileIdentity,
      },
      playerUids: [whitePlayer.uid, blackPlayer.uid],
      winnerUid: gameState.winnerUid || null,
      result: reason,
      totalMoves: gameState.moveHistory?.length || gameState.moveNumber || 0,
      finalFen: gameState.fen,
      startedAt: room.createdAt || serverTimestamp(),
      completedAt: serverTimestamp(),
      rematchNumber: rematchNum,
      createdAt: serverTimestamp(),
    };

    transaction.set(gameRef, historyRecord);

    // Save individual history record for Player 1: users/{player1.uid}/gameHistory/{gameId}
    if (player1.uid) {
      const p1HistoryRef = doc(db, 'users', player1.uid, 'gameHistory', gameId);
      const isP1Winner = Boolean(gameState.winnerUid && gameState.winnerUid === player1.uid);
      const isP1Loser = Boolean(gameState.winnerUid && gameState.winnerUid !== player1.uid);
      const p1Result: GameResult = isP1Winner ? 'WIN' : isP1Loser ? 'LOSS' : 'DRAW';

      transaction.set(p1HistoryRef, {
        gameId,
        roomId,
        opponentUid: player2.uid,
        opponentName: player2.displayName || 'Opponent',
        opponentIdentity: player2.profileIdentity || null,
        opponentPhotoURL: player2.photoURL || null,
        playerColor: player1.chessColor || 'WHITE',
        result: p1Result,
        reason,
        totalMoves: historyRecord.totalMoves,
        finalFen: historyRecord.finalFen,
        playedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    // Save individual history record for Player 2: users/{player2.uid}/gameHistory/{gameId}
    if (player2.uid) {
      const p2HistoryRef = doc(db, 'users', player2.uid, 'gameHistory', gameId);
      const isP2Winner = Boolean(gameState.winnerUid && gameState.winnerUid === player2.uid);
      const isP2Loser = Boolean(gameState.winnerUid && gameState.winnerUid !== player2.uid);
      const p2Result: GameResult = isP2Winner ? 'WIN' : isP2Loser ? 'LOSS' : 'DRAW';

      transaction.set(p2HistoryRef, {
        gameId,
        roomId,
        opponentUid: player1.uid,
        opponentName: player1.displayName || 'Opponent',
        opponentIdentity: player1.profileIdentity || null,
        opponentPhotoURL: player1.photoURL || null,
        playerColor: player2.chessColor || 'BLACK',
        result: p2Result,
        reason,
        totalMoves: historyRecord.totalMoves,
        finalFen: historyRecord.finalFen,
        playedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    // Update Player 1 stats
    if (player1.uid) {
      const p1Ref = doc(db, 'users', player1.uid);
      const p1Snap = await transaction.get(p1Ref);
      if (p1Snap.exists()) {
        const p1Data = p1Snap.data();
        const isWinner = Boolean(gameState.winnerUid && gameState.winnerUid === player1.uid);
        const isLoser = Boolean(gameState.winnerUid && gameState.winnerUid !== player1.uid);
        transaction.update(p1Ref, {
          gamesPlayed: (p1Data.gamesPlayed || 0) + 1,
          wins: isWinner ? (p1Data.wins || 0) + 1 : p1Data.wins || 0,
          losses: isLoser ? (p1Data.losses || 0) + 1 : p1Data.losses || 0,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Update Player 2 stats
    if (player2.uid) {
      const p2Ref = doc(db, 'users', player2.uid);
      const p2Snap = await transaction.get(p2Ref);
      if (p2Snap.exists()) {
        const p2Data = p2Snap.data();
        const isWinner = Boolean(gameState.winnerUid && gameState.winnerUid === player2.uid);
        const isLoser = Boolean(gameState.winnerUid && gameState.winnerUid !== player2.uid);
        transaction.update(p2Ref, {
          gamesPlayed: (p2Data.gamesPlayed || 0) + 1,
          wins: isWinner ? (p2Data.wins || 0) + 1 : p2Data.wins || 0,
          losses: isLoser ? (p2Data.losses || 0) + 1 : p2Data.losses || 0,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Mark room historySaved and statsProcessed
    transaction.update(roomRef, {
      'gameState.statsProcessed': true,
      historySaved: true,
      status: 'FINISHED',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.info(`[Game] Game history saved & user stats updated for room ${roomId}`);
    }
  });
};

/**
 * Backward compatibility alias for processGameStatsAndHistory
 */
export const processGameStats = processGameStatsAndHistory;

/**
 * Request a rematch from opponent.
 * Includes timestamp for safe expiration.
 */
export const requestRematch = async (roomId: string, uid: string): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    if (import.meta.env?.DEV) {
      console.info(`[Rematch] Request received from ${uid} in room ${roomId}`);
    }

    transaction.update(roomRef, {
      'gameState.rematchRequest': {
        requestedBy: uid,
        requestedAt: Date.now(),
        status: 'PENDING',
      },
      status: 'REMATCH_PENDING',
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Respond to a rematch request.
 * If accepted, automatically swaps chess colors (WHITE <-> BLACK) and resets gameState.
 * If declined or expired, updates status and keeps room finished.
 */
export const respondToRematch = async (
  roomId: string,
  _uid: string,
  accept: boolean
): Promise<void> => {
  const roomRef = doc(db, 'rooms', roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const room = roomSnap.data() as RoomDocument;
    if (!room.gameState) return;

    // Check expiration
    if (isRematchExpired(room.gameState.rematchRequest?.requestedAt)) {
      if (import.meta.env?.DEV) {
        console.info(`[Rematch] Request expired in room ${roomId}`);
      }
      transaction.update(roomRef, {
        'gameState.rematchRequest.status': 'EXPIRED',
        status: 'COMPLETED',
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (!accept) {
      if (import.meta.env?.DEV) {
        console.info(`[Rematch] Request declined in room ${roomId}`);
      }
      transaction.update(roomRef, {
        'gameState.rematchRequest.status': 'DECLINED',
        status: 'COMPLETED',
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (import.meta.env?.DEV) {
      console.info(`[Rematch] Request accepted in room ${roomId}`);
    }

    // Swap chess colors between Player 1 and Player 2
    const updatedPlayers = room.players.map((p) => ({
      ...p,
      chessColor: p.chessColor ? getOppositeChessSide(p.chessColor) : null,
      ready: true,
    }));

    const rematchTime = room.timeControl?.initialTime || DEFAULT_TIME_CONTROL.initialTime;

    transaction.update(roomRef, {
      players: updatedPlayers,
      'gameState.fen': INITIAL_CHESS_FEN,
      'gameState.turn': 'WHITE',
      'gameState.status': 'PLAYING',
      'gameState.checkedColor': null,
      'gameState.lastMove': null,
      'gameState.moveHistory': [],
      'gameState.moveNumber': 0,
      'gameState.version': 0,
      'gameState.winnerUid': null,
      'gameState.resignedBy': null,
      'gameState.endReason': null,
      'gameState.timer.whiteTimeRemaining': rematchTime,
      'gameState.timer.blackTimeRemaining': rematchTime,
      'gameState.timer.activeTimerColor': 'WHITE',
      'gameState.timer.timerStartedAt': serverTimestamp(),
      'gameState.timer.timerPausedAt': null,
      'gameState.timer.status': 'RUNNING',
      'gameState.finishedAt': null,
      'gameState.statsProcessed': false,
      'gameState.rematchRequest': null,
      'gameState.rematchCount': (room.gameState.rematchCount || 0) + 1,
      'gameState.updatedAt': serverTimestamp(),
      historySaved: false,
      status: 'PLAYING',
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env?.DEV) {
      console.log('[Timer] Initialized');
    }
  });
};

/**
 * Query persistent game history for a user with in-memory sort fallback
 */
export const fetchUserGameHistory = async (
  uid: string,
  limitCount = 20
): Promise<GameHistoryRecord[]> => {
  if (!uid) return [];

  try {
    const q = query(
      collection(db, 'games'),
      where('playerUids', 'array-contains', uid),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const games = snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as GameHistoryRecord[];

    if (import.meta.env?.DEV) {
      console.info(`[History] Loaded ${games.length} games for user ${uid}`);
    }
    return games;
  } catch (err: any) {
    // Fallback if composite index on completedAt is not yet created
    try {
      const fallbackQ = query(
        collection(db, 'games'),
        where('playerUids', 'array-contains', uid),
        limit(limitCount)
      );
      const fallbackSnap = await getDocs(fallbackQ);
      const records = fallbackSnap.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id,
      })) as GameHistoryRecord[];

      records.sort((a, b) => {
        const timeA = a.completedAt?.toMillis
          ? a.completedAt.toMillis()
          : a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : 0;
        const timeB = b.completedAt?.toMillis
          ? b.completedAt.toMillis()
          : b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : 0;
        return timeB - timeA;
      });

      if (import.meta.env?.DEV) {
        console.info(`[History] Loaded ${records.length} games (fallback) for user ${uid}`);
      }
      return records;
    } catch (fallbackErr) {
      if (import.meta.env?.DEV) {
        console.warn('[fetchUserGameHistory Error]', fallbackErr);
      }
      return [];
    }
  }
};

/**
 * User-friendly game error mapping
 */
export const mapGameError = (error: any): string => {
  const code = error?.message || error?.code || '';

  switch (code) {
    case 'TIME_EXPIRED':
      return 'Your time has expired. You cannot make a move.';
    case 'NOT_YOUR_TURN':
      return "It is not your turn. Please wait for your opponent's move.";
    case 'ILLEGAL_MOVE':
      return 'That move is not legal according to royal chess rules.';
    case 'GAME_NOT_ACTIVE':
      return 'This game is currently not active.';
    case 'GAME_ALREADY_FINISHED':
      return 'This battle has already ended.';
    case 'DRAW_OFFER_ACTIVE':
      return 'A draw offer is already pending for this match.';
    case 'DRAW_OFFER_EXPIRED':
      return 'The draw offer has expired.';
    case 'NO_ACTIVE_DRAW_OFFER':
      return 'No active draw offer found.';
    case 'CANNOT_RESPOND_OWN_OFFER':
      return 'You cannot respond to your own draw offer.';
    case 'NOT_ROOM_PARTICIPANT':
    case 'NOT_AUTHORIZED':
      return 'You are not part of this battle.';
    case 'permission-denied':
      return 'Firestore permission denied. Check security rules.';
    default:
      return 'Failed to sync move with opponent. Please try again.';
  }
};
