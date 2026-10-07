import { useEffect, useState } from 'react';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { getFavorites, removeFavorite } from '../libraryStore';

export default function Favorites() {
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
    const q = search.toLowerCase();
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.genre || '').toLowerCase().includes(q)
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
    e?.stopPropagation();
    removeFavorite(id);
  }

  return (
    <div className="favorites-page">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>Saved Favorites</h1>
          <p>
            Your personal collection of bookmarked books. Quickly search, sort, and manage your saved reading list.
          </p>
        </div>

        <div className="favorites-controls-bar">
          <input
            type="text"
            className="search-filter-input"
            placeholder="Filter saved favorites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Recently Saved</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="rating-asc">Lowest Rated</option>
            <option value="title">Alphabetical (Title)</option>
          </select>
        </div>
      </header>

      {favorites.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">♥</div>
          <h3>No Favorites Saved Yet</h3>
          <p>
            Browse recommendations or search books, then click the bookmark icon on any card to save it to your favorites.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-card">
          <p>No favorites match your search “{search}”.</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {filtered.map((book) => (
            <div key={book.id} className="favorite-item-wrapper">
              <BookCard book={book} onSelect={() => setSelectedBook(book)} />
              <button
                type="button"
                className="btn-remove-favorite"
                onClick={(e) => handleRemove(book.id, e)}
                title="Remove from favorites"
              >
                ✕ Remove
              </button>
            </div>
          ))}
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
