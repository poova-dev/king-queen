import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Copy,
  Check,
  Crown,
  Sparkles,
  Users,
  CheckCircle2,
  Hourglass,
  LogOut,
  Shield,
  Loader2,
  Share2,
  Play,
  KeyRound,
  PlusCircle,
} from 'lucide-react';
import { Button, Avatar } from '../components/UI';
import { UserProfile } from '../types';
import { useTruthDareRoom } from '../hooks/useTruthDareRoom';

interface TruthDareLobbyScreenProps {
  user: UserProfile;
  onBack: () => void;
  onBothReady: () => void;
}

export const TruthDareLobbyScreen: React.FC<TruthDareLobbyScreenProps> = ({
  user,
  onBack,
  onBothReady,
}) => {
  const {
    currentRoom,
    isCreator,
    myPlayer,
    partnerPlayer,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    loading,
    error,
    clearError,
  } = useTruthDareRoom();

  const [copied, setCopied] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>('CREATE');

  // Watch for session start transition
  useEffect(() => {
    if (currentRoom && currentRoom.status === 'PLAYING') {
      const timer = setTimeout(() => {
        onBothReady();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentRoom?.status, onBothReady]);

  const handleCopyCode = async () => {
    if (!currentRoom?.roomCode) return;
    try {
      await navigator.clipboard.writeText(currentRoom.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.warn('[TruthDare] Clipboard write failed', err);
    }
  };

  const handleShareInvite = async () => {
    if (!currentRoom?.roomCode) return;
    const shareData = {
      title: 'King & Queen — Truth or Dare',
      text: `Join my private Truth or Dare chamber on King & Queen! Room Code: ${currentRoom.roomCode}`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleStartGame = async () => {
    if (!isCreator || isStartingGame) return;
    setIsStartingGame(true);
    try {
      await startGame();
    } catch (err) {
      console.error('[TruthDare] Failed to start game', err);
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeaveModalOpen(false);
    await leaveRoom();
    onBack();
  };

  const handleCreateRoom = async () => {
    try {
      clearError();
      await createRoom();
    } catch (err) {
      console.error('[TruthDare] Create room failed', err);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    try {
      clearError();
      await joinRoom(joinCodeInput);
    } catch (err) {
      console.error('[TruthDare] Join room failed', err);
    }
  };

  const creatorPlayer = currentRoom?.players.find((p) => p.role === 'CREATOR');
  const guestPlayer = currentRoom?.players.find((p) => p.role === 'PARTNER');
  const hasTwoPlayers = Boolean(currentRoom && currentRoom.players.length === 2);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]/40">
        <button
          onClick={() => {
            if (currentRoom) {
              setIsLeaveModalOpen(true);
            } else {
              onBack();
            }
          }}
          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-400 hover:border-rose-500/40 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-rose-400 uppercase">
              {currentRoom ? 'PRIVATE CHAMBER' : 'MULTIPLAYER LOBBY'}
            </span>
          </div>
          <h1 className="text-sm font-display tracking-widest uppercase text-[var(--text)]">
            TRUTH OR DARE 😈
          </h1>
        </div>

        {currentRoom ? (
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-400 transition-colors"
            aria-label="Exit chamber"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[var(--primary)]/70" />
          </div>
        )}
      </header>

      {/* MAIN BODY */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col justify-between gap-6 pb-28">
        {/* CASE 1: NOT YET IN A ROOM -> CREATE OR JOIN TABS */}
        {!currentRoom && (
          <div className="flex flex-col gap-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.25)]">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-display tracking-widest uppercase text-[var(--text)]">
                PRIVATE MULTIPLAYER
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Two players. One royal chamber. Create a secret room or enter with your partner's code.
              </p>
            </div>

            {/* SEGMENTED TAB */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <button
                onClick={() => setActiveTab('CREATE')}
                className={`py-2.5 rounded-xl text-xs font-display tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'CREATE'
                    ? 'bg-rose-900/60 border border-rose-500/50 text-rose-100 shadow-md font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] font-medium'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>CREATE</span>
              </button>
              <button
                onClick={() => setActiveTab('JOIN')}
                className={`py-2.5 rounded-xl text-xs font-display tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'JOIN'
                    ? 'bg-rose-900/60 border border-rose-500/50 text-rose-100 shadow-md font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] font-medium'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>JOIN</span>
              </button>
            </div>

            {/* TAB CONTENT: CREATE */}
            {activeTab === 'CREATE' && (
              <div className="rounded-3xl bg-[var(--surface)] border border-rose-900/40 p-6 flex flex-col items-center text-center gap-4 shadow-xl">
                <span className="text-[10px] font-bold tracking-[0.2em] text-rose-400 uppercase">
                  HOST A NEW CHAMBER
                </span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Generate a private room code and invite your sovereign partner to play in real-time.
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full h-12 font-display text-xs tracking-widest uppercase bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border border-rose-500/50 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.45)]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>CREATING ROOM...</span>
                    </div>
                  ) : (
                    'CREATE PRIVATE ROOM'
                  )}
                </Button>
              </div>
            )}

            {/* TAB CONTENT: JOIN */}
            {activeTab === 'JOIN' && (
              <form
                onSubmit={handleJoinRoom}
                className="rounded-3xl bg-[var(--surface)] border border-rose-900/40 p-6 flex flex-col items-center text-center gap-4 shadow-xl"
              >
                <span className="text-[10px] font-bold tracking-[0.2em] text-rose-400 uppercase">
                  ENTER ROOM CODE
                </span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Type your partner's 4-digit code (e.g. TD-7K9P).
                </p>

                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="TD-____"
                  maxLength={7}
                  className="w-full text-center tracking-[0.25em] font-mono text-2xl py-3 px-4 rounded-xl bg-[var(--background)] border border-rose-900/60 focus:border-rose-500 focus:outline-none text-[var(--primary)] uppercase font-bold"
                />

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || !joinCodeInput.trim()}
                  className="w-full h-12 font-display text-xs tracking-widest uppercase bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border border-rose-500/50 text-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.45)]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>JOINING...</span>
                    </div>
                  ) : (
                    'JOIN WITH ROOM CODE'
                  )}
                </Button>
              </form>
            )}

            {error && (
              <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-center font-bold tracking-wide">
                {error}
              </div>
            )}
          </div>
        )}

        {/* CASE 2: IN AN ACTIVE ROOM */}
        {currentRoom && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* ROOM CODE DISPLAY CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#180E16] via-[var(--surface)] to-[var(--surface)] border border-rose-900/50 p-6 flex flex-col items-center text-center gap-3 shadow-[0_4px_30px_rgba(225,29,72,0.12)]">
              <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase">
                YOUR PRIVATE ROOM
              </span>

              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono font-black tracking-[0.2em] text-[var(--primary)] uppercase drop-shadow-[0_2px_12px_rgba(184,155,94,0.3)]">
                  {currentRoom.roomCode}
                </span>

                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                    copied
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-600/40 text-rose-300 hover:bg-rose-900/50'
                  }`}
                  aria-label="Copy room code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareInvite}
                  className="p-2 rounded-xl bg-rose-950/60 border border-rose-600/40 text-rose-300 hover:bg-rose-900/50 transition-colors"
                  aria-label="Share invite"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {hasTwoPlayers
                  ? 'Both royals are seated in the private chamber.'
                  : 'Waiting for your partner... Share this code to enter.'}
              </p>

              {/* Toast feedback */}
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>✓ ROOM CODE COPIED!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PARTNER ARRIVED BANNER */}
            {hasTwoPlayers && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-rose-950/90 border border-rose-500/60 flex flex-col items-center justify-center text-center gap-1 shadow-lg animate-in fade-in zoom-in-95">
                <span className="text-xs font-display tracking-widest text-rose-200 font-bold uppercase flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[var(--primary)] animate-pulse" />
                  YOUR PARTNER HAS ARRIVED 👑
                </span>
                <span className="text-[10px] tracking-wider text-rose-300/80 uppercase font-semibold">
                  BOTH PLAYERS ARE READY
                </span>
              </div>
            )}

            {/* PLAYERS SECTION */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--primary)] uppercase pl-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                PLAYERS (2 MAX)
              </span>

              {/* PLAYER 1: HOST / CREATOR */}
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar
                    size="md"
                    src={creatorPlayer?.photoURL}
                    className="border-2 border-[var(--primary)]"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {creatorPlayer?.displayName || 'Host'}
                      </span>
                      {creatorPlayer?.uid === user.uid && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold tracking-widest uppercase">
                      <Crown className="w-3 h-3" />
                      <span>👑 {creatorPlayer?.identity || 'KING'} • CREATOR</span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  READY
                </span>
              </div>

              {/* PLAYER 2: GUEST / PARTNER */}
              {guestPlayer ? (
                <div className="rounded-2xl bg-[var(--surface)] border border-rose-900/40 p-4 flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="md"
                      src={guestPlayer.photoURL}
                      className="border-2 border-rose-500/50"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {guestPlayer.displayName}
                        </span>
                        {guestPlayer.uid === user.uid && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold tracking-widest uppercase">
                        <Shield className="w-3 h-3" />
                        <span>👑 {guestPlayer.identity || 'QUEEN'} • PARTNER</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    READY
                  </span>
                </div>
              ) : (
                /* ANIMATED WAITING PLACEHOLDER */
                <div className="rounded-2xl border-2 border-dashed border-rose-900/40 p-6 flex flex-col items-center justify-center gap-3 text-center bg-rose-950/15">
                  <div className="w-11 h-11 rounded-full border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                    <Hourglass className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                      WAITING FOR YOUR PARTNER...
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] max-w-xs">
                      A private invitation has been created. Share your royal room code.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* STICKY BOTTOM ACTION BAR (ONLY WHEN IN ROOM) */}
      {currentRoom && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent border-t border-[var(--border)]/30 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            {hasTwoPlayers ? (
              isCreator ? (
                <Button
                  variant="primary"
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                  className="w-full h-14 font-display text-xs tracking-widest uppercase bg-gradient-to-r from-rose-900 via-rose-700 to-rose-950 border border-rose-400/60 text-white shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:shadow-[0_0_40px_rgba(225,29,72,0.6)] flex items-center justify-center gap-2"
                >
                  {isStartingGame ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>STARTING THE GAME...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>START GAME 😈</span>
                    </>
                  )}
                </Button>
              ) : (
                <div className="w-full h-12 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-center gap-2 text-xs font-bold text-rose-200 uppercase tracking-wider animate-pulse">
                  <Hourglass className="w-4 h-4 text-rose-400" />
                  <span>WAITING FOR CREATOR TO START...</span>
                </div>
              )
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsLeaveModalOpen(true)}
                className="w-full h-12 font-display text-xs tracking-widest uppercase border-[var(--border)] text-[var(--text-muted)] hover:text-rose-400 hover:border-rose-500/40"
              >
                LEAVE ROOM
              </Button>
            )}
          </div>
        </footer>
      )}

      {/* LEAVE CONFIRMATION MODAL */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs rounded-3xl bg-[var(--surface)] border border-rose-900/50 p-6 flex flex-col items-center text-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-400">
              <LogOut className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-display tracking-wider text-[var(--text)] uppercase">
                LEAVE ROOM?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {isCreator
                  ? 'If you leave, this private room will be closed.'
                  : 'You will leave the chamber and return to the main hall.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                onClick={handleConfirmLeave}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase transition-colors"
              >
                LEAVE ROOM
              </button>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-medium tracking-wide transition-colors"
              >
                STAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
