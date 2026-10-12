import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import {
  getFavorites,
  removeFavorite,
  setBookShelf,
} from '../libraryStore';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'rating-desc' | 'rating-asc' | 'title' | 'author'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'bookshelf' | 'list'
  const [selectedBook, setSelectedBook] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    function onStorage() {
      setFavorites(getFavorites());
    }
    window.addEventListener('libraai_store_update', onStorage);
    return () => window.removeEventListener('libraai_store_update', onStorage);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  function showToast(msg) {
    setToastMessage(msg);
  }

  // Calculate unique genres with counts from favorites
  const genreOptions = useMemo(() => {
    const counts = {};
    favorites.forEach((b) => {
      if (b.genre && b.genre !== 'Unknown') {
        counts[b.genre] = (counts[b.genre] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
    return sorted;
  }, [favorites]);


  // Filter and sort favorites
  const filtered = useMemo(() => {
    let list = [...favorites];

    // Filter by genre
    if (selectedGenre !== 'all') {
      list = list.filter((b) => b.genre === selectedGenre);
    }

    // Filter by search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q) ||
          (b.genre || '').toLowerCase().includes(q) ||
          (b.mood || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'rating-desc') {
      list.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    } else if (sortBy === 'rating-asc') {
      list.sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'author') {
      list.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    }

    return list;
  }, [favorites, selectedGenre, search, sortBy]);

  function handleRemove(id, title, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    removeFavorite(id);
    showToast(`Removed "${title || 'Book'}" from saved favorites.`);
  }

  function handleStartReading(book, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    setBookShelf(book, 'reading');
    showToast(`Added "${book.title}" to Currently Reading shelf!`);
  }

  return (
    <div className="favorites-page-v2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="favorites-floating-toast">
          <span className="toast-icon">♥</span>
          <span className="toast-text">{toastMessage}</span>
        </div>
      )}

      {/* Atmospheric Hero Banner */}
      <section className="favorites-hero-sanctuary">
        <div className="hero-sanctuary-content">
          <div className="hero-sanctuary-header">
            <div className="hero-sanctuary-badge rose-badge">
              <span className="badge-sparkle">♥</span>
              <span>Curated Wishlist & Bookmarks</span>
            </div>
            <h1 className="hero-sanctuary-title">
              Saved Favorites <span className="title-gradient-rose">& Literary Treasures</span>
            </h1>
            <p className="hero-sanctuary-desc">
              Your handpicked personal catalog: manage bookmarked reads, explore genre affinities,
              launch study schedules, and discover similar titles with AI reasoning.
            </p>
          </div>

          {/* Hero Action Controls */}
          <div className="hero-sanctuary-actions">
            <Link to="/recommend" className="btn-hero-primary rose-gradient">
              <span className="btn-icon">⚡</span>
              <span>AI Recommendations</span>
            </Link>
            <Link to="/library" className="btn-hero-secondary">
              <span className="btn-icon">📚</span>
              <span>My Library Hub</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="hero-sanctuary-ambient-glow rose-glow" />
      </section>

      {/* Main Content Area */}
      {favorites.length === 0 ? (
        <div className="aesthetic-favorites-empty-card">
          <div className="empty-halo-icon rose-halo">
            <span className="empty-emoji">♥</span>
            <div className="empty-pulse-halo rose-pulse" />
          </div>
          <h2 className="empty-title">Your favorites wishlist is empty</h2>
          <p className="empty-desc">
            You haven’t bookmarked any titles yet. Explore curated AI recommendations or search
            the 10,538-book digital library to build your reading wishlist.
          </p>
          <div className="empty-actions-row">
            <button
              type="button"
              className="btn-empty-action rose-btn"
              onClick={() => navigate('/recommend')}
            >
              ⚡ Explore Recommendations
            </button>
            <button
              type="button"
              className="btn-empty-secondary"
              onClick={() => navigate('/search')}
            >
              🔍 Browse Catalog
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Genre & Affinity Filter Bar */}
          {genreOptions.length > 0 && (
            <div className="favorites-genre-filter-strip">
              <span className="filter-strip-label">Filter by Genre:</span>
              <div className="genre-chips-scroll">
                <button
                  type="button"
                  className={`genre-chip-btn ${selectedGenre === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedGenre('all')}
                >
                  All Genres ({favorites.length})
                </button>
                {genreOptions.map(({ genre, count }) => (
                  <button
                    key={genre}
                    type="button"
                    className={`genre-chip-btn ${selectedGenre === 'genre' ? 'active' : ''} ${
                      selectedGenre === genre ? 'active' : ''
                    }`}
                    onClick={() => setSelectedGenre(selectedGenre === genre ? 'all' : genre)}
                  >
                    {genre} <span className="chip-count">({count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Command Toolbar (Search, Sort & View Mode) */}
          <div className="favorites-command-toolbar">
            <div className="toolbar-left-info">
              <span className="toolbar-count-badge">
                Showing <strong>{filtered.length}</strong> of {favorites.length} saved{' '}
                {favorites.length === 1 ? 'book' : 'books'}
              </span>
              {(search || selectedGenre !== 'all') && (
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearch('');
                    setSelectedGenre('all');
                  }}
                >
                  Reset filters ✕
                </button>
              )}
            </div>

            <div className="toolbar-controls-cluster">
              {/* Instant Search Field */}
              <div className="favorites-search-input-box">
                <span className="search-symbol">🔍</span>
                <input
                  type="text"
                  placeholder="Search favorites by title, author, mood..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="favorites-search-field"
                />
                {search && (
                  <button
                    type="button"
                    className="btn-clear-search-field"
                    onClick={() => setSearch('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="favorites-sort-box">
                <label htmlFor="favorites-sort-select" className="sr-only">
                  Sort Saved Books
                </label>
                <select
                  id="favorites-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="favorites-sort-select"
                >
                  <option value="newest">Recently Saved</option>
                  <option value="rating-desc">Highest Rated (★ 5 → 1)</option>
                  <option value="rating-asc">Lowest Rated</option>
                  <option value="title">Alphabetical (Title A–Z)</option>
                  <option value="author">Alphabetical (Author A–Z)</option>
                </select>
              </div>

              {/* View Mode Toggle Group */}
              <div className="favorites-view-toggle-group">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Modern Grid View"
                >
                  <span className="mode-icon">🔲</span>
                  <span className="mode-label">Grid</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'bookshelf' ? 'active' : ''}`}
                  onClick={() => setViewMode('bookshelf')}
                  title="Cozy 3D Bookshelf View"
                >
                  <span className="mode-icon">📚</span>
                  <span className="mode-label">Bookshelf</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Compact Editorial List"
                >
                  <span className="mode-icon">☰</span>
                  <span className="mode-label">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {filtered.length === 0 ? (
            <div className="aesthetic-favorites-empty-card filtered">
              <div className="empty-halo-icon">
                <span className="empty-emoji">🔍</span>
              </div>
              <h3 className="empty-title">No matching favorites found</h3>
              <p className="empty-desc">
                No bookmarked titles match &ldquo;{search}&rdquo;
                {selectedGenre !== 'all' ? ` in ${selectedGenre}` : ''}.
              </p>
              <button
                type="button"
                className="btn-empty-action rose-btn"
                onClick={() => {
                  setSearch('');
                  setSelectedGenre('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'bookshelf' ? (
            <FavoritesVirtualBookshelf
              books={filtered}
              onSelectBook={setSelectedBook}
            />
          ) : viewMode === 'list' ? (
            <FavoritesListView
              books={filtered}
              onSelectBook={setSelectedBook}
              onStartReading={handleStartReading}
              onRemove={handleRemove}
              onFindSimilar={(book) => navigate(`/similar?bookId=${encodeURIComponent(book.id)}`)}
            />
          ) : (
            <div className="books-grid favorites-grid">
              {filtered.map((book) => (
                <div key={book.id} className="favorite-card-container">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />

                  {/* Card Action Ribbon */}
                  <div className="favorite-actions-ribbon">
                    <button
                      type="button"
                      className="btn-fav-ribbon-primary"
                      onClick={(e) => handleStartReading(book, e)}
                      title="Add to Currently Reading shelf"
                    >
                      📖 Start Reading
                    </button>
                    <button
                      type="button"
                      className="btn-fav-ribbon-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/similar?bookId=${encodeURIComponent(book.id)}`);
                      }}
                      title="Find Similar Books"
                    >
                      🔍 Similar
                    </button>
                    <button
                      type="button"
                      className="btn-fav-ribbon-danger"
                      onClick={(e) => handleRemove(book.id, book.title, e)}
                      title="Remove Bookmark"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Global Book Details Modal */}
      {selectedBook && (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}

/* =========================================================================
   Subcomponent: Virtual 3D Bookshelf Mode for Favorites
   ========================================================================= */
function FavoritesVirtualBookshelf({ books, onSelectBook }) {
  return (
    <div className="virtual-bookshelf-container">
      <div className="virtual-bookshelf-rack">
        <div className="virtual-books-row">
          {books.map((book) => (
            <div
              key={book.id}
              className="virtual-shelf-book-item"
              onClick={() => onSelectBook?.(book)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectBook?.(book)}
            >
              <div className="virtual-book-stand">
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="virtual-book-art"
                    loading="lazy"
                  />
                ) : (
                  <div className="virtual-book-fallback">
                    <span className="fallback-spine-title">{book.title}</span>
                  </div>
                )}
                {/* Floating Preview Card on Hover */}
                <div className="virtual-book-hover-card">
                  <strong className="hover-title">{book.title}</strong>
                  <span className="hover-author">{book.author}</span>
                  <div className="hover-meta">
                    <span className="hover-genre">{book.genre}</span>
                    {book.score && (
                      <span className="hover-score">★ {Number(book.score).toFixed(1)}</span>
                    )}
                  </div>
                  <span className="hover-click-prompt">Click to view details</span>
                </div>
              </div>
              <div className="virtual-book-shelf-shadow" />
            </div>
          ))}
        </div>

        {/* 3D Illuminated Wooden Shelf Plank */}
        <div className="virtual-wood-shelf-plank">
          <div className="plank-surface" />
          <div className="plank-front" />
          <div className="plank-ambient-shadow" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Subcomponent: Compact Editorial List View for Favorites
   ========================================================================= */
function FavoritesListView({ books, onSelectBook, onStartReading, onRemove, onFindSimilar }) {
  return (
    <div className="shelf-list-view-table">
      {books.map((book) => (
        <div
          key={book.id}
          className="shelf-list-row"
          onClick={() => onSelectBook?.(book)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectBook?.(book)}
        >
          {/* Thumbnail */}
          <div className="list-row-thumb">
            {book.image ? (
              <img src={book.image} alt={book.title} loading="lazy" />
            ) : (
              <div className="list-thumb-fallback">♥</div>
            )}
          </div>

          {/* Info */}
          <div className="list-row-info">
            <strong className="list-row-title">{book.title}</strong>
            <span className="list-row-author">by {book.author || 'Unknown'}</span>
            <div className="list-row-tags">
              {book.genre && <span className="list-tag genre">{book.genre}</span>}
              {book.mood && book.mood !== 'Neutral' && (
                <span className="list-tag mood">{book.mood}</span>
              )}
              {book.score && (
                <span className="list-tag score">★ {Number(book.score).toFixed(1)}</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="list-row-actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn-list-action primary"
              onClick={(e) => onStartReading(book, e)}
              title="Add to Currently Reading shelf"
            >
              📖 Start Reading
            </button>
            <button
              type="button"
              className="btn-list-action"
              onClick={() => onFindSimilar(book)}
              title="Find Similar Books"
            >
              🔍 Similar
            </button>
            <button
              type="button"
              className="btn-list-action danger"
              onClick={(e) => onRemove(book.id, book.title, e)}
              title="Remove from favorites"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
