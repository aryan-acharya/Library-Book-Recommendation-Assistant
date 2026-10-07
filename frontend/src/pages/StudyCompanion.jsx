import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Cover } from '../components/BookComponents';
import {
  deleteStudyPlan,
  getFavorites,
  getStudyPlans,
  saveStudyPlan,
  toggleStudyDay,
} from '../libraryStore';

export default function StudyCompanion() {
  const [searchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const [days, setDays] = useState(7);
  const [activePlan, setActivePlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const plans = getStudyPlans();
    setSavedPlans(plans);

    const bookIdParam = searchParams.get('bookId');
    if (bookIdParam) {
      loadBook(bookIdParam);
    } else if (plans.length > 0) {
      setActivePlan(plans[0]);
    } else {
      // Pick first favorite or sample book
      const favs = getFavorites();
      if (favs.length > 0) {
        setSelectedBook(favs[0]);
      } else {
        loadBook('B07470'); // The Silent Patient
      }
    }

    function onStorage() {
      setSavedPlans(getStudyPlans());
    }
    window.addEventListener('libraai_store_update', onStorage);
    return () => window.removeEventListener('libraai_store_update', onStorage);
  }, [searchParams]);

  async function loadBook(id) {
    setLoading(true);
    try {
      const res = await api.book(id);
      setSelectedBook(res.book);
      const existingPlan = getStudyPlans().find((p) => p.bookId === id);
      if (existingPlan) {
        setActivePlan(existingPlan);
        setDays(existingPlan.days);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.search(searchQuery.trim(), 1, 6);
      setSearchResults(res.books || []);
    } catch {
      setSearchResults([]);
    }
  }

  function handleCreatePlan() {
    if (!selectedBook) return;

    // Estimate pages based on book length
    let totalPages = 320;
    if (selectedBook.length?.toLowerCase() === 'short') totalPages = 180;
    if (selectedBook.length?.toLowerCase() === 'long') totalPages = 540;

    const numDays = Math.max(1, Math.min(60, Number(days) || 7));
    const pagesPerDay = Math.ceil(totalPages / numDays);

    const schedule = [];
    let currentStart = 1;
    for (let d = 1; d <= numDays; d++) {
      const end = Math.min(totalPages, currentStart + pagesPerDay - 1);
      schedule.push({
        day: d,
        startPage: currentStart,
        endPage: end,
        targetPages: end - currentStart + 1,
      });
      currentStart = end + 1;
    }

    const newPlan = {
      bookId: selectedBook.id,
      title: selectedBook.title,
      author: selectedBook.author,
      image: selectedBook.image,
      genre: selectedBook.genre,
      totalPages,
      days: numDays,
      pagesPerDay,
      schedule,
      completedDays: [],
      createdAt: new Date().toISOString(),
    };

    saveStudyPlan(newPlan);
    setActivePlan(newPlan);
    setSavedPlans(getStudyPlans());
  }

  function handleDayToggle(dayNum) {
    if (!activePlan) return;
    toggleStudyDay(activePlan.bookId, dayNum);
    const updated = getStudyPlans().find((p) => p.bookId === activePlan.bookId);
    if (updated) setActivePlan(updated);
  }

  function handleDeletePlan(bookId) {
    deleteStudyPlan(bookId);
    const plans = getStudyPlans();
    setSavedPlans(plans);
    if (activePlan?.bookId === bookId) {
      setActivePlan(plans[0] || null);
    }
  }

  const completedCount = activePlan?.completedDays?.length || 0;
  const totalDaysCount = activePlan?.days || 1;
  const progressPct = Math.round((completedCount / totalDaysCount) * 100);

  return (
    <div className="study-companion-page">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>Study &amp; Reading Companion</h1>
          <p>
            Break down any book into structured daily reading targets, track your page targets, and monitor your progress.
          </p>
        </div>

        {/* Book Search Form */}
        <form className="similar-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search book to plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-small-primary">Search</button>
        </form>
      </header>

      {/* Search results picker */}
      {searchResults.length > 0 ? (
        <div className="similar-search-dropdown-results">
          <div className="results-head">Choose book for study plan:</div>
          <div className="results-grid-compact">
            {searchResults.map((b) => (
              <div
                key={b.id}
                className="compact-select-card"
                onClick={() => {
                  setSelectedBook(b);
                  setSearchResults([]);
                  setSearchQuery('');
                  const existing = savedPlans.find((p) => p.bookId === b.id);
                  if (existing) setActivePlan(existing);
                }}
              >
                <Cover src={b.image} alt={b.title} className="thumb" />
                <div className="text">
                  <strong>{b.title}</strong>
                  <span>{b.author} · {b.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="study-layout-grid">
        {/* Left Column: Plan Generator & Saved Plans */}
        <div className="study-sidebar-col">
          <div className="study-create-card">
            <h3>Plan a New Book</h3>
            {selectedBook ? (
              <div className="selected-book-preview">
                <Cover src={selectedBook.image} alt={selectedBook.title} className="mini-cover" />
                <div className="mini-info">
                  <strong>{selectedBook.title}</strong>
                  <span>{selectedBook.author}</span>
                  <span className="badge-pill">{selectedBook.length || 'Medium'} Length</span>
                </div>
              </div>
            ) : (
              <p className="muted">Search or select a book above to plan.</p>
            )}

            <div className="days-input-group">
              <label htmlFor="study-days">Days Available to Read</label>
              <div className="input-stepper">
                <input
                  id="study-days"
                  type="number"
                  min="1"
                  max="60"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
                <span className="unit-label">days</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-create-plan"
              onClick={handleCreatePlan}
              disabled={!selectedBook || loading}
            >
              Generate Daily Reading Target →
            </button>
          </div>

          {/* Saved Plans List */}
          {savedPlans.length > 0 ? (
            <div className="saved-plans-card">
              <h3>Active Reading Schedules ({savedPlans.length})</h3>
              <div className="saved-plans-list">
                {savedPlans.map((p) => {
                  const done = p.completedDays?.length || 0;
                  const pct = Math.round((done / p.days) * 100);
                  const isCurrent = activePlan?.bookId === p.bookId;
                  return (
                    <div
                      key={p.bookId}
                      className={`saved-plan-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => setActivePlan(p)}
                    >
                      <Cover src={p.image} alt={p.title} className="plan-thumb" />
                      <div className="plan-item-meta">
                        <strong title={p.title}>{p.title}</strong>
                        <span>
                          {done}/{p.days} days ({pct}%)
                        </span>
                        <div className="mini-progress-bar">
                          <div className="fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="delete-plan-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(p.bookId);
                        }}
                        title="Delete schedule"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Active Schedule View */}
        <div className="study-main-col">
          {activePlan ? (
            <div className="active-schedule-card">
              <div className="schedule-header">
                <div className="schedule-book-info">
                  <Cover src={activePlan.image} alt={activePlan.title} className="schedule-cover" />
                  <div>
                    <span className="status-pill available">Active Reading Plan</span>
                    <h2>{activePlan.title}</h2>
                    <p className="author">by {activePlan.author}</p>
                    <div className="stats-badges-strip">
                      <span>Total: ~{activePlan.totalPages} pages</span>
                      <span>Target: ~{activePlan.pagesPerDay} pages/day</span>
                      <span>Target Time: {activePlan.days} days</span>
                    </div>
                  </div>
                </div>

                {/* Big Progress Gauge */}
                <div className="progress-summary-box">
                  <div className="progress-pct-huge">{progressPct}%</div>
                  <div className="progress-sub">
                    {completedCount} of {totalDaysCount} Days Done
                  </div>
                  <div className="full-progress-bar">
                    <div className="fill-blue" style={{ width: `${progressPct}%` }}></div>
                  </div>
                  <p className="est-finish">
                    {progressPct === 100
                      ? '🎉 Book Completed!'
                      : `Est. completion in ${totalDaysCount - completedCount} days`}
                  </p>
                </div>
              </div>

              {/* Day-by-Day Checklist */}
              <div className="schedule-days-grid">
                <h3>Daily Targets</h3>
                <div className="days-cards-container">
                  {activePlan.schedule?.map((item) => {
                    const isDone = (activePlan.completedDays || []).includes(item.day);
                    return (
                      <div
                        key={item.day}
                        className={`day-target-card ${isDone ? 'completed' : ''}`}
                        onClick={() => handleDayToggle(item.day)}
                      >
                        <div className="day-card-top">
                          <span className="day-number">Day {item.day}</span>
                          <span className={`check-indicator ${isDone ? 'checked' : ''}`}>
                            {isDone ? '✓ Completed' : '○ Pending'}
                          </span>
                        </div>
                        <div className="day-page-range">
                          Pages {item.startPage} – {item.endPage}
                        </div>
                        <div className="day-target-desc">
                          Target: {item.targetPages} pages
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-plan-placeholder">
              <div className="placeholder-icon">📖</div>
              <h3>No Active Reading Schedule</h3>
              <p>Select or search for any book to generate a personalized daily reading plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
