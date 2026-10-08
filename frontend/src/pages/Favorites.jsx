import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader, EmptyState } from '../components/UIComponents';
import { getFavorites, removeFavorite } from '../libraryStore';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    setFavorites(getFavorites());
    function onStorage() {
      setFavorites(getFavorites());
    }
    window.addEventListener('libraai_store_update', onStorage);
    return () => window.removeEventListener('libraai_store_update', onStorage);
  }, []);

  let filtered = favorites.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.genre || '').toLowerCase().includes(q) ||
      (b.mood || '').toLowerCase().includes(q)
    );
  });

  if (sortBy === 'rating-desc') {
    filtered.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  } else if (sortBy === 'rating-asc') {
    filtered.sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0));
  } else if (sortBy === 'title') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  function handleRemove(id, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    removeFavorite(id);
  }

  return (
    <div className="favorites-page">
      <PageHeader
        title="Saved Favorites"
        description="Books you’ve saved for later. Search, sort, and manage your personal bookmarked reading collection."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        }
      />

      {favorites.length > 0 && (
        <div className="favorites-controls-card">
          <div className="favorites-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="favorites-search-input"
              placeholder="Search saved favorites by title, author, or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="favorites-sort-wrap">
            <label htmlFor="favorites-sort-select">Sort by:</label>
            <div className="custom-select-wrapper">
              <select
                id="favorites-sort-select"
                className="custom-dropdown-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Recently Saved</option>
                <option value="rating-desc">Highest Rated (★)</option>
                <option value="rating-asc">Lowest Rated</option>
                <option value="title">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          icon="♥"
          title="No favorite books yet."
          message="You haven’t bookmarked any books yet. Explore recommendations or search the library catalog to build your favorites list."
          actionText="Explore Books"
          onAction={() => navigate('/search')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Matching Favorites"
          message={`No bookmarked titles match your filter “${search}”.`}
          actionText="Clear Search Filter"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="favorites-results-container">
          <div className="results-count-bar">
            <span>
              Showing {filtered.length} of {favorites.length} saved {favorites.length === 1 ? 'book' : 'books'}
            </span>
          </div>

          <div className="books-grid">
            {filtered.map((book) => (
              <div key={book.id} className="favorite-card-container">
                <BookCard
                  book={book}
                  onSelect={() => setSelectedBook(book)}
                  extraAction={
                    <button
                      type="button"
                      className="btn-remove-favorite-pill"
                      onClick={(e) => handleRemove(book.id, e)}
                      title="Remove from favorites"
                    >
                      ✕ Remove Favorite
                    </button>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBook ? (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </div>
  );
}
