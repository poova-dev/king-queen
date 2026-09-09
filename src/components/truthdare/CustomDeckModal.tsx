import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  FolderPlus,
  Check,
  Globe,
  Lock,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  TruthDareCustomDeck,
  TruthDareCard,
  TruthDareMode,
  TruthDareCategory,
  TruthDareDifficulty,
} from '../../types';
import {
  getUserCustomDecks,
  createCustomDeck,
  deleteCustomDeck,
  addCardToDeck,
  deleteCardFromDeck,
} from '../../services/customDeckService';
import { getCategoryDefinitions } from '../../lib/truthDareCards';

interface CustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerUid: string;
  selectedDeckId?: string | null;
  onSelectDeck?: (deck: TruthDareCustomDeck | null) => void;
}

export const CustomDeckModal: React.FC<CustomDeckModalProps> = ({
  isOpen,
  onClose,
  ownerUid,
  selectedDeckId,
  onSelectDeck,
}) => {
  const [decks, setDecks] = useState<TruthDareCustomDeck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDeck, setActiveDeck] = useState<TruthDareCustomDeck | null>(null);

  // New deck form state
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [creatingLoading, setCreatingLoading] = useState(false);

  // New card form state
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);
  const [cardMode, setCardMode] = useState<TruthDareMode>('TRUTH');
  const [cardCategory, setCardCategory] = useState<TruthDareCategory>('FRIENDSHIP');
  const [cardDifficulty, setCardDifficulty] = useState<TruthDareDifficulty>('EASY');
  const [cardText, setCardText] = useState('');
  const [cardLoading, setCardLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ownerUid) return;
    setLoading(true);
    setErrorMessage(null);
    getUserCustomDecks(ownerUid)
      .then((userDecks) => {
        setDecks(userDecks);
        if (selectedDeckId) {
          const found = userDecks.find((d) => d.id === selectedDeckId);
          if (found) setActiveDeck(found);
        }
      })
      .catch((err) => {
        setErrorMessage('Failed to load decks. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, ownerUid, selectedDeckId]);

  if (!isOpen) return null;

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreatingLoading(true);
    setErrorMessage(null);

    try {
      const created = await createCustomDeck(
        ownerUid,
        newTitle,
        newDescription,
        newVisibility
      );
      setDecks((prev) => [created, ...prev]);
      setActiveDeck(created);
      setIsCreatingDeck(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating deck');
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this custom deck?')) return;
    try {
      await deleteCustomDeck(deckId, ownerUid);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      if (activeDeck?.id === deckId) {
        setActiveDeck(null);
        onSelectDeck?.(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting deck');
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !cardText.trim()) return;
    setCardLoading(true);
    setErrorMessage(null);

    try {
      const newCard = await addCardToDeck(activeDeck.id, ownerUid, {
        type: cardMode,
        category: cardCategory,
        difficulty: cardDifficulty,
        text: cardText.trim(),
      });

      const updatedDeck = {
        ...activeDeck,
        cards: [...(activeDeck.cards || []), newCard],
        cardsCount: (activeDeck.cardsCount || 0) + 1,
      };

      setActiveDeck(updatedDeck);
      setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
      setIsAddingCard(false);
      setCardText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error adding card');
    } finally {
      setCardLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!activeDeck) return;
    try {
      await deleteCardFromDeck(activeDeck.id, ownerUid, cardId);
      const updatedCards = (activeDeck.cards || []).filter((c) => c.id !== cardId);
      const updatedDeck = {
        ...activeDeck,
        cards: updatedCards,
        cardsCount: updatedCards.length,
      };
      setActiveDeck(updatedDeck);
      setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting card');
    }
  };

  const categories = getCategoryDefinitions(cardMode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-deck-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)] to-[var(--background)]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            <h2
              id="custom-deck-modal-title"
              className="font-display font-bold text-sm tracking-wider uppercase text-[var(--text)]"
            >
              {activeDeck ? activeDeck.title : 'Custom Decks'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/30 transition-colors"
            aria-label="Close custom deck modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Loading Decks...
              </span>
            </div>
          ) : activeDeck ? (
            /* DECK DETAIL & CARDS VIEW */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDeck(null);
                    setIsAddingCard(false);
                  }}
                  className="text-xs text-[var(--primary)] font-bold tracking-wider hover:underline"
                >
                  ← All Decks
                </button>
                <div className="flex items-center gap-2">
                  {onSelectDeck && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDeck(activeDeck);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-lg bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                      Use Deck
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteDeck(activeDeck.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label="Delete this deck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)]">{activeDeck.description || 'No description'}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)] font-medium">
                  <span>{activeDeck.cards?.length || 0} Cards</span>
                  <span>•</span>
                  <span>{activeDeck.visibility}</span>
                </div>
              </div>

              {/* Add Card Form or Toggle */}
              {isAddingCard ? (
                <form onSubmit={handleAddCard} className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] flex flex-col gap-3">
                  <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text)]">
                    Add New Card
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCardMode('TRUTH')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        cardMode === 'TRUTH'
                          ? 'bg-[var(--primary)] text-black'
                          : 'bg-[var(--surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      Truth
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardMode('DARE')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        cardMode === 'DARE'
                          ? 'bg-rose-500 text-white'
                          : 'bg-[var(--surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      Dare
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                        Category
                      </label>
                      <select
                        value={cardCategory}
                        onChange={(e) => setCardCategory(e.target.value as TruthDareCategory)}
                        className="w-full mt-1 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                        Difficulty
                      </label>
                      <select
                        value={cardDifficulty}
                        onChange={(e) => setCardDifficulty(e.target.value as TruthDareDifficulty)}
                        className="w-full mt-1 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none"
                      >
                        <option value="EASY">🟢 Easy</option>
                        <option value="MEDIUM">🟡 Medium</option>
                        <option value="HARD">🔴 Hard</option>
                        <option value="EXTREME">👑 Extreme</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      Card Prompt
                    </label>
                    <textarea
                      required
                      value={cardText}
                      onChange={(e) => setCardText(e.target.value)}
                      placeholder="Write your custom prompt here..."
                      rows={3}
                      className="w-full mt-1 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCard(false)}
                      className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={cardLoading || !cardText.trim()}
                      className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                    >
                      {cardLoading ? 'Saving...' : 'Save Card'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCard(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Card to Deck</span>
                </button>
              )}

              {/* Cards List */}
              <div className="flex flex-col gap-2 mt-1">
                {activeDeck.cards && activeDeck.cards.length > 0 ? (
                  activeDeck.cards.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              card.type === 'TRUTH'
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {card.type}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase">
                            {card.category} • {card.difficulty}
                          </span>
                        </div>
                        <p className="text-[var(--text)] mt-0.5">{card.text}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        aria-label="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-xs text-[var(--text-muted)] italic">
                    No cards in this deck yet. Add your first card above!
                  </p>
                )}
              </div>
            </div>
          ) : isCreatingDeck ? (
            /* CREATE DECK FORM */
            <form onSubmit={handleCreateDeck} className="flex flex-col gap-4">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text)]">
                Create New Custom Deck
              </h3>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Deck Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., College Nights, Couple Fun"
                  className="w-full mt-1.5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this deck..."
                  rows={2}
                  className="w-full mt-1.5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setNewVisibility('PRIVATE')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all ${
                      newVisibility === 'PRIVATE'
                        ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]'
                        : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVisibility('PUBLIC')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all ${
                      newVisibility === 'PUBLIC'
                        ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]'
                        : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingDeck(false)}
                  className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLoading || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Deck</span>
                </button>
              </div>
            </form>
          ) : (
            /* DECKS LIST VIEW */
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingDeck(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/40 hover:border-[var(--primary)] text-[var(--primary)] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create Custom Deck</span>
              </button>

              {decks.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 mt-1">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      onClick={() => setActiveDeck(deck)}
                      className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/50 flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-[var(--border)]/10"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-xs text-[var(--text)] uppercase tracking-wider">
                            {deck.title}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {deck.visibility === 'PUBLIC' ? '🌐' : '🔒'}
                          </span>
                        </div>
                        {deck.description && (
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                            {deck.description}
                          </p>
                        )}
                        <span className="text-[9px] text-[var(--primary)] font-medium mt-0.5">
                          {deck.cards?.length || 0} Cards
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectDeck && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDeck(deck);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-black font-bold text-[10px] uppercase tracking-wider transition-colors"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <BookOpen className="w-8 h-8 opacity-40 text-[var(--primary)]" />
                  <p className="text-xs">No custom decks yet.</p>
                  <p className="text-[10px] max-w-xs">
                    Create your own custom Truth or Dare decks with personalized questions and dares!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
