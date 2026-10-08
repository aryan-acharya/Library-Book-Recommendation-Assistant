import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics } from '../libraryStore';
import { PageHeader, EmptyState } from '../components/UIComponents';

export default function Analytics() {
  const navigate = useNavigate();
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
      <PageHeader
        title="Reader &amp; AI System Analytics"
        description="Real user activity metrics computed from your interactions: recommendations generated, books viewed, saved favorites, and reading progression."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        }
      />

      {!stats.hasActivity ? (
        <EmptyState
          icon="📊"
          title="Not enough activity yet."
          message="Explore recommendations on the Home page, bookmark books to your library, or start a study plan to see your real reading metrics and AI interaction stats here."
          actionText="Discover Books on Home"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="analytics-content-grid">
          {/* Top KPI Metrics: 4 Primary Cards required */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-icon">📖</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.booksViewed}</strong>
                <span className="kpi-label">Books Viewed</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">♥</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.favoritesCount}</strong>
                <span className="kpi-label">Favorites</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">⚡</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.totalRecommendations}</strong>
                <span className="kpi-label">Recommendations Generated</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-icon">📚</span>
              <div className="kpi-data">
                <strong className="kpi-num">{stats.favoritesCount + (stats.studyPlansCount || 0)}</strong>
                <span className="kpi-label">Books Saved</span>
              </div>
            </div>
          </div>

          <div className="analytics-charts-grid">
            {/* Chart 1: Favorite Genres Distribution */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Favorite Genres</h3>
                <span className="chart-sub">From bookmarks &amp; explored books</span>
              </div>

              {stats.favoriteGenres.length === 0 ? (
                <p className="empty-chart-text">No genre preferences recorded yet.</p>
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

            {/* Chart 2: Favorite Moods Distribution */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Favorite Moods</h3>
                <span className="chart-sub">From preference filters &amp; selections</span>
              </div>

              {stats.favoriteMoods.length === 0 ? (
                <p className="empty-chart-text">No mood preferences recorded yet.</p>
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

          {/* Reading Activity & Recommendation Activity Cards */}
          <div className="analytics-activities-grid">
            {/* Reading Activity */}
            <div className="activity-card">
              <div className="activity-header">
                <div>
                  <h3>Reading Activity</h3>
                  <p className="chart-sub">
                    Pace and daily targets tracked via Study Companion
                  </p>
                </div>
                <span className="progress-badge">{stats.readingProgressPct}% Target Met</span>
              </div>

              <div className="activity-progress-bar-wrap">
                <div
                  className="activity-progress-fill"
                  style={{ width: `${stats.readingProgressPct}%` }}
                ></div>
              </div>

              <div className="activity-metrics-row">
                <div className="act-metric">
                  <strong>{stats.studyPlansCount}</strong>
                  <span>Active Plans</span>
                </div>
                <div className="act-metric">
                  <strong>{stats.totalCompletedDays}</strong>
                  <span>Days Completed</span>
                </div>
                <div className="act-metric">
                  <strong>{stats.totalTargetDays}</strong>
                  <span>Total Target Days</span>
                </div>
              </div>
            </div>

            {/* Recommendation Activity */}
            <div className="activity-card">
              <div className="activity-header">
                <div>
                  <h3>Recommendation Activity</h3>
                  <p className="chart-sub">
                    Inference engine and quality rating tracking
                  </p>
                </div>
                <span className="quality-badge">
                  {stats.averageSavedRating ? `★ ${stats.averageSavedRating.toFixed(2)}` : '★ High Quality'}
                </span>
              </div>

              <div className="rec-activity-stats-grid">
                <div className="rec-stat-box">
                  <span className="rec-stat-num">{stats.totalRecommendations}</span>
                  <span className="rec-stat-label">Inference Runs</span>
                </div>
                <div className="rec-stat-box">
                  <span className="rec-stat-num">
                    {stats.averageSavedRating ? stats.averageSavedRating.toFixed(2) : '—'}
                  </span>
                  <span className="rec-stat-label">Avg Saved Book Rating</span>
                </div>
                <div className="rec-stat-box">
                  <span className="rec-stat-num">8</span>
                  <span className="rec-stat-label">Hill Climbing Restarts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
