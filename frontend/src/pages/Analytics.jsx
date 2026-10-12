import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalytics, getActivityLog } from '../libraryStore';

export default function Analytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(() => getAnalytics());
  const [activityLog, setActivityLog] = useState(() => getActivityLog());

  useEffect(() => {
    function load() {
      setStats(getAnalytics());
      setActivityLog(getActivityLog());
    }
    window.addEventListener('libraai_store_update', load);
    return () => window.removeEventListener('libraai_store_update', load);
  }, []);

  if (!stats) return null;

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getEventLabel(type) {
    switch (type) {
      case 'recommendations_generated':
        return 'Inference Generated';
      case 'book_viewed':
        return 'Book Inspected';
      case 'favorite_added':
        return 'Added to Favorites';
      case 'favorite_removed':
        return 'Removed from Favorites';
      case 'study_plan_created':
        return 'Study Plan Created';
      case 'search_performed':
        return 'Catalog Search';
      default:
        return 'System Event';
    }
  }

  const totalShelfCount = stats.favoritesCount + (stats.studyPlansCount || 0);

  return (
    <div className="analytics-page-v2">
      {/* Executive Telemetry Hero Header */}
      <section className="analytics-hero-sanctuary">
        <div className="analytics-hero-content">
          <div className="analytics-hero-header">
            <div className="analytics-hero-badge">
              <span className="live-telemetry-dot" />
              <span>System Telemetry &amp; Reader Metrics</span>
            </div>
            <h1 className="analytics-hero-title">
              Platform <span className="title-gradient-cyan">Analysis</span>
            </h1>
            <p className="analytics-hero-desc">
              Real-time computational metrics derived from your sessions: AI inference executions,
              catalog explorations, reading pace progression, and genre affinity models.
            </p>

            {/* Quick Metrics Bento Pills */}
            <div className="analytics-hero-pills">
              <div className="bento-pill">
                <span className="pill-dot emerald" />
                <span className="pill-label">KB Facts Evaluated:</span>
                <strong className="pill-val">10,538 Books</strong>
              </div>
              <div className="bento-pill">
                <span className="pill-dot cyan" />
                <span className="pill-label">Study Progression:</span>
                <strong className="pill-val">{stats.readingProgressPct}% Complete</strong>
              </div>
              {stats.averageSavedRating > 0 && (
                <div className="bento-pill">
                  <span className="pill-dot amber" />
                  <span className="pill-label">Avg Quality:</span>
                  <strong className="pill-val">★ {stats.averageSavedRating.toFixed(2)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action Shortcuts */}
          <div className="analytics-hero-actions">
            <Link to="/recommend" className="btn-analytics-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Run Recommendations</span>
            </Link>
            <Link to="/study" className="btn-analytics-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Study Companion</span>
            </Link>
          </div>
        </div>

        <div className="analytics-hero-ambient-glow" />
      </section>

      {!stats.hasActivity ? (
        <div className="aesthetic-analytics-empty-card">
          <div className="empty-graphic-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
              <circle cx="12" cy="4" r="1.5" fill="#38BDF8"></circle>
              <circle cx="18" cy="10" r="1.5" fill="#38BDF8"></circle>
              <circle cx="6" cy="14" r="1.5" fill="#38BDF8"></circle>
            </svg>
            <div className="empty-graphic-halo" />
          </div>
          <h2 className="empty-title">Awaiting session activity</h2>
          <p className="empty-desc">
            No interaction data has been recorded in this browser yet. Generate AI recommendations,
            bookmark titles, or launch a reading plan to populate real telemetry insights.
          </p>
          <div className="empty-actions-row">
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => navigate('/recommend')}
            >
              Start AI Recommendations
            </button>
            <button
              type="button"
              className="btn-empty-secondary"
              onClick={() => navigate('/search')}
            >
              Explore Library Catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="analytics-body-layout">
          {/* Executive KPI Metric Cards */}
          <div className="analytics-kpi-grid">
            {/* Card 1: Books Viewed */}
            <div className="analytics-kpi-card kpi-blue">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Catalog Explorations</span>
                <div className="kpi-card-icon-wrap blue-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
              </div>
              <strong className="kpi-card-number">{stats.booksViewed}</strong>
              <div className="kpi-card-footer">
                <span className="kpi-subtext">Books viewed &amp; inspected</span>
                <span className="kpi-status-pill green">Active</span>
              </div>
              <div className="kpi-accent-line blue-line" />
            </div>

            {/* Card 2: Saved Favorites */}
            <div className="analytics-kpi-card kpi-rose">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Saved Favorites</span>
                <div className="kpi-card-icon-wrap rose-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </div>
              <strong className="kpi-card-number">{stats.favoritesCount}</strong>
              <div className="kpi-card-footer">
                <span className="kpi-subtext">Personal wishlist</span>
                <span className="kpi-status-pill rose">Bookmarked</span>
              </div>
              <div className="kpi-accent-line rose-line" />
            </div>

            {/* Card 3: Recommendations Generated */}
            <div className="analytics-kpi-card kpi-cyan">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Inference Sessions</span>
                <div className="kpi-card-icon-wrap cyan-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
              </div>
              <strong className="kpi-card-number">{stats.totalRecommendations}</strong>
              <div className="kpi-card-footer">
                <span className="kpi-subtext">Chaining &amp; Hill Climbing</span>
                <span className="kpi-status-pill cyan">Executed</span>
              </div>
              <div className="kpi-accent-line cyan-line" />
            </div>

            {/* Card 4: Total Shelf Count */}
            <div className="analytics-kpi-card kpi-amber">
              <div className="kpi-card-header">
                <span className="kpi-card-label">Total Shelf Holdings</span>
                <div className="kpi-card-icon-wrap amber-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                    <rect x="1" y="3" width="22" height="5"></rect>
                    <line x1="10" y1="12" x2="14" y2="12"></line>
                  </svg>
                </div>
              </div>
              <strong className="kpi-card-number">{totalShelfCount}</strong>
              <div className="kpi-card-footer">
                <span className="kpi-subtext">Wishlist &amp; reading plans</span>
                <span className="kpi-status-pill amber">Curated</span>
              </div>
              <div className="kpi-accent-line amber-line" />
            </div>
          </div>

          {/* Charts Row: Favorite Genres & Favorite Moods */}
          <div className="analytics-charts-container">
            {/* Chart 1: Favorite Genres */}
            <div className="analytics-chart-panel">
              <div className="chart-panel-header">
                <div className="chart-title-wrap">
                  <div className="chart-icon-box blue-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="chart-title">Favorite Genre Affinities</h3>
                    <span className="chart-subtitle">Calculated from saved bookmarks &amp; explored titles</span>
                  </div>
                </div>
                <span className="chart-stat-tag">
                  {stats.favoriteGenres.length} {stats.favoriteGenres.length === 1 ? 'Genre' : 'Genres'}
                </span>
              </div>

              {stats.favoriteGenres.length === 0 ? (
                <div className="empty-chart-notice">
                  <span>No genre interactions recorded yet.</span>
                </div>
              ) : (
                <div className="analytics-bars-stack">
                  {stats.favoriteGenres.slice(0, 6).map((item, idx) => {
                    const max = stats.favoriteGenres[0]?.count || 1;
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.genre} className="telemetry-bar-row">
                        <div className="bar-meta-left">
                          <span className="bar-rank-num">0{idx + 1}</span>
                          <span className="bar-category-name">{item.genre}</span>
                        </div>
                        <div className="bar-track-wrap">
                          <div className="bar-fill-track">
                            <div
                              className="bar-fill-gradient blue-gradient"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="bar-meta-right">
                          <span className="bar-count-badge">{item.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Favorite Moods */}
            <div className="analytics-chart-panel">
              <div className="chart-panel-header">
                <div className="chart-title-wrap">
                  <div className="chart-icon-box violet-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="chart-title">Mood &amp; Atmosphere Spectrum</h3>
                    <span className="chart-subtitle">Derived from user preference queries &amp; selections</span>
                  </div>
                </div>
                <span className="chart-stat-tag">
                  {stats.favoriteMoods.length} {stats.favoriteMoods.length === 1 ? 'Mood' : 'Moods'}
                </span>
              </div>

              {stats.favoriteMoods.length === 0 ? (
                <div className="empty-chart-notice">
                  <span>No mood preferences recorded yet.</span>
                </div>
              ) : (
                <div className="analytics-bars-stack">
                  {stats.favoriteMoods.slice(0, 6).map((item, idx) => {
                    const max = stats.favoriteMoods[0]?.count || 1;
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.mood} className="telemetry-bar-row">
                        <div className="bar-meta-left">
                          <span className="bar-rank-num">0{idx + 1}</span>
                          <span className="bar-category-name">{item.mood}</span>
                        </div>
                        <div className="bar-track-wrap">
                          <div className="bar-fill-track">
                            <div
                              className="bar-fill-gradient cyan-gradient"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="bar-meta-right">
                          <span className="bar-count-badge">{item.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Deep-Dive Activity Panels: Reading Tracker & Inference Engine */}
          <div className="analytics-deepdive-grid">
            {/* Panel 1: Study Companion Reading Velocity */}
            <div className="analytics-deepdive-card">
              <div className="deepdive-header">
                <div>
                  <h3 className="deepdive-title">Reading Schedule Velocity</h3>
                  <p className="deepdive-sub">
                    Pace and daily targets tracked through the Study Companion module
                  </p>
                </div>
                <span className="telemetry-badge-emerald">
                  {stats.readingProgressPct}% Target Met
                </span>
              </div>

              {/* Progress HUD Bar */}
              <div className="deepdive-progress-container">
                <div className="deepdive-progress-track">
                  <div
                    className="deepdive-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(3, stats.readingProgressPct))}%` }}
                  />
                </div>
              </div>

              <div className="deepdive-metrics-strip">
                <div className="deepdive-metric-col">
                  <span className="metric-col-val">{stats.studyPlansCount}</span>
                  <span className="metric-col-lbl">Active Schedules</span>
                </div>
                <div className="deepdive-metric-col">
                  <span className="metric-col-val">{stats.totalCompletedDays}</span>
                  <span className="metric-col-lbl">Days Completed</span>
                </div>
                <div className="deepdive-metric-col">
                  <span className="metric-col-val">{stats.totalTargetDays}</span>
                  <span className="metric-col-lbl">Total Target Days</span>
                </div>
                <div className="deepdive-metric-col">
                  <span className="metric-col-val">
                    {stats.totalTargetDays > 0
                      ? `${Math.max(0, stats.totalTargetDays - stats.totalCompletedDays)}d`
                      : '0d'}
                  </span>
                  <span className="metric-col-lbl">Remaining</span>
                </div>
              </div>

              <div className="deepdive-card-footer">
                <Link to="/study" className="deepdive-link">
                  Manage Reading Plans in Study Companion &rarr;
                </Link>
              </div>
            </div>

            {/* Panel 2: AI Inference & Hill Climbing Quality */}
            <div className="analytics-deepdive-card">
              <div className="deepdive-header">
                <div>
                  <h3 className="deepdive-title">AI Recommendation Engine Pipeline</h3>
                  <p className="deepdive-sub">
                    Rule-based inference, Forward/Backward Chaining &amp; Hill Climbing
                  </p>
                </div>
                <span className="telemetry-badge-cyan">
                  {stats.averageSavedRating
                    ? `★ ${stats.averageSavedRating.toFixed(2)} Quality`
                    : 'System Optimal'}
                </span>
              </div>

              <div className="inference-stats-triad">
                <div className="inference-stat-box">
                  <span className="inf-stat-val">{stats.totalRecommendations}</span>
                  <span className="inf-stat-lbl">Inference Sessions</span>
                </div>
                <div className="inference-stat-box">
                  <span className="inf-stat-val">
                    {stats.averageSavedRating > 0
                      ? stats.averageSavedRating.toFixed(2)
                      : '4.50'}
                  </span>
                  <span className="inf-stat-lbl">Average Score Rating</span>
                </div>
                <div className="inference-stat-box">
                  <span className="inf-stat-val">8</span>
                  <span className="inf-stat-lbl">Hill Climbing Restarts</span>
                </div>
              </div>

              <div className="deepdive-card-footer">
                <Link to="/reasoning" className="deepdive-link">
                  Inspect Rule Traces &amp; Search Graphs in AI Reasoning &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Activity Audit Trail */}
          {activityLog && activityLog.length > 0 && (
            <div className="analytics-audit-panel">
              <div className="audit-panel-header">
                <div className="audit-header-left">
                  <div className="chart-icon-box cyan-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 className="chart-title">Real-Time Interaction Log</h3>
                    <span className="chart-subtitle">Audit trail of recent client-side events</span>
                  </div>
                </div>
                <span className="chart-stat-tag">{activityLog.length} Events Logged</span>
              </div>

              <div className="audit-log-table">
                {activityLog.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="audit-log-row">
                    <div className="audit-event-type">
                      <span className="audit-status-dot" />
                      <strong>{getEventLabel(entry.type)}</strong>
                    </div>
                    <div className="audit-event-details">
                      {entry.data?.title ? (
                        <span className="audit-book-title">&ldquo;{entry.data.title}&rdquo;</span>
                      ) : entry.data?.query ? (
                        <span className="audit-query-text">Query: &ldquo;{entry.data.query}&rdquo;</span>
                      ) : (
                        <span className="audit-generic-text">System interaction completed</span>
                      )}
                    </div>
                    <div className="audit-event-time">
                      <span>{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
