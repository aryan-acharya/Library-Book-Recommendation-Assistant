import { useEffect, useState } from 'react';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../components/UIComponents';

const initialFilters = {
  genre: '',
  subgenre: '',
  mood: '',
  readingLevel: '',
  ageGroup: '',
  availability: '',
  minRating: '',
  publishedFrom: '',
  publishedTo: '',
};

export default function Explore() {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ books: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    api.meta().then(setMeta).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v != null) params[k] = v;
    });
    api
      .books(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, page]);

  function update(key, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setFilters(initialFilters);
    setPage(1);
  }

  return (
    <div className="explore-page">
      <PageHeader
        title="Explore Library"
        description="Browse all 10,538 books from the Knowledge Base with server-side filters and pagination."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        }
      />

      {/* Styled Filters Grid Card */}
      <div className="search-filters-card">
        <div className="filters-header-row">
          <div className="filters-title-group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <h3>Filter Knowledge Base Books</h3>
          </div>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={handleReset}
          >
            Reset Filters
          </button>
        </div>

        <div className="filters-select-grid">
          <div className="filter-select-group">
            <label>Genre</label>
            <select
              className="custom-dropdown-select"
              value={filters.genre}
              onChange={(e) => update('genre', e.target.value)}
            >
              <option value="">All Genres</option>
              {(meta?.genres || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Subgenre</label>
            <select
              className="custom-dropdown-select"
              value={filters.subgenre}
              onChange={(e) => update('subgenre', e.target.value)}
            >
              <option value="">All Subgenres</option>
              {(meta?.subgenres || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Mood</label>
            <select
              className="custom-dropdown-select"
              value={filters.mood}
              onChange={(e) => update('mood', e.target.value)}
            >
              <option value="">All Moods</option>
              {(meta?.moods || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Reading Level</label>
            <select
              className="custom-dropdown-select"
              value={filters.readingLevel}
              onChange={(e) => update('readingLevel', e.target.value)}
            >
              <option value="">All Levels</option>
              {(meta?.readingLevels || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Age Group</label>
            <select
              className="custom-dropdown-select"
              value={filters.ageGroup}
              onChange={(e) => update('ageGroup', e.target.value)}
            >
              <option value="">All Age Groups</option>
              {(meta?.ageGroups || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Availability</label>
            <select
              className="custom-dropdown-select"
              value={filters.availability}
              onChange={(e) => update('availability', e.target.value)}
            >
              <option value="">Any Availability</option>
              {(meta?.availabilities || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Min Rating</label>
            <select
              className="custom-dropdown-select"
              value={filters.minRating}
              onChange={(e) => update('minRating', e.target.value)}
            >
              <option value="">Any Rating</option>
              <option value="3">3.0+ ★</option>
              <option value="3.5">3.5+ ★</option>
              <option value="4">4.0+ ★</option>
              <option value="4.5">4.5+ ★</option>
            </select>
          </div>

          <div className="filter-select-group">
            <label>Year From</label>
            <input
              type="number"
              className="filter-number-input"
              placeholder="e.g. 1950"
              value={filters.publishedFrom}
              onChange={(e) => update('publishedFrom', e.target.value)}
            />
          </div>

          <div className="filter-select-group">
            <label>Year To</label>
            <input
              type="number"
              className="filter-number-input"
              placeholder="e.g. 2024"
              value={filters.publishedTo}
              onChange={(e) => update('publishedTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Meta Results Bar */}
      <div className="search-meta-bar">
        <span>
          Showing {data.books?.length || 0} books (Page {data.page || page} of {data.pages || 1}) · Total matches: {data.total?.toLocaleString() || 0}
        </span>
      </div>

      {loading ? (
        <LoadingState message="Filtering Knowledge Base books..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setPage(1)} />
      ) : data.books?.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No Books Found"
          message="No books matched the current combination of filters. Try clearing or relaxing some criteria."
          actionText="Reset All Filters"
          onAction={handleReset}
        />
      ) : (
        <div className="books-grid">
          {data.books.map((book) => (
            <div key={book.id} className="search-book-wrapper">
              <BookCard
                book={book}
                onSelect={() => setSelectedBook(book)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {data.pages > 1 && (
        <div className="pagination-bar">
          <button
            type="button"
            className="btn-page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span className="page-indicator">
            Page {page} of {data.pages}
          </span>
          <button
            type="button"
            className="btn-page"
            disabled={page >= data.pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {selectedBook && (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}
