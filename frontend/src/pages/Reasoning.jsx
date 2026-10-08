import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader, LoadingState, Tabs, EmptyState } from '../components/UIComponents';

export default function Reasoning() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reasoning');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRestartIdx, setActiveRestartIdx] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);

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

  const tabOptions = [
    { id: 'reasoning', label: 'AI Reasoning' },
    { id: 'rule-based', label: 'Rule-Based' },
    { id: 'hill-climbing', label: 'Hill Climbing' },
  ];

  if (loading) {
    return (
      <div className="reasoning-page">
        <PageHeader
          title="AI Reasoning"
          description="Inspecting inference engine, Rule-Based logic, and Hill Climbing optimization..."
        />
        <LoadingState message="Running Rule-Based inference and evaluating Hill Climbing search..." />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="reasoning-page">
        <PageHeader
          title="AI Reasoning"
          description="Detailed inspection of the LibraAI reasoning engine."
        />
        <EmptyState
          icon="🧠"
          title="No Reasoning Session Recorded"
          message="Run recommendations from the Get Recommendations page to generate and inspect a live reasoning trace."
          actionText="Get AI Recommendations"
          onAction={() => navigate('/recommend')}
        />
      </div>
    );
  }

  const prefs = result.userPreferences || {};
  const hc = result.hillClimbing || result.hill_climbing || {};
  const allRuns = hc.allRuns || [];
  const primaryRun = hc.primaryRun || (allRuns.length > 0 ? allRuns[0] : null);
  const selectedRun = allRuns[activeRestartIdx] || primaryRun;
  const recommendations = result.recommendations || [];

  return (
    <div className="reasoning-page">
      <PageHeader
        title="AI Reasoning"
        description="Inspect the real backend AI pipeline: Fact Representation, Knowledge Base rules, Forward/Backward Chaining deduction, and Random-Restart Hill Climbing optimization."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
          </svg>
        }
      />

      {/* Tabs Navigation */}
      <div className="reasoning-tabs-container">
        <Tabs
          tabs={tabOptions}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ================= TAB 1: AI REASONING ================= */}
      {activeTab === 'reasoning' && (
        <div className="reasoning-tab-view">
          {/* Pipeline Flow Banner */}
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
                <span className="step-title">Scoring</span>
              </div>
              <span className="pipeline-arrow">→</span>
              <div className="pipeline-node highlight">
                <span className="step-num">7</span>
                <span className="step-title">Optimization</span>
              </div>
              <span className="pipeline-arrow">→</span>
              <div className="pipeline-node success">
                <span className="step-num">8</span>
                <span className="step-title">Final Recs</span>
              </div>
            </div>
          </div>

          <div className="reason-grid">
            {/* 1. User Preferences */}
            <article className="panel">
              <div className="panel-badge-step">Stage 1 &amp; 2</div>
              <h2>User Preferences &amp; Fact Representation</h2>
              <div className="pref-mini-grid">
                <div className="pref-item">
                  <span>Genre:</span> <strong>{prefs.genre || 'Any'}</strong>
                </div>
                <div className="pref-item">
                  <span>Mood:</span> <strong>{prefs.mood || 'Any'}</strong>
                </div>
                <div className="pref-item">
                  <span>Interest:</span> <strong>{prefs.interest || 'Any'}</strong>
                </div>
                <div className="pref-item">
                  <span>Reading Level:</span> <strong>{prefs.readingLevel || 'Any'}</strong>
                </div>
                <div className="pref-item">
                  <span>Min Rating:</span> <strong>{prefs.minimumRating ? `${prefs.minimumRating}+` : 'Any'}</strong>
                </div>
                <div className="pref-item">
                  <span>Availability:</span> <strong>{prefs.showAvailableOnly ? 'Available Only' : 'All'}</strong>
                </div>
              </div>

              <h3>Extracted System Facts</h3>
              <ul className="fact-list">
                {(result.facts || []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>

            {/* 2. Knowledge Base */}
            <article className="panel">
              <div className="panel-badge-step">Stage 3 &amp; 5</div>
              <h2>Knowledge Base &amp; Candidate Books</h2>
              <p>
                Candidates were queried from the <strong>10,538-book Knowledge Base</strong> using multi-attribute predicate matching.
              </p>
              <div className="kpi-callout-row">
                <div className="kpi-callout">
                  <span className="callout-num">10,538</span>
                  <span className="callout-label">Total Books in KB</span>
                </div>
                <div className="kpi-callout highlight">
                  <span className="callout-num">{result.candidateBooks?.length || 0}</span>
                  <span className="callout-label">Candidate Pool Entered</span>
                </div>
              </div>
              <p className="panel-desc-small">
                Inference method applied: <strong>{result.reasoningMethod === 'backward' ? 'Backward Chaining (Goal Verification)' : 'Forward Chaining (Data-Driven Deduction)'}</strong>.
              </p>
            </article>

            {/* 3. Rules Overview */}
            <article className="panel">
              <div className="panel-badge-step">Stage 4</div>
              <h2>Rules Fired Summary</h2>
              <p className="panel-desc-small">
                A total of <strong>{(result.firedRules || []).length}</strong> rule applications succeeded across candidate books.
              </p>
              <ul className="rule-list compact">
                {(result.firedRules || []).slice(0, 15).map((r, i) => (
                  <li key={`${r.id}-${r.bookId}-${i}`}>
                    <strong>{r.id}</strong> {r.name || ''} → <code>{r.fact}</code>
                  </li>
                ))}
              </ul>
            </article>

            {/* 4. Recommendation Scoring */}
            <article className="panel">
              <div className="panel-badge-step">Stage 6</div>
              <h2>Scoring &amp; Objective Function</h2>
              <p className="panel-desc-small">
                Evaluation weights combining user preferences and catalog quality signals:
              </p>
              <div className="weight-row">
                {Object.entries(result.scoreWeights || {}).map(([k, v]) => (
                  <span key={k} className="chip">
                    {k} +{v}
                  </span>
                ))}
              </div>
              <div className="score-table-compact">
                {(result.scores || []).slice(0, 5).map((s) => (
                  <div key={s.id} className="score-row">
                    <span className="book-title-cell">{s.title}</span>
                    <strong className="score-value-cell">Score {s.recommendationScore}</strong>
                  </div>
                ))}
              </div>
            </article>

            {/* 5. Optimization & Final Recommendations */}
            <article className="panel wide">
              <div className="panel-badge-step">Stage 7 &amp; 8</div>
              <h2>Optimization &amp; Final Top 5 Recommendations</h2>
              <p className="panel-desc-small">
                Hill Climbing executed with <strong>{result.restarts?.length || 8} random restarts</strong>, discovering local optimum score of <strong>{hc.bestScore || '—'}/20</strong>.
              </p>

              <div className="recommendations-results-grid">
                {recommendations.slice(0, 5).map((book, idx) => (
                  <div key={book.id} className="reason-book-card-item">
                    <BookCard
                      book={book}
                      rank={idx + 1}
                      score={book.score || book.recommendationScore}
                      onSelect={() => setSelectedBook(book)}
                    />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RULE-BASED ================= */}
      {activeTab === 'rule-based' && (
        <div className="reasoning-tab-view">
          <div className="reason-grid">
            {/* Rules Definition & Execution */}
            <article className="panel wide">
              <h2>Expert Rules Applied</h2>
              <p className="panel-desc-small">
                The inference engine evaluated candidate books against the 10 production rules (R1–R10).
              </p>
              <ul className="rule-list full">
                {(result.firedRules || []).slice(0, 25).map((r, i) => (
                  <li key={`${r.id}-${r.bookId}-${i}`} className="rule-full-item">
                    <div className="rule-item-top">
                      <span className="rule-id-badge">{r.id}</span>
                      <strong className="rule-name">{r.name}</strong>
                    </div>
                    <div className="rule-fact-text">Derived: <code>{r.fact}</code></div>
                  </li>
                ))}
              </ul>
            </article>

            {/* Matched & Derived Facts */}
            <article className="panel">
              <h2>Matched &amp; Derived Facts</h2>
              <pre className="code-block">
                {(result.derivedFacts || []).slice(0, 50).join('\n')}
              </pre>
            </article>

            {/* Forward Chaining or Backward Chaining */}
            {result.reasoningMethod === 'forward' ? (
              <article className="panel">
                <h2>Forward Chaining Deduction Trace</h2>
                <p className="panel-desc-small">
                  Data-driven inference: starting from user facts and firing applicable rules forward until candidate scores stabilize.
                </p>
                <ol className="steps">
                  {(result.reasoningSteps || [])
                    .filter((s) => !String(s).startsWith('  ←') && !String(s).startsWith('Goal:'))
                    .slice(0, 30)
                    .map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                </ol>
                <div className="rules-checked-footer">
                  <span>Rules checked:</span> {(result.rulesChecked || []).join(', ')}
                </div>
              </article>
            ) : (
              <article className="panel">
                <h2>Backward Chaining Goal Tree</h2>
                <p className="panel-desc-small">
                  Goal-driven inference: starts with hypothesis goals (RecommendBook, HighMatch) and searches backward for supporting facts.
                </p>
                <pre className="code-block">{(result.goalTree || []).join('\n')}</pre>
                <h3>Proof Examples</h3>
                <div className="proof-grid">
                  {(result.proofExamples || []).map((p) => (
                    <div key={p.bookId} className="proof-card">
                      <strong>{p.title}</strong>
                      <p>Goal: <code>{p.goal}</code></p>
                      <p className="ok">Proven: {(p.proven || []).join(', ')}</p>
                      <p className="fail">Failed: {(p.failed || []).join(', ') || 'None'}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: HILL CLIMBING ================= */}
      {activeTab === 'hill-climbing' && (
        <div className="reasoning-tab-view">
          <div className="hc-panel">
            {/* Concept Callout */}
            <div className="hc-concept-callout">
              <div className="concept-icon">⛰️</div>
              <div>
                <strong>Local Optimum vs. Global Optimum in LibraAI:</strong>
                <p>
                  Hill Climbing is a local search algorithm that iteratively moves from a candidate to a neighbor with a strictly higher recommendation score. It halts when no neighbor yields a higher score (a <strong>local optimum</strong>).
                </p>
                <p className="concept-sub">
                  <strong>Semantic Neighbor Definition:</strong> Two books are neighbors if they share meaningful domain attributes (genre, subgenre, mood, themes, keywords, author, or reading level) — <em>never adjacent rows in the dataset</em>. Random restarts are executed from diverse candidate seeds to explore multiple regions and prevent getting stuck in poor local optima.
                </p>
              </div>
            </div>

            {/* Restarts Summary Bar */}
            <div className="hc-restarts-section">
              <div className="hc-restarts-head">
                <h3>Random Restarts Overview ({result.restarts?.length || 0} Runs)</h3>
                {hc.bestResult ? (
                  <span className="hc-best-tag">
                    🏆 Global Discovered: <strong>{hc.bestResult}</strong> (Score {hc.bestScore})
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
                        <span className="restart-num">Restart #{r.restart}</span>
                        {isBest && <span className="best-pill">★ Best Score</span>}
                      </div>
                      <div className="restart-flow">
                        <div className="flow-step">
                          <span className="flow-label">Start:</span>
                          <span className="flow-book" title={r.startTitle}>{r.startTitle}</span>
                          <span className="flow-score">({r.startScore})</span>
                        </div>
                        <span className="flow-arrow">→</span>
                        <div className="flow-step">
                          <span className="flow-label">Optimum:</span>
                          <span className="flow-book" title={r.localOptimumTitle}>{r.localOptimumTitle}</span>
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

            {/* Detailed Selected Run Trace */}
            {selectedRun && (
              <div className="hc-detail-run">
                <div className="run-header">
                  <h3>
                    Search Execution Trace — {selectedRun.label || `Restart #${activeRestartIdx + 1}`}
                  </h3>
                  <span className="chip">
                    {selectedRun.steps?.length || 0} Iteration Steps · Local Optimum: Score {selectedRun.score}
                  </span>
                </div>

                {/* Starting Candidate */}
                <div className="hc-initial-box">
                  <div className="initial-badge">Starting Candidate Seed</div>
                  <div className="initial-body">
                    <strong>{selectedRun.startTitle || selectedRun.startBook?.title}</strong>
                    <span className="initial-score">
                      Starting Recommendation Score: <strong>{selectedRun.startScore ?? selectedRun.startBook?.score}</strong>
                    </span>
                  </div>
                </div>

                {/* Step Iterations Timeline */}
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
                          {idx < (selectedRun.steps || []).length - 1 && (
                            <div className="timeline-line" />
                          )}
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
                              </div>
                            ) : isOptimum ? (
                              <div className="optimum-title">
                                <span>🎯 Local Optimum Reached: <strong>{step.current_book || step.candidate?.title}</strong></span>
                                <span className="score-tag optimum-score">Score: {step.score}</span>
                              </div>
                            ) : (
                              <div className="start-title">
                                <span>Initial Candidate: <strong>{step.current_book || step.candidate?.title}</strong></span>
                                <span className="score-tag">Score: {step.score}</span>
                              </div>
                            )}
                          </div>

                          <p className="step-desc-text">
                            {step.reason || step.description || (isOptimum ? 'No neighboring candidate with higher score found. Search terminated at local optimum.' : 'Evaluating neighboring candidate space...')}
                          </p>

                          {/* Evaluated Neighbors List */}
                          {(step.neighbors_evaluated || step.neighbors || []).length > 0 && (
                            <div className="step-neighbors-box">
                              <span className="neighbors-head">
                                Evaluated {(step.neighbors_evaluated || step.neighbors).length} Semantic Neighbors:
                              </span>
                              <div className="neighbors-pills-list">
                                {(step.neighbors_evaluated || step.neighbors).slice(0, 8).map((nbr, nIdx) => (
                                  <span key={nIdx} className={`nbr-pill ${nbr.chosen ? 'chosen' : ''}`}>
                                    {nbr.title} ({nbr.score})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedBook && (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}
