import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/UI';
import {
  Copy,
  Share2,
  Check,
  Crown,
  Sparkles,
  AlertCircle,
  Sword,
  Shield,
  LogOut,
  Loader2,
} from 'lucide-react';
import { UserProfile, RoomDocument, CoinTossChoice, ChessSide } from '../types';
import { useRoom } from '../hooks/useRoom';
import { RoyalCoin } from '../components/room/RoyalCoin';
import { PlayerLobbyCard } from '../components/room/PlayerLobbyCard';

interface WaitingRoomScreenProps {
  user: UserProfile;
  room?: RoomDocument | null;
  onCancel: () => void;
  onStart: (room: RoomDocument) => void;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  user,
  onCancel,
  onStart,
}) => {
  const {
    currentRoom,
    roomLoading,
    roomError,
    isCreator,
    isJoiningPlayer,
    currentPlayer,
    opponent,
    myChessColor,
    tossWinner,
    setTossChoice,
    flipCoin,
    selectChessColor,
    setReady,
    leaveRoom,
    clearError,
  } = useRoom();

  const [copiedCode, setCopiedCode] = useState(false);
  const [sharedInvite, setSharedInvite] = useState(false);
  const [isFlippingLocal, setIsFlippingLocal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Auto-navigate to chess game when room status reaches PLAYING
  useEffect(() => {
    if (currentRoom?.status === 'PLAYING') {
      onStart(currentRoom);
    }
  }, [currentRoom?.status, currentRoom, onStart]);

  const roomCode = currentRoom?.roomCode || 'KQ-????';
  const creatorPlayer = currentRoom?.players[0] || null;
  const partnerPlayer = currentRoom?.players[1] || null;
  const hasPartnerJoined = Boolean(partnerPlayer);

  // Clipboard Copy
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Web Share or Clipboard Fallback
  const handleShareInvite = async () => {
    const inviteText = `Join me for a game of KING & QUEEN 👑♟️\nRoom Code: ${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KING & QUEEN Private Room',
          text: inviteText,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share was dismissed or failed
      }
    }

    try {
      await navigator.clipboard.writeText(inviteText);
      setSharedInvite(true);
      setTimeout(() => setSharedInvite(false), 2000);
    } catch {
      setSharedInvite(true);
      setTimeout(() => setSharedInvite(false), 2000);
    }
  };

  // Flip Royal Coin action
  const handleFlipCoin = async () => {
    setIsFlippingLocal(true);
    try {
      await flipCoin();
    } catch (err) {
      setIsFlippingLocal(false);
    }
  };

  // Confirm leave
  const handleConfirmLeave = async () => {
    setShowLeaveModal(false);
    await leaveRoom();
    onCancel();
  };

  // Check if room was cancelled by creator
  if (currentRoom?.status === 'CANCELLED') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-6 py-12 bg-[var(--background)] text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display uppercase tracking-widest text-[var(--text)] mb-2">
          Room Closed
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mb-8">
          The room host has left or closed this session.
        </p>
        <Button onClick={onCancel} className="px-8 h-12 font-semibold">
          RETURN HOME
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-[var(--background)] relative">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)]">
            ROYAL LOBBY
          </span>
          <h1 className="text-xl font-display text-[var(--text)] tracking-wider">
            {currentRoom?.status === 'WAITING'
              ? 'WAITING FOR PARTNER'
              : currentRoom?.status === 'COIN_TOSS'
              ? 'THE ROYAL TOSS'
              : currentRoom?.status === 'COLOR_SELECTION'
              ? 'COMMAND THE SIDE'
              : 'MATCH READY'}
          </h1>
        </div>

        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors"
          title="Leave Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-wider uppercase">LEAVE</span>
        </button>
      </header>

      {/* Error Alert Banner */}
      <AnimatePresence>
        {roomError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-between text-xs text-[var(--accent)]"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{roomError}</span>
            </div>
            <button
              onClick={clearError}
              className="text-[10px] underline font-bold uppercase ml-2 tracking-wider"
            >
              DISMISS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-between gap-6 pb-6">
        {/* Room Code Showcase Box */}
        <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--text-muted)]">
            PRIVATE ROOM CODE
          </span>
          <span className="text-3xl font-display font-bold tracking-[0.25em] text-[var(--primary)] select-all">
            {roomCode}
          </span>
          <div className="flex gap-2 w-full mt-1">
            <Button
              variant="secondary"
              onClick={handleCopyCode}
              className="flex-1 h-11 text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-bold">COPIED ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>COPY CODE</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleShareInvite}
              className="flex-1 h-11 text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5"
            >
              {sharedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-bold">INVITE COPIED</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>SHARE INVITE</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Players Head-to-Head Cards */}
        <div className="w-full max-w-sm flex items-center justify-between gap-2">
          <PlayerLobbyCard
            player={creatorPlayer}
            isCurrentUser={creatorPlayer?.uid === user.uid}
            expectedRole="KING"
            waitingText="Waiting..."
            showReadyStatus={currentRoom?.status === 'READY'}
          />

          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-xs font-display italic text-[var(--primary)] opacity-40 font-bold">
              VS
            </span>
          </div>

          <PlayerLobbyCard
            player={partnerPlayer}
            isCurrentUser={partnerPlayer?.uid === user.uid}
            expectedRole="QUEEN"
            waitingText="Waiting for partner..."
            showReadyStatus={currentRoom?.status === 'READY'}
          />
        </div>

        {/* Interactive Game Phase Sections */}
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* 1. WAITING FOR PARTNER */}
          {currentRoom?.status === 'WAITING' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 text-center my-4"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                    className="w-2 h-2 rounded-full bg-[var(--primary)]"
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-[var(--text)]">
                Waiting for your partner to join...
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Share the 4-digit code above. As soon as your partner enters, The Royal Toss will commence!
              </p>
            </motion.div>
          )}

          {/* 2. THE ROYAL TOSS PHASE */}
          {currentRoom?.status === 'COIN_TOSS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center gap-4 text-center"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-[var(--primary)] tracking-widest uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                  THE ROYAL TOSS 🪙
                </span>
                <p className="text-xs text-[var(--text-muted)] italic">
                  "Let fate decide who commands the choice."
                </p>
              </div>

              {/* Step A: Partner has NOT chosen Heads or Tails yet */}
              {!partnerPlayer?.tossChoice && (
                <div className="w-full mt-2">
                  {isJoiningPlayer ? (
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold tracking-wider uppercase text-[var(--text)]">
                        CHOOSE YOUR CALL
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setTossChoice('HEADS')}
                          disabled={roomLoading}
                          className="h-16 flex flex-col items-center justify-center border-[var(--primary)]/40 hover:border-[var(--primary)]"
                        >
                          <span className="text-lg">♔</span>
                          <span className="text-xs font-display font-bold tracking-wider">
                            HEADS
                          </span>
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setTossChoice('TAILS')}
                          disabled={roomLoading}
                          className="h-16 flex flex-col items-center justify-center border-[var(--primary)]/40 hover:border-[var(--primary)]"
                        >
                          <span className="text-lg">♕</span>
                          <span className="text-xs font-display font-bold tracking-wider">
                            TAILS
                          </span>
                        </Button>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Your partner will automatically receive the opposite call.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                      <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                        YOUR PARTNER IS CHOOSING...
                      </span>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Partner is selecting Heads or Tails. You will automatically receive the counterpart.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step B: Partner has chosen, Coin is ready to flip */}
              {partnerPlayer?.tossChoice && (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)]">PARTNER:</span>
                      <span className="text-[var(--primary)] font-bold">
                        {partnerPlayer.tossChoice}
                      </span>
                    </div>
                    <span className="text-[var(--border)]">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)]">HOST:</span>
                      <span className="text-[var(--primary)] font-bold">
                        {creatorPlayer?.tossChoice}
                      </span>
                    </div>
                  </div>

                  {/* 3D Animated Royal Coin */}
                  <RoyalCoin
                    coinResult={currentRoom.coinResult}
                    isFlipping={isFlippingLocal}
                  />

                  {/* Flip button for Joining Player vs Waiting state for Host */}
                  {isJoiningPlayer ? (
                    <Button
                      onClick={handleFlipCoin}
                      disabled={roomLoading || isFlippingLocal || currentRoom.coinResult !== null}
                      className="w-full h-14 font-semibold tracking-wider mt-2 shadow-lg"
                    >
                      {isFlippingLocal ? 'THE COIN IS SPINNING...' : 'FLIP THE ROYAL COIN 🪙'}
                    </Button>
                  ) : (
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)] mt-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                      <span>YOUR PARTNER IS FLIPPING THE COIN...</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. COLOR SELECTION PHASE */}
          {currentRoom?.status === 'COLOR_SELECTION' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center gap-4 text-center"
            >
              {/* Coin with result badge */}
              <RoyalCoin
                coinResult={currentRoom.coinResult}
                isFlipping={false}
              />

              {/* Toss Winner Announcement */}
              <div className="flex flex-col items-center gap-1">
                {tossWinner?.uid === user.uid ? (
                  <>
                    <span className="text-base font-display font-bold text-[var(--primary)] tracking-widest uppercase flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-[var(--primary)]" />
                      YOU WON THE ROYAL TOSS!
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      "You command the choice of battlefield."
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-display font-bold text-[var(--text)] tracking-wider uppercase">
                      YOUR PARTNER WON THE TOSS
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      "Waiting for their decision on the battlefield side..."
                    </p>
                  </>
                )}
              </div>

              {/* Winner Side Picker vs Opponent Waiting Banner */}
              {tossWinner?.uid === user.uid ? (
                <div className="w-full flex flex-col gap-3 mt-2">
                  <span className="text-xs font-bold tracking-widest uppercase text-[var(--text)]">
                    CHOOSE YOUR SIDE
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => selectChessColor('WHITE')}
                      disabled={roomLoading}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--surface-light)] transition-all flex flex-col items-center gap-2 group text-left"
                    >
                      <span className="text-3xl text-[#FFF8DC]">♔</span>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs font-display font-bold tracking-wider text-[var(--text)]">
                          WHITE
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Make the first move.
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => selectChessColor('BLACK')}
                      disabled={roomLoading}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--surface-light)] transition-all flex flex-col items-center gap-2 group text-left"
                    >
                      <span className="text-3xl text-[#8E8E93]">♚</span>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xs font-display font-bold tracking-wider text-[var(--text)]">
                          BLACK
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Play from the shadows.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center gap-2.5 text-xs text-[var(--text-muted)] mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>YOUR PARTNER IS CHOOSING THE SIDE...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* 4. READY PHASE */}
          {currentRoom?.status === 'READY' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center gap-5 text-center mt-2"
            >
              {/* Assigned Side Card */}
              <div className="w-full p-4 rounded-2xl bg-[var(--surface)] border border-[var(--primary)]/40 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-2xl">
                    {myChessColor === 'WHITE' ? '♔' : '♚'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                      YOUR SIDE
                    </span>
                    <span className="text-sm font-bold text-[var(--primary)] tracking-wider">
                      {myChessColor === 'WHITE' ? '♔ WHITE (FIRST MOVE)' : '♚ BLACK (DEFENDER)'}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                  ASSIGNED
                </div>
              </div>

              {/* Ready action button */}
              <div className="w-full flex flex-col gap-2">
                {currentPlayer?.ready ? (
                  <div className="w-full h-14 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center gap-2 text-green-400 font-display font-bold tracking-widest text-sm">
                    <Check className="w-5 h-5 text-green-400" />
                    YOU ARE READY ✓
                  </div>
                ) : (
                  <Button
                    onClick={() => setReady()}
                    disabled={roomLoading}
                    className="w-full h-14 font-semibold tracking-wider shadow-xl"
                  >
                    I AM READY
                  </Button>
                )}

                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {opponent?.ready
                    ? 'Your opponent is confirmed and ready!'
                    : 'Waiting for both monarchs to confirm readiness.'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Leave Room Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
            >
              <h3 className="text-lg font-display text-[var(--text)] uppercase tracking-wider">
                Leave Room?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {isCreator
                  ? 'If you leave as host, the room will be cancelled and closed for your partner.'
                  : 'Leaving will return you to the home dashboard.'}
              </p>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 h-11 text-xs font-semibold"
                >
                  STAY
                </Button>
                <Button
                  onClick={handleConfirmLeave}
                  className="flex-1 h-11 text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white border-none"
                >
                  LEAVE
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
