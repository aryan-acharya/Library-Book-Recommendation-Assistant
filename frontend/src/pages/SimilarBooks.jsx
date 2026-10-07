import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Cover } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { isFavorite, toggleFavorite } from '../libraryStore';

export default function SimilarBooks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetBook, setTargetBook] = useState(null);
  const [similarList, setSimilarList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
      setError(err.message || 'Failed to load similar books.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBookSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.search(searchQuery.trim(), 1, 6);
      setSearchResults(res.books || []);
    } catch {
      setSearchResults([]);
    }
  }

  function handleSelectBook(book) {
    setSearchParams({ bookId: book.id });
    setSearchResults([]);
    setSearchQuery('');
    loadSimilar(book.id);
  }

  return (
    <div className="similar-books-page">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>Similar Books Explorer</h1>
          <p>
            Find books semantically and structurally related to any title using shared genres, subgenres, moods, themes, and keywords.
          </p>
        </div>

        {/* Quick Search to Pick Book */}
        <form className="similar-search-form" onSubmit={handleBookSearch}>
          <input
            type="text"
            placeholder="Change base book (e.g. Verity, Dune)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-small-primary">Search</button>
        </form>
      </header>

      {/* Search dropdown results if searching */}
      {searchResults.length > 0 ? (
        <div className="similar-search-dropdown-results">
          <div className="results-head">Select a base book:</div>
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
                  <span>{b.author} · {b.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Target Book Spotlight */}
      {targetBook ? (
        <div className="target-book-banner">
          <div className="target-book-cover-wrap">
            <Cover src={targetBook.image} alt={targetBook.title} className="target-cover" />
          </div>
          <div className="target-book-details">
            <span className="badge-pill">Target Base Book</span>
            <h2>{targetBook.title}</h2>
            <p className="author">by {targetBook.author}</p>
            <div className="tags-row">
              <span className="pill">{targetBook.genre}</span>
              <span className="pill">{targetBook.mood}</span>
              <span className="pill">{targetBook.readingLevel}</span>
              <span className="pill rating">★ {targetBook.score}</span>
            </div>
            <p className="desc">{targetBook.description?.slice(0, 240)}...</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="loading-state-banner">
          <div className="loading-pulse-spinner"></div>
          <p>Computing semantic and attribute similarities across 10,538 books...</p>
        </div>
      ) : null}

      {error ? <div className="error-alert-card">{error}</div> : null}

      {/* Similar Books Grid */}
      {!loading && similarList.length > 0 ? (
        <section className="similar-results-section">
          <h2>Books Similar to “{targetBook?.title}”</h2>
          <div className="similar-books-grid">
            {similarList.map((book) => {
              const fav = isFavorite(book.id);
              return (
                <div
                  key={book.id}
                  className="similar-book-card"
                  onClick={() => setSelectedModalBook(book)}
                >
                  <div className="card-top-badges">
                    <span className="similarity-badge">
                      {book.similarityScore}% Match
                    </span>
                    <button
                      type="button"
                      className={`fav-btn-icon ${fav ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(book);
                      }}
                      title={fav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {fav ? '♥' : '♡'}
                    </button>
                  </div>

                  <div className="cover-wrap">
                    <Cover src={book.image} alt={book.title} />
                  </div>

                  <div className="similar-card-body">
                    <h3 title={book.title}>{book.title}</h3>
                    <p className="author">{book.author}</p>
                    <div className="rating-row">
                      <span className="star">★</span>
                      <span>{book.score}</span>
                      <span className="dot">·</span>
                      <span className={`status-pill-small ${book.availability?.toLowerCase()}`}>
                        {book.availability}
                      </span>
                    </div>

                    <div className="shared-signals">
                      {book.sharedGenre ? (
                        <span className="signal-chip match">✓ Same Genre ({book.genre})</span>
                      ) : null}
                      {book.sharedMood ? (
                        <span className="signal-chip match">✓ Same Mood ({book.mood})</span>
                      ) : null}
                      {(book.sharedThemes || []).slice(0, 2).map((t) => (
                        <span key={t} className="signal-chip">Theme: {t}</span>
                      ))}
                      {(book.sharedKeywords || []).slice(0, 2).map((k) => (
                        <span key={k} className="signal-chip subtle">#{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedModalBook ? (
        <BookDetailsModal
          bookData={selectedModalBook}
          onClose={() => setSelectedModalBook(null)}
        />
      ) : null}
    </div>
  );
}
