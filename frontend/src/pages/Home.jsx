import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import heroBookImg from '../assets/hero_magic_book.jpg';
import { SuggestionCard, TopBookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { trackActivity } from '../libraryStore';

const defaultPreferences = {
  genre: 'Horror',
  mood: 'Suspenseful',
  interest: 'Mystery',
  readingLevel: 'Intermediate',
  ageGroup: 'Young Adult',
  minimumRating: 4.0,
  showAvailableOnly: true,
  useHillClimbing: true,
};

const loadingMessages = [
  'Understanding preferences...',
  'Finding matching books in Knowledge Base...',
  'Applying rule-based inference...',
  'Optimizing recommendations via Hill Climbing search...',
];

export default function Home() {
  const [meta, setMeta] = useState(null);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [otherSuggestions, setOtherSuggestions] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const prefSectionRef = useRef(null);
  const navigate = useNavigate();

  // Load metadata on mount
  useEffect(() => {
    api
      .meta()
      .then((m) => setMeta(m))
      .catch((err) => console.error('Failed to load meta:', err));
  }, []);

  // Fetch initial recommendations on load
  useEffect(() => {
    fetchRecommendations(defaultPreferences);
    fetchOtherSuggestions();
  }, []);

  // Animated loading step ticker
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % loadingMessages.length);
    }, 600);
    return () => clearInterval(interval);
  }, [loading]);

  async function fetchOtherSuggestions() {
    try {
      // Fetch high-rated diverse suggestions from search or books
      const res = await api.search('murder OR dark OR thriller OR secret', 1, 8);
      if (res && res.books && res.books.length > 0) {
        setOtherSuggestions(res.books.slice(0, 4));
      } else {
        const booksRes = await api.books({ limit: 4, minRating: 4.0 });
        setOtherSuggestions(booksRes.books || []);
      }
    } catch {
      // Fallback
      api.books({ limit: 4 }).then((res) => setOtherSuggestions(res.books || []));
    }
  }

  async function fetchRecommendations(prefs) {
    setLoading(true);
    setError('');
    setLoadingStep(0);
    try {
      const payload = {
        genre: prefs.genre || undefined,
        mood: prefs.mood || undefined,
        interest: prefs.interest || undefined,
        readingLevel: prefs.readingLevel || undefined,
        ageGroup: prefs.ageGroup || undefined,
        minimumRating: prefs.minimumRating || undefined,
        showAvailableOnly: prefs.showAvailableOnly,
        useHillClimbing: prefs.useHillClimbing,
        reasoningMethod: 'forward',
        restarts: 8,
      };

      const result = await api.recommend(payload);
      const recs = result.recommendations || [];
      setRecommendations(recs);

      // Save for dedicated AI Reasoning page
      sessionStorage.setItem('libraai_last_reasoning', JSON.stringify(result));

      // Track real analytics activity
      trackActivity('recommendations_generated', {
        count: recs.length,
        genre: prefs.genre,
        mood: prefs.mood,
        hc: prefs.useHillClimbing,
      });

      if (recs.length === 0) {
        setError('No books matched all your preferences. Try lowering the minimum rating or clearing filters.');
      }
    } catch (err) {
      console.error('Recommendation error:', err);
      setError(err.message || 'Failed to retrieve recommendations from the AI engine.');
    } finally {
      setLoading(false);
    }
  }

  function handlePreferenceChange(key, value) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setPreferences(defaultPreferences);
    fetchRecommendations(defaultPreferences);
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetchRecommendations(preferences);
  }

  function scrollToPreferences() {
    prefSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="home-page-container">
      {/* 1. HERO SECTION */}
      <section className="home-hero-card">
        <div className="hero-content-col">
          <h1 className="hero-headline">
            Find Your Next <span className="hero-accent-text">Great Read</span>
          </h1>
          <p className="hero-description">
            Get personalized book recommendations using AI, rule-based reasoning and hill climbing search.
          </p>
          <div className="hero-actions-row">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={scrollToPreferences}
            >
              Get Recommendations →
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => navigate('/explore')}
            >
              Explore Library
            </button>
          </div>
        </div>

        <div className="hero-visual-col">
          <div className="hero-image-glow-wrap">
            <img
              src={heroBookImg}
              alt="Magical illuminated book"
              className="hero-magical-book"
            />
          </div>
        </div>
      </section>

      {/* 2. YOUR PREFERENCES SECTION */}
      <section className="home-preferences-card" ref={prefSectionRef}>
        <div className="pref-card-header">
          <div className="pref-title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <button
            type="button"
            className="pref-reset-btn"
            onClick={handleReset}
            title="Reset preferences to defaults"
          >
            ↻ Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pref-controls-form">
          {/* Row 1: Dropdown Selectors */}
          <div className="pref-dropdowns-grid">
            <div className="pref-field">
              <label htmlFor="pref-genre">Genre</label>
              <select
                id="pref-genre"
                value={preferences.genre}
                onChange={(e) => handlePreferenceChange('genre', e.target.value)}
              >
                <option value="">Any Genre</option>
                {(meta?.genres || ['Horror', 'Crime', 'Thriller', 'Fiction', 'Fantasy', 'Romance', 'Mystery', 'Classics']).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="pref-field">
              <label htmlFor="pref-mood">Mood</label>
              <select
                id="pref-mood"
                value={preferences.mood}
                onChange={(e) => handlePreferenceChange('mood', e.target.value)}
              >
                <option value="">Any Mood</option>
                {(meta?.moods || ['Suspenseful', 'Dark', 'Mysterious', 'Emotional', 'Adventurous', 'Reflective']).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="pref-field">
              <label htmlFor="pref-interest">Interest / Theme</label>
              <select
                id="pref-interest"
                value={preferences.interest}
                onChange={(e) => handlePreferenceChange('interest', e.target.value)}
              >
                <option value="">Any Interest</option>
                {(meta?.themes || ['Mystery', 'Psychological', 'Artificial Intelligence', 'Gothic', 'Supernatural', 'Science Fiction', 'Crime']).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="pref-field">
              <label htmlFor="pref-level">Reading Level</label>
              <select
                id="pref-level"
                value={preferences.readingLevel}
                onChange={(e) => handlePreferenceChange('readingLevel', e.target.value)}
              >
                {(meta?.readingLevels || ['Beginner', 'Intermediate', 'Advanced']).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="pref-field">
              <label htmlFor="pref-age">Age Group</label>
              <select
                id="pref-age"
                value={preferences.ageGroup}
                onChange={(e) => handlePreferenceChange('ageGroup', e.target.value)}
              >
                {(meta?.ageGroups || ['Young Adult', 'Adult', 'Children', 'General']).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Sliders, Toggles, and Submit Action */}
          <div className="pref-secondary-row">
            <div className="rating-slider-group">
              <div className="slider-label-row">
                <span>Minimum Rating</span>
                <strong className="slider-val">{preferences.minimumRating ? `${Number(preferences.minimumRating).toFixed(1)}+` : 'Any'}</strong>
              </div>
              <input
                type="range"
                min="3.0"
                max="4.8"
                step="0.1"
                className="custom-range-slider"
                value={preferences.minimumRating || 3.0}
                onChange={(e) => handlePreferenceChange('minimumRating', parseFloat(e.target.value))}
              />
            </div>

            <label className="toggle-switch-label pref-toggle-available">
              <input
                type="checkbox"
                checked={preferences.showAvailableOnly}
                onChange={(e) => handlePreferenceChange('showAvailableOnly', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Show available books only</span>
            </label>

            <label className="toggle-switch-label pref-toggle-hillclimb">
              <input
                type="checkbox"
                checked={preferences.useHillClimbing}
                onChange={(e) => handlePreferenceChange('useHillClimbing', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Use Hill Climbing Optimization</span>
            </label>

            <div className="pref-action-btn-wrap">
              <button
                type="submit"
                className="btn-find-recommendations"
                disabled={loading}
              >
                {loading ? 'Optimizing…' : 'Find Recommendations →'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Loading Banner */}
      {loading ? (
        <div className="loading-state-banner">
          <div className="loading-pulse-spinner"></div>
          <p className="loading-ticker-text">{loadingMessages[loadingStep]}</p>
        </div>
      ) : null}

      {/* Error / Empty State */}
      {error ? (
        <div className="error-alert-card">
          <p>{error}</p>
          <div className="error-actions">
            <button type="button" className="btn-small-primary" onClick={handleReset}>
              Reset Preferences
            </button>
            <button type="button" className="btn-small-outline" onClick={() => navigate('/explore')}>
              Explore Library
            </button>
          </div>
        </div>
      ) : null}

      {/* 3. TOP 5 RECOMMENDED BOOKS SECTION */}
      <section className="recommendations-section">
        <div className="section-title-bar">
          <div className="title-and-subtitle">
            <div className="section-headline-with-icon">
              <span className="sparkle-icon">✦</span>
              <h2>Top 5 Recommended Books</h2>
            </div>
            <p className="section-subtext">
              {preferences.useHillClimbing
                ? 'Optimized using Rule-Based Reasoning and Hill Climbing Search'
                : 'Ranked directly using Rule-Based Reasoning scoring'}
            </p>
          </div>
          <button
            type="button"
            className="btn-view-all"
            onClick={() => navigate('/recommend')}
          >
            View All
          </button>
        </div>

        <div className="top-books-grid">
          {recommendations.slice(0, 5).map((book, index) => (
            <TopBookCard
              key={book.id || index}
              book={book}
              rank={index + 1}
              onSelect={(b) => setSelectedBook(b)}
            />
          ))}
        </div>
      </section>

      {/* 4. OTHER SUGGESTIONS SECTION */}
      <section className="suggestions-section">
        <h3 className="suggestions-headline">Other Suggestions</h3>
        <div className="suggestions-grid">
          {otherSuggestions.map((book) => (
            <SuggestionCard
              key={book.id}
              book={book}
              onSelect={(b) => setSelectedBook(b)}
            />
          ))}
        </div>
      </section>

      {/* Interactive Book Details Modal */}
      {selectedBook ? (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </div>
  );
}
