import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import {
  getFavorites,
  getRecentlyViewed,
  getCurrentlyReading,
  getCompletedBooks,
  getStudyPlans,
  getAnalytics,
  setBookShelf,
  removeBookShelf,
  removeFavorite,
  toggleFavorite,
  clearRecentlyViewed,
} from '../libraryStore';

export default function MyLibrary() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'bookshelf' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'rating-desc' | 'rating-asc' | 'title'
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [recent, setRecent] = useState(() => getRecentlyViewed());
  const [currentlyReading, setCurrentlyReading] = useState(() => getCurrentlyReading());
  const [completed, setCompleted] = useState(() => getCompletedBooks());
  const [studyPlans, setStudyPlans] = useState(() => getStudyPlans());
  const [analytics, setAnalytics] = useState(() => getAnalytics());
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeMenuBookId, setActiveMenuBookId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    function loadData() {
      setFavorites(getFavorites());
      setRecent(getRecentlyViewed());
      setCurrentlyReading(getCurrentlyReading());
      setCompleted(getCompletedBooks());
      setStudyPlans(getStudyPlans());
      setAnalytics(getAnalytics());
    }
    window.addEventListener('libraai_store_update', loadData);
    return () => window.removeEventListener('libraai_store_update', loadData);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Close book action menu on click outside
  useEffect(() => {
    function handleWindowClick() {
      setActiveMenuBookId(null);
    }
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  function showToast(msg) {
    setToastMessage(msg);
  }

  // Deduplicated unique collection for overall count & surprise pick
  const allUniqueBooks = useMemo(() => {
    const map = new Map();
    [...currentlyReading, ...favorites, ...completed, ...recent].forEach((b) => {
      if (b && b.id && !map.has(b.id)) {
        map.set(b.id, b);
      }
    });
    return Array.from(map.values());
  }, [currentlyReading, favorites, completed, recent]);

  const totalShelfCount = allUniqueBooks.length;

  // Filter and sort helper
  function processBooks(bookList) {
    let result = [...bookList];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q) ||
          (b.genre || '').toLowerCase().includes(q) ||
          (b.mood || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'rating-desc') {
      result.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    } else if (sortBy === 'rating-asc') {
      result.sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return result;
  }

  // Surprise random book from library
  function handleSurprisePick() {
    if (allUniqueBooks.length === 0) {
      showToast('Your library is empty. Save or explore a book first!');
      return;
    }
    const randomIndex = Math.floor(Math.random() * allUniqueBooks.length);
    setSelectedBook(allUniqueBooks[randomIndex]);
    showToast(`Surprise Pick: "${allUniqueBooks[randomIndex].title}"`);
  }

  // Move book between shelves
  function handleMoveToShelf(book, targetShelf, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveMenuBookId(null);

    if (targetShelf === 'reading') {
      setBookShelf(book, 'reading');
      showToast(`Moved "${book.title}" to Currently Reading`);
    } else if (targetShelf === 'completed') {
      setBookShelf(book, 'completed');
      showToast(`Marked "${book.title}" as Completed Milestone!`);
    } else if (targetShelf === 'saved') {
      toggleFavorite(book);
      showToast(`Bookmarked "${book.title}" in Saved Books`);
    } else if (targetShelf === 'remove-reading') {
      removeBookShelf(book.id);
      showToast(`Removed "${book.title}" from Currently Reading`);
    } else if (targetShelf === 'remove-completed') {
      removeBookShelf(book.id);
      showToast(`Removed "${book.title}" from Completed`);
    } else if (targetShelf === 'remove-favorite') {
      removeFavorite(book.id);
      showToast(`Removed "${book.title}" from Saved Favorites`);
    }
  }

  function handleClearHistory(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm('Clear all recently viewed book history?')) {
      clearRecentlyViewed();
      showToast('Recently viewed history cleared.');
    }
  }

  const tabOptions = [
    { id: 'all', label: 'All Shelves', count: totalShelfCount, icon: '📚' },
    { id: 'reading', label: 'Currently Reading', count: currentlyReading.length, icon: '📖' },
    { id: 'saved', label: 'Saved Wishlist', count: favorites.length, icon: '♥' },
    { id: 'completed', label: 'Completed', count: completed.length, icon: '🏆' },
    { id: 'recent', label: 'Recently Viewed', count: recent.length, icon: '👁️' },
  ];

  const processedReading = processBooks(currentlyReading);
  const processedFavorites = processBooks(favorites);
  const processedCompleted = processBooks(completed);
  const processedRecent = processBooks(recent);

  const topGenre = analytics?.favoriteGenres?.[0]?.genre || null;
  const progressPct = analytics?.readingProgressPct || 0;

  return (
    <div className="my-library-page-v2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="library-floating-toast">
          <span className="toast-icon">✨</span>
          <span className="toast-text">{toastMessage}</span>
        </div>
      )}

      {/* Atmospheric Hero Sanctuary Header */}
      <section className="library-hero-sanctuary">
        <div className="hero-sanctuary-content">
          <div className="hero-sanctuary-header">
            <div className="hero-sanctuary-badge">
              <span className="badge-sparkle">✨</span>
              <span>Personal Reading Sanctuary</span>
            </div>
            <h1 className="hero-sanctuary-title">
              My Library <span className="title-gradient-glow">& Reader HQ</span>
            </h1>
            <p className="hero-sanctuary-desc">
              Your centralized digital atelier: manage active reading schedules, bookmarked
              treasures, completed milestones, and track your reading velocity.
            </p>

            {/* Quick Metrics Bento Pills */}
            <div className="hero-sanctuary-pills">
              <div className="bento-pill">
                <span className="pill-dot emerald" />
                <span className="pill-label">Collection:</span>
                <strong className="pill-val">{totalShelfCount} Books</strong>
              </div>
              <div className="bento-pill">
                <span className="pill-dot cyan" />
                <span className="pill-label">Study Progress:</span>
                <strong className="pill-val">{progressPct}% Complete</strong>
              </div>
              {topGenre && (
                <div className="bento-pill">
                  <span className="pill-dot amber" />
                  <span className="pill-label">Affinity:</span>
                  <strong className="pill-val">{topGenre}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Hero Action Controls */}
          <div className="hero-sanctuary-actions">
            <Link to="/recommend" className="btn-hero-primary">
              <span className="btn-icon">⚡</span>
              <span>AI Recommendations</span>
            </Link>
            <Link to="/study" className="btn-hero-secondary">
              <span className="btn-icon">📅</span>
              <span>Study Planner</span>
            </Link>
            <button
              type="button"
              className="btn-hero-glass"
              onClick={handleSurprisePick}
              title="Pick a random book from your collection"
            >
              <span className="btn-icon">🎲</span>
              <span>Surprise Read</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="hero-sanctuary-ambient-glow" />
      </section>

      {/* Interactive KPI Shelf Cards Strip */}
      <div className="library-kpi-grid">
        {/* Card 1: Currently Reading */}
        <div
          className={`library-kpi-card card-reading ${activeTab === 'reading' ? 'is-active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'reading' ? 'all' : 'reading')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap emerald">
              <span className="kpi-icon">📖</span>
            </div>
            <div className="kpi-live-badge">
              <span className="live-pulse" />
              <span>In Progress</span>
            </div>
          </div>
          <div className="kpi-main">
            <span className="kpi-label">Currently Reading</span>
            <strong className="kpi-count">{currentlyReading.length}</strong>
            <span className="kpi-sub">
              {studyPlans.length > 0 ? `${studyPlans.length} active schedules` : 'Active book schedules'}
            </span>
          </div>
          <div className="kpi-bottom-bar emerald-bar" />
        </div>

        {/* Card 2: Saved Favorites */}
        <div
          className={`library-kpi-card card-saved ${activeTab === 'saved' ? 'is-active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'saved' ? 'all' : 'saved')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap rose">
              <span className="kpi-icon">♥</span>
            </div>
            <div className="kpi-tag-badge rose-tag">Wishlist</div>
          </div>
          <div className="kpi-main">
            <span className="kpi-label">Saved Books</span>
            <strong className="kpi-count">{favorites.length}</strong>
            <span className="kpi-sub">Bookmarked for later</span>
          </div>
          <div className="kpi-bottom-bar rose-bar" />
        </div>

        {/* Card 3: Completed Milestones */}
        <div
          className={`library-kpi-card card-completed ${activeTab === 'completed' ? 'is-active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'completed' ? 'all' : 'completed')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap amber">
              <span className="kpi-icon">🏆</span>
            </div>
            <div className="kpi-tag-badge amber-tag">Milestones</div>
          </div>
          <div className="kpi-main">
            <span className="kpi-label">Completed</span>
            <strong className="kpi-count">{completed.length}</strong>
            <span className="kpi-sub">Finished book goals</span>
          </div>
          <div className="kpi-bottom-bar amber-bar" />
        </div>

        {/* Card 4: Recently Viewed */}
        <div
          className={`library-kpi-card card-recent ${activeTab === 'recent' ? 'is-active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'recent' ? 'all' : 'recent')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-top">
            <div className="kpi-icon-wrap indigo">
              <span className="kpi-icon">👁️</span>
            </div>
            <div className="kpi-tag-badge indigo-tag">History</div>
          </div>
          <div className="kpi-main">
            <span className="kpi-label">Recently Viewed</span>
            <strong className="kpi-count">{recent.length}</strong>
            <span className="kpi-sub">Catalog explorations</span>
          </div>
          <div className="kpi-bottom-bar indigo-bar" />
        </div>
      </div>

      {/* Reader Command Toolbar (Tabs + Search + Sort + View Mode) */}
      <div className="library-command-toolbar">
        {/* Segmented Shelf Tabs */}
        <div className="toolbar-tabs-cluster">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`toolbar-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-text">{tab.label}</span>
              <span className="tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search, Sort & View Mode Cluster */}
        <div className="toolbar-controls-cluster">
          {/* Instant Shelf Search */}
          <div className="shelf-search-input-box">
            <span className="search-symbol">🔍</span>
            <input
              type="text"
              placeholder="Filter your shelves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shelf-search-field"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-shelf-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="shelf-sort-box">
            <label htmlFor="shelf-sort-select" className="sr-only">
              Sort Shelves
            </label>
            <select
              id="shelf-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="shelf-sort-select"
            >
              <option value="recent">Default / Recent</option>
              <option value="rating-desc">Highest Rated (★)</option>
              <option value="rating-asc">Lowest Rated</option>
              <option value="title">Alphabetical (A–Z)</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="shelf-view-toggle-group">
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

      {/* =========================================================================
          SECTION 1: Currently Reading Shelf
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'reading') && (
        <section className="library-shelf-module reading-shelf-module">
          <div className="shelf-module-header">
            <div className="shelf-header-left">
              <div className="shelf-gem-icon emerald-gem">📖</div>
              <div>
                <div className="shelf-title-line">
                  <h2 className="shelf-heading">Currently Reading</h2>
                  <span className="shelf-count-pill emerald-pill">
                    {processedReading.length} {processedReading.length === 1 ? 'book' : 'books'}
                  </span>
                </div>
                <p className="shelf-subcaption">
                  Active schedules, daily milestones, and books currently in progress.
                </p>
              </div>
            </div>
            <div className="shelf-header-actions">
              <Link to="/study" className="shelf-link-cta">
                Study Companion Hub →
              </Link>
            </div>
          </div>

          {processedReading.length === 0 ? (
            <ShelfEmptyState
              icon="📖"
              title={searchQuery ? 'No reading books match your filter' : 'No books in progress'}
              description={
                searchQuery
                  ? `No books matching "${searchQuery}" found in your reading list.`
                  : 'Start a structured reading plan with our AI Study Companion to track daily chapters and milestones.'
              }
              actionText="Start a Reading Schedule →"
              onAction={() => navigate('/study')}
            />
          ) : viewMode === 'bookshelf' ? (
            <VirtualBookshelfRack
              books={processedReading}
              onSelectBook={setSelectedBook}
            />
          ) : viewMode === 'list' ? (
            <ShelfListView
              books={processedReading}
              studyPlans={studyPlans}
              onSelectBook={setSelectedBook}
              onMoveShelf={handleMoveToShelf}
              shelfType="reading"
            />
          ) : (
            <div className="books-grid shelf-grid">
              {processedReading.map((book) => {
                const plan = studyPlans.find((p) => p.bookId === book.id);
                const done = plan?.completedDays?.length || 0;
                const total = plan?.days || 1;
                const pct = Math.round((done / total) * 100);

                return (
                  <div key={book.id} className="shelf-card-container">
                    <BookCard
                      book={book}
                      onSelect={() => setSelectedBook(book)}
                    />

                    {/* Integrated Reading HUD */}
                    <div className="shelf-reading-hud">
                      <div className="hud-metric-row">
                        <span className="hud-track-label">Reading Progress</span>
                        <span className="hud-badge emerald-glow">
                          {pct}% ({done}/{total} days)
                        </span>
                      </div>

                      <div className="hud-progress-track">
                        <div
                          className="hud-progress-fill"
                          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                        />
                      </div>

                      <div className="hud-actions-row">
                        <Link
                          to={`/study?bookId=${encodeURIComponent(book.id)}`}
                          className="btn-hud-resume"
                        >
                          Continue Session →
                        </Link>

                        <div className="shelf-card-menu-wrap">
                          <button
                            type="button"
                            className="btn-shelf-menu-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuBookId(
                                activeMenuBookId === book.id ? null : book.id
                              );
                            }}
                            title="Manage Shelf"
                          >
                            •••
                          </button>

                          {activeMenuBookId === book.id && (
                            <div
                              className="shelf-dropdown-popover"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="popover-item"
                                onClick={(e) => handleMoveToShelf(book, 'completed', e)}
                              >
                                🏆 Mark as Completed
                              </button>
                              <button
                                type="button"
                                className="popover-item"
                                onClick={(e) => handleMoveToShelf(book, 'saved', e)}
                              >
                                ♥ Save to Wishlist
                              </button>
                              <button
                                type="button"
                                className="popover-item danger"
                                onClick={(e) => handleMoveToShelf(book, 'remove-reading', e)}
                              >
                                ✕ Remove from Shelf
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 2: Saved Wishlist Shelf
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'saved') && (
        <section className="library-shelf-module saved-shelf-module">
          <div className="shelf-module-header">
            <div className="shelf-header-left">
              <div className="shelf-gem-icon rose-gem">♥</div>
              <div>
                <div className="shelf-title-line">
                  <h2 className="shelf-heading">Saved Wishlist</h2>
                  <span className="shelf-count-pill rose-pill">
                    {processedFavorites.length}{' '}
                    {processedFavorites.length === 1 ? 'book' : 'books'}
                  </span>
                </div>
                <p className="shelf-subcaption">
                  Personal bookmarks and anticipated reads curated from AI recommendations.
                </p>
              </div>
            </div>
            <div className="shelf-header-actions">
              <Link to="/favorites" className="shelf-link-cta">
                Manage Favorites →
              </Link>
            </div>
          </div>

          {processedFavorites.length === 0 ? (
            <ShelfEmptyState
              icon="♥"
              title={searchQuery ? 'No saved books match your filter' : 'No books bookmarked yet'}
              description={
                searchQuery
                  ? `No books matching "${searchQuery}" found in your wishlist.`
                  : 'Bookmark captivating titles across the catalog or recommendation engine to build your dream shelf.'
              }
              actionText="Explore AI Recommendations →"
              onAction={() => navigate('/recommend')}
            />
          ) : viewMode === 'bookshelf' ? (
            <VirtualBookshelfRack
              books={processedFavorites}
              onSelectBook={setSelectedBook}
            />
          ) : viewMode === 'list' ? (
            <ShelfListView
              books={processedFavorites}
              studyPlans={studyPlans}
              onSelectBook={setSelectedBook}
              onMoveShelf={handleMoveToShelf}
              shelfType="saved"
            />
          ) : (
            <div className="books-grid shelf-grid">
              {processedFavorites.map((book) => (
                <div key={book.id} className="shelf-card-container">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />

                  {/* Quick Shelf Management Ribbon */}
                  <div className="shelf-saved-ribbon">
                    <button
                      type="button"
                      className="btn-shelf-action-primary"
                      onClick={(e) => handleMoveToShelf(book, 'reading', e)}
                    >
                      📖 Start Reading
                    </button>
                    <button
                      type="button"
                      className="btn-shelf-action-ghost"
                      onClick={() => navigate(`/similar?bookId=${encodeURIComponent(book.id)}`)}
                      title="Find Similar Books"
                    >
                      🔍 Similar
                    </button>
                    <button
                      type="button"
                      className="btn-shelf-action-danger"
                      onClick={(e) => handleMoveToShelf(book, 'remove-favorite', e)}
                      title="Remove Bookmark"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 3: Completed Milestones Shelf
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'completed') && (
        <section className="library-shelf-module completed-shelf-module">
          <div className="shelf-module-header">
            <div className="shelf-header-left">
              <div className="shelf-gem-icon amber-gem">🏆</div>
              <div>
                <div className="shelf-title-line">
                  <h2 className="shelf-heading">Completed Milestones</h2>
                  <span className="shelf-count-pill amber-pill">
                    {processedCompleted.length}{' '}
                    {processedCompleted.length === 1 ? 'book' : 'books'}
                  </span>
                </div>
                <p className="shelf-subcaption">
                  Books finished through daily schedules or self-paced reading achievements.
                </p>
              </div>
            </div>
            <div className="shelf-header-actions">
              <Link to="/recommend" className="shelf-link-cta">
                Find Your Next Read →
              </Link>
            </div>
          </div>

          {processedCompleted.length === 0 ? (
            <ShelfEmptyState
              icon="🏆"
              title={searchQuery ? 'No completed books match your filter' : 'No books completed yet'}
              description={
                searchQuery
                  ? `No books matching "${searchQuery}" found in your completed records.`
                  : 'Finished study plans and completed books will be celebrated here with achievement laurels.'
              }
              actionText="Browse Catalog →"
              onAction={() => navigate('/search')}
            />
          ) : viewMode === 'bookshelf' ? (
            <VirtualBookshelfRack
              books={processedCompleted}
              onSelectBook={setSelectedBook}
            />
          ) : viewMode === 'list' ? (
            <ShelfListView
              books={processedCompleted}
              studyPlans={studyPlans}
              onSelectBook={setSelectedBook}
              onMoveShelf={handleMoveToShelf}
              shelfType="completed"
            />
          ) : (
            <div className="books-grid shelf-grid">
              {processedCompleted.map((book) => (
                <div key={book.id} className="shelf-card-container">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />

                  {/* Celebratory Milestone Badge */}
                  <div className="shelf-celebration-ribbon">
                    <div className="celebration-badge-gold">
                      <span className="laurel-icon">🏆</span>
                      <strong>Finished Milestone</strong>
                    </div>
                    <div className="celebration-actions">
                      <button
                        type="button"
                        className="btn-celebrate-action"
                        onClick={() => navigate(`/similar?bookId=${encodeURIComponent(book.id)}`)}
                      >
                        Explore Similar →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 4: Recently Viewed Shelf
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'recent') && (
        <section className="library-shelf-module recent-shelf-module">
          <div className="shelf-module-header">
            <div className="shelf-header-left">
              <div className="shelf-gem-icon indigo-gem">👁️</div>
              <div>
                <div className="shelf-title-line">
                  <h2 className="shelf-heading">Recently Viewed</h2>
                  <span className="shelf-count-pill indigo-pill">
                    {processedRecent.length} {processedRecent.length === 1 ? 'book' : 'books'}
                  </span>
                </div>
                <p className="shelf-subcaption">
                  Books you recently inspected, searched, or explored across LibraAI.
                </p>
              </div>
            </div>
            <div className="shelf-header-actions">
              {recent.length > 0 && (
                <button
                  type="button"
                  className="btn-clear-history-ghost"
                  onClick={handleClearHistory}
                >
                  Clear History
                </button>
              )}
            </div>
          </div>

          {processedRecent.length === 0 ? (
            <ShelfEmptyState
              icon="👁️"
              title={searchQuery ? 'No recent books match your filter' : 'No recently viewed books'}
              description={
                searchQuery
                  ? `No books matching "${searchQuery}" found in your viewing history.`
                  : 'Books you discover on Home, Recommendations, or Search will automatically appear here for easy recall.'
              }
              actionText="Discover Books on Home →"
              onAction={() => navigate('/')}
            />
          ) : viewMode === 'bookshelf' ? (
            <VirtualBookshelfRack
              books={processedRecent}
              onSelectBook={setSelectedBook}
            />
          ) : viewMode === 'list' ? (
            <ShelfListView
              books={processedRecent}
              studyPlans={studyPlans}
              onSelectBook={setSelectedBook}
              onMoveShelf={handleMoveToShelf}
              shelfType="recent"
            />
          ) : (
            <div className="books-grid shelf-grid">
              {processedRecent.map((book) => (
                <div key={book.id} className="shelf-card-container">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />

                  {/* Quick Bookmark / Study Action Ribbon */}
                  <div className="shelf-recent-ribbon">
                    <button
                      type="button"
                      className="btn-shelf-action-primary"
                      onClick={(e) => handleMoveToShelf(book, 'reading', e)}
                    >
                      📖 Read
                    </button>
                    <button
                      type="button"
                      className="btn-shelf-action-ghost"
                      onClick={(e) => handleMoveToShelf(book, 'saved', e)}
                    >
                      ♥ Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
   Subcomponent: Aesthetic Empty State for Shelves
   ========================================================================= */
function ShelfEmptyState({ icon, title, description, actionText, onAction }) {
  return (
    <div className="aesthetic-shelf-empty-card">
      <div className="empty-halo-icon">
        <span className="empty-emoji">{icon}</span>
        <div className="empty-pulse-halo" />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {actionText && onAction && (
        <button type="button" className="btn-empty-action" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}

/* =========================================================================
   Subcomponent: Virtual 3D Bookshelf Mode (Cozy Digital Bookshelf)
   ========================================================================= */
function VirtualBookshelfRack({ books, onSelectBook }) {
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
                    {book.score && <span className="hover-score">★ {Number(book.score).toFixed(1)}</span>}
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
   Subcomponent: Compact Editorial List View
   ========================================================================= */
function ShelfListView({ books, studyPlans, onSelectBook, onMoveShelf, shelfType }) {
  return (
    <div className="shelf-list-view-table">
      {books.map((book) => {
        const plan = studyPlans.find((p) => p.bookId === book.id);
        const done = plan?.completedDays?.length || 0;
        const total = plan?.days || 1;
        const pct = Math.round((done / total) * 100);

        return (
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
                <div className="list-thumb-fallback">📖</div>
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

            {/* Progress or Status */}
            {shelfType === 'reading' && plan && (
              <div className="list-row-progress">
                <div className="list-progress-header">
                  <span>Progress:</span>
                  <strong>
                    {pct}% ({done}/{total}d)
                  </strong>
                </div>
                <div className="list-progress-bar">
                  <div className="list-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {shelfType === 'completed' && (
              <div className="list-row-status completed">
                <span>🏆 Completed Milestone</span>
              </div>
            )}

            {/* Quick Actions */}
            <div
              className="list-row-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="btn-list-action"
                onClick={() => onSelectBook?.(book)}
              >
                Inspect
              </button>
              {shelfType === 'saved' && (
                <button
                  type="button"
                  className="btn-list-action primary"
                  onClick={(e) => onMoveShelf(book, 'reading', e)}
                >
                  Start Reading
                </button>
              )}
              {shelfType === 'reading' && (
                <button
                  type="button"
                  className="btn-list-action success"
                  onClick={(e) => onMoveShelf(book, 'completed', e)}
                >
                  Mark Done
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
