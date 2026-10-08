import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../components/UIComponents';
import { trackActivity } from '../libraryStore';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState('');
  const [author, setAuthor] = useState('');
  const [mood, setMood] = useState('');
  const [minRating, setMinRating] = useState('');
  const [readingLevel, setReadingLevel] = useState('');
  const [length, setLength] = useState('');
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
    api
      .meta()
      .then(setMeta)
      .catch((e) => console.warn('Could not load metadata:', e.message));
  }, []);

  // Run search when URL query changes or on initial mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setQuery(q);
      executeSearch(q, 1);
    } else {
      executeSearch('', 1);
    }
  }, [searchParams]);

  async function executeSearch(searchText, targetPage = 1) {
    setLoading(true);
    setError('');
    setPage(targetPage);

    try {
      let result;
      const trimmed = (searchText !== undefined ? searchText : query).trim();

      if (trimmed) {
        trackActivity('search_performed', { query: trimmed });
      }

      const hasSecondaryFilters =
        genre || author || mood || minRating || readingLevel || length || availability || yearFrom || yearTo;

      if (!trimmed && hasSecondaryFilters) {
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

        // Additional client-side filters for author and length
        if (author || length) {
          result.books = (result.books || []).filter((b) => {
            if (author && !(b.author || '').toLowerCase().includes(author.toLowerCase())) {
              return false;
            }
            if (length && (b.length || '').toLowerCase() !== length.toLowerCase()) {
              return false;
            }
            return true;
          });
        }
      } else if (trimmed) {
        result = await api.search(trimmed, targetPage, 20);

        // Apply secondary filters on search matches
        if (hasSecondaryFilters) {
          result.books = (result.books || []).filter((b) => {
            if (genre && (b.genre || '').toLowerCase() !== genre.toLowerCase()) return false;
            if (author && !(b.author || '').toLowerCase().includes(author.toLowerCase())) return false;
            if (mood && (b.mood || '').toLowerCase() !== mood.toLowerCase()) return false;
            if (minRating && Number(b.score) < Number(minRating)) return false;
            if (readingLevel && (b.readingLevel || '').toLowerCase() !== readingLevel.toLowerCase()) return false;
            if (length && (b.length || '').toLowerCase() !== length.toLowerCase()) return false;
            if (availability && (b.availability || '').toLowerCase() !== availability.toLowerCase()) return false;
            if (yearFrom && Number(b.published) < Number(yearFrom)) return false;
            if (yearTo && Number(b.published) > Number(yearTo)) return false;
            return true;
          });
        }
      } else {
        result = await api.books({ page: targetPage, limit: 20 });
        result.query = 'All Books';
      }

      setData(result);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const q = query.trim();
    setSearchParams(q ? { q } : {});
    executeSearch(q, 1);
  }

  function handleResetFilters() {
    setGenre('');
    setAuthor('');
    setMood('');
    setMinRating('');
    setReadingLevel('');
    setLength('');
    setAvailability('');
    setYearFrom('');
    setYearTo('');
    setQuery('');
    setSearchParams({});
    executeSearch('', 1);
  }

  return (
    <div className="search-page-container">
      {/* 1. Header */}
      <PageHeader
        title="Book"
        accentText="Search"
        description="Explore the library and discover your next read across 10,538 titles with instant keyword lookup and deep attribute filters."
        icon="🔍"
      />

      {/* 2. Main Search Bar & Filters Card */}
      <form className="advanced-search-card" onSubmit={handleFormSubmit}>
        <div className="search-bar-primary">
          <span className="search-bar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            className="search-bar-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, genres, keywords (e.g. Mystery, Agatha Christie, AI)..."
          />
          <button type="submit" className="btn-search-cta" disabled={loading}>
            {loading ? 'Searching…' : 'Search Books'}
          </button>
        </div>

        {/* Structured Multi-attribute Filters Row */}
        <div className="search-filters-grid">
          <div className="filter-item">
            <label>Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All Genres</option>
              {(meta?.genres || []).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Author</label>
            <input
              type="text"
              placeholder="e.g. Stephen King"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>Mood</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)}>
              <option value="">All Moods</option>
              {(meta?.moods || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Minimum Rating</label>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="">Any Rating</option>
              <option value="3.0">3.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Difficulty</label>
            <select value={readingLevel} onChange={(e) => setReadingLevel(e.target.value)}>
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Length</label>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="">Any Length</option>
              <option value="Short">Short</option>
              <option value="Medium">Medium</option>
              <option value="Long">Long</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Limited">Limited</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div className="filter-item year-range">
            <label>Publication Year</label>
            <div className="year-inputs-pair">
              <input
                type="number"
                placeholder="From"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
              />
              <span className="year-separator">–</span>
              <input
                type="number"
                placeholder="To"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item reset-col">
            <label>&nbsp;</label>
            <button
              type="button"
              className="btn-filter-reset"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              Reset All
            </button>
          </div>
        </div>
      </form>

      {/* 3. Loading State */}
      {loading ? <LoadingState message="Searching digital collection..." /> : null}

      {/* 4. Error State */}
      {error && !loading ? (
        <ErrorState
          error={error}
          onRetry={() => executeSearch(query, page)}
          onBack={handleResetFilters}
        />
      ) : null}

      {/* 5. Results Section */}
      {!loading && !error && data ? (
        <div className="search-results-section">
          <div className="results-header-bar">
            <div className="results-count-title">
              <h2>
                {data.books?.length === 0 ? '0' : data.total?.toLocaleString?.() || data.books?.length || 0} Books Found
                {query ? ` for “${query}”` : ''}
              </h2>
              <span className="page-summary-tag">
                Page {data.page || page} of {data.pages || 1}
              </span>
            </div>
          </div>

          {(!data.books || data.books.length === 0) ? (
            <EmptyState
              icon="🔎"
              title="No books match your search"
              message="Try broadening your keywords, lowering the minimum rating threshold, or resetting your attribute filters."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="search-books-grid">
                {data.books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onSelect={(b) => setSelectedBook(b)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {(data.pages || 1) > 1 ? (
                <div className="search-pagination-bar">
                  <button
                    type="button"
                    className="btn-pagination"
                    disabled={page <= 1}
                    onClick={() => executeSearch(query, page - 1)}
                  >
                    ← Previous
                  </button>
                  <span className="pagination-text">
                    Page {page} of {data.pages || 1}
                  </span>
                  <button
                    type="button"
                    className="btn-pagination"
                    disabled={page >= (data.pages || 1)}
                    onClick={() => executeSearch(query, page + 1)}
                  >
                    Next →
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* 6. Book Details Modal */}
      {selectedBook ? (
        <BookDetailsModal
          bookId={selectedBook.id}
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </div>
  );
}
