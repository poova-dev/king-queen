import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  LogOut,
  Flame,
  Shield,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  Heart,
  Crown,
  BookOpen,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/UI';
import {
  UserProfile,
  TruthDareMode,
  TruthDareCategory,
  TruthDareDifficulty,
  TruthDareCustomDeck,
} from '../types';
import { useTruthDareRoom } from '../hooks/useTruthDareRoom';
import { getCardById } from '../lib/truthDareCards';
import { CategorySelector } from '../components/truthdare/CategorySelector';
import { DifficultySelector } from '../components/truthdare/DifficultySelector';
import { CustomDeckModal } from '../components/truthdare/CustomDeckModal';

interface TruthDareGameScreenProps {
  user: UserProfile;
  onExit: () => void;
}

export const TruthDareGameScreen: React.FC<TruthDareGameScreenProps> = ({
  user,
  onExit,
}) => {
  const {
    currentRoom,
    leaveRoom,
    selectTruthOrDare,
    completeRound,
    error,
  } = useTruthDareRoom();

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCompletingRound, setIsCompletingRound] = useState(false);

  // Challenger local selection choices before draw
  const [chosenMode, setChosenMode] = useState<TruthDareMode>('TRUTH');
  const [chosenCategory, setChosenCategory] = useState<TruthDareCategory | null>('FRIENDSHIP');
  const [chosenDifficulty, setChosenDifficulty] = useState<TruthDareDifficulty | null>('EASY');
  const [activeCustomDeck, setActiveCustomDeck] = useState<TruthDareCustomDeck | null>(null);

  const session = currentRoom?.session ?? null;
  const myPlayer = currentRoom?.players.find((p) => p.uid === user.uid);
  const partnerPlayer = currentRoom?.players.find((p) => p.uid !== user.uid);

  const isMyTurn = session?.currentPlayerUid === user.uid;
  const phase = session?.phase ?? 'INITIALIZING';
  const round = session?.round ?? 1;

  const card = getCardById(
    session?.selectedCardId,
    activeCustomDeck?.cards
  );

  const handleConfirmExit = async () => {
    setIsExitModalOpen(false);
    await leaveRoom();
    onExit();
  };

  const handleDrawCard = async () => {
    if (isSelecting || !isMyTurn || phase !== 'CHOOSING') return;
    setIsSelecting(true);
    try {
      await selectTruthOrDare({
        mode: chosenMode,
        category: chosenCategory,
        difficulty: chosenDifficulty,
        deckType: activeCustomDeck ? 'CUSTOM' : 'BUILT_IN',
        deckId: activeCustomDeck?.id || null,
      });
    } catch {
      // error shown via context
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCompleteRound = async () => {
    if (isCompletingRound || phase !== 'RESPONDING') return;
    setIsCompletingRound(true);
    try {
      await completeRound();
    } catch {
      // error shown via context
    } finally {
      setIsCompletingRound(false);
    }
  };

  // ─── PHASE: INITIALIZING ─────────────────────────────────────────────────
  if (phase === 'INITIALIZING') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none items-center justify-center gap-6 px-6">
        <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
        <p className="text-xs font-display tracking-widest text-rose-300 uppercase">
          INITIALIZING SESSION...
        </p>
      </div>
    );
  }

  // ─── PHASE: CHOOSING ─────────────────────────────────────────────────────
  if (phase === 'CHOOSING') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none">
        <Header round={round} onExit={() => setIsExitModalOpen(true)} />

        <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col items-center justify-between gap-6 pb-12">
          {/* Players Row with Challenger / Judge Roles */}
          <PlayerRow
            myPlayer={myPlayer}
            partnerPlayer={partnerPlayer}
            isMyTurn={isMyTurn}
          />

          {isMyTurn ? (
            /* MY TURN — Challenger Choice Form */
            <motion.div
              key="my-choose"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center gap-5 my-auto"
            >
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[10px] font-bold tracking-[0.25em] text-rose-400 uppercase">
                  YOUR TURN • CHALLENGER
                </span>
                <h2 className="text-xl font-display tracking-widest text-[var(--text)] uppercase">
                  CUSTOMIZE YOUR CHALLENGE
                </h2>
                <p className="text-xs text-[var(--text-muted)] max-w-xs">
                  Select mode, category, and difficulty level before drawing.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="w-full flex gap-3">
                <button
                  id="td-truth-btn"
                  type="button"
                  aria-label="Select Truth Mode"
                  onClick={() => {
                    setChosenMode('TRUTH');
                    setChosenCategory('FRIENDSHIP');
                  }}
                  className={`flex-1 py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-display text-xs font-bold tracking-widest uppercase transition-all ${
                    chosenMode === 'TRUTH'
                      ? 'bg-gradient-to-b from-[var(--primary)]/25 to-[var(--primary)]/5 border-[var(--primary)] text-[var(--primary)] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                      : 'bg-[var(--surface)]/70 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]/50 hover:text-[var(--text)]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>TRUTH</span>
                </button>

                <button
                  id="td-dare-btn"
                  type="button"
                  aria-label="Select Dare Mode"
                  onClick={() => {
                    setChosenMode('DARE');
                    setChosenCategory('FUNNY');
                  }}
                  className={`flex-1 py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-display text-xs font-bold tracking-widest uppercase transition-all ${
                    chosenMode === 'DARE'
                      ? 'bg-gradient-to-b from-rose-500/25 to-rose-500/5 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-[var(--surface)]/70 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]/50 hover:text-[var(--text)]'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>DARE</span>
                </button>
              </div>

              {/* Category Selector */}
              <CategorySelector
                mode={chosenMode}
                selectedCategory={chosenCategory}
                onSelectCategory={(cat) => setChosenCategory(cat)}
                disabled={isSelecting}
              />

              {/* Difficulty Selector */}
              <DifficultySelector
                selectedDifficulty={chosenDifficulty}
                onSelectDifficulty={(diff) => setChosenDifficulty(diff)}
                disabled={isSelecting}
              />

              {/* Deck Source Bar */}
              <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--surface)]/60 border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs text-[var(--text)] font-medium">
                    Deck: {activeCustomDeck ? activeCustomDeck.title : 'Built-in Royal Deck'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeckModalOpen(true)}
                  className="text-xs text-[var(--primary)] hover:underline font-bold tracking-wider uppercase"
                >
                  {activeCustomDeck ? 'Change' : 'Custom Decks'}
                </button>
              </div>

              {/* Draw Action Button */}
              <button
                id="td-draw-card-btn"
                type="button"
                onClick={handleDrawCard}
                disabled={isSelecting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-amber-400 text-black font-display text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSelecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DRAWING CARD...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>DRAW ROYAL CARD</span>
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            /* OPPONENT'S TURN — Waiting UI */
            <motion.div
              key="wait-choose"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center gap-6 my-auto"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--surface-light)] border border-[var(--border)] flex items-center justify-center text-2xl text-[var(--text-muted)]">
                    👑
                  </div>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--primary)] uppercase">
                  ROUND {String(round).padStart(2, '0')} • {partnerPlayer?.displayName?.toUpperCase()}'S TURN
                </span>
                <h2 className="text-lg font-display tracking-wider text-[var(--text)] uppercase">
                  WAITING FOR {partnerPlayer?.displayName?.toUpperCase() || 'PARTNER'}
                </h2>
                <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
                  {partnerPlayer?.displayName || 'Your partner'} is selecting category and difficulty 😈
                </p>
              </div>

              <div className="w-full flex gap-3 opacity-40 pointer-events-none">
                <div className="flex-1 py-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center gap-1 text-[var(--text-muted)] font-display text-xs tracking-widest uppercase">
                  <Shield className="w-5 h-5" />
                  <span>TRUTH</span>
                </div>
                <div className="flex-1 py-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center gap-1 text-[var(--text-muted)] font-display text-xs tracking-widest uppercase">
                  <Flame className="w-5 h-5" />
                  <span>DARE</span>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <Button
            variant="secondary"
            onClick={() => setIsExitModalOpen(true)}
            className="w-full h-11 text-xs font-display tracking-widest uppercase rounded-xl"
          >
            LEAVE SESSION
          </Button>
        </main>

        <ExitModal
          isOpen={isExitModalOpen}
          onConfirm={handleConfirmExit}
          onCancel={() => setIsExitModalOpen(false)}
        />

        <CustomDeckModal
          isOpen={isDeckModalOpen}
          onClose={() => setIsDeckModalOpen(false)}
          ownerUid={user.uid || ''}
          selectedDeckId={activeCustomDeck?.id}
          onSelectDeck={(deck) => setActiveCustomDeck(deck)}
        />
      </div>
    );
  }

  // ─── PHASE: RESPONDING ────────────────────────────────────────────────────
  if (phase === 'RESPONDING') {
    const isTruth = session?.selectedMode === 'TRUTH';
    const modeLabel = isTruth ? 'TRUTH' : 'DARE';
    const modeColor = isTruth
      ? 'text-[var(--primary)] border-[var(--primary)]/40 bg-[var(--primary)]/10'
      : 'text-rose-300 border-rose-500/40 bg-rose-950/40';
    const modeIcon = isTruth ? (
      <Shield className="w-4 h-4 text-[var(--primary)]" />
    ) : (
      <Flame className="w-4 h-4 text-rose-400" />
    );

    return (
      <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none">
        <Header round={round} onExit={() => setIsExitModalOpen(true)} />

        <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col items-center justify-between gap-6 pb-12">
          <PlayerRow
            myPlayer={myPlayer}
            partnerPlayer={partnerPlayer}
            isMyTurn={isMyTurn}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${session?.selectedCardId}`}
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full flex flex-col items-center my-auto motion-reduce:transition-none motion-reduce:animate-none"
            >
              {/* Badges Bar */}
              <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-widest uppercase ${modeColor}`}
                >
                  {modeIcon}
                  <span>{modeLabel}</span>
                </div>

                {session?.selectedCategory && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[10px] font-bold tracking-wider text-[var(--text)] uppercase">
                    <span>{session.selectedCategory}</span>
                  </div>
                )}

                {session?.selectedDifficulty && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[10px] font-bold tracking-wider text-[var(--primary)] uppercase">
                    <span>{session.selectedDifficulty}</span>
                  </div>
                )}
              </div>

              {/* Card Container */}
              <div className="w-full rounded-3xl bg-gradient-to-b from-[var(--surface)] to-[var(--background)] border border-[var(--border)]/90 p-6 sm:p-7 shadow-2xl flex flex-col gap-4 text-center">
                {card ? (
                  <>
                    <p className="text-[var(--text)] text-base sm:text-lg font-medium leading-relaxed">
                      "{card.text}"
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div
                        className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${
                          card.intensity === 'SOFT'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30'
                            : card.intensity === 'MEDIUM'
                            ? 'text-amber-400 border-amber-500/30 bg-amber-950/30'
                            : 'text-rose-400 border-rose-500/30 bg-rose-950/30'
                        }`}
                      >
                        INTENSITY: {card.intensity || card.difficulty || 'STANDARD'}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[var(--text-muted)] text-sm italic">
                    Card details synchronizing...
                  </p>
                )}
              </div>

              {/* Context text */}
              <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 tracking-widest uppercase font-mono">
                {isMyTurn
                  ? 'YOU are on the hot seat — answer or perform!'
                  : `${partnerPlayer?.displayName || 'Partner'} must complete this challenge!`}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              id="td-complete-round-btn"
              onClick={handleCompleteRound}
              disabled={isCompletingRound}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-amber-400 text-black font-display text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isCompletingRound ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isCompletingRound ? 'ADVANCING...' : 'DONE — NEXT ROUND'}</span>
            </button>

            {error && (
              <p className="text-xs text-rose-400 text-center">{error}</p>
            )}

            <Button
              variant="secondary"
              onClick={() => setIsExitModalOpen(true)}
              className="w-full h-10 text-xs font-display tracking-widest uppercase rounded-xl"
            >
              LEAVE SESSION
            </Button>
          </div>
        </main>

        <ExitModal
          isOpen={isExitModalOpen}
          onConfirm={handleConfirmExit}
          onCancel={() => setIsExitModalOpen(false)}
        />
      </div>
    );
  }

  // ─── FALLBACK ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--text)] select-none items-center justify-center gap-4 px-6">
      <Sparkles className="w-8 h-8 text-rose-400 animate-spin" />
      <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">
        Syncing session...
      </p>
    </div>
  );
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Header({
  round,
  onExit,
}: {
  round: number;
  onExit: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--background)]/85 backdrop-blur-md border-b border-[var(--border)]/40">
      <button
        onClick={onExit}
        className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-label="Exit Game"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[10px] font-bold tracking-[0.25em] text-rose-400 uppercase">
            ROUND {String(round).padStart(2, '0')}
          </span>
        </div>
        <h1 className="text-xs sm:text-sm font-display tracking-widest uppercase text-[var(--text)]">
          TRUTH OR DARE 😈
        </h1>
      </div>

      <button
        onClick={onExit}
        className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        aria-label="Leave Session"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}

function PlayerRow({
  myPlayer,
  partnerPlayer,
  isMyTurn,
}: {
  myPlayer: any;
  partnerPlayer: any;
  isMyTurn: boolean;
}) {
  return (
    <div className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)]/80 p-3 flex items-center justify-between shadow-sm">
      {/* My Player */}
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="text-xs font-semibold text-[var(--text)]">
            {myPlayer?.displayName || 'You'}
          </span>
        </div>
        <span
          className={`text-[8px] font-bold tracking-wider px-1.5 py-0.2 rounded uppercase ${
            isMyTurn
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-[var(--surface-light)] text-[var(--text-muted)] border border-[var(--border)]'
          }`}
        >
          {isMyTurn ? 'CHALLENGER' : 'JUDGE'}
        </span>
      </div>

      <span className="text-xs font-serif italic text-rose-400 font-bold px-2">
        vs
      </span>

      {/* Partner Player */}
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--text)]">
            {partnerPlayer?.displayName || 'Partner'}
          </span>
          <Crown className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <span
          className={`text-[8px] font-bold tracking-wider px-1.5 py-0.2 rounded uppercase ${
            !isMyTurn
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-[var(--surface-light)] text-[var(--text-muted)] border border-[var(--border)]'
          }`}
        >
          {!isMyTurn ? 'CHALLENGER' : 'JUDGE'}
        </span>
      </div>
    </div>
  );
}

function ExitModal({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xs rounded-3xl bg-[var(--surface)] border border-rose-900/50 p-6 flex flex-col items-center text-center gap-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-center text-rose-400">
          <LogOut className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-display tracking-wider text-[var(--text)] uppercase">
            LEAVE CURRENT GAME?
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Exiting will end your participation in this private session.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            LEAVE SESSION
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-medium tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
