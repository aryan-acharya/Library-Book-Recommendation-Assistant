import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../libraryStore';

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    function load() {
      setStats(getAnalytics());
    }
    load();
    window.addEventListener('libraai_store_update', load);
    return () => window.removeEventListener('libraai_store_update', load);
  }, []);

  if (!stats) return null;

  return (
    <div className="analytics-page">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>Reader &amp; AI System Analytics</h1>
          <p>
            Real user activity metrics computed from your interactions: recommendations generated, books viewed, saved favorites, and reading progression.
          </p>
        </div>
      </header>

      {!stats.hasActivity ? (
        <div className="empty-state-card">
          <div className="empty-icon">📊</div>
          <h3>Not enough activity yet</h3>
          <p>
            Explore recommendations on the Home page, bookmark books to your library, or start a study plan to see your real reading metrics and AI interaction stats here.
          </p>
          <div style={{ marginTop: '1.2rem' }}>
            <Link to="/" className="btn-small-primary">
              Discover Books on Home →
            </Link>
          </div>
        </div>
      ) : (
        <div className="analytics-content-grid">
          {/* Top KPI Metrics */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-icon">⚡</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.totalRecommendations}</strong>
                <span className="kpi-label">AI Recommendations Run</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">📖</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.booksViewed}</strong>
                <span className="kpi-label">Books Explored</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">♥</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.favoritesCount}</strong>
                <span className="kpi-label">Saved Favorites</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">★</span>
              <div className="kpi-data">
                <strong className="kpi-num">
                  {stats.averageSavedRating ? stats.averageSavedRating.toFixed(2) : '—'}
                </strong>
                <span className="kpi-label">Avg Saved Book Rating</span>
              </div>
            </div>
          </div>

          <div className="analytics-charts-grid">
            {/* Favorite Genres Distribution */}
            <div className="chart-card">
              <h3>Top Preferred Genres</h3>
              <p className="chart-sub">Computed from saved favorites and explored books</p>
              {stats.favoriteGenres.length === 0 ? (
                <p className="empty-text">No genre preferences recorded yet.</p>
              ) : (
                <div className="bars-list">
                  {stats.favoriteGenres.slice(0, 6).map((item) => {
                    const max = stats.favoriteGenres[0]?.count || 1;
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.genre} className="bar-item">
                        <div className="bar-labels">
                          <span>{item.genre}</span>
                          <strong>{item.count}</strong>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill blue" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Favorite Moods Distribution */}
            <div className="chart-card">
              <h3>Top Preferred Moods</h3>
              <p className="chart-sub">Computed from candidate interactions and bookmarks</p>
              {stats.favoriteMoods.length === 0 ? (
                <p className="empty-text">No mood preferences recorded yet.</p>
              ) : (
                <div className="bars-list">
                  {stats.favoriteMoods.slice(0, 6).map((item) => {
                    const max = stats.favoriteMoods[0]?.count || 1;
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.mood} className="bar-item">
                        <div className="bar-labels">
                          <span>{item.mood}</span>
                          <strong>{item.count}</strong>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill cyan" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reading Progress & Study Goals */}
          <div className="analytics-study-card">
            <div className="study-header">
              <div>
                <h3>Study Companion Progress</h3>
                <p className="chart-sub">
                  Overall completion percentage across all active reading schedules
                </p>
              </div>
              <span className="progress-badge">{stats.readingProgressPct}% Complete</span>
            </div>

            <div className="full-progress-bar-wrap">
              <div
                className="full-progress-fill"
                style={{ width: `${stats.readingProgressPct}%` }}
              ></div>
            </div>

            <div className="study-summary-numbers">
              <div className="num-box">
                <strong>{stats.studyPlansCount}</strong>
                <span>Active Schedules</span>
              </div>
              <div className="num-box">
                <strong>{stats.totalCompletedDays}</strong>
                <span>Days Completed</span>
              </div>
              <div className="num-box">
                <strong>{stats.totalTargetDays}</strong>
                <span>Total Target Days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
