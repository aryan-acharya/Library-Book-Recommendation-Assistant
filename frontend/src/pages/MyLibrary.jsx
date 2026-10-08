import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader, EmptyState, Tabs } from '../components/UIComponents';
import {
  getFavorites,
  getRecentlyViewed,
  getCurrentlyReading,
  getCompletedBooks,
  getStudyPlans,
} from '../libraryStore';

export default function MyLibrary() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    function loadData() {
      setFavorites(getFavorites());
      setRecent(getRecentlyViewed());
      setCurrentlyReading(getCurrentlyReading());
      setCompleted(getCompletedBooks());
      setStudyPlans(getStudyPlans());
    }
    loadData();
    window.addEventListener('libraai_store_update', loadData);
    return () => window.removeEventListener('libraai_store_update', loadData);
  }, []);

  const totalShelfCount =
    favorites.length + currentlyReading.length + completed.length + recent.length;

  const tabOptions = [
    { id: 'all', label: `All Shelves (${totalShelfCount})` },
    { id: 'reading', label: `Currently Reading (${currentlyReading.length})` },
    { id: 'saved', label: `Saved Books (${favorites.length})` },
    { id: 'completed', label: `Completed (${completed.length})` },
    { id: 'recent', label: `Recently Viewed (${recent.length})` },
  ];

  return (
    <div className="my-library-page">
      <PageHeader
        title="My Library"
        description="Your centralized reading headquarters: active reading schedules, saved bookmarks, completed milestones, and recent explorations."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        }
      />

      {/* KPI Stats Strip */}
      <div className="library-stats-strip">
        <div
          className={`stat-card ${activeTab === 'reading' ? 'highlight' : ''}`}
          onClick={() => setActiveTab('reading')}
          role="button"
          tabIndex={0}
        >
          <span className="stat-label">Currently Reading</span>
          <strong className="stat-value">{currentlyReading.length}</strong>
          <span className="stat-sub">Active in progress</span>
        </div>
        <div
          className={`stat-card ${activeTab === 'saved' ? 'highlight' : ''}`}
          onClick={() => setActiveTab('saved')}
          role="button"
          tabIndex={0}
        >
          <span className="stat-label">Saved Books</span>
          <strong className="stat-value">{favorites.length}</strong>
          <span className="stat-sub">Bookmarked favorites</span>
        </div>
        <div
          className={`stat-card ${activeTab === 'completed' ? 'highlight' : ''}`}
          onClick={() => setActiveTab('completed')}
          role="button"
          tabIndex={0}
        >
          <span className="stat-label">Completed</span>
          <strong className="stat-value">{completed.length}</strong>
          <span className="stat-sub">Finished milestones</span>
        </div>
        <div
          className={`stat-card ${activeTab === 'recent' ? 'highlight' : ''}`}
          onClick={() => setActiveTab('recent')}
          role="button"
          tabIndex={0}
        >
          <span className="stat-label">Recently Viewed</span>
          <strong className="stat-value">{recent.length}</strong>
          <span className="stat-sub">Browsing history</span>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="library-tabs-row">
        <Tabs
          tabs={tabOptions}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* SECTION 1: Currently Reading */}
      {(activeTab === 'all' || activeTab === 'reading') && (
        <section className="library-shelf-section">
          <div className="shelf-section-header">
            <div className="shelf-title-wrap">
              <span className="shelf-icon">📖</span>
              <h2>Currently Reading ({currentlyReading.length})</h2>
            </div>
            <Link to="/study" className="shelf-action-link">
              Study Companion →
            </Link>
          </div>

          {currentlyReading.length === 0 ? (
            <div className="shelf-empty-inline">
              <p>No books currently in progress.</p>
              <button
                type="button"
                className="btn-small-primary"
                onClick={() => navigate('/study')}
              >
                Start a Reading Plan →
              </button>
            </div>
          ) : (
            <div className="books-grid">
              {currentlyReading.map((book) => {
                const plan = studyPlans.find((p) => p.bookId === book.id);
                const done = plan?.completedDays?.length || 0;
                const total = plan?.days || 1;
                const pct = Math.round((done / total) * 100);

                return (
                  <div key={book.id} className="shelf-book-wrapper">
                    <BookCard
                      book={book}
                      onSelect={() => setSelectedBook(book)}
                    />
                    {plan && (
                      <div className="shelf-progress-indicator">
                        <div className="indicator-top">
                          <span>Reading Progress</span>
                          <strong>{pct}% ({done}/{total} days)</strong>
                        </div>
                        <div className="indicator-bar">
                          <div className="fill" style={{ width: `${pct}%` }}></div>
                        </div>
                        <Link
                          to={`/study?bookId=${book.id}`}
                          className="btn-inline-resume"
                        >
                          Continue Schedule →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: Saved Books */}
      {(activeTab === 'all' || activeTab === 'saved') && (
        <section className="library-shelf-section">
          <div className="shelf-section-header">
            <div className="shelf-title-wrap">
              <span className="shelf-icon">♥</span>
              <h2>Saved Books ({favorites.length})</h2>
            </div>
            <Link to="/favorites" className="shelf-action-link">
              Manage Favorites →
            </Link>
          </div>

          {favorites.length === 0 ? (
            <div className="shelf-empty-inline">
              <p>You haven’t bookmarked any books yet.</p>
              <button
                type="button"
                className="btn-small-primary"
                onClick={() => navigate('/search')}
              >
                Explore Catalog →
              </button>
            </div>
          ) : (
            <div className="books-grid">
              {favorites.map((book) => (
                <div key={book.id} className="shelf-book-wrapper">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: Completed */}
      {(activeTab === 'all' || activeTab === 'completed') && (
        <section className="library-shelf-section">
          <div className="shelf-section-header">
            <div className="shelf-title-wrap">
              <span className="shelf-icon">🏆</span>
              <h2>Completed ({completed.length})</h2>
            </div>
          </div>

          {completed.length === 0 ? (
            <div className="shelf-empty-inline">
              <p>No books completed yet. Books you finish in your study plans will appear here.</p>
            </div>
          ) : (
            <div className="books-grid">
              {completed.map((book) => (
                <div key={book.id} className="shelf-book-wrapper">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />
                  <div className="shelf-completed-badge">
                    <span>✓ Completed Milestone</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 4: Recently Viewed */}
      {(activeTab === 'all' || activeTab === 'recent') && (
        <section className="library-shelf-section">
          <div className="shelf-section-header">
            <div className="shelf-title-wrap">
              <span className="shelf-icon">👁️</span>
              <h2>Recently Viewed ({recent.length})</h2>
            </div>
          </div>

          {recent.length === 0 ? (
            <div className="shelf-empty-inline">
              <p>No books viewed recently. Books you explore will automatically appear here.</p>
              <button
                type="button"
                className="btn-small-primary"
                onClick={() => navigate('/')}
              >
                Discover on Home →
              </button>
            </div>
          ) : (
            <div className="books-grid">
              {recent.map((book) => (
                <div key={book.id} className="shelf-book-wrapper">
                  <BookCard
                    book={book}
                    onSelect={() => setSelectedBook(book)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Global Book Details Modal */}
      {selectedBook ? (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </div>
  );
}
