import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { trackActivity } from '../libraryStore';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [minRating, setMinRating] = useState('');
  const [readingLevel, setReadingLevel] = useState('');
  const [availability, setAvailability] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
  }, []);

  // Run search when URL query changes or on initial mount if query exists
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      executeSearch(q, 1);
    } else {
      // Show initial catalog search
      executeSearch('', 1);
    }
  }, [searchParams]);

  async function executeSearch(searchText, targetPage = 1) {
    setLoading(true);
    setError('');
    setPage(targetPage);

    try {
      let result;
      const trimmed = (searchText ?? query).trim();

      if (trimmed) {
        trackActivity('search_performed', { query: trimmed });
      }

      if (
        !trimmed &&
        (genre || mood || minRating || readingLevel || availability || yearFrom || yearTo)
      ) {
        // Use filter_books endpoint
        const params = {
          page: targetPage,
          limit: 20,
        };
        if (genre) params.genre = genre;
        if (mood) params.mood = mood;
        if (minRating) params.minRating = minRating;
        if (readingLevel) params.readingLevel = readingLevel;
        if (availability) params.availability = availability;
        if (yearFrom) params.publishedFrom = yearFrom;
        if (yearTo) params.publishedTo = yearTo;
        result = await api.books(params);
        result.query = 'Filtered Catalog';
      } else if (trimmed) {
        result = await api.search(trimmed, targetPage, 20);
        // Apply client filters if secondary filters are chosen
        if (genre || mood || minRating || readingLevel || availability) {
          result.books = (result.books || []).filter((b) => {
            if (genre && (b.genre || '').toLowerCase() !== genre.toLowerCase()) return false;
            if (mood && (b.mood || '').toLowerCase() !== mood.toLowerCase()) return false;
            if (minRating && Number(b.score) < Number(minRating)) return false;
            if (readingLevel && (b.readingLevel || '').toLowerCase() !== readingLevel.toLowerCase()) return false;
            if (availability && (b.availability || '').toLowerCase() !== availability.toLowerCase()) return false;
            return true;
          });
        }
      } else {
        result = await api.books({ page: targetPage, limit: 20 });
        result.query = 'All Books';
      }

      setData(result);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
    executeSearch(query, 1);
  }

  function handleResetFilters() {
    setGenre('');
    setMood('');
    setMinRating('');
    setReadingLevel('');
    setAvailability('');
    setLength('');
    setYearFrom('');
    setYearTo('');
    setQuery('');
    setSearchParams({});
    executeSearch('', 1);
  }

  return (
    <div className="search-page-container">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>Library Book Search</h1>
          <p>
            Search and filter through all 10,538 titles by title, author, genre, mood, reading level, circulation availability, and publication period.
          </p>
        </div>
      </header>

      {/* Main Search Bar */}
      <form className="advanced-search-form" onSubmit={handleFormSubmit}>
        <div className="search-input-wrapper-large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input-large"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, keywords, or topics (e.g. Artificial Intelligence, Agatha Christie)..."
          />
          <button type="submit" className="btn-search-primary" disabled={loading}>
            {loading ? 'Searching…' : 'Search Books'}
          </button>
        </div>

        {/* Filter Strip */}
        <div className="search-filters-row">
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All Genres</option>
            {(meta?.genres || []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="">All Moods</option>
            {(meta?.moods || []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
            <option value="">Any Rating</option>
            <option value="3.0">3.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>

          <select value={readingLevel} onChange={(e) => setReadingLevel(e.target.value)}>
            <option value="">All Difficulty Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">All Availabilities</option>
            <option value="Available">Available</option>
            <option value="Limited">Limited</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          <input
            type="number"
            className="year-filter-input"
            placeholder="From Year"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
          />

          <input
            type="number"
            className="year-filter-input"
            placeholder="To Year"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
          />

          <button
            type="button"
            className="btn-filter-reset"
            onClick={handleResetFilters}
            title="Reset all filters"
          >
            Reset
          </button>
        </div>
      </form>

      {error ? <div className="error-alert-card">{error}</div> : null}

      {loading ? (
        <div className="loading-state-banner">
          <div className="loading-pulse-spinner"></div>
          <p>Searching digital collection...</p>
        </div>
      ) : null}

      {data ? (
        <div className="search-results-section">
          <div className="search-results-header">
            <h2>
              {data.total?.toLocaleString?.() || 0} Books Found
              {data.query && data.query !== 'All Books' ? ` for “${data.query}”` : ''}
            </h2>
            <span className="page-summary">
              Page {data.page || page} of {data.pages || 1}
            </span>
          </div>

          <div className="search-books-grid">
            {(data.books || []).map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={() => setSelectedBook(book)}
              />
            ))}
          </div>

          <div className="pagination-bar">
            <button
              type="button"
              className="btn-page"
              disabled={page <= 1}
              onClick={() => executeSearch(query, page - 1)}
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} / {data.pages || 1}
            </span>
            <button
              type="button"
              className="btn-page"
              disabled={page >= (data.pages || 1)}
              onClick={() => executeSearch(query, page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {selectedBook ? (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </div>
  );
}
