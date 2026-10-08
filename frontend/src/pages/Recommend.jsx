import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import heroBookImg from '../assets/hero_magic_book.jpg';
import { BookCover, TopBookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { isFavorite, toggleFavorite, trackActivity } from '../libraryStore';

const emptyForm = {
  genre: '',
  interest: '',
  mood: '',
  readingLevel: 'Intermediate',
  ageGroup: 'Adult',
  theme: '',
  minimumRating: '4.0',
  length: 'Any',
  keywords: '',
  reasoningMethod: 'forward',
  restarts: '8',
};

const fallbackGenres = [
  'Fiction',
  'Mystery',
  'Thriller',
  'Horror',
  'Fantasy',
  'Romance',
  'Science Fiction',
  'Self Help',
  'History',
  'Biography',
  'Classics',
  'Young Adult',
  'Nonfiction',
  'Crime',
  'Psychology',
  'Philosophy',
  'Art',
  'Poetry',
  'Travel',
  'Science',
  'Memoir',
];

const fallbackMoods = [
  'Relaxed',
  'Motivated',
  'Curious',
  'Suspenseful',
  'Emotional',
  'Romantic',
  'Adventurous',
  'Focused',
  'Dark',
  'Humorous',
  'Mysterious',
];

const fallbackThemes = [
  'Survival',
  'Identity',
  'Family',
  'Love',
  'Power',
  'Friendship',
  'Betrayal',
  'Justice',
  'Loss',
  'Courage',
  'Good vs Evil',
  'Redemption',
  'Coming of Age',
  'War',
  'Time',
  'Morality',
  'Secrets',
  'Ambition',
];

const loadingPipelineSteps = [
  'Understanding your preferences...',
  'Converting preferences into facts...',
  'Applying reasoning rules...',
  'Finding candidate books...',
  'Calculating recommendation scores...',
  'Running Hill Climbing optimization...',
  'Selecting Top 5 recommendations...',
];

export default function Recommend() {
  const [searchParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // View All Modal state
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [viewAllSearch, setViewAllSearch] = useState('');
  const [viewAllGenre, setViewAllGenre] = useState('');
  const [viewAllAvail, setViewAllAvail] = useState('');
  const [viewAllSort, setViewAllSort] = useState('score');
  const [viewAllPage, setViewAllPage] = useState(1);

  const resultsSectionRef = useRef(null);

  // Fetch meta on mount
  useEffect(() => {
    api
      .meta()
      .then(setMeta)
      .catch((e) => console.warn('Could not load metadata:', e.message));

    // Restore cached reasoning if available
    try {
      const cached = sessionStorage.getItem('libraai_last_reasoning');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.recommendations && parsed.recommendations.length > 0) {
          setResult(parsed);
          if (parsed.userPreferences) {
            setForm((prev) => ({
              ...prev,
              genre: parsed.userPreferences.genre || '',
              interest: parsed.userPreferences.interest || '',
              mood: parsed.userPreferences.mood || '',
              readingLevel: parsed.userPreferences.readingLevel || 'Intermediate',
              ageGroup: parsed.userPreferences.ageGroup || 'Adult',
              theme: parsed.userPreferences.theme || '',
              minimumRating:
                parsed.userPreferences.minimumRating !== null &&
                parsed.userPreferences.minimumRating !== undefined
                  ? String(parsed.userPreferences.minimumRating)
                  : '4.0',
              length: parsed.userPreferences.length || 'Any',
              keywords: Array.isArray(parsed.userPreferences.keywords)
                ? parsed.userPreferences.keywords.join(', ')
                : parsed.userPreferences.keywords || '',
              reasoningMethod: parsed.userPreferences.reasoningMethod || 'forward',
              restarts: String(parsed.userPreferences.restarts || 8),
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse cached recommendations:', e);
    }
  }, []);

  // Pre-fill from URL query parameters (e.g. from "Find Similar Books" or Book Details links)
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const moodParam = searchParams.get('mood');
    const themeParam = searchParams.get('theme');
    const levelParam = searchParams.get('readingLevel');
    const interestParam = searchParams.get('interest');
    const ratingParam = searchParams.get('minimumRating');
    const methodParam = searchParams.get('method');
    const restartsParam = searchParams.get('restarts');

    if (
      genreParam ||
      moodParam ||
      themeParam ||
      levelParam ||
      interestParam ||
      ratingParam ||
      methodParam ||
      restartsParam
    ) {
      setForm((prev) => ({
        ...prev,
        genre: genreParam !== null ? genreParam : prev.genre,
        mood: moodParam !== null ? moodParam : prev.mood,
        theme: themeParam !== null ? themeParam : prev.theme,
        readingLevel: levelParam !== null ? levelParam : prev.readingLevel,
        interest: interestParam !== null ? interestParam : prev.interest,
        minimumRating: ratingParam !== null ? ratingParam : prev.minimumRating,
        reasoningMethod: methodParam || prev.reasoningMethod,
        restarts: restartsParam || prev.restarts,
      }));
    }
  }, [searchParams]);

  // Animated loading step ticker
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % loadingPipelineSteps.length);
    }, 450);
    return () => clearInterval(interval);
  }, [loading]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setForm(emptyForm);
    setError('');
  }

  async function handleGenerate(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setLoadingStep(0);

    try {
      const payload = {
        genre: form.genre ? form.genre.trim() : undefined,
        interest: form.interest ? form.interest.trim() : undefined,
        mood: form.mood ? form.mood.trim() : undefined,
        readingLevel: form.readingLevel ? form.readingLevel.trim() : undefined,
        ageGroup: form.ageGroup ? form.ageGroup.trim() : undefined,
        theme: form.theme ? form.theme.trim() : undefined,
        minimumRating:
          form.minimumRating === 'any' || !form.minimumRating
            ? null
            : Number(form.minimumRating),
        length: form.length ? form.length.trim() : 'Any',
        keywords: form.keywords
          ? form.keywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        reasoningMethod: form.reasoningMethod || 'forward',
        restarts: Number(form.restarts || 8),
        useHillClimbing: true,
      };

      const data = await api.recommend(payload);
      setResult(data);
      sessionStorage.setItem('libraai_last_reasoning', JSON.stringify(data));

      trackActivity('recommendations_generated', {
        count: data?.recommendations?.length || 0,
        genre: form.genre,
        mood: form.mood,
        method: form.reasoningMethod,
        restarts: form.restarts,
      });

      if (!data?.recommendations || data.recommendations.length === 0) {
        setError(
          'No books in the Knowledge Base matched all your criteria. Try loosening the minimum rating or clearing some preferences.'
        );
      } else {
        // Smoothly scroll to results if on smaller screens
        setTimeout(() => {
          resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      }
    } catch (err) {
      console.error('Recommendation API error:', err);
      setError(err.message || 'Unable to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Genres, moods, and themes merged with meta
  const genreList = Array.from(
    new Set([...(meta?.genres || []), ...fallbackGenres])
  ).filter(Boolean);
  const moodList = Array.from(
    new Set([...(meta?.moods || []), ...fallbackMoods])
  ).filter(Boolean);
  const themeList = Array.from(
    new Set([...(meta?.themes || []), ...fallbackThemes])
  ).filter(Boolean);

  // Filtered candidate list for View All modal
  const allCandidates = result
    ? [
        ...(result.recommendations || []),
        ...((result.candidateBooks || []).filter(
          (c) => !(result.recommendations || []).some((r) => r.id === c.id)
        )),
      ]
    : [];

  const filteredCandidates = allCandidates
    .filter((b) => {
      if (!viewAllSearch.trim()) return true;
      const q = viewAllSearch.toLowerCase();
      return (
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.genre?.toLowerCase().includes(q)
      );
    })
    .filter((b) => {
      if (!viewAllGenre) return true;
      return b.genre?.toLowerCase() === viewAllGenre.toLowerCase();
    })
    .filter((b) => {
      if (!viewAllAvail) return true;
      return b.availability?.toLowerCase() === viewAllAvail.toLowerCase();
    })
    .sort((a, b) => {
      if (viewAllSort === 'score') {
        return (b.recommendationScore || 0) - (a.recommendationScore || 0);
      }
      if (viewAllSort === 'rating') {
        return (b.score || 0) - (a.score || 0);
      }
      if (viewAllSort === 'ratings') {
        return (b.ratings || 0) - (a.ratings || 0);
      }
      if (viewAllSort === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  const PAGE_SIZE = 10;
  const totalCandidatePages = Math.ceil(filteredCandidates.length / PAGE_SIZE) || 1;
  const paginatedCandidates = filteredCandidates.slice(
    (viewAllPage - 1) * PAGE_SIZE,
    viewAllPage * PAGE_SIZE
  );

  return (
    <div className="recommend-page-container">
      {/* 1. PAGE HEADER CARD */}
      <section className="rec-header-card">
        <div className="rec-header-content">
          <h1 className="rec-header-headline">
            AI <span className="rec-header-accent">Recommendations</span>
          </h1>
          <p className="rec-header-desc">
            Enter your preferences below. LibraAI converts them into facts, evaluates IF–THEN rules,
            applies forward/backward chaining, scores candidates dynamically, and optimizes the Top 5
            via Random-Restart Hill Climbing.
          </p>
        </div>

        <div className="rec-header-visual">
          <div className="rec-header-image-wrap">
            <img
              src={heroBookImg}
              alt="LibraAI Recommendations Knowledge Engine"
              className="rec-header-book-img"
            />
          </div>
        </div>
      </section>

      {/* 2. YOUR PREFERENCES CARD */}
      <section className="rec-preferences-card">
        <div className="pref-card-header">
          <div className="pref-title-group">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            <h2>Your Preferences</h2>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="rec-form-body">
          {/* Form Grid Row 1 (5 columns on desktop) */}
          <div className="pref-grid-row-1">
            {/* 1. Genre */}
            <div className="pref-input-field">
              <label htmlFor="pref-genre">Genre</label>
              <select
                id="pref-genre"
                value={form.genre}
                onChange={(e) => update('genre', e.target.value)}
              >
                <option value="">Any</option>
                {genreList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Interest / Topic */}
            <div className="pref-input-field">
              <label htmlFor="pref-interest">Interest / Topic</label>
              <input
                id="pref-interest"
                type="text"
                value={form.interest}
                onChange={(e) => update('interest', e.target.value)}
                placeholder="e.g. Mystery, Programming"
                list="interest-suggestions"
              />
              <datalist id="interest-suggestions">
                <option value="Mystery" />
                <option value="Programming" />
                <option value="Artificial Intelligence" />
                <option value="Psychology" />
                <option value="Philosophy" />
                <option value="Thriller" />
                <option value="Science Fiction" />
                <option value="History" />
                <option value="Fantasy" />
              </datalist>
            </div>

            {/* 3. Mood */}
            <div className="pref-input-field">
              <label htmlFor="pref-mood">Mood</label>
              <select
                id="pref-mood"
                value={form.mood}
                onChange={(e) => update('mood', e.target.value)}
              >
                <option value="">Any</option>
                {moodList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Reading Level */}
            <div className="pref-input-field">
              <label htmlFor="pref-reading-level">Reading Level</label>
              <select
                id="pref-reading-level"
                value={form.readingLevel}
                onChange={(e) => update('readingLevel', e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* 5. Age Group */}
            <div className="pref-input-field">
              <label htmlFor="pref-age-group">Age Group</label>
              <select
                id="pref-age-group"
                value={form.ageGroup}
                onChange={(e) => update('ageGroup', e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Children">Children</option>
                <option value="Young Adult">Young Adult</option>
                <option value="Adult">Adult</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Form Grid Row 2 (4 columns on desktop) */}
          <div className="pref-grid-row-2">
            {/* 1. Theme */}
            <div className="pref-input-field">
              <label htmlFor="pref-theme">Theme</label>
              <select
                id="pref-theme"
                value={form.theme}
                onChange={(e) => update('theme', e.target.value)}
              >
                <option value="">Any</option>
                {themeList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Minimum Rating */}
            <div className="pref-input-field">
              <label htmlFor="pref-min-rating">Minimum Rating</label>
              <select
                id="pref-min-rating"
                value={form.minimumRating}
                onChange={(e) => update('minimumRating', e.target.value)}
              >
                <option value="any">Any</option>
                <option value="3.0">3.0+</option>
                <option value="3.5">3.5+</option>
                <option value="4.0">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>

            {/* 3. Preferred Length */}
            <div className="pref-input-field">
              <label htmlFor="pref-length">Preferred Length</label>
              <select
                id="pref-length"
                value={form.length}
                onChange={(e) => update('length', e.target.value)}
              >
                <option value="Any">Any</option>
                <option value="Short">Short</option>
                <option value="Medium">Medium</option>
                <option value="Long">Long</option>
              </select>
            </div>

            {/* 4. Keywords */}
            <div className="pref-input-field">
              <label htmlFor="pref-keywords">Keywords (comma-separated)</label>
              <input
                id="pref-keywords"
                type="text"
                value={form.keywords}
                onChange={(e) => update('keywords', e.target.value)}
                placeholder="e.g. ghost, murder, robot"
              />
            </div>
          </div>

          {/* Form Row 3: Reasoning Method & Hill Climbing Optimization */}
          <div className="pref-row-reasoning-hc">
            {/* Left: Reasoning Method */}
            <div className="pref-reasoning-col">
              <div className="pref-col-title">Reasoning Method</div>
              <div className="reasoning-radios-wrap">
                <label className="reasoning-radio-label">
                  <input
                    type="radio"
                    name="reasoningMethod"
                    value="forward"
                    checked={form.reasoningMethod === 'forward'}
                    onChange={() => update('reasoningMethod', 'forward')}
                  />
                  <div className="radio-text-wrap">
                    <span className="radio-heading">Forward Chaining</span>
                    <span className="radio-sub">Start from user facts and apply rules forward</span>
                  </div>
                </label>

                <label className="reasoning-radio-label">
                  <input
                    type="radio"
                    name="reasoningMethod"
                    value="backward"
                    checked={form.reasoningMethod === 'backward'}
                    onChange={() => update('reasoningMethod', 'backward')}
                  />
                  <div className="radio-text-wrap">
                    <span className="radio-heading">Backward Chaining</span>
                    <span className="radio-sub">
                      Start from goal and work backward to find matching books
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Right: Hill Climbing Optimization */}
            <div className="pref-hc-col">
              <div className="pref-col-title">Hill Climbing Optimization</div>
              <div className="hc-control-wrapper">
                <select
                  className="hc-select"
                  value={form.restarts}
                  onChange={(e) => update('restarts', e.target.value)}
                >
                  <option value="3">3 Restarts</option>
                  <option value="5">5 Restarts</option>
                  <option value="8">8 Restarts (Recommended)</option>
                  <option value="10">10 Restarts</option>
                </select>

                <div
                  className="hc-info-wrap"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip((prev) => !prev)}
                >
                  <button
                    type="button"
                    className="hc-info-btn"
                    aria-label="Hill Climbing Restart Information"
                  >
                    ⓘ
                  </button>
                  <div className={`hc-tooltip-box ${showTooltip ? 'visible' : ''}`}>
                    Random-Restart Hill Climbing explores multiple starting candidates to reduce the
                    chance of getting stuck at a local optimum.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Row 4: Actions (Reset All & Get AI Recommendations) */}
          <div className="pref-actions-row">
            <button
              type="button"
              className="btn-reset-all"
              onClick={handleReset}
              title="Reset all preferences to defaults"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span>Reset All</span>
            </button>

            <button type="submit" className="btn-get-ai-recs" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-pulse-spinner"></span>
                  <span>Optimizing Recommendations...</span>
                </>
              ) : (
                <>
                  <span>✨ Get AI Recommendations →</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 3. LOADING PIPELINE STATE */}
      {loading ? (
        <section className="rec-loading-container">
          <div className="rec-loading-bar-wrap">
            <div className="rec-loading-bar-fill"></div>
          </div>
          <div className="rec-loading-step-active">
            <span className="loading-pulse-spinner"></span>
            <span className="rec-loading-step-text">
              {loadingPipelineSteps[loadingStep]}
            </span>
          </div>
          <div className="rec-loading-pipeline-trail">
            {loadingPipelineSteps.map((step, idx) => (
              <span
                key={step}
                className={`pipeline-dot ${idx === loadingStep ? 'active' : idx < loadingStep ? 'done' : ''}`}
                title={step}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. ERROR STATE */}
      {error && !loading ? (
        <section className="error-alert-card">
          <div className="error-msg-wrap">
            <strong>Unable to generate recommendations.</strong>
            <p>{error}</p>
          </div>
          <div className="error-actions">
            <button
              type="button"
              className="btn-small-primary"
              onClick={handleGenerate}
            >
              Try Again
            </button>
            <button
              type="button"
              className="btn-small-outline"
              onClick={handleReset}
            >
              Reset Preferences
            </button>
          </div>
        </section>
      ) : null}

      {/* 5. TOP 5 RECOMMENDED BOOKS */}
      {result && result.recommendations && result.recommendations.length > 0 && !loading ? (
        <section className="recommendations-section" ref={resultsSectionRef}>
          <div className="section-title-bar">
            <div className="section-headline-with-icon">
              <span className="sparkle-diamond-icon">✨</span>
              <div>
                <h2>Top 5 Recommended Books</h2>
                <p className="section-subtext">
                  Optimized using Rule-Based Reasoning and Hill Climbing Search
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn-view-all-header"
              onClick={() => {
                setViewAllOpen(true);
                setViewAllPage(1);
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>View All</span>
            </button>
          </div>

          <div className="top-books-grid">
            {result.recommendations.slice(0, 5).map((book, idx) => (
              <TopBookCard
                key={book.id || idx}
                book={book}
                rank={idx + 1}
                onSelect={(b) => setSelectedBook(b)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* 6. EMPTY STATE (BEFORE FIRST GENERATION) */}
      {!result && !loading && !error ? (
        <section className="rec-empty-state-card">
          <div className="rec-empty-icon-wrap">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <circle cx="12" cy="10" r="3"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 18v2"></path>
            </svg>
          </div>
          <h3>Tell LibraAI what you're looking for.</h3>
          <p>
            Choose your preferences above and let the AI find the right books for you using
            expert rules, forward/backward chaining, and hill climbing optimization.
          </p>
          <button
            type="button"
            className="btn-empty-generate"
            onClick={handleGenerate}
          >
            ✨ Generate Recommendations with Current Preferences
          </button>
        </section>
      ) : null}

      {/* 7. VIEW ALL MODAL (Full candidates view with search, filter, sort, pagination) */}
      {viewAllOpen ? (
        <div className="modal-backdrop" onClick={() => setViewAllOpen(false)}>
          <div
            className="view-all-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="view-all-modal-head">
              <div>
                <h2>All Candidate Books</h2>
                <p>
                  Found {filteredCandidates.length} candidate book{filteredCandidates.length === 1 ? '' : 's'} evaluated by the inference engine
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewAllOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Controls Bar: Search, Filters, Sort */}
            <div className="view-all-controls-bar">
              <div className="view-all-search-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Filter by title, author, or genre..."
                  value={viewAllSearch}
                  onChange={(e) => {
                    setViewAllSearch(e.target.value);
                    setViewAllPage(1);
                  }}
                />
              </div>

              <div className="view-all-filters-wrap">
                <select
                  value={viewAllGenre}
                  onChange={(e) => {
                    setViewAllGenre(e.target.value);
                    setViewAllPage(1);
                  }}
                >
                  <option value="">All Genres</option>
                  {genreList.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <select
                  value={viewAllAvail}
                  onChange={(e) => {
                    setViewAllAvail(e.target.value);
                    setViewAllPage(1);
                  }}
                >
                  <option value="">All Availability</option>
                  <option value="Available">Available</option>
                  <option value="Limited">Limited</option>
                  <option value="Unavailable">Unavailable</option>
                </select>

                <select
                  value={viewAllSort}
                  onChange={(e) => {
                    setViewAllSort(e.target.value);
                    setViewAllPage(1);
                  }}
                >
                  <option value="score">Sort by AI Score</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="ratings">Sort by Popularity</option>
                  <option value="title">Sort by Title (A–Z)</option>
                </select>
              </div>
            </div>

            {/* List / Grid of candidates */}
            <div className="view-all-candidates-list">
              {paginatedCandidates.length === 0 ? (
                <div className="view-all-no-results">
                  <p>No candidates match the selected filters.</p>
                </div>
              ) : (
                paginatedCandidates.map((book) => {
                  const fav = isFavorite(book.id);
                  return (
                    <div
                      key={book.id}
                      className="candidate-row-item"
                      onClick={() => setSelectedBook(book)}
                    >
                      <BookCover
                        src={book.image}
                        alt={book.title}
                        containerClassName="candidate-thumb"
                      />
                      <div className="candidate-row-meta">
                        <div className="candidate-row-title-line">
                          <strong className="candidate-title">{book.title}</strong>
                          {book.recommendationScore !== undefined ? (
                            <span className="candidate-score-badge">
                              AI Score: {book.recommendationScore}/{book.maxScore || 20}
                            </span>
                          ) : null}
                        </div>
                        <span className="candidate-author">by {book.author}</span>
                        <div className="candidate-tags-row">
                          <span className="tag-pill">{book.genre}</span>
                          {book.subgenre && book.subgenre !== 'General' ? (
                            <span className="tag-pill">{book.subgenre}</span>
                          ) : null}
                          <span className="star-rating">★ {book.score}</span>
                          <span className={`status-pill-mini ${book.availability?.toLowerCase()}`}>
                            ● {book.availability || 'Available'}
                          </span>
                        </div>
                      </div>

                      <div className="candidate-row-actions">
                        <button
                          type="button"
                          className={`bookmark-btn ${fav ? 'favorited' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(book);
                          }}
                          title={fav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={fav ? '#38BDF8' : 'none'}
                            stroke={fav ? '#38BDF8' : 'currentColor'}
                            strokeWidth="2"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-details-mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBook(book);
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalCandidatePages > 1 ? (
              <div className="view-all-pagination">
                <button
                  type="button"
                  className="page-btn"
                  disabled={viewAllPage <= 1}
                  onClick={() => setViewAllPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span className="page-indicator">
                  Page {viewAllPage} of {totalCandidatePages}
                </span>
                <button
                  type="button"
                  className="page-btn"
                  disabled={viewAllPage >= totalCandidatePages}
                  onClick={() => setViewAllPage((p) => Math.min(totalCandidatePages, p + 1))}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 8. BOOK DETAILS MODAL */}
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
