import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../components/UIComponents';
import { trackActivity } from '../libraryStore';

const QUICK_PICKS = [
  { label: 'Dune', query: 'Dune' },
  { label: 'Stephen King', query: 'Stephen King' },
  { label: 'Science Fiction', genre: 'Science Fiction' },
  { label: 'Psychology', genre: 'Psychology' },
  { label: 'Mystery', genre: 'Mystery' },
  { label: 'Fantasy', genre: 'Fantasy' },
  { label: 'Horror', genre: 'Horror' },
  { label: 'Agatha Christie', query: 'Agatha Christie' },
  { label: '4.5+ ★', minRating: '4.5' },
  { label: 'Available Only', availability: 'Available' },
];

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
  const [sortBy, setSortBy] = useState('relevance');
  const [meta, setMeta] = useState(null);

  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // Load metadata on mount
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

  // Compute active filters count
  const activeFilters = useMemo(() => {
    const list = [];
    if (genre) list.push({ key: 'genre', label: `Genre: ${genre}`, clear: () => setGenre('') });
    if (author) list.push({ key: 'author', label: `Author: ${author}`, clear: () => setAuthor('') });
    if (mood) list.push({ key: 'mood', label: `Mood: ${mood}`, clear: () => setMood('') });
    if (minRating) list.push({ key: 'minRating', label: `Rating: ${minRating}+ ★`, clear: () => setMinRating('') });
    if (readingLevel) list.push({ key: 'readingLevel', label: `Level: ${readingLevel}`, clear: () => setReadingLevel('') });
    if (length) list.push({ key: 'length', label: `Length: ${length}`, clear: () => setLength('') });
    if (availability) list.push({ key: 'availability', label: `Status: ${availability}`, clear: () => setAvailability('') });
    if (yearFrom || yearTo) {
      list.push({
        key: 'years',
        label: `Year: ${yearFrom || 'Any'}–${yearTo || 'Now'}`,
        clear: () => { setYearFrom(''); setYearTo(''); },
      });
    }
    return list;
  }, [genre, author, mood, minRating, readingLevel, length, availability, yearFrom, yearTo]);

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
    if (e) e.preventDefault();
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
    setSortBy('relevance');
    setSearchParams({});
    executeSearch('', 1);
  }

  function handleQuickPick(pick) {
    if (pick.query !== undefined) {
      setQuery(pick.query);
      setSearchParams(pick.query ? { q: pick.query } : {});
      executeSearch(pick.query, 1);
    }
    if (pick.genre !== undefined) {
      setGenre(pick.genre);
      executeSearch(query, 1);
    }
    if (pick.minRating !== undefined) {
      setMinRating(pick.minRating);
      executeSearch(query, 1);
    }
    if (pick.availability !== undefined) {
      setAvailability(pick.availability);
      executeSearch(query, 1);
    }
  }

  // Sorted list of displayed books
  const sortedBooks = useMemo(() => {
    if (!data?.books) return [];
    const books = [...data.books];
    if (sortBy === 'rating_desc') {
      return books.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    }
    if (sortBy === 'rating_asc') {
      return books.sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0));
    }
    if (sortBy === 'year_desc') {
      return books.sort((a, b) => (Number(b.published) || 0) - (Number(a.published) || 0));
    }
    if (sortBy === 'year_asc') {
      return books.sort((a, b) => (Number(a.published) || 0) - (Number(b.published) || 0));
    }
    if (sortBy === 'title_asc') {
      return books.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return books;
  }, [data?.books, sortBy]);

  return (
    <div className="search-page-container">
      {/* ================= 1. PAGE HEADER FRAME ================= */}
      <PageHeader
        title="Book Search"
        accentText="Catalog Explorer"
        description="Explore the library collection across 10,538 titles with instant keyword lookup, predicate filters, and multi-attribute deep search."
        icon="🔍"
      />

      {/* ================= 2. SEARCH & FILTER HUB FRAME ================= */}
      <section className="search-hub-frame">
        <div className="search-hub-header">
          <div className="hub-title-group">
            <span className="hub-badge-pill">DISCOVERY ENGINE</span>
            <h2 className="hub-main-title">Search &amp; Filter the Digital Collection</h2>
            <p className="hub-subtitle">
              Lookup by title, author, keyword, or combine fine-grained multi-attribute constraints.
            </p>
          </div>

          <div className="hub-header-meta">
            <span className="hub-stat-tag">
              <span className="pulse-dot-cyan"></span>
              10,538 Books Indexed
            </span>
          </div>
        </div>

        {/* Primary Search Bar */}
        <form className="primary-search-form" onSubmit={handleFormSubmit}>
          <div className="search-input-field-wrap">
            <span className="search-field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              id="search-input-primary"
              className="search-input-primary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by book title, author, genre, or keyword (e.g. Dune, Agatha Christie, Artificial Intelligence)..."
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => { setQuery(''); setSearchParams({}); executeSearch('', 1); }}
                title="Clear query"
              >
                ✕
              </button>
            )}
          </div>

          <button type="submit" className="btn-search-cta" disabled={loading}>
            <span className="btn-search-icon">🔍</span>
            <span>{loading ? 'Searching…' : 'Search Books'}</span>
          </button>
        </form>

        {/* Quick Discovery Picks */}
        <div className="quick-picks-container">
          <span className="quick-picks-label">Quick Picks:</span>
          <div className="quick-picks-chips">
            {QUICK_PICKS.map((pick) => {
              const isActive =
                (pick.query && query.toLowerCase() === pick.query.toLowerCase()) ||
                (pick.genre && genre === pick.genre) ||
                (pick.minRating && minRating === pick.minRating) ||
                (pick.availability && availability === pick.availability);

              return (
                <button
                  key={pick.label}
                  type="button"
                  className={`quick-pick-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleQuickPick(pick)}
                >
                  {pick.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deep Attribute Filters Container */}
        <div className="deep-filters-section">
          <div className="filters-section-top">
            <div className="filters-toggle-head">
              <span className="filters-icon">⚙️</span>
              <strong className="filters-title">Deep Attribute Filters</strong>
              {activeFilters.length > 0 && (
                <span className="filters-count-badge">{activeFilters.length} Active</span>
              )}
            </div>

            <button
              type="button"
              className="btn-toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
            </button>
          </div>

          {showFilters && (
            <div className="filters-controls-grid">
              {/* Filter 1: Genre */}
              <div className="filter-group-item">
                <label htmlFor="filter-genre">Genre</label>
                <div className="select-wrap">
                  <select
                    id="filter-genre"
                    value={genre}
                    onChange={(e) => { setGenre(e.target.value); }}
                  >
                    <option value="">All Genres</option>
                    {(meta?.genres || []).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter 2: Author */}
              <div className="filter-group-item">
                <label htmlFor="filter-author">Author Keyword</label>
                <input
                  id="filter-author"
                  type="text"
                  placeholder="e.g. Stephen King"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="filter-input-text"
                />
              </div>

              {/* Filter 3: Mood */}
              <div className="filter-group-item">
                <label htmlFor="filter-mood">Mood &amp; Atmosphere</label>
                <div className="select-wrap">
                  <select
                    id="filter-mood"
                    value={mood}
                    onChange={(e) => { setMood(e.target.value); }}
                  >
                    <option value="">All Moods</option>
                    {(meta?.moods || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter 4: Minimum Rating */}
              <div className="filter-group-item">
                <label htmlFor="filter-rating">Minimum Rating</label>
                <div className="select-wrap">
                  <select
                    id="filter-rating"
                    value={minRating}
                    onChange={(e) => { setMinRating(e.target.value); }}
                  >
                    <option value="">Any Rating</option>
                    <option value="3.0">3.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>
              </div>

              {/* Filter 5: Reading Level */}
              <div className="filter-group-item">
                <label htmlFor="filter-level">Reading Difficulty</label>
                <div className="select-wrap">
                  <select
                    id="filter-level"
                    value={readingLevel}
                    onChange={(e) => { setReadingLevel(e.target.value); }}
                  >
                    <option value="">All Difficulty Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Filter 6: Book Length */}
              <div className="filter-group-item">
                <label htmlFor="filter-length">Book Length</label>
                <div className="select-wrap">
                  <select
                    id="filter-length"
                    value={length}
                    onChange={(e) => { setLength(e.target.value); }}
                  >
                    <option value="">Any Length</option>
                    <option value="Short">Short (&lt; 250 pages)</option>
                    <option value="Medium">Medium (250–450 pages)</option>
                    <option value="Long">Long (&gt; 450 pages)</option>
                  </select>
                </div>
              </div>

              {/* Filter 7: Availability */}
              <div className="filter-group-item">
                <label htmlFor="filter-avail">Library Availability</label>
                <div className="select-wrap">
                  <select
                    id="filter-avail"
                    value={availability}
                    onChange={(e) => { setAvailability(e.target.value); }}
                  >
                    <option value="">All Statuses</option>
                    <option value="Available">Available Now</option>
                    <option value="Limited">Limited Copies</option>
                    <option value="Unavailable">Checked Out</option>
                  </select>
                </div>
              </div>

              {/* Filter 8: Publication Year Range */}
              <div className="filter-group-item year-group">
                <label>Publication Year Range</label>
                <div className="year-inputs-pair">
                  <input
                    type="number"
                    placeholder="From"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    className="filter-input-year"
                  />
                  <span className="year-separator">–</span>
                  <input
                    type="number"
                    placeholder="To"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    className="filter-input-year"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Action Buttons */}
          <div className="filters-actions-footer">
            <button
              type="button"
              className="btn-apply-filters"
              onClick={() => executeSearch(query, 1)}
            >
              Apply Filter Criteria
            </button>
            <button
              type="button"
              className="btn-reset-filters"
              onClick={handleResetFilters}
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </section>

      {/* ================= 3. ACTIVE FILTERS & CONTROLS FRAME ================= */}
      <section className="search-controls-bar-frame">
        <div className="controls-left">
          <span className="results-counter-pill">
            <span className="counter-icon">📚</span>
            <strong>
              {data?.books?.length === 0 ? '0' : data?.total?.toLocaleString?.() || data?.books?.length || 0}
            </strong>
            <span>Books {query ? `matching “${query}”` : 'in current view'}</span>
          </span>

          {/* Dismissible active filter chips */}
          {activeFilters.length > 0 && (
            <div className="active-filter-chips-list">
              {activeFilters.map((f) => (
                <span key={f.key} className="active-filter-chip">
                  <span>{f.label}</span>
                  <button
                    type="button"
                    className="btn-clear-single-filter"
                    onClick={() => { f.clear(); executeSearch(query, 1); }}
                    title={`Remove ${f.label}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="btn-clear-all-text"
                onClick={handleResetFilters}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Sort selector */}
        <div className="controls-right">
          <label htmlFor="sort-books-select" className="sort-label">Sort by:</label>
          <div className="select-wrap sort-select-wrap">
            <select
              id="sort-books-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevance">Catalog Relevance</option>
              <option value="rating_desc">Highest Rating (★ High to Low)</option>
              <option value="rating_asc">Lowest Rating (★ Low to High)</option>
              <option value="year_desc">Newest Published</option>
              <option value="year_asc">Oldest Published</option>
              <option value="title_asc">Title (A to Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ================= 4. LOADING STATE ================= */}
      {loading && <LoadingState message="Searching digital collection..." />}

      {/* ================= 5. ERROR STATE ================= */}
      {error && !loading && (
        <ErrorState
          error={error}
          onRetry={() => executeSearch(query, page)}
          onBack={handleResetFilters}
        />
      )}

      {/* ================= 6. RESULTS CATALOG FRAME ================= */}
      {!loading && !error && data && (
        <section className="search-results-frame">
          {sortedBooks.length === 0 ? (
            <EmptyState
              icon="🔎"
              title="No books match your criteria"
              message="Try broadening your keywords, clearing filters, or exploring related genres from the quick picks above."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              {/* Responsive Book Grid */}
              <div className="search-catalog-grid">
                {sortedBooks.map((book) => (
                  <div key={book.id} className="search-book-card-wrap">
                    <BookCard
                      book={book}
                      onSelect={(b) => setSelectedBook(b)}
                    />
                  </div>
                ))}
              </div>

              {/* ================= 7. PAGINATION DOCK FRAME ================= */}
              {(data.pages || 1) > 1 && (
                <div className="search-pagination-dock">
                  <div className="pagination-info-side">
                    <span>
                      Showing Page <strong>{page}</strong> of <strong>{data.pages || 1}</strong>
                    </span>
                    <span className="pagination-sub-text">
                      ({data.total?.toLocaleString?.() || 0} total catalog entries)
                    </span>
                  </div>

                  <div className="pagination-buttons-group">
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={page <= 1}
                      onClick={() => executeSearch(query, 1)}
                      title="First Page"
                    >
                      « First
                    </button>
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={page <= 1}
                      onClick={() => executeSearch(query, page - 1)}
                    >
                      ← Previous
                    </button>

                    <div className="page-current-indicator">
                      {page} / {data.pages || 1}
                    </div>

                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={page >= (data.pages || 1)}
                      onClick={() => executeSearch(query, page + 1)}
                    >
                      Next →
                    </button>
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={page >= (data.pages || 1)}
                      onClick={() => executeSearch(query, data.pages || 1)}
                      title="Last Page"
                    >
                      Last »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetailsModal
          bookId={selectedBook.id}
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}
