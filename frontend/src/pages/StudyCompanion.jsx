import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Cover } from '../components/BookComponents';
import { PageHeader, EmptyState, LoadingState } from '../components/UIComponents';
import {
  deleteStudyPlan,
  getFavorites,
  getStudyPlans,
  saveStudyPlan,
  toggleStudyDay,
  setBookShelf,
} from '../libraryStore';

export default function StudyCompanion() {
  const [searchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const [days, setDays] = useState(7);
  const [activePlan, setActivePlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [continueFeedback, setContinueFeedback] = useState('');
  const scheduleRef = useRef(null);

  useEffect(() => {
    const plans = getStudyPlans();
    setSavedPlans(plans);

    const bookIdParam = searchParams.get('bookId');
    if (bookIdParam) {
      loadBook(bookIdParam);
    } else if (plans.length > 0) {
      setActivePlan(plans[0]);
    } else {
      const favs = getFavorites();
      if (favs.length > 0) {
        setSelectedBook(favs[0]);
      } else {
        loadBook('B07470'); // The Silent Patient default
      }
    }

    function onStorage() {
      setSavedPlans(getStudyPlans());
    }
    window.addEventListener('libraai_store_update', onStorage);
    return () => window.removeEventListener('libraai_store_update', onStorage);
  }, [searchParams]);

  async function loadBook(id) {
    setLoadingBook(true);
    try {
      const res = await api.book(id);
      if (res && res.book) {
        setSelectedBook(res.book);
        const existingPlan = getStudyPlans().find((p) => p.bookId === id);
        if (existingPlan) {
          setActivePlan(existingPlan);
          setDays(existingPlan.days);
        }
      }
    } catch (e) {
      console.error('Failed to load book for study plan:', e);
    } finally {
      setLoadingBook(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.search(searchQuery.trim(), 1, 6);
      setSearchResults(res.books || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleCreatePlan() {
    if (!selectedBook) return;

    // Estimate pages based on book length
    let totalPages = 320;
    const len = (selectedBook.length || '').toLowerCase();
    if (len === 'short') totalPages = 180;
    else if (len === 'long') totalPages = 540;

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
        targetPages: Math.max(1, end - currentStart + 1),
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
    setBookShelf(selectedBook, 'reading');
    setActivePlan(newPlan);
    setSavedPlans(getStudyPlans());
    setContinueFeedback('Study plan generated and added to Currently Reading!');
    setTimeout(() => setContinueFeedback(''), 4000);

    // Scroll smoothly to schedule
    setTimeout(() => {
      scheduleRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }

  function handleReset() {
    setDays(7);
    setSearchQuery('');
    setSearchResults([]);
    const favs = getFavorites();
    if (favs.length > 0) {
      setSelectedBook(favs[0]);
    } else {
      loadBook('B07470');
    }
    setContinueFeedback('Form reset to default settings.');
    setTimeout(() => setContinueFeedback(''), 3000);
  }

  function handleDayToggle(dayNum) {
    if (!activePlan) return;
    toggleStudyDay(activePlan.bookId, dayNum);
    const updated = getStudyPlans().find((p) => p.bookId === activePlan.bookId);
    if (updated) {
      setActivePlan(updated);
      // If all days completed, prompt or mark shelf as completed
      if (updated.completedDays?.length === updated.days) {
        setBookShelf(
          {
            id: updated.bookId,
            title: updated.title,
            author: updated.author,
            image: updated.image,
            genre: updated.genre,
          },
          'completed'
        );
        setContinueFeedback('Congratulations! You completed this reading plan! 🎉 Book moved to Completed shelf.');
      }
    }
  }

  function handleContinueReading() {
    if (!activePlan) return;
    // Find next uncompleted day
    const completed = activePlan.completedDays || [];
    const nextDay = activePlan.schedule?.find((item) => !completed.includes(item.day));
    if (nextDay) {
      // Mark it as done or highlight
      handleDayToggle(nextDay.day);
      setContinueFeedback(`Marked Day ${nextDay.day} (Pages ${nextDay.startPage}–${nextDay.endPage}) as completed! 📖`);
    } else {
      setContinueFeedback('All reading days for this book are completed! Great job! 🎉');
    }
    setTimeout(() => setContinueFeedback(''), 4500);
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
  const remainingDays = Math.max(0, totalDaysCount - completedCount);

  return (
    <div className="study-companion-page">
      <PageHeader
        title="Study Companion"
        description="Create a personalized reading plan and daily schedule to finish any book at your pace."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M9 16l2 2 4-4"></path>
          </svg>
        }
      />

      {continueFeedback && (
        <div className="study-feedback-toast">
          <span>{continueFeedback}</span>
        </div>
      )}

      {/* 4-Step Visual Flow Header */}
      <div className="study-flow-steps-banner">
        <div className="flow-step-item active">
          <span className="step-num">1</span>
          <span className="step-text">Select Book</span>
        </div>
        <span className="step-arrow">→</span>
        <div className="flow-step-item active">
          <span className="step-num">2</span>
          <span className="step-text">Enter Days</span>
        </div>
        <span className="step-arrow">→</span>
        <div className="flow-step-item active">
          <span className="step-num">3</span>
          <span className="step-text">Generate Plan</span>
        </div>
        <span className="step-arrow">→</span>
        <div className="flow-step-item active">
          <span className="step-num">4</span>
          <span className="step-text">Reading Schedule</span>
        </div>
      </div>

      <div className="study-layout-grid">
        {/* Left Column: Flow Controls & Plan Config */}
        <div className="study-sidebar-col">
          {/* Step 1: Select Book */}
          <div className="study-card-panel">
            <div className="panel-step-badge">Step 1</div>
            <h3>Select a Book</h3>
            <p className="panel-sub">Search library catalog or pick a book to schedule.</p>

            <form className="study-search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-small-primary" disabled={searching}>
                {searching ? '...' : 'Search'}
              </button>
            </form>

            {/* Live Search Results Picker */}
            {searchResults.length > 0 && (
              <div className="study-search-results-list">
                <div className="results-head">Choose Book:</div>
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
            )}

            {/* Selected Book Preview */}
            {selectedBook ? (
              <div className="selected-book-preview-card">
                <Cover src={selectedBook.image} alt={selectedBook.title} className="preview-cover" />
                <div className="preview-info">
                  <h4>{selectedBook.title}</h4>
                  <p className="preview-author">by {selectedBook.author}</p>
                  <div className="preview-tags">
                    <span className="tag-pill">{selectedBook.genre || 'Fiction'}</span>
                    <span className="tag-pill">
                      {selectedBook.length ? `${selectedBook.length} Length` : '~320 Pages'}
                    </span>
                    {selectedBook.score ? (
                      <span className="tag-pill gold">★ {selectedBook.score}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : loadingBook ? (
              <LoadingState message="Loading book details..." />
            ) : (
              <p className="muted-hint">Search and select any book above.</p>
            )}
          </div>

          {/* Step 2: Enter Number of Days */}
          <div className="study-card-panel">
            <div className="panel-step-badge">Step 2</div>
            <h3>Enter Number of Days</h3>
            <p className="panel-sub">How many days do you want to allocate for reading?</p>

            <div className="days-input-wrapper">
              <label htmlFor="study-days-input">Target Duration</label>
              <div className="stepper-row">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setDays((d) => Math.max(1, Number(d) - 1))}
                >
                  −
                </button>
                <input
                  id="study-days-input"
                  type="number"
                  min="1"
                  max="60"
                  className="study-days-num-input"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setDays((d) => Math.min(60, Number(d) + 1))}
                >
                  +
                </button>
                <span className="days-unit">Days</span>
              </div>
            </div>

            {/* Quick Days Selector Chips */}
            <div className="days-quick-chips">
              {[3, 7, 14, 21, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip-day ${Number(days) === d ? 'active' : ''}`}
                  onClick={() => setDays(d)}
                >
                  {d} Days
                </button>
              ))}
            </div>

            {/* Estimated Page Target Pill */}
            {selectedBook && (
              <div className="daily-pace-estimate">
                <span>Estimated Pace:</span>
                <strong>
                  ~{Math.ceil((selectedBook.length?.toLowerCase() === 'short' ? 180 : selectedBook.length?.toLowerCase() === 'long' ? 540 : 320) / Math.max(1, Number(days) || 7))} pages/day
                </strong>
              </div>
            )}
          </div>

          {/* Step 3: Action Buttons */}
          <div className="study-actions-panel">
            <button
              type="button"
              className="btn-generate-plan"
              onClick={handleCreatePlan}
              disabled={!selectedBook || loadingBook}
            >
              Generate Plan →
            </button>
            <button
              type="button"
              className="btn-reset-plan"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {/* Saved Reading Plans List */}
          {savedPlans.length > 0 && (
            <div className="study-card-panel">
              <h3>Active Schedules ({savedPlans.length})</h3>
              <div className="saved-plans-compact-list">
                {savedPlans.map((p) => {
                  const done = p.completedDays?.length || 0;
                  const pct = Math.round((done / p.days) * 100);
                  const isCurrent = activePlan?.bookId === p.bookId;
                  return (
                    <div
                      key={p.bookId}
                      className={`saved-plan-row ${isCurrent ? 'selected' : ''}`}
                      onClick={() => setActivePlan(p)}
                    >
                      <Cover src={p.image} alt={p.title} className="row-thumb" />
                      <div className="row-details">
                        <strong title={p.title}>{p.title}</strong>
                        <span>
                          {done}/{p.days} days ({pct}%)
                        </span>
                        <div className="row-progress-bar">
                          <div className="row-progress-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-plan-icon"
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
          )}
        </div>

        {/* Right Column: Step 4 Reading Schedule */}
        <div className="study-main-col" ref={scheduleRef}>
          {activePlan ? (
            <div className="reading-schedule-dashboard">
              {/* Header Info Banner */}
              <div className="schedule-meta-banner">
                <div className="banner-left">
                  <Cover src={activePlan.image} alt={activePlan.title} className="schedule-hero-cover" />
                  <div className="banner-text">
                    <span className="badge-pill active">Step 4: Reading Schedule</span>
                    <h2>{activePlan.title}</h2>
                    <p className="author-name">by {activePlan.author}</p>
                    <div className="schedule-key-metrics">
                      <span className="key-metric">
                        Total: <strong>~{activePlan.totalPages} pages</strong>
                      </span>
                      <span className="key-metric">
                        Daily Target: <strong>~{activePlan.pagesPerDay} pages/day</strong>
                      </span>
                      <span className="key-metric">
                        Plan Duration: <strong>{activePlan.days} days</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Box & Action */}
                <div className="banner-progress-box">
                  <div className="progress-top-row">
                    <span className="progress-percentage">{progressPct}%</span>
                    <span className="progress-count">
                      {completedCount} / {totalDaysCount} Days
                    </span>
                  </div>
                  <div className="large-progress-track">
                    <div className="large-progress-fill" style={{ width: `${progressPct}%` }}></div>
                  </div>
                  <div className="estimate-row">
                    {progressPct === 100 ? (
                      <span className="completion-estimate complete">🎉 All targets completed!</span>
                    ) : (
                      <span className="completion-estimate">
                        Est. completion in {remainingDays} {remainingDays === 1 ? 'day' : 'days'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-continue-reading"
                    onClick={handleContinueReading}
                  >
                    📖 Continue Reading
                  </button>
                </div>
              </div>

              {/* Day-by-Day Reading Schedule Grid */}
              <div className="schedule-days-section">
                <div className="section-title-strip">
                  <h3>Daily Reading Targets</h3>
                  <span className="sub-hint">Click any day to toggle completion</span>
                </div>

                <div className="daily-schedule-cards-grid">
                  {(activePlan.schedule || []).map((item) => {
                    const isDone = (activePlan.completedDays || []).includes(item.day);
                    return (
                      <div
                        key={item.day}
                        className={`daily-target-card ${isDone ? 'done' : ''}`}
                        onClick={() => handleDayToggle(item.day)}
                      >
                        <div className="card-header-row">
                          <span className="day-badge">Day {item.day}</span>
                          <span className={`status-pill ${isDone ? 'checked' : 'pending'}`}>
                            {isDone ? '✓ Done' : '○ Pending'}
                          </span>
                        </div>

                        <div className="card-page-range">
                          Pages {item.startPage} – {item.endPage}
                        </div>

                        <div className="card-target-footer">
                          <span>Target:</span>
                          <strong>{item.targetPages} pages</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="📖"
              title="No Active Reading Schedule"
              message="Select or search for any book in Step 1 to generate a personalized daily reading plan."
              actionText="Pick a Book to Plan"
              onAction={() => {
                const favs = getFavorites();
                if (favs.length > 0) setSelectedBook(favs[0]);
                else loadBook('B07470');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
