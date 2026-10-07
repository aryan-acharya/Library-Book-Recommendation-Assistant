import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import {
  getFavorites,
  getRecentlyViewed,
  getStudyPlans,
} from '../libraryStore';

export default function MyLibrary() {
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    function loadData() {
      setFavorites(getFavorites());
      setRecent(getRecentlyViewed());
      setStudyPlans(getStudyPlans());
    }
    loadData();
    window.addEventListener('libraai_store_update', loadData);
    return () => window.removeEventListener('libraai_store_update', loadData);
  }, []);

  // Compute real reading progress statistics
  let totalDaysTarget = 0;
  let totalDaysDone = 0;
  studyPlans.forEach((p) => {
    totalDaysTarget += p.days || 1;
    totalDaysDone += (p.completedDays || []).length;
  });
  const overallReadingProgressPct =
    totalDaysTarget > 0 ? Math.round((totalDaysDone / totalDaysTarget) * 100) : 0;

  return (
    <div className="my-library-page">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>My Library</h1>
          <p>Your centralized reader hub: bookmarked favorites, active study schedules, and recently explored titles.</p>
        </div>
      </header>

      {/* Summary KPI Strip */}
      <div className="library-stats-strip">
        <div className="stat-card">
          <span className="stat-label">Favorites Saved</span>
          <strong className="stat-value">{favorites.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Study Plans</span>
          <strong className="stat-value">{studyPlans.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Recently Explored</span>
          <strong className="stat-value">{recent.length}</strong>
        </div>
        <div className="stat-card highlight">
          <span className="stat-label">Reading Plan Progress</span>
          <strong className="stat-value">{overallReadingProgressPct}%</strong>
        </div>
      </div>

      {/* Section 1: Active Reading Schedules & Progress */}
      <section className="library-section">
        <div className="section-header-inline">
          <h2>Reading Progress &amp; Active Schedules</h2>
          <Link to="/study" className="link-subtle">
            Manage Study Companion →
          </Link>
        </div>

        {studyPlans.length === 0 ? (
          <div className="empty-inline-box">
            <p>No active study schedules. Pick any book in your library to start a reading schedule.</p>
            <Link to="/study" className="btn-small-primary">
              Create Study Schedule
            </Link>
          </div>
        ) : (
          <div className="study-plans-overview-grid">
            {studyPlans.map((plan) => {
              const done = plan.completedDays?.length || 0;
              const pct = Math.round((done / plan.days) * 100);
              return (
                <div key={plan.bookId} className="study-overview-card">
                  <div className="card-top">
                    <div>
                      <h3>{plan.title}</h3>
                      <p className="author">by {plan.author}</p>
                    </div>
                    <span className="pct-badge">{pct}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="card-bottom">
                    <span>{done} of {plan.days} reading days finished</span>
                    <Link to={`/study?bookId=${plan.bookId}`} className="btn-resume">
                      Open Schedule →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Saved Favorites */}
      <section className="library-section">
        <div className="section-header-inline">
          <h2>Saved Favorites ({favorites.length})</h2>
          <Link to="/favorites" className="link-subtle">
            View All Favorites →
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-inline-box">
            <p>You haven’t bookmarked any books yet.</p>
            <Link to="/recommend" className="btn-small-primary">
              Discover Books
            </Link>
          </div>
        ) : (
          <div className="book-cards-row-scroll">
            {favorites.slice(0, 8).map((book) => (
              <div key={book.id} className="book-card-fixed-width">
                <BookCard book={book} onSelect={() => setSelectedBook(book)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Recently Explored Books */}
      <section className="library-section">
        <div className="section-header-inline">
          <h2>Recently Explored ({recent.length})</h2>
        </div>

        {recent.length === 0 ? (
          <div className="empty-inline-box">
            <p>No books viewed recently. Books you explore will automatically appear here.</p>
          </div>
        ) : (
          <div className="book-cards-row-scroll">
            {recent.slice(0, 8).map((book) => (
              <div key={book.id} className="book-card-fixed-width">
                <BookCard book={book} onSelect={() => setSelectedBook(book)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedBook ? (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </div>
  );
}
