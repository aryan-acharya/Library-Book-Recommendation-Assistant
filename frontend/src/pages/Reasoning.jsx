import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { RecommendationCard } from '../components/BookComponents';

export default function Reasoning() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRestartIdx, setActiveRestartIdx] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('libraai_last_reasoning');
      if (raw) {
        setResult(JSON.parse(raw));
        return;
      }
    } catch {
      // ignore
    }

    // Auto-run inference with default profile so AI Reasoning is never empty
    setLoading(true);
    api
      .recommend({
        genre: 'Horror',
        mood: 'Suspenseful',
        interest: 'Mystery',
        readingLevel: 'Intermediate',
        ageGroup: 'Young Adult',
        minimumRating: 4.0,
        showAvailableOnly: true,
        useHillClimbing: true,
        reasoningMethod: 'forward',
        restarts: 8,
      })
      .then((data) => {
        setResult(data);
        sessionStorage.setItem('libraai_last_reasoning', JSON.stringify(data));
      })
      .catch((e) => console.error('Failed to load reasoning:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="reasoning-page">
        <header className="section-head">
          <h1>AI Reasoning</h1>
          <p>Running Rule-Based inference and Hill Climbing search...</p>
        </header>
        <div className="loading-state-banner">
          <div className="loading-pulse-spinner"></div>
          <p>Evaluating IF–THEN rules and candidate neighborhood...</p>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="reasoning-page">
        <header className="section-head">
          <h1>AI Reasoning</h1>
          <p>No reasoning session recorded. Run recommendations to view trace.</p>
        </header>
        <Link className="btn primary" to="/recommend">
          Get AI Recommendations
        </Link>
      </section>
    );
  }

  const prefs = result.userPreferences || {};
  const hc = result.hillClimbing || result.hill_climbing || {};
  const allRuns = hc.allRuns || [];
  const primaryRun = hc.primaryRun || (allRuns.length > 0 ? allRuns[0] : null);
  const selectedRun = allRuns[activeRestartIdx] || primaryRun;

  return (
    <section className="reasoning-page">
      <header className="section-head">
        <h1>AI Reasoning</h1>
        <p>
          Complete inference trace using{' '}
          <strong>{result.reasoningMethod === 'backward' ? 'Backward Chaining' : 'Forward Chaining'}</strong>,
          dynamic recommendation scoring, and Random-Restart Hill Climbing optimization.
        </p>
      </header>

      {/* Visual Pipeline Architecture Banner */}
      <div className="reasoning-pipeline-flow">
        <h3>AI Recommendation Process Architecture</h3>
        <div className="pipeline-steps-chain">
          <div className="pipeline-node">
            <span className="step-num">1</span>
            <span className="step-title">User Preferences</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node">
            <span className="step-num">2</span>
            <span className="step-title">Fact Representation</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node">
            <span className="step-num">3</span>
            <span className="step-title">Knowledge Base</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node">
            <span className="step-num">4</span>
            <span className="step-title">Rule-Based Reasoning</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node">
            <span className="step-num">5</span>
            <span className="step-title">Candidate Books</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node">
            <span className="step-num">6</span>
            <span className="step-title">Recommendation Scoring</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node highlight">
            <span className="step-num">7</span>
            <span className="step-title">Hill Climbing</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node success">
            <span className="step-num">8</span>
            <span className="step-title">Top 5 Recs</span>
          </div>
        </div>
      </div>

      <div className="reason-grid">
        <article className="panel">
          <h2>1. User Facts</h2>
          <ul className="fact-list">
            {(result.facts || []).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="muted">
            Genre = {prefs.genre || '—'} · Mood = {prefs.mood || '—'} · Interest = {prefs.interest || '—'} ·
            Level = {prefs.readingLevel || '—'} · Min Rating = {prefs.minimumRating ?? 'Any'}
          </div>
        </article>

        <article className="panel">
          <h2>2. Knowledge Base</h2>
          <p>
            Candidates were drawn from the 10,538-book Knowledge Base after preference-guided filtering and rule
            evaluation.
          </p>
          <p>
            <strong>{result.candidateBooks?.length || 0}</strong> candidate books entered scoring and search.
          </p>
        </article>

        <article className="panel">
          <h2>3. Rules Fired</h2>
          <ul className="rule-list compact">
            {(result.firedRules || []).slice(0, 40).map((r, i) => (
              <li key={`${r.id}-${r.bookId}-${i}`}>
                <strong>{r.id}</strong> {r.name || ''} → {r.fact}
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>4. Derived Facts</h2>
          <pre className="code-block">{(result.derivedFacts || []).slice(0, 60).join('\n')}</pre>
        </article>

        {result.reasoningMethod === 'forward' ? (
          <article className="panel wide">
            <h2>5. Forward Chaining</h2>
            <ol className="steps">
              {(result.reasoningSteps || [])
                .filter((s) => !String(s).startsWith('  ←') && !String(s).startsWith('Goal:'))
                .map((step) => (
                  <li key={step}>{step}</li>
                ))}
            </ol>
            <p className="muted">Rules checked: {(result.rulesChecked || []).join(', ')}</p>
          </article>
        ) : (
          <article className="panel wide">
            <h2>5. Backward Chaining</h2>
            <pre className="code-block">{(result.goalTree || []).join('\n')}</pre>
            <h3>Proof Examples</h3>
            <div className="proof-grid">
              {(result.proofExamples || []).map((p) => (
                <div key={p.bookId} className="proof-card">
                  <strong>{p.title}</strong>
                  <p>Goal: {p.goal}</p>
                  <p className="ok">Proven: {(p.proven || []).join(', ')}</p>
                  <p className="fail">Failed: {(p.failed || []).join(', ') || '—'}</p>
                </div>
              ))}
            </div>
          </article>
        )}

        <article className="panel wide">
          <h2>6. Recommendation Scoring Function</h2>
          <p className="muted">
            The objective function dynamically computes candidate scores by combining preference matches with library signals.
          </p>
          <div className="weight-row">
            {Object.entries(result.scoreWeights || {}).map(([k, v]) => (
              <span key={k} className="chip">
                {k} +{v}
              </span>
            ))}
          </div>
          <div className="score-table">
            {(result.scores || []).slice(0, 10).map((s) => (
              <div key={s.id} className="score-row">
                <span>{s.title}</span>
                <strong>Score {s.recommendationScore}</strong>
              </div>
            ))}
          </div>
        </article>

        {/* SECTION 7: HILL CLIMBING SEARCH */}
        <article className="panel wide hc-panel">
          <div className="hc-header">
            <h2>7. ⛰️ Hill Climbing Search</h2>
            <span className="chip hc-badge-info">
              {result.restarts?.length || 0} Restarts · Best Score: {hc.bestScore || 0}/20
            </span>
          </div>

          {/* Educational Callout: Local Optimum vs Global Optimum */}
          <div className="hc-concept-callout">
            <div className="concept-icon">💡</div>
            <div>
              <strong>Local Optimum vs. Global Optimum:</strong>
              <p>
                Hill Climbing stops when no neighboring candidate has a better recommendation score.
                This candidate is a <strong>local optimum</strong> within the explored neighborhood.
                Random restarts are used to explore different regions of the candidate space to avoid weak local optima.
                <em> Hill Climbing does not guarantee finding the globally optimal book.</em>
              </p>
              <p className="concept-sub">
                <strong>Neighbor Definition:</strong> Two books are neighbors if they share meaningful attributes
                (genre, subgenre, mood, themes, keywords, author, or reading level) — <em>never adjacent rows in the dataset</em>.
              </p>
            </div>
          </div>

          {/* User Preferences Card */}
          <div className="hc-card hc-prefs-summary">
            <h3>User Preferences</h3>
            <div className="pref-badges-grid">
              <div className="pref-badge-item">
                <span className="pref-label">Genre:</span>
                <strong>{prefs.genre || 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Mood:</span>
                <strong>{prefs.mood || 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Interest:</span>
                <strong>{prefs.interest || 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Reading Level:</span>
                <strong>{prefs.readingLevel || 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Minimum Rating:</span>
                <strong>{prefs.minimumRating ? `${prefs.minimumRating}+` : 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Length:</span>
                <strong>{prefs.length || 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Theme:</span>
                <strong>{prefs.theme || 'Any'}</strong>
              </div>
              <div className="pref-badge-item">
                <span className="pref-label">Keywords:</span>
                <strong>{(prefs.keywords || []).join(', ') || 'None'}</strong>
              </div>
            </div>
          </div>

          {/* Random Restarts Overview (Viva demonstration view) */}
          <div className="hc-restarts-section">
            <div className="hc-restarts-head">
              <h3>Random-Restart Overview</h3>
              {hc.bestResult ? (
                <span className="hc-best-tag">
                  🏆 Best Discovered: <strong>{hc.bestResult}</strong> (Score {hc.bestScore})
                </span>
              ) : null}
            </div>

            <div className="hc-restart-cards-grid">
              {(result.restarts || []).map((r, i) => {
                const isBest = r.score === hc.bestScore;
                const isSelected = activeRestartIdx === i;
                return (
                  <button
                    key={r.restart}
                    type="button"
                    className={`hc-restart-btn-card ${isSelected ? 'selected' : ''} ${isBest ? 'is-best' : ''}`}
                    onClick={() => setActiveRestartIdx(i)}
                  >
                    <div className="restart-btn-top">
                      <span className="restart-num">Random Restart {r.restart}</span>
                      {isBest ? <span className="best-pill">★ Best</span> : null}
                    </div>
                    <div className="restart-flow">
                      <div className="flow-step">
                        <span className="flow-label">Start:</span>
                        <span className="flow-book">{r.startTitle}</span>
                        <span className="flow-score">({r.startScore})</span>
                      </div>
                      <span className="flow-arrow">→</span>
                      <div className="flow-step">
                        <span className="flow-label">Optimum:</span>
                        <span className="flow-book">{r.localOptimumTitle}</span>
                        <span className="flow-score highlight">({r.score})</span>
                      </div>
                    </div>
                    <div className="restart-status-bar">
                      <span>{r.pathSummary || `Final Score: ${r.score}`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Step-by-Step Climb Inspection for Selected Run */}
          {selectedRun ? (
            <div className="hc-detail-run">
              <div className="run-header">
                <h3>
                  Search Trace — {selectedRun.label || `Restart ${activeRestartIdx + 1}`}
                </h3>
                <span className="chip">
                  {selectedRun.steps?.length || 0} Search Steps · Local Optimum: Score {selectedRun.score}
                </span>
              </div>

              {/* Initial Candidate */}
              <div className="hc-initial-box">
                <div className="initial-badge">Initial Candidate</div>
                <div className="initial-body">
                  <strong>{selectedRun.startTitle || selectedRun.startBook?.title}</strong>
                  <span className="initial-score">
                    Starting Recommendation Score: <strong>{selectedRun.startScore ?? selectedRun.startBook?.score}</strong>
                  </span>
                </div>
              </div>

              {/* Steps Timeline */}
              <div className="hc-timeline">
                {(selectedRun.steps || []).map((step, idx) => {
                  const isMove = step.action === 'move';
                  const isOptimum = step.action === 'local_optimum' || step.status === 'no_better_neighbor';
                  const isStart = step.action === 'start';

                  return (
                    <div
                      key={idx}
                      className={`hc-step-card ${isMove ? 'step-move' : ''} ${isOptimum ? 'step-optimum' : ''}`}
                    >
                      <div className="step-badge-col">
                        <span className="step-num-pill">
                          {isStart ? 'Start' : `Step ${step.stepNumber || step.step || idx}`}
                        </span>
                        {idx < (selectedRun.steps || []).length - 1 ? (
                          <div className="timeline-line" />
                        ) : null}
                      </div>

                      <div className="step-content">
                        <div className="step-title-row">
                          {isMove ? (
                            <div className="step-transition">
                              <span className="from-book">
                                {step.current_book || step.from?.title}
                                <span className="score-tag">({step.fromScore})</span>
                              </span>
                              <span className="transition-arrow">→</span>
                              <span className="to-book">
                                {step.selected || step.to?.title}
                                <span className="score-tag better">({step.toScore})</span>
                              </span>
                              <span className="status-pill ok">✓ Better neighbor found</span>
                            </div>
                          ) : isOptimum ? (
                            <div className="step-transition">
                              <span className="current-optimum-book">
                                {step.current_book || step.book?.title}
                                <span className="score-tag highlight">({step.current_score ?? step.score})</span>
                              </span>
                              <span className="status-pill stop">✕ No better neighboring book found</span>
                            </div>
                          ) : (
                            <div className="step-transition">
                              <span>{step.message}</span>
                            </div>
                          )}
                        </div>

                        <p className="step-msg-text">{step.message}</p>

                        {/* Neighbors evaluated at this step */}
                        {step.neighbors && step.neighbors.length > 0 ? (
                          <details className="neighbor-eval-details" open={idx === 0}>
                            <summary>
                              Evaluated {step.neighbors.length} Neighboring Candidates
                            </summary>
                            <div className="neighbor-cards-list">
                              {step.neighbors.map((nb, nIdx) => (
                                <div
                                  key={nIdx}
                                  className={`neighbor-card-item ${nb.better ? 'better' : 'worse'}`}
                                >
                                  <div className="nb-info">
                                    <span className="nb-title">{nb.title || nb.book?.title}</span>
                                    <span className="nb-meta">
                                      {nb.book?.genre} · {nb.book?.mood}
                                    </span>
                                  </div>
                                  <div className="nb-score-col">
                                    <span className="nb-score">Score {nb.score}</span>
                                    <span className={`nb-eval-tag ${nb.better ? 'tag-better' : 'tag-worse'}`}>
                                      {nb.better ? '✓ Better' : '✕ Lower/Equal'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Final Local Optimum Box */}
              <div className="hc-final-optimum-box">
                <div className="optimum-header">
                  <span className="optimum-badge">Final Local Optimum</span>
                  <span className="optimum-score-chip">
                    Score {selectedRun.score}/20
                  </span>
                </div>
                <div className="optimum-details">
                  <h4>{selectedRun.localOptimumTitle || selectedRun.localOptimum?.title}</h4>
                  <p className="muted">
                    No neighboring candidate in the search neighborhood has a score strictly greater than{' '}
                    <strong>{selectedRun.score}</strong>. Hill Climbing terminates at this candidate.
                  </p>
                  <div className="optimum-path-chain">
                    <strong>Search Path:</strong> {selectedRun.pathSummary}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </article>

        {/* SECTION 8: FINAL RECOMMENDATIONS */}
        <article className="panel wide">
          <h2>8. Final Top 5 Recommendations</h2>
          <p className="muted">
            Optimized by Hill Climbing, deduplicated across random restarts, and ranked by recommendation score.
          </p>
          <div className="rec-list">
            {(result.recommendations || []).map((book, i) => (
              <RecommendationCard key={book.id} book={book} rank={i + 1} />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
