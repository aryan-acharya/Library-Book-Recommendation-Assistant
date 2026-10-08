import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BookCard, Cover } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../components/UIComponents';

export default function SimilarBooks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetBook, setTargetBook] = useState(null);
  const [similarList, setSimilarList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedModalBook, setSelectedModalBook] = useState(null);

  const initialBookId = searchParams.get('bookId') || 'B07470'; // Default to "The Silent Patient"

  useEffect(() => {
    loadSimilar(initialBookId);
  }, [initialBookId]);

  async function loadSimilar(id) {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.similar(id);
      setTargetBook(data.book);
      setSimilarList(data.similar || []);
    } catch (err) {
      console.error('Similar books load error:', err);
      setError(err.message || 'Failed to load similar books.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBookSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const res = await api.search(q, 1, 6);
      setSearchResults(res.books || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSelectBook(book) {
    setSearchParams({ bookId: book.id });
    setSearchResults([]);
    setSearchQuery('');
    loadSimilar(book.id);
  }

  return (
    <div className="similar-books-page-container">
      {/* 1. Header */}
      <PageHeader
        title="Similar Books"
        accentText="Explorer"
        description="Find books semantically and structurally related to any title using shared genres, subgenres, moods, themes, and keywords."
        icon="🔗"
      />

      {/* 2. Base Book Picker & Spotlight */}
      <section className="similar-picker-card">
        <div className="picker-header-row">
          <div className="picker-title-group">
            <span className="picker-icon">🎯</span>
            <div>
              <h3>Choose a Base Book</h3>
              <p>Search any book in the Knowledge Base to compute its closest semantic neighbors</p>
            </div>
          </div>

          <form className="similar-search-input-form" onSubmit={handleBookSearch}>
            <input
              type="text"
              placeholder="Search by title or author (e.g. Verity, Dune)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-small-primary" disabled={searchLoading}>
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Results Dropdown / Picker */}
        {searchResults.length > 0 ? (
          <div className="similar-search-dropdown-results">
            <div className="results-head">Click a book to set as base:</div>
            <div className="results-grid-compact">
              {searchResults.map((b) => (
                <div
                  key={b.id}
                  className="compact-select-card"
                  onClick={() => handleSelectBook(b)}
                >
                  <Cover src={b.image} alt={b.title} className="thumb" />
                  <div className="text">
                    <strong>{b.title}</strong>
                    <span>
                      {b.author} · {b.genre} · ★ {b.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Spotlight on Base Book */}
        {targetBook ? (
          <div className="target-book-banner-card">
            <div className="target-book-cover-wrap">
              <Cover src={targetBook.image} alt={targetBook.title} className="target-cover" />
            </div>

            <div className="target-book-details">
              <div className="target-badges-row">
                <span className="badge-pill active-base">Active Base Book</span>
                <span className="badge-pill">{targetBook.genre}</span>
                {targetBook.mood && targetBook.mood !== 'Neutral' ? (
                  <span className="badge-pill">{targetBook.mood} Mood</span>
                ) : null}
                <span className="badge-pill rating">★ {targetBook.score}</span>
              </div>

              <h2 className="target-title">{targetBook.title}</h2>
              <p className="target-author">by {targetBook.author}</p>

              <p className="target-desc">
                {targetBook.description
                  ? `${targetBook.description.slice(0, 240)}...`
                  : 'No extended description available in catalog.'}
              </p>

              {targetBook.themes && targetBook.themes.length > 0 ? (
                <div className="target-themes-row">
                  <span className="theme-label">Key Themes:</span>
                  {targetBook.themes.slice(0, 4).map((t) => (
                    <span key={t} className="tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {/* 3. Loading State */}
      {loading ? (
        <LoadingState message="Computing attribute & semantic similarities across the catalog..." />
      ) : null}

      {/* 4. Error State */}
      {error && !loading ? (
        <ErrorState
          error={error}
          onRetry={() => loadSimilar(initialBookId)}
          onBack={() => loadSimilar('B07470')}
        />
      ) : null}

      {/* 5. Similar Books Results Section */}
      {!loading && !error && similarList.length > 0 ? (
        <section className="similar-results-section">
          <div className="results-header-bar">
            <h2>
              Books Semantically Similar to “{targetBook?.title}”
            </h2>
            <span className="page-summary-tag">{similarList.length} Related Books Found</span>
          </div>

          <div className="similar-books-grid">
            {similarList.map((book) => {
              // Build shared signals element to attach into standard card
              const sharedSignals = (
                <div className="shared-signals-wrap">
                  {book.sharedGenre ? (
                    <span className="signal-chip match">✓ Same Genre ({book.genre})</span>
                  ) : null}
                  {book.sharedMood ? (
                    <span className="signal-chip match">✓ Same Mood ({book.mood})</span>
                  ) : null}
                  {(book.sharedThemes || []).slice(0, 1).map((t) => (
                    <span key={t} className="signal-chip">
                      Theme: {t}
                    </span>
                  ))}
                </div>
              );

              return (
                <BookCard
                  key={book.id}
                  book={book}
                  similarity={book.similarityScore}
                  extraAction={sharedSignals}
                  onSelect={(b) => setSelectedModalBook(b)}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 6. Empty State */}
      {!loading && !error && similarList.length === 0 && targetBook ? (
        <EmptyState
          icon="🔗"
          title="No closely related books found"
          message="No books in the Knowledge Base matched enough shared attributes with this title. Try picking another base book."
          actionText="Pick The Silent Patient"
          onAction={() => handleSelectBook({ id: 'B07470' })}
        />
      ) : null}

      {/* 7. Book Details Modal */}
      {selectedModalBook ? (
        <BookDetailsModal
          bookId={selectedModalBook.id}
          bookData={selectedModalBook}
          onClose={() => setSelectedModalBook(null)}
        />
      ) : null}
    </div>
  );
}
