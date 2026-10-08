import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BookCover } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader } from '../components/UIComponents';
import { addRecentlyViewed, isFavorite, toggleFavorite } from '../libraryStore';

// Curated popular library books for quick exploration
const QUICK_PICKS = [
  { id: 'B07470', title: 'The Silent Patient', author: 'Alex Michaelides' },
  { id: 'B00182', title: 'Silent Lies', author: 'Neva Altaj' },
  { id: 'B00288', title: 'The Iron King', author: 'Maurice Druon' },
  { id: 'B05753', title: 'Batman: The Dark Knight Returns', author: 'Frank Miller' },
];

export default function SimilarBooks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Target book and results state
  const [targetBook, setTargetBook] = useState(null);
  const [similarList, setSimilarList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search and autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResultsList, setSearchResultsList] = useState([]);
  const [searchError, setSearchError] = useState('');
  const searchContainerRef = useRef(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('similarity');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterMood, setFilterMood] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [minMatch, setMinMatch] = useState('all');

  // UI state
  const [selectedModalBook, setSelectedModalBook] = useState(null);
  const [expandedWhy, setExpandedWhy] = useState({});
  const [descExpanded, setDescExpanded] = useState(false);
  const [, setStoreVersion] = useState(0);

  const bookIdParam = searchParams.get('bookId');

  // Initial load or URL param change
  useEffect(() => {
    if (bookIdParam) {
      loadSimilar(bookIdParam);
    }
  }, [bookIdParam]);

  // Keep favorites in sync with libraryStore events
  useEffect(() => {
    function onStoreChange() {
      setStoreVersion((v) => v + 1);
    }
    window.addEventListener('libraai_store_update', onStoreChange);
    return () => window.removeEventListener('libraai_store_update', onStoreChange);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchInputChange(e) {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  // Debounced live autocomplete
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.search(q, 1, 6);
        if (!isCancelled) {
          setSuggestions(res.books || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Autocomplete query failed:', err);
      } finally {
        if (!isCancelled) setSearching(false);
      }
    }, 220);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Load similarity from backend
  async function loadSimilar(id) {
    if (!id) return;
    setLoading(true);
    setError('');
    setSearchResultsList([]);
    setSearchError('');
    try {
      const data = await api.similar(id);
      setTargetBook(data.book);
      setSimilarList(data.similar || []);
      if (data.book) {
        addRecentlyViewed(data.book);
        setTargetFav(isFavorite(data.book.id));
      }
    } catch (err) {
      console.error('Similar books load error:', err);
      setError(err.message || 'Failed to load similar books.');
    } finally {
      setLoading(false);
    }
  }

  // Handle book selection
  function handleSelectBook(book) {
    if (!book?.id) return;
    setSearchParams({ bookId: book.id });
    setSearchQuery('');
    setShowSuggestions(false);
    setSearchResultsList([]);
    setSearchError('');
    loadSimilar(book.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Search submission (Enter or Search button)
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const q = searchQuery.trim();
    if (!q) return;

    setShowSuggestions(false);
    setSearching(true);
    setSearchError('');
    try {
      const res = await api.search(q, 1, 8);
      const books = res.books || [];
      if (books.length === 0) {
        setSearchResultsList([]);
        setSearchError(`No books found in the catalog matching “${q}”. Try another title or author.`);
      } else if (books.length === 1) {
        handleSelectBook(books[0]);
      } else {
        // If exact title match exists, pick it directly
        const exactMatch = books.find((b) => b.title.toLowerCase() === q.toLowerCase());
        if (exactMatch) {
          handleSelectBook(exactMatch);
        } else {
          setSearchResultsList(books);
        }
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  // Toggle favorites for target book
  function handleToggleTargetFav() {
    if (!targetBook) return;
    toggleFavorite(targetBook);
    setStoreVersion((v) => v + 1);
  }

  // Toggle favorites for a card
  function handleToggleCardFav(e, book) {
    e.stopPropagation();
    toggleFavorite(book);
    setStoreVersion((v) => v + 1);
  }

  // Toggle why-similar expandable section
  function toggleWhyAccordion(bookId) {
    setExpandedWhy((prev) => ({ ...prev, [bookId]: !prev[bookId] }));
  }

  // Extract filter options dynamically from results
  const availableGenres = useMemo(() => {
    const set = new Set();
    similarList.forEach((b) => {
      if (b.genre && b.genre !== 'Unknown') set.add(b.genre);
    });
    return Array.from(set).sort();
  }, [similarList]);

  const availableMoods = useMemo(() => {
    const set = new Set();
    similarList.forEach((b) => {
      if (b.mood && b.mood !== 'Neutral') set.add(b.mood);
    });
    return Array.from(set).sort();
  }, [similarList]);

  // Filter & sort logic
  const filteredAndSortedList = useMemo(() => {
    let list = [...similarList];

    // Filter by Genre
    if (filterGenre !== 'all') {
      list = list.filter((b) => b.genre?.toLowerCase() === filterGenre.toLowerCase());
    }

    // Filter by Mood
    if (filterMood !== 'all') {
      list = list.filter((b) => b.mood?.toLowerCase() === filterMood.toLowerCase());
    }

    // Filter by Availability
    if (filterAvailability !== 'all') {
      list = list.filter((b) => (b.availability || '').toLowerCase() === filterAvailability.toLowerCase());
    }

    // Filter by Min Match Score
    if (minMatch !== 'all') {
      const threshold = parseInt(minMatch, 10);
      list = list.filter((b) => (b.similarityScore || 0) >= threshold);
    }

    // Sort
    if (sortBy === 'similarity') {
      list.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0) || (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.ratings || 0) - (a.ratings || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [similarList, filterGenre, filterMood, filterAvailability, minMatch, sortBy]);

  const hasActiveFilters = filterGenre !== 'all' || filterMood !== 'all' || filterAvailability !== 'all' || minMatch !== 'all';

  function resetFilters() {
    setFilterGenre('all');
    setFilterMood('all');
    setFilterAvailability('all');
    setMinMatch('all');
    setSortBy('similarity');
  }

  // Parse keywords and themes safely
  const targetThemes = useMemo(() => {
    if (!targetBook?.themes) return [];
    if (Array.isArray(targetBook.themes)) return targetBook.themes;
    if (typeof targetBook.themes === 'string') return targetBook.themes.split(' ').filter(Boolean);
    return [];
  }, [targetBook?.themes]);

  const targetKeywords = useMemo(() => {
    if (!targetBook?.keywords) return [];
    if (Array.isArray(targetBook.keywords)) return targetBook.keywords;
    if (typeof targetBook.keywords === 'string') return targetBook.keywords.split(' ').filter(Boolean);
    return [];
  }, [targetBook?.keywords]);

  return (
    <div className="similar-explorer-page">
      {/* 1. Page Header */}
      <PageHeader
        title="Similar Books Explorer"
        accentText="Semantic Discovery"
        description="Discover books that are semantically and structurally similar to your selected book."
      />

      {/* 2. Dedicated Search Card */}
      <section className="similar-search-card" ref={searchContainerRef}>
        <div className="search-card-header">
          <div>
            <h3 className="search-card-title">Find Similar Books</h3>
            <p className="search-card-subtitle">
              Search for any book by title, author, or keyword to compute its closest semantic neighbors.
            </p>
          </div>
        </div>

        <form className="similar-search-bar-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-field-wrap">
            <span className="search-field-icon">🔍</span>
            <input
              id="similar-search-input"
              type="text"
              className="similar-search-input"
              placeholder="Search for a title, author, or book (e.g. The Silent Patient, Dune, Verity)..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {searchQuery ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                title="Clear input"
              >
                ✕
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            className="btn-similar-search-submit"
            disabled={searching}
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* Live Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 ? (
          <div className="similar-autocomplete-dropdown">
            <div className="dropdown-label">Matching books in catalog:</div>
            {suggestions.map((b) => (
              <div
                key={b.id}
                className="autocomplete-row-item"
                onClick={() => handleSelectBook(b)}
              >
                <BookCover src={b.image} alt={b.title} containerClassName="autocomplete-thumb" />
                <div className="autocomplete-meta">
                  <strong className="autocomplete-title">{b.title}</strong>
                  <span className="autocomplete-sub">
                    by {b.author} · {b.genre} · ★ {b.score || '4.0'}
                  </span>
                </div>
                <span className="autocomplete-select-arrow">Select →</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Search Results Strip (When multiple results are returned from pressing Search) */}
        {searchResultsList.length > 0 ? (
          <div className="search-results-strip">
            <div className="results-strip-heading">
              Select a book to set as your base:
            </div>
            <div className="search-results-chips-grid">
              {searchResultsList.map((b) => (
                <div
                  key={b.id}
                  className="search-result-chip-card"
                  onClick={() => handleSelectBook(b)}
                >
                  <BookCover src={b.image} alt={b.title} containerClassName="chip-thumb" />
                  <div className="chip-meta">
                    <strong>{b.title}</strong>
                    <span>by {b.author} · {b.genre}</span>
                  </div>
                  <span className="chip-choose-btn">Choose</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {searchError ? (
          <div className="search-inline-error">
            <span>ℹ️ {searchError}</span>
          </div>
        ) : null}

        {/* Quick Picks for Instant Discovery */}
        <div className="quick-picks-row">
          <span className="quick-picks-label">Quick picks:</span>
          <div className="quick-picks-chips">
            {QUICK_PICKS.map((qp) => (
              <button
                key={qp.id}
                type="button"
                className={`quick-pick-pill ${targetBook?.id === qp.id ? 'active' : ''}`}
                onClick={() => handleSelectBook(qp)}
              >
                {qp.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Selected / Target Book Section */}
      {targetBook ? (
        <section className="similar-target-card">
          <div className="target-card-top-bar">
            <div className="target-headline-group">
              <span className="target-section-title">Selected Book</span>
              <span className="badge-active-base">🎯 Active Base Book</span>
            </div>
            <div className="target-top-actions">
              {(() => {
                const isTargetFav = targetBook?.id ? isFavorite(targetBook.id) : false;
                return (
                  <button
                    type="button"
                    className={`btn-target-fav ${isTargetFav ? 'favorited' : ''}`}
                    onClick={handleToggleTargetFav}
                    title={isTargetFav ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    {isTargetFav ? '♥ Saved in Favorites' : '♡ Add to Favorites'}
                  </button>
                );
              })()}
            </div>
          </div>

          <div className="target-card-body-grid">
            {/* Target Book Cover (Dedicated Frame with object-fit: contain) */}
            <div className="target-cover-column">
              <BookCover
                src={targetBook.image}
                alt={targetBook.title}
                containerClassName="target-cover-frame"
              />
            </div>

            {/* Target Book Info Column */}
            <div className="target-details-column">
              <div className="target-title-block">
                <h2 className="target-title">{targetBook.title}</h2>
                <p className="target-author">by {targetBook.author}</p>
              </div>

              {/* Badges strip: Genre, Subgenre, Mood, Reading Level, Availability */}
              <div className="target-badges-strip">
                <div className="target-rating-badge">
                  <span className="star">★</span>
                  <span className="rating-val">{targetBook.score ? Number(targetBook.score).toFixed(2) : '4.00'}</span>
                  {targetBook.ratings ? (
                    <span className="rating-count">({Number(targetBook.ratings).toLocaleString()} ratings)</span>
                  ) : null}
                </div>

                <span className="target-pill genre">{targetBook.genre}</span>

                {targetBook.subgenre && targetBook.subgenre !== 'General' && targetBook.subgenre !== targetBook.genre ? (
                  <span className="target-pill">{targetBook.subgenre}</span>
                ) : null}

                {targetBook.mood && targetBook.mood !== 'Neutral' ? (
                  <span className="target-pill mood">{targetBook.mood} Mood</span>
                ) : null}

                {targetBook.readingLevel ? (
                  <span className="target-pill level">{targetBook.readingLevel}</span>
                ) : null}

                <div className={`target-status-dot ${targetBook.availability?.toLowerCase()}`}>
                  <span className="status-dot"></span>
                  <span>{targetBook.availability || 'Available'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="target-description-box">
                <p className="target-desc-text">
                  {descExpanded || (targetBook.description?.length || 0) <= 240
                    ? targetBook.description || 'No extended catalog summary available.'
                    : `${targetBook.description.slice(0, 240)}...`}
                </p>
                {(targetBook.description?.length || 0) > 240 ? (
                  <button
                    type="button"
                    className="btn-desc-toggle"
                    onClick={() => setDescExpanded(!descExpanded)}
                  >
                    {descExpanded ? 'Show Less ▴' : 'Read More ▾'}
                  </button>
                ) : null}
              </div>

              {/* Themes & Keywords */}
              <div className="target-attributes-grid">
                {targetThemes.length > 0 ? (
                  <div className="attr-item">
                    <span className="attr-title">Themes:</span>
                    <div className="attr-chips-wrap">
                      {targetThemes.slice(0, 5).map((t) => (
                        <span key={t} className="attr-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {targetKeywords.length > 0 ? (
                  <div className="attr-item">
                    <span className="attr-title">Keywords:</span>
                    <div className="attr-chips-wrap">
                      {targetKeywords.slice(0, 5).map((k) => (
                        <span key={k} className="attr-chip keyword">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="target-actions-bar">
                <button
                  type="button"
                  className="btn-action-recommend"
                  onClick={() =>
                    navigate(
                      `/recommend?genre=${encodeURIComponent(targetBook.genre || '')}&mood=${encodeURIComponent(
                        targetBook.mood || ''
                      )}`
                    )
                  }
                >
                  ✨ Find Recommendations
                </button>
                <button
                  type="button"
                  className="btn-action-study"
                  onClick={() => navigate(`/study?bookId=${encodeURIComponent(targetBook.id)}`)}
                >
                  📖 Create Study Plan
                </button>
                <button
                  type="button"
                  className="btn-action-view"
                  onClick={() => setSelectedModalBook(targetBook)}
                >
                  Catalog Details →
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. Loading State */}
      {loading ? (
        <section className="similar-loading-card">
          <div className="loading-spinner-ring"></div>
          <h3>Finding Similar Books...</h3>
          <p className="loading-sub">
            Computing semantic similarities across genres, moods, themes, and keywords in the catalog.
          </p>
          <div className="loading-steps-pills">
            <span className="loading-step-pill">✓ Analyzing genres & subgenres</span>
            <span className="loading-step-pill">✓ Comparing themes & motifs</span>
            <span className="loading-step-pill">✓ Evaluating keywords</span>
            <span className="loading-step-pill">✓ Calculating similarity</span>
            <span className="loading-step-pill">✓ Ranking results</span>
          </div>
        </section>
      ) : null}

      {/* 5. Error State */}
      {error && !loading ? (
        <section className="similar-error-card">
          <div className="error-icon-circle">⚠️</div>
          <h3>Unable to find similar books</h3>
          <p>{error || 'An error occurred while computing similarity.'}</p>
          <div className="empty-actions-row">
            <button
              type="button"
              className="btn-secondary-pill"
              onClick={() => loadSimilar(bookIdParam || 'B07470')}
            >
              Try Again
            </button>
            <button
              type="button"
              className="btn-primary-pill"
              onClick={() => navigate('/search')}
            >
              Browse Library
            </button>
          </div>
        </section>
      ) : null}

      {/* 6. Empty State (No book selected) */}
      {!loading && !error && !targetBook ? (
        <section className="similar-empty-card">
          <div className="empty-icon-circle">🔗</div>
          <h3>Find books similar to something you love</h3>
          <p>
            Search for any title, author, or keyword above to discover related books based on
            shared genres, themes, moods, and structural characteristics.
          </p>
          <div className="empty-actions-row">
            <button
              type="button"
              className="btn-primary-pill"
              onClick={() => navigate('/search')}
            >
              Browse Library Catalog
            </button>
          </div>
        </section>
      ) : null}

      {/* 7. No Similar Books Found (Selected book has 0 matches) */}
      {!loading && !error && targetBook && similarList.length === 0 ? (
        <section className="similar-empty-card">
          <div className="empty-icon-circle">🔍</div>
          <h3>No similar books were found</h3>
          <p>
            No other books in the Knowledge Base matched enough shared attributes with “{targetBook.title}”.
            Try picking another book to explore.
          </p>
          <div className="empty-actions-row">
            <button
              type="button"
              className="btn-secondary-pill"
              onClick={() => {
                setSearchQuery('');
                document.getElementById('similar-search-input')?.focus();
              }}
            >
              Try Another Book
            </button>
            <button
              type="button"
              className="btn-primary-pill"
              onClick={() => navigate('/search')}
            >
              Browse Library
            </button>
          </div>
        </section>
      ) : null}

      {/* 8. Similarity Results Section */}
      {!loading && !error && targetBook && similarList.length > 0 ? (
        <section className="similar-results-section">
          {/* Section Header */}
          <div className="results-header-block">
            <div className="results-title-group">
              <h2 className="results-title">
                Books Similar to “{targetBook.title}”
              </h2>
              <p className="results-subtitle">
                Based on shared genres, themes, mood, keywords, and structural similarity.
              </p>
            </div>
            <div className="results-count-badge">
              {filteredAndSortedList.length} of {similarList.length} Similar Books Found
            </div>
          </div>

          {/* Sorting and Filters Toolbar */}
          <div className="similar-toolbar-card">
            <div className="toolbar-controls-group">
              {/* Sort by */}
              <div className="toolbar-control">
                <label htmlFor="similar-sort-select">Sort by:</label>
                <select
                  id="similar-sort-select"
                  className="toolbar-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="similarity">Similarity (Highest)</option>
                  <option value="rating">Rating (Highest)</option>
                  <option value="title">Title (A–Z)</option>
                </select>
              </div>

              {/* Filter: Genre */}
              {availableGenres.length > 1 ? (
                <div className="toolbar-control">
                  <label htmlFor="similar-genre-filter">Genre:</label>
                  <select
                    id="similar-genre-filter"
                    className="toolbar-select"
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                  >
                    <option value="all">All Genres</option>
                    {availableGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Filter: Mood */}
              {availableMoods.length > 1 ? (
                <div className="toolbar-control">
                  <label htmlFor="similar-mood-filter">Mood:</label>
                  <select
                    id="similar-mood-filter"
                    className="toolbar-select"
                    value={filterMood}
                    onChange={(e) => setFilterMood(e.target.value)}
                  >
                    <option value="all">All Moods</option>
                    {availableMoods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Filter: Availability */}
              <div className="toolbar-control">
                <label htmlFor="similar-avail-filter">Availability:</label>
                <select
                  id="similar-avail-filter"
                  className="toolbar-select"
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                </select>
              </div>

              {/* Filter: Minimum Match */}
              <div className="toolbar-control">
                <label htmlFor="similar-match-filter">Min Match:</label>
                <select
                  id="similar-match-filter"
                  className="toolbar-select"
                  value={minMatch}
                  onChange={(e) => setMinMatch(e.target.value)}
                >
                  <option value="all">Any Match</option>
                  <option value="70">70%+ Match</option>
                  <option value="75">75%+ Match</option>
                  <option value="80">80%+ Match</option>
                </select>
              </div>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={resetFilters}
              >
                Reset Filters ✕
              </button>
            ) : null}
          </div>

          {/* Filter Empty State */}
          {filteredAndSortedList.length === 0 ? (
            <div className="filter-no-results-card">
              <p>No similar books match your active filter criteria.</p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Similarity Results Grid (4 cards desktop, 2-3 tablet, 1 mobile) */
            <div className="similar-books-grid">
              {filteredAndSortedList.map((book) => {
                const isFav = isFavorite(book.id);
                const isWhyOpen = !!expandedWhy[book.id];
                const matchScore = book.similarityScore || 70;

                // Shared factors list from real backend calculation
                const sharedThemesList = Array.isArray(book.sharedThemes)
                  ? book.sharedThemes
                  : typeof book.sharedThemes === 'string'
                  ? book.sharedThemes.split(' ').filter(Boolean)
                  : [];

                const sharedKeywordsList = Array.isArray(book.sharedKeywords)
                  ? book.sharedKeywords
                  : typeof book.sharedKeywords === 'string'
                  ? book.sharedKeywords.split(' ').filter(Boolean)
                  : [];

                const availClass = (book.availability || 'available').toLowerCase();

                return (
                  <div key={book.id} className="similar-book-card">
                    {/* Top Bar: Match score badge & Bookmark */}
                    <div className="similar-card-top-bar">
                      <span className="similarity-score-pill">
                        {matchScore}% Match
                      </span>

                      <button
                        type="button"
                        className={`card-bookmark-btn ${isFav ? 'active' : ''}`}
                        onClick={(e) => handleToggleCardFav(e, book)}
                        title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                        aria-label="Bookmark"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isFav ? '#38BDF8' : 'none'}
                          stroke={isFav ? '#38BDF8' : 'currentColor'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                    </div>

                    {/* Dedicated Book Cover Container (Complete cover visible with object-fit: contain) */}
                    <BookCover
                      src={book.image}
                      alt={book.title}
                      containerClassName="similar-card-cover-container"
                    />

                    {/* Card Body Info */}
                    <div className="similar-card-info-body">
                      <h3 className="similar-card-title" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="similar-card-author">{book.author}</p>

                      <div className="similar-card-rating-line">
                        <span className="star-icon">★</span>
                        <span className="rating-value">
                          {book.score ? Number(book.score).toFixed(1) : '4.0'}
                        </span>
                        {book.ratings ? (
                          <span className="ratings-count">
                            ({Number(book.ratings).toLocaleString()})
                          </span>
                        ) : null}
                      </div>

                      <div className="similar-card-tags-line">
                        <span className="tag-pill">{book.genre}</span>
                        {book.mood && book.mood !== 'Neutral' ? (
                          <span className="tag-pill mood">{book.mood}</span>
                        ) : null}
                      </div>

                      <div className={`similar-card-status-dot ${availClass}`}>
                        <span className="status-dot"></span>
                        <span>{book.availability || 'Available'}</span>
                      </div>

                      {/* Expandable "Why similar?" accordion */}
                      <div className="why-similar-accordion">
                        <button
                          type="button"
                          className={`btn-toggle-why ${isWhyOpen ? 'open' : ''}`}
                          onClick={() => toggleWhyAccordion(book.id)}
                        >
                          <span>Why similar?</span>
                          <span className="toggle-chevron">{isWhyOpen ? '▲' : '▼'}</span>
                        </button>

                        {isWhyOpen ? (
                          <div className="why-factors-box">
                            <ul className="why-factors-list">
                              {book.sharedGenre ? (
                                <li>
                                  <span className="factor-check">✓</span> Shared genre:{' '}
                                  <strong>{book.genre}</strong>
                                </li>
                              ) : null}
                              {book.sharedMood ? (
                                <li>
                                  <span className="factor-check">✓</span> Shared mood:{' '}
                                  <strong>{book.mood}</strong>
                                </li>
                              ) : null}
                              {sharedThemesList.length > 0 ? (
                                <li>
                                  <span className="factor-check">✓</span> Shared theme:{' '}
                                  <strong>{sharedThemesList.join(', ')}</strong>
                                </li>
                              ) : null}
                              {sharedKeywordsList.length > 0 ? (
                                <li>
                                  <span className="factor-check">✓</span> Similar keywords:{' '}
                                  <strong>{sharedKeywordsList.slice(0, 3).join(', ')}</strong>
                                </li>
                              ) : null}
                              {book.readingLevel &&
                              targetBook?.readingLevel &&
                              book.readingLevel === targetBook.readingLevel ? (
                                <li>
                                  <span className="factor-check">✓</span> Same reading level:{' '}
                                  <strong>{book.readingLevel}</strong>
                                </li>
                              ) : null}
                            </ul>
                          </div>
                        ) : null}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="similar-card-footer-actions">
                        <button
                          type="button"
                          className="btn-card-details"
                          onClick={() => setSelectedModalBook(book)}
                        >
                          View Details →
                        </button>

                        <button
                          type="button"
                          className="btn-find-similar"
                          onClick={() => handleSelectBook(book)}
                          title={`Explore books similar to ${book.title}`}
                        >
                          ⚡ Find Similar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* 9. Interactive Book Details Modal */}
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
