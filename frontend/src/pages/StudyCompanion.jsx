import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { BookCover } from '../components/BookComponents';
import { PageHeader, EmptyState, LoadingState } from '../components/UIComponents';
import {
  deleteStudyPlan,
  getFavorites,
  getStudyPlans,
  saveStudyPlan,
  toggleStudyDay,
  setBookShelf,
} from '../libraryStore';

// Curated library books for 1-click study planning
const QUICK_PICKS = [
  { id: 'B07470', title: 'The Silent Patient', author: 'Alex Michaelides' },
  { id: 'B00182', title: 'Silent Lies', author: 'Neva Altaj' },
  { id: 'B00288', title: 'The Iron King', author: 'Maurice Druon' },
  { id: 'B05753', title: 'Batman: The Dark Knight Returns', author: 'Frank Miller' },
  { id: 'B01930', title: 'Are You Afraid of the Dark?', author: 'Sidney Sheldon' },
];

export default function StudyCompanion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBook, setSelectedBook] = useState(null);
  const [days, setDays] = useState(7);
  const [activePlan, setActivePlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);

  // Search & autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [continueFeedback, setContinueFeedback] = useState('');

  const scheduleRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Initialize data on mount or URL change
  useEffect(() => {
    const plans = getStudyPlans();
    setSavedPlans(plans);

    const bookIdParam = searchParams.get('bookId');
    if (bookIdParam) {
      loadBook(bookIdParam);
    } else if (plans.length > 0) {
      const firstPlan = plans[0];
      setActivePlan(firstPlan);
      setSelectedBook({
        id: firstPlan.bookId,
        title: firstPlan.title,
        author: firstPlan.author,
        image: firstPlan.image,
        genre: firstPlan.genre,
        length: firstPlan.totalPages >= 400 ? 'Long' : firstPlan.totalPages <= 200 ? 'Short' : 'Medium',
      });
      setDays(firstPlan.days);
    } else {
      const favs = getFavorites();
      if (favs.length > 0) {
        setSelectedBook(favs[0]);
        loadBook(favs[0].id);
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

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search autocomplete
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

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
        console.error('Study search error:', err);
      } finally {
        if (!isCancelled) setSearching(false);
      }
    }, 220);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  async function loadBook(id) {
    if (!id) return;
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

  function handleSelectBookItem(book) {
    if (!book) return;
    setSelectedBook(book);
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchParams({ bookId: book.id });

    const existing = savedPlans.find((p) => p.bookId === book.id);
    if (existing) {
      setActivePlan(existing);
      setDays(existing.days);
    } else {
      loadBook(book.id);
    }
  }

  function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!searchQuery.trim()) return;
    if (suggestions.length > 0) {
      handleSelectBookItem(suggestions[0]);
    }
  }

  function handleCreatePlan() {
    if (!selectedBook) return;

    // Estimate total pages based on length attribute
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
      length: selectedBook.length,
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
    setContinueFeedback(`Study schedule generated for “${selectedBook.title}” and added to Currently Reading! 📖`);
    setTimeout(() => setContinueFeedback(''), 4500);

    setTimeout(() => {
      scheduleRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }

  function handleReset() {
    setDays(7);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    loadBook('B07470');
    setContinueFeedback('Study companion reset to defaults.');
    setTimeout(() => setContinueFeedback(''), 3000);
  }

  function handleDayToggle(dayNum) {
    if (!activePlan) return;
    toggleStudyDay(activePlan.bookId, dayNum);
    const updated = getStudyPlans().find((p) => p.bookId === activePlan.bookId);
    if (updated) {
      setActivePlan(updated);
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
        setContinueFeedback(`Congratulations! You completed the reading schedule for “${updated.title}”! 🎉 Moved to Completed shelf.`);
      } else {
        const isDoneNow = updated.completedDays?.includes(dayNum);
        setContinueFeedback(isDoneNow ? `Day ${dayNum} marked as completed! ✓` : `Day ${dayNum} status reset to pending.`);
      }
      setTimeout(() => setContinueFeedback(''), 4000);
    }
  }

  function handleContinueReading() {
    if (!activePlan) return;
    const completed = activePlan.completedDays || [];
    const nextDay = activePlan.schedule?.find((item) => !completed.includes(item.day));
    if (nextDay) {
      handleDayToggle(nextDay.day);
      setContinueFeedback(`Marked Day ${nextDay.day} (Pages ${nextDay.startPage}–${nextDay.endPage}) as completed! 📖`);
    } else {
      setContinueFeedback('All reading days for this book are already completed! Great achievement! 🎉');
    }
    setTimeout(() => setContinueFeedback(''), 4500);
  }

  function handleDeletePlan(bookId) {
    deleteStudyPlan(bookId);
    const plans = getStudyPlans();
    setSavedPlans(plans);
    if (activePlan?.bookId === bookId) {
      const nextPlan = plans[0] || null;
      setActivePlan(nextPlan);
      if (nextPlan) {
        setSelectedBook({
          id: nextPlan.bookId,
          title: nextPlan.title,
          author: nextPlan.author,
          image: nextPlan.image,
          genre: nextPlan.genre,
        });
      }
    }
    setContinueFeedback('Schedule removed from active plans.');
    setTimeout(() => setContinueFeedback(''), 3000);
  }

  // Pace estimation
  const estTotalPages =
    selectedBook?.length?.toLowerCase() === 'short'
      ? 180
      : selectedBook?.length?.toLowerCase() === 'long'
      ? 540
      : 320;
  const numDaysVal = Math.max(1, Math.min(60, Number(days) || 7));
  const estDailyPages = Math.ceil(estTotalPages / numDaysVal);

  const completedCount = activePlan?.completedDays?.length || 0;
  const totalDaysCount = activePlan?.days || 1;
  const progressPct = Math.round((completedCount / totalDaysCount) * 100);
  const remainingDays = Math.max(0, totalDaysCount - completedCount);

  return (
    <div className="study-companion-page">
      {/* 1. Page Header */}
      <PageHeader
        title="Study Companion"
        accentText="Personalized Schedule"
        description="Create structured daily reading targets to finish any book at your ideal pace."
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

      {/* Floating Action / Success Toast */}
      {continueFeedback ? (
        <div className="study-feedback-toast">
          <span>{continueFeedback}</span>
        </div>
      ) : null}

      {/* 2. Structured 4-Step Visual Flow Header */}
      <div className="study-flow-steps-banner">
        <div className={`flow-step-item ${selectedBook ? 'done' : 'active'}`}>
          <span className="step-num">{selectedBook ? '✓' : '1'}</span>
          <span className="step-text">1. Select Book</span>
        </div>
        <span className="step-arrow">→</span>

        <div className={`flow-step-item ${days ? 'done' : 'active'}`}>
          <span className="step-num">{days ? '✓' : '2'}</span>
          <span className="step-text">2. Configure Days</span>
        </div>
        <span className="step-arrow">→</span>

        <div className={`flow-step-item ${activePlan ? 'done' : 'active'}`}>
          <span className="step-num">{activePlan ? '✓' : '3'}</span>
          <span className="step-text">3. Generate Plan</span>
        </div>
        <span className="step-arrow">→</span>

        <div className={`flow-step-item ${progressPct === 100 ? 'done' : activePlan ? 'active' : ''}`}>
          <span className="step-num">{progressPct === 100 ? '★' : '4'}</span>
          <span className="step-text">4. Reading Targets</span>
        </div>
      </div>

      {/* 3. Horizontal Configuration Row: Step 1 and Step 2 Side-by-Side */}
      <div className="study-steps-row">
        {/* Step 1: Select Book Frame */}
        <section className="study-card-panel step1-panel" ref={searchContainerRef}>
          <div className="panel-step-badge">Step 1</div>
          <h3 className="panel-title">Select a Book</h3>
          <p className="panel-sub">
            Pick any book from the library catalog to build your daily reading roadmap.
          </p>

          {/* Search Input Bar */}
          <form className="study-search-bar" onSubmit={handleSearchSubmit}>
            <div className="study-search-input-wrap">
              <span className="search-icon-symbol">🔍</span>
              <input
                type="text"
                placeholder="Search book title, author, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="study-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              className="btn-study-search-submit"
              disabled={searching}
            >
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {/* Live Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 ? (
            <div className="study-search-results-list">
              <div className="results-head">Matching Catalog Books:</div>
              {suggestions.map((b) => (
                <div
                  key={b.id}
                  className="compact-select-card"
                  onClick={() => handleSelectBookItem(b)}
                >
                  <BookCover
                    src={b.image}
                    alt={b.title}
                    containerClassName="compact-card-thumb"
                  />
                  <div className="compact-card-meta">
                    <strong>{b.title}</strong>
                    <span>by {b.author} · {b.genre}</span>
                  </div>
                  <span className="compact-choose-pill">Select →</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Quick Pick Pills for 1-Click Planning */}
          <div className="study-quick-picks">
            <span className="quick-picks-label">Quick picks:</span>
            <div className="quick-picks-list">
              {QUICK_PICKS.map((qp) => (
                <button
                  key={qp.id}
                  type="button"
                  className={`study-quick-pill ${selectedBook?.id === qp.id ? 'active' : ''}`}
                  onClick={() => handleSelectBookItem(qp)}
                >
                  {qp.title}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Book Preview Card */}
          {selectedBook ? (
            <div className="selected-book-preview-card">
              <BookCover
                src={selectedBook.image}
                alt={selectedBook.title}
                containerClassName="preview-cover-container"
              />
              <div className="preview-info">
                <span className="preview-label">Selected Book:</span>
                <h4 className="preview-title" title={selectedBook.title}>{selectedBook.title}</h4>
                <p className="preview-author">by {selectedBook.author}</p>
                <div className="preview-tags">
                  <span className="tag-pill genre">{selectedBook.genre || 'Fiction'}</span>
                  <span className="tag-pill length">
                    {selectedBook.length ? `${selectedBook.length} Length` : '~320 Pages'}
                  </span>
                  {selectedBook.score ? (
                    <span className="tag-pill gold">★ {Number(selectedBook.score).toFixed(1)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : loadingBook ? (
            <LoadingState message="Loading book details..." />
          ) : (
            <p className="muted-hint">Select any book from the catalog or quick picks above.</p>
          )}
        </section>

        {/* Step 2: Configure Duration Frame */}
        <section className="study-card-panel step2-panel">
          <div className="panel-step-badge">Step 2</div>
          <h3 className="panel-title">Target Duration</h3>
          <p className="panel-sub">
            How many days would you like to allocate to finish this book?
          </p>

          <div className="days-input-wrapper">
            <label htmlFor="study-days-input">Total Target Days:</label>
            <div className="stepper-row">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setDays((d) => Math.max(1, Number(d) - 1))}
                title="Decrease days"
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
                onChange={(e) => setDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setDays((d) => Math.min(60, Number(d) + 1))}
                title="Increase days"
              >
                +
              </button>
              <span className="days-unit">Days</span>
            </div>
          </div>

          {/* Quick Duration Selector Chips */}
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

          {/* Pace Metric Pill */}
          <div className="daily-pace-estimate">
            <div className="pace-left">
              <span>Calculated Daily Pace:</span>
              <strong>~{estDailyPages} pages/day</strong>
            </div>
            <span className="pace-badge">
              {estDailyPages <= 25 ? '🌿 Relaxed' : estDailyPages <= 50 ? '⚡ Moderate' : '🔥 Sprint'}
            </span>
          </div>

          {/* Step 3: Action Buttons Frame */}
          <div className="study-actions-panel">
            <button
              type="button"
              className="btn-generate-plan"
              onClick={handleCreatePlan}
              disabled={!selectedBook || loadingBook}
            >
              Generate Study Plan ⚡
            </button>
            <button
              type="button"
              className="btn-reset-plan"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {/* Saved Reading Plans Strip */}
          {savedPlans.length > 0 ? (
            <div className="step2-saved-plans-block">
              <div className="saved-plans-header">
                <span className="saved-plans-mini-title">Active Plans</span>
                <span className="plans-counter-pill">{savedPlans.length}</span>
              </div>
              <div className="saved-plans-compact-list">
                {savedPlans.map((p) => {
                  const done = p.completedDays?.length || 0;
                  const pct = Math.round((done / p.days) * 100);
                  const isCurrent = activePlan?.bookId === p.bookId;
                  return (
                    <div
                      key={p.bookId}
                      className={`saved-plan-row ${isCurrent ? 'selected' : ''}`}
                      onClick={() => {
                        setActivePlan(p);
                        setSelectedBook({
                          id: p.bookId,
                          title: p.title,
                          author: p.author,
                          image: p.image,
                          genre: p.genre,
                          length: p.totalPages >= 400 ? 'Long' : p.totalPages <= 200 ? 'Short' : 'Medium',
                        });
                        setDays(p.days);
                      }}
                    >
                      <BookCover
                        src={p.image}
                        alt={p.title}
                        containerClassName="row-thumb-container"
                      />
                      <div className="row-details">
                        <strong title={p.title}>{p.title}</strong>
                        <div className="row-meta-line">
                          <span>{done}/{p.days} days completed</span>
                          <span className="pct-text">{pct}%</span>
                        </div>
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
          ) : null}
        </section>
      </div>

      {/* 4. Full-Width Step 4 Reading Schedule Dashboard (Below Step 1 & 2) */}
      <div className="study-step4-container" ref={scheduleRef}>
        {activePlan ? (
          <div className="reading-schedule-dashboard">
            {/* Header Info Banner Frame */}
            <section className="schedule-meta-banner">
              <div className="banner-left">
                <BookCover
                  src={activePlan.image}
                  alt={activePlan.title}
                  containerClassName="schedule-hero-cover"
                />
                <div className="banner-text">
                  <span className="badge-pill active">Step 4: Active Reading Schedule</span>
                  <h2 className="schedule-title">{activePlan.title}</h2>
                  <p className="author-name">by {activePlan.author}</p>
                  <div className="schedule-key-metrics">
                    <span className="key-metric">
                      Total: <strong>~{activePlan.totalPages} pages</strong>
                    </span>
                    <span className="key-metric">
                      Daily Pace: <strong>~{activePlan.pagesPerDay} pages/day</strong>
                    </span>
                    <span className="key-metric">
                      Duration: <strong>{activePlan.days} days</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Box & Action */}
              <div className="banner-progress-box">
                <div className="progress-top-row">
                  <span className="progress-percentage">{progressPct}%</span>
                  <span className="progress-count">
                    {completedCount} / {totalDaysCount} Days Completed
                  </span>
                </div>
                <div className="large-progress-track">
                  <div className="large-progress-fill" style={{ width: `${progressPct}%` }}></div>
                </div>
                <div className="estimate-row">
                  {progressPct === 100 ? (
                    <span className="completion-estimate complete">🎉 All targets completed! Moved to shelf.</span>
                  ) : (
                    <span className="completion-estimate">
                      {remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining to finish
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
            </section>

            {/* Day-by-Day Reading Schedule Grid Frame */}
            <section className="schedule-days-section">
              <div className="section-title-strip">
                <div>
                  <h3 className="section-headline">Daily Reading Targets</h3>
                  <p className="section-sub">
                    Click any day card to log completion or mark pages read.
                  </p>
                </div>
                <span className="sub-hint">
                  {completedCount} of {totalDaysCount} finished
                </span>
              </div>

              <div className="daily-schedule-cards-grid">
                {(activePlan.schedule || []).map((item) => {
                  const isDone = (activePlan.completedDays || []).includes(item.day);
                  return (
                    <div
                      key={item.day}
                      className={`daily-target-card ${isDone ? 'done' : ''}`}
                      onClick={() => handleDayToggle(item.day)}
                      title={isDone ? `Day ${item.day} completed. Click to mark pending.` : `Click to mark Day ${item.day} as completed.`}
                    >
                      <div className="card-header-row">
                        <span className="day-badge">Day {item.day}</span>
                        <span className={`status-pill ${isDone ? 'checked' : 'pending'}`}>
                          {isDone ? '✓ Completed' : '○ Pending'}
                        </span>
                      </div>

                      <div className="card-page-range">
                        Pages {item.startPage} – {item.endPage}
                      </div>

                      <div className="card-target-footer">
                        <span>Daily Target:</span>
                        <strong>{item.targetPages} pages</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <EmptyState
            icon="📖"
            title="Ready to Build Your Reading Schedule"
            message="Select or search for any book in Step 1 to generate a personalized daily reading plan."
            actionText="Generate 7-Day Plan"
            onAction={handleCreatePlan}
          />
        )}
      </div>
    </div>
  );
}
