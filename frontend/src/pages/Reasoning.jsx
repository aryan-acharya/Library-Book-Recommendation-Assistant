import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader, LoadingState, Tabs, EmptyState } from '../components/UIComponents';

/**
 * Stage Connector visual pipe between consecutive reasoning frames.
 */
function StageConnector({ stepFrom, stepTo, label, icon = '↓' }) {
  return (
    <div className="reasoning-stage-connector" aria-hidden="true">
      <div className="stage-connector-line"></div>
      <div className="stage-connector-badge">
        <span className="connector-arrow-icon">{icon}</span>
        <span className="connector-label">
          <strong>{stepFrom} → {stepTo}:</strong> {label}
        </span>
      </div>
      <div className="stage-connector-line"></div>
    </div>
  );
}

/**
 * Tab 1: End-to-End Decision Architecture Flowchart
 */
function ArchitectureFlowchart({ stats, activeStage, onSelectStage }) {
  const nodes = [
    {
      id: 'stage-1',
      num: '01',
      title: 'User Criteria',
      sub: `${stats.prefCount || 5} Constraints`,
      category: 'input',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      badge: 'Input Percepts',
    },
    {
      id: 'stage-1-facts',
      num: '02',
      title: 'Fact Representation',
      sub: `${stats.factCount || 6} FOL Facts`,
      category: 'facts',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7"></polyline>
          <line x1="9" y1="20" x2="15" y2="20"></line>
          <line x1="12" y1="4" x2="12" y2="20"></line>
        </svg>
      ),
      badge: 'Logic Assertion',
    },
    {
      id: 'stage-2',
      num: '03',
      title: 'Knowledge Base',
      sub: '10,538 Titles In KB',
      category: 'kb',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      ),
      badge: 'Catalog Filtering',
    },
    {
      id: 'stage-3',
      num: '04',
      title: 'Rule Inference',
      sub: `${stats.firedCount || 0} Fired Rules`,
      category: 'engine',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      ),
      badge: stats.method === 'backward' ? 'Backward Chaining' : 'Forward Chaining',
    },
    {
      id: 'stage-4',
      num: '05',
      title: 'Objective Scoring',
      sub: `${stats.candidateCount || 0} Scored Pool`,
      category: 'scoring',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
      badge: 'Weighted Evaluation',
    },
    {
      id: 'stage-5',
      num: '06',
      title: 'Hill Climbing',
      sub: `${stats.restartsCount || 8} Restarts`,
      category: 'search',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3l4 8 5-5 5 15H2L8 3z"></path>
        </svg>
      ),
      badge: 'Local Search',
    },
    {
      id: 'stage-6',
      num: '07',
      title: 'Final Solutions',
      sub: `Top ${stats.recCount || 5} Books`,
      category: 'output',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      badge: 'Optimal Action',
    },
  ];

  return (
    <section className="reasoning-flowchart-card">
      <div className="flowchart-header">
        <div className="flowchart-header-text">
          <div className="flowchart-badge-row">
            <span className="live-status-dot"></span>
            <span className="flowchart-type-tag">Inference Pipeline Architecture</span>
            <span className="flowchart-active-tag">Active State</span>
          </div>
          <h3 className="flowchart-main-title">AI Recommendation Process Flowchart</h3>
          <p className="flowchart-subtitle">
            Visual flowchart tracing end-to-end data flow: user percepts, logic assertions, rule engine chaining, heuristic objective evaluation, and hill climbing local search optimization.
          </p>
        </div>
      </div>

      <div className="flowchart-viewport">
        <div className="flowchart-nodes-track">
          {nodes.map((node, idx) => {
            const isTarget = activeStage === node.id;
            return (
              <div key={node.id} className="flowchart-node-wrapper">
                <button
                  type="button"
                  className={`flowchart-node-card node-cat-${node.category} ${isTarget ? 'is-selected' : ''}`}
                  onClick={() => onSelectStage(node.id)}
                  title={`Click to navigate to ${node.title}`}
                >
                  <div className="node-card-top">
                    <span className="node-num-pill">{node.num}</span>
                    <span className="node-badge-tag">{node.badge}</span>
                  </div>
                  <div className="node-icon-box">{node.icon}</div>
                  <strong className="node-title">{node.title}</strong>
                  <span className="node-sub">{node.sub}</span>
                </button>

                {idx < nodes.length - 1 && (
                  <div className="flowchart-connector-arrow" aria-hidden="true">
                    <div className="connector-h-line"></div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="arrow-head-svg">
                      <path d="M2 1L8 6L2 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Tab 2: Rule-Based Inference Engine Flowchart
 */
function RuleEngineFlowchart({ method = 'forward', firedCount = 0 }) {
  return (
    <section className="reasoning-flowchart-card rule-flowchart-theme">
      <div className="flowchart-header">
        <div className="flowchart-header-text">
          <div className="flowchart-badge-row">
            <span className="live-status-dot green"></span>
            <span className="flowchart-type-tag">Expert System Architecture</span>
            <span className="flowchart-active-tag">
              {method === 'backward' ? 'Backward Chaining (Goal-Driven)' : 'Forward Chaining (Data-Driven)'}
            </span>
          </div>
          <h3 className="flowchart-main-title">Rule-Based Inference Engine Flowchart</h3>
          <p className="flowchart-subtitle">
            How LibraAI evaluates First-Order Logic facts against the 17 production rules (R1–R17) in working memory to derive preference matches.
          </p>
        </div>
      </div>

      <div className="rule-engine-flow-diagram">
        {/* Top Tier: Input Percepts */}
        <div className="ref-flow-row">
          <div className="ref-node-box input-source">
            <span className="ref-node-tag">PERCEPTS</span>
            <strong>User Criteria</strong>
            <small>Genre, Mood, Rating, Level</small>
          </div>
          <div className="ref-flow-arrow-down">
            <span>asserts</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <path d="M8 2V20M8 20L3 15M8 20L13 15" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="ref-node-box input-source">
            <span className="ref-node-tag">CATALOG</span>
            <strong>Book Attributes</strong>
            <small>10,538 Knowledge Base Rows</small>
          </div>
        </div>

        {/* Core Working Memory & LHS/RHS Cycle */}
        <div className="ref-core-cycle">
          <div className="ref-memory-box">
            <div className="ref-memory-header">
              <span className="memory-indicator">●</span>
              <strong>WORKING MEMORY</strong>
              <span className="memory-badge">Active Fact Base</span>
            </div>
            <p className="memory-desc">Holds initial user facts and all incrementally deduced predicates.</p>
          </div>

          <div className="ref-cycle-connectors">
            <div className="ref-h-arrow">
              <span className="arrow-text">Fact Premises (LHS)</span>
              <div className="h-line-glow"></div>
            </div>
            <div className="ref-engine-box">
              <span className="ref-node-tag engine">PATTERN MATCHER</span>
              <strong>Rule Base (R1–R17)</strong>
              <small>Evaluates IF conditions across candidate pool</small>
            </div>
            <div className="ref-h-arrow return">
              <span className="arrow-text">Asserts New Fact (RHS)</span>
              <div className="h-line-glow"></div>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Deductions & Candidate Filtering */}
        <div className="ref-flow-row bottom-row">
          <div className="ref-node-box deduction-box">
            <span className="ref-node-tag success">DERIVED FACTS</span>
            <strong>Fired Deductions ({firedCount})</strong>
            <small>GenreMatch, MoodMatch, RatingMatch, LevelFit</small>
          </div>
          <div className="ref-flow-arrow-horizontal">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
              <path d="M2 8H20M20 8L15 3M20 8L15 13" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="ref-node-box candidates-out">
            <span className="ref-node-tag gold">CANDIDATE POOL</span>
            <strong>Validated Books</strong>
            <small>Qualified for Objective Scoring</small>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Tab 3: Hill Climbing Optimization Flowchart
 */
function HillClimbingFlowchart({ restartsCount = 8, bestScore = 0 }) {
  return (
    <section className="reasoning-flowchart-card hc-flowchart-theme">
      <div className="flowchart-header">
        <div className="flowchart-header-text">
          <div className="flowchart-badge-row">
            <span className="live-status-dot amber"></span>
            <span className="flowchart-type-tag">Optimization Heuristic</span>
            <span className="flowchart-active-tag">Random-Restart Local Search</span>
          </div>
          <h3 className="flowchart-main-title">Hill Climbing Algorithm Flowchart</h3>
          <p className="flowchart-subtitle">
            Iterative state-space local search over semantic neighborhoods: exploring candidate peaks and escaping local plateaus via {restartsCount} random restarts.
          </p>
        </div>
      </div>

      <div className="hc-flowchart-diagram">
        <div className="hc-flow-column">
          {/* Node 1: Start Seed */}
          <div className="hc-step-node start">
            <span className="step-tag">START SEED</span>
            <strong>Select Candidate Seed S₀</strong>
            <small>Random restart initialization from candidate pool</small>
          </div>

          <div className="hc-arrow-down">
            <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
              <path d="M7 2V20M7 20L2 15M7 20L12 15" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Node 2: Neighborhood Generation */}
          <div className="hc-step-node process">
            <span className="step-tag">EXPANSION</span>
            <strong>Generate Semantic Neighbors N(S)</strong>
            <small>Shared genre, mood, keywords, subgenre, or author</small>
          </div>

          <div className="hc-arrow-down">
            <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
              <path d="M7 2V20M7 20L2 15M7 20L12 15" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Node 3: Heuristic Evaluation */}
          <div className="hc-step-node process">
            <span className="step-tag">EVALUATION</span>
            <strong>Evaluate Heuristic Scores f(n)</strong>
            <small>Compute objective recommendation score for all neighbors</small>
          </div>

          <div className="hc-arrow-down">
            <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
              <path d="M7 2V20M7 20L2 15M7 20L12 15" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Node 4: Decision Diamond */}
          <div className="hc-decision-wrapper">
            <div className="hc-diamond-box">
              <span className="diamond-tag">DECISION</span>
              <strong className="diamond-text">max f(n) &gt; f(S)?</strong>
              <small>Is any neighbor strictly better?</small>
            </div>

            <div className="hc-branch-yes">
              <span className="branch-label yes">YES</span>
              <div className="branch-action-pill">
                <strong>Transition Step</strong>
                <span>Set S ← argmax f(n)</span>
              </div>
              <div className="loop-back-indicator">
                <span>⮌ Loops back to evaluate new neighbors</span>
              </div>
            </div>
          </div>

          <div className="hc-arrow-down">
            <span className="branch-label no">NO (Peak)</span>
            <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
              <path d="M7 2V20M7 20L2 15M7 20L12 15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Node 5: Local Optimum */}
          <div className="hc-step-node optimum">
            <span className="step-tag peak">LOCAL PEAK</span>
            <strong>Local Optimum Reached</strong>
            <small>Zero upward gradient in immediate neighborhood</small>
          </div>

          <div className="hc-arrow-down">
            <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
              <path d="M7 2V20M7 20L2 15M7 20L12 15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Node 6: Global Extraction */}
          <div className="hc-step-node termination">
            <span className="step-tag gold">GLOBAL BEST</span>
            <strong>Extract Global Optimum S*</strong>
            <small>Best local optimum across all {restartsCount} restarts (Score: {bestScore}/20)</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Reasoning() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reasoning');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRestartIdx, setActiveRestartIdx] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [rulesCatalog, setRulesCatalog] = useState([]);
  const [ruleSearch, setRuleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load rules catalog
  useEffect(() => {
    api
      .rules()
      .then((data) => {
        if (data && data.rules) setRulesCatalog(data.rules);
      })
      .catch((e) => console.error('Failed to load rules catalog:', e));
  }, []);

  // Load or run default recommendation session
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
    { id: 'reasoning', label: 'AI Reasoning Pipeline' },
    { id: 'rule-based', label: 'Rule-Based Engine (17 Rules)' },
    { id: 'hill-climbing', label: 'Hill Climbing Search (8 Restarts)' },
  ];

  const handleSelectStage = (stageId) => {
    setActiveStage(stageId);
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered rules in Tab 2
  const filteredRules = useMemo(() => {
    return rulesCatalog.filter((r) => {
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchQuery =
        !ruleSearch ||
        r.name?.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.id?.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.if?.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.then?.toLowerCase().includes(ruleSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [rulesCatalog, selectedCategory, ruleSearch]);

  const categories = useMemo(() => {
    const cats = new Set(rulesCatalog.map((r) => r.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [rulesCatalog]);

  if (loading) {
    return (
      <div className="reasoning-page">
        <PageHeader
          title="AI Reasoning"
          description="Inspecting inference engine, Rule-Based logic, and Hill Climbing optimization..."
        />
        <LoadingState message="Running symbolic inference and evaluating Hill Climbing search..." />
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
  const candidateBooks = result.candidateBooks || [];
  const firedRules = result.firedRules || [];
  const facts = result.facts || [];

  return (
    <div className="reasoning-page">
      <PageHeader
        title="AI Reasoning"
        accentText="Engine & Search Architecture"
        description="Inspect the authentic backend AI pipeline: Fact Representation, Knowledge Base rules, Forward/Backward Chaining deduction, and Random-Restart Hill Climbing optimization."
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

      {/* ===================================================================
          TAB 1: AI REASONING PIPELINE (END-TO-END FLOW)
          =================================================================== */}
      {activeTab === 'reasoning' && (
        <div className="reasoning-tab-view">
          {/* 1. Interactive Architecture Flowchart */}
          <ArchitectureFlowchart
            stats={{
              prefCount: Object.values(prefs).filter(Boolean).length,
              factCount: facts.length,
              candidateCount: candidateBooks.length,
              firedCount: firedRules.length,
              restartsCount: result.restarts?.length || 8,
              recCount: recommendations.length,
              method: result.reasoningMethod,
            }}
            activeStage={activeStage}
            onSelectStage={handleSelectStage}
          />

          {/* Stage Connector: Flowchart to Stage 1 */}
          <StageConnector
            stepFrom="Input Pipeline"
            stepTo="Stage 01"
            label="Intake User Percepts & Translate into First-Order Logic Predicates"
            icon="↓"
          />

          {/* ================= STAGE 01 FRAME ================= */}
          <section id="stage-1" className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-blue">STAGE 01</span>
                  <span className="stage-category-label">PERCEPTS &amp; KNOWLEDGE REPRESENTATION</span>
                </div>
                <h2 className="stage-main-title">User Criteria &amp; Fact Representation (FOL)</h2>
                <p className="stage-description">
                  The AI intake layer normalizes user constraints and asserts them as First-Order Logic facts in working memory.
                </p>
              </div>
            </div>

            <div className="stage-frame-body-grid two-col">
              {/* Left Column: User Criteria Card */}
              <div className="stage-sub-card">
                <div className="sub-card-header">
                  <span className="sub-card-icon">🎛️</span>
                  <div>
                    <h3 className="sub-card-title">Normalized User Percepts</h3>
                    <p className="sub-card-desc">Received from interactive input controls</p>
                  </div>
                </div>

                <div className="pref-mini-grid">
                  <div className="pref-item">
                    <span className="pref-label">Genre:</span>
                    <strong className="pref-val">{prefs.genre || 'Any'}</strong>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Mood:</span>
                    <strong className="pref-val">{prefs.mood || 'Any'}</strong>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Interest:</span>
                    <strong className="pref-val">{prefs.interest || 'Any'}</strong>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Reading Level:</span>
                    <strong className="pref-val">{prefs.readingLevel || 'Any'}</strong>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Min Rating:</span>
                    <strong className="pref-val">{prefs.minimumRating ? `${prefs.minimumRating}+ ★` : 'Any'}</strong>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Availability:</span>
                    <strong className="pref-val">{prefs.showAvailableOnly ? 'Available Only' : 'All Catalog'}</strong>
                  </div>
                </div>

                <div className="sub-card-footer-note">
                  <span>Inference Strategy:</span>
                  <strong>{result.reasoningMethod === 'backward' ? 'Backward Chaining (Goal-Driven)' : 'Forward Chaining (Data-Driven)'}</strong>
                </div>
              </div>

              {/* Right Column: First-Order Logic Facts Card */}
              <div className="stage-sub-card">
                <div className="sub-card-header">
                  <span className="sub-card-icon">📝</span>
                  <div>
                    <h3 className="sub-card-title">Asserted System Facts in Working Memory</h3>
                    <p className="sub-card-desc">Symbolic predicates ready for rule evaluation ({facts.length} facts)</p>
                  </div>
                </div>

                <div className="fact-terminal-box">
                  <div className="terminal-titlebar">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                    <span className="terminal-title">libraai-inference-memory</span>
                  </div>
                  <ul className="fact-code-list">
                    {facts.length > 0 ? (
                      facts.map((f, i) => (
                        <li key={f} className="fact-line-item">
                          <span className="fact-line-num">{(i + 1).toString().padStart(2, '0')}</span>
                          <span className="fact-syntax">{f}</span>
                        </li>
                      ))
                    ) : (
                      <li className="fact-line-item empty">No custom facts asserted (broad exploration mode)</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Stage Connector: 1 to 2 */}
          <StageConnector
            stepFrom="Stage 01"
            stepTo="Stage 02"
            label={`Asserted ${facts.length} Facts into Knowledge Base Engine to Query Catalog`}
            icon="↓"
          />

          {/* ================= STAGE 02 FRAME ================= */}
          <section id="stage-2" className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-indigo">STAGE 02</span>
                  <span className="stage-category-label">KNOWLEDGE BASE &amp; CANDIDATE RETRIEVAL</span>
                </div>
                <h2 className="stage-main-title">Knowledge Base Query &amp; Candidate Space</h2>
                <p className="stage-description">
                  The system queries its digital library of 10,538 titles and applies multi-attribute prefiltering to isolate a focused candidate pool.
                </p>
              </div>
            </div>

            <div className="stage-frame-body-grid">
              <div className="kpi-metrics-banner">
                <div className="kpi-callout">
                  <span className="callout-num">10,538</span>
                  <span className="callout-label">Total Books in KB</span>
                  <span className="callout-hint">Indexed catalog items</span>
                </div>
                <div className="kpi-callout highlight">
                  <span className="callout-num">{candidateBooks.length}</span>
                  <span className="callout-label">Qualified Candidate Pool</span>
                  <span className="callout-hint">Passed attribute prefilters</span>
                </div>
                <div className="kpi-callout">
                  <span className="callout-num">17</span>
                  <span className="callout-label">Production Rules Checked</span>
                  <span className="callout-hint">IF–THEN expert rules</span>
                </div>
                <div className="kpi-callout success">
                  <span className="callout-num">{firedRules.length}</span>
                  <span className="callout-label">Total Rules Fired</span>
                  <span className="callout-hint">Across candidate set</span>
                </div>
              </div>

              {/* Candidate Pool Samples */}
              <div className="stage-sub-card full-width">
                <div className="sub-card-header">
                  <span className="sub-card-icon">📚</span>
                  <div>
                    <h3 className="sub-card-title">Initial Candidate Pool Snapshot</h3>
                    <p className="sub-card-desc">Sample books qualifying for symbolic rule evaluation</p>
                  </div>
                </div>

                <div className="candidate-chips-flex">
                  {candidateBooks.slice(0, 10).map((b, idx) => (
                    <span key={b.id || idx} className="candidate-sample-chip">
                      <span className="chip-book-title">{b.title}</span>
                      <span className="chip-meta">{b.genre} · {b.mood || 'Standard'}</span>
                    </span>
                  ))}
                  {candidateBooks.length > 10 && (
                    <span className="candidate-more-tag">+{candidateBooks.length - 10} more candidates in memory</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Stage Connector: 2 to 3 */}
          <StageConnector
            stepFrom="Stage 02"
            stepTo="Stage 03"
            label="Candidate Pool Passed to Symbolic Rule Engine for Deduction"
            icon="↓"
          />

          {/* ================= STAGE 03 FRAME ================= */}
          <section id="stage-3" className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-purple">STAGE 03</span>
                  <span className="stage-category-label">SYMBOLIC INFERENCE ENGINE</span>
                </div>
                <h2 className="stage-main-title">Rule-Based Reasoning &amp; Fired Rules Trace</h2>
                <p className="stage-description">
                  Candidates are evaluated against production rules R1–R17. Derived predicates like GenreMatch, MoodMatch, and RatingMatch are asserted forward.
                </p>
              </div>
            </div>

            <div className="stage-frame-body-grid two-col">
              {/* Left Column: Fired Rules Summary */}
              <div className="stage-sub-card">
                <div className="sub-card-header">
                  <span className="sub-card-icon">⚡</span>
                  <div>
                    <h3 className="sub-card-title">Fired Rule Instances ({firedRules.length})</h3>
                    <p className="sub-card-desc">Active expert rules triggered across candidate books</p>
                  </div>
                </div>

                <div className="rules-fired-scrollbox">
                  {firedRules.slice(0, 12).map((r, i) => (
                    <div key={`${r.id}-${r.bookId}-${i}`} className="rule-fired-row">
                      <div className="rule-fired-badge">
                        <span className="rf-id">{r.id}</span>
                        <span className="rf-name">{r.name}</span>
                      </div>
                      <div className="rule-fired-result">
                        <span className="rf-arrow">derives →</span>
                        <code className="rf-fact">{r.fact}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Reasoning Deduction Steps */}
              <div className="stage-sub-card">
                <div className="sub-card-header">
                  <span className="sub-card-icon">🧭</span>
                  <div>
                    <h3 className="sub-card-title">Reasoning Deduction Steps</h3>
                    <p className="sub-card-desc">Step-by-step trace of inference progression</p>
                  </div>
                </div>

                <ol className="reasoning-steps-timeline">
                  {(result.reasoningSteps || [])
                    .filter((s) => !String(s).startsWith('  ←') && !String(s).startsWith('Goal:'))
                    .slice(0, 7)
                    .map((step, idx) => (
                      <li key={idx} className="step-timeline-item">
                        <span className="step-timeline-num">{idx + 1}</span>
                        <p className="step-timeline-text">{step}</p>
                      </li>
                    ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Stage Connector: 3 to 4 */}
          <StageConnector
            stepFrom="Stage 03"
            stepTo="Stage 04"
            label="Inferred Facts & Matches Fed into Multi-Criteria Objective Scoring"
            icon="↓"
          />

          {/* ================= STAGE 04 FRAME ================= */}
          <section id="stage-4" className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-amber">STAGE 04</span>
                  <span className="stage-category-label">HEURISTIC EVALUATION</span>
                </div>
                <h2 className="stage-main-title">Multi-Attribute Recommendation Scoring</h2>
                <p className="stage-description">
                  Every candidate is evaluated through an objective score function that combines preference matches, rating thresholds, and semantic fit.
                </p>
              </div>
            </div>

            <div className="stage-frame-body-grid">
              {/* Formula & Weights Card */}
              <div className="stage-sub-card full-width">
                <div className="sub-card-header">
                  <span className="sub-card-icon">⚖️</span>
                  <div>
                    <h3 className="sub-card-title">Objective Scoring Function &amp; Weights</h3>
                    <p className="sub-card-desc">f(b) = w_genre·M_g + w_mood·M_m + w_interest·M_i + w_level·M_l + w_rating·M_r + w_avail·M_a</p>
                  </div>
                </div>

                <div className="score-weights-row">
                  {Object.entries(result.scoreWeights || {}).map(([key, val]) => (
                    <div key={key} className="weight-badge-card">
                      <span className="weight-key">{key}</span>
                      <strong className="weight-val">+{val} pts</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scored Candidates Leaderboard */}
              <div className="stage-sub-card full-width">
                <div className="sub-card-header">
                  <span className="sub-card-icon">📊</span>
                  <div>
                    <h3 className="sub-card-title">Top Scored Candidates Preview</h3>
                    <p className="sub-card-desc">Pre-search ranking across qualified candidates</p>
                  </div>
                </div>

                <div className="scored-candidates-table">
                  {(result.scores || []).slice(0, 6).map((item, idx) => (
                    <div key={item.id} className="scored-row-item">
                      <span className="scored-rank">#{idx + 1}</span>
                      <div className="scored-info">
                        <strong className="scored-title">{item.title}</strong>
                        <div className="score-meter-wrap">
                          <div
                            className="score-meter-fill"
                            style={{ width: `${Math.min(100, (item.recommendationScore / 20) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="scored-points-tag">{item.recommendationScore} / 20 pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Stage Connector: 4 to 5 */}
          <StageConnector
            stepFrom="Stage 04"
            stepTo="Stage 05"
            label="Scored Candidates Seeded into Random-Restart Hill Climbing Local Search"
            icon="↓"
          />

          {/* ================= STAGE 05 FRAME ================= */}
          <section id="stage-5" className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-emerald">STAGE 05</span>
                  <span className="stage-category-label">LOCAL SEARCH OPTIMIZATION</span>
                </div>
                <h2 className="stage-main-title">Hill Climbing Search with Random Restarts</h2>
                <p className="stage-description">
                  Local search algorithm that navigates semantic candidate neighborhoods (shared genre, mood, keywords, author) to discover local score optima.
                </p>
              </div>
            </div>

            <div className="stage-frame-body-grid">
              <div className="hc-concept-summary-card">
                <div className="hc-concept-col">
                  <span className="concept-badge">ALGORITHM DEFINITION</span>
                  <h4 className="concept-title">Local Optimum vs. Global Optimum</h4>
                  <p className="concept-body">
                    A candidate is a <strong>local optimum</strong> when no neighbor in its immediate semantic space yields a strictly higher score. Random restarts launch search from multiple distinct candidate seeds to escape sub-optimal local plateaus and locate the <strong>global optimum</strong>.
                  </p>
                </div>
                <div className="hc-optimum-stat-box">
                  <span className="stat-label">Best Discovered Optimum</span>
                  <strong className="stat-score">{hc.bestScore || 18} / 20 pts</strong>
                  <span className="stat-title-book">{hc.bestResult || 'Top Candidate'}</span>
                </div>
              </div>

              {/* Restarts Strip */}
              <div className="stage-sub-card full-width">
                <div className="sub-card-header">
                  <span className="sub-card-icon">⛰️</span>
                  <div>
                    <h3 className="sub-card-title">Executed Restarts Overview ({result.restarts?.length || 8} Runs)</h3>
                    <p className="sub-card-desc">Each restart explores a unique starting seed candidate</p>
                  </div>
                </div>

                <div className="hc-restart-cards-grid">
                  {(result.restarts || []).map((r) => {
                    const isBest = r.score === hc.bestScore;
                    return (
                      <div key={r.restart} className={`hc-restart-card ${isBest ? 'is-best' : ''}`}>
                        <div className="restart-card-top">
                          <span className="restart-id">Run #{r.restart}</span>
                          {isBest && <span className="best-pill">★ Best Score</span>}
                        </div>
                        <div className="restart-path-row">
                          <div className="path-node">
                            <span className="path-label">Seed:</span>
                            <span className="path-title" title={r.startTitle}>{r.startTitle}</span>
                            <span className="path-score">({r.startScore})</span>
                          </div>
                          <span className="path-arrow">→</span>
                          <div className="path-node">
                            <span className="path-label">Peak:</span>
                            <span className="path-title" title={r.localOptimumTitle}>{r.localOptimumTitle}</span>
                            <span className="path-score highlight">({r.score})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Stage Connector: 5 to 6 */}
          <StageConnector
            stepFrom="Stage 05"
            stepTo="Stage 06"
            label="Global Best Search Paths Selected as Final User Action Recommendations"
            icon="↓"
          />

          {/* ================= STAGE 06 FRAME ================= */}
          <section id="stage-6" className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-gold">STAGE 06</span>
                  <span className="stage-category-label">SOLUTION ACTION</span>
                </div>
                <h2 className="stage-main-title">Final Top 5 Ranked Recommendations</h2>
                <p className="stage-description">
                  The highest scoring, explainable solutions discovered through the rule-based inference and hill climbing search pipeline.
                </p>
              </div>
            </div>

            <div className="stage-frame-body-grid">
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
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================
          TAB 2: RULE-BASED ENGINE DEEP DIVE
          =================================================================== */}
      {activeTab === 'rule-based' && (
        <div className="reasoning-tab-view">
          {/* Rule Engine Flowchart */}
          <RuleEngineFlowchart
            method={result.reasoningMethod}
            firedCount={firedRules.length}
          />

          <StageConnector
            stepFrom="Engine Architecture"
            stepTo="Rule Base Catalog"
            label="Inspect All 17 Production Rules with LHS/RHS Logic and Current Session Matches"
            icon="↓"
          />

          {/* Production Rules Explorer */}
          <section className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-purple">EXPERT SYSTEM</span>
                  <span className="stage-category-label">PRODUCTION RULE BASE</span>
                </div>
                <h2 className="stage-main-title">Expert Production Rules Catalog (17 Rules)</h2>
                <p className="stage-description">
                  Declarative IF–THEN rules formalizing library domain knowledge: Genre affinities, mood congruence, reading levels, rating thresholds, and book themes.
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="rule-search-filter-bar">
              <div className="rule-search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search rules by name, ID, or IF/THEN condition..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="rule-search-input"
                />
              </div>

              <div className="rule-category-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`rule-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules Grid */}
            <div className="expert-rules-grid">
              {filteredRules.map((rule) => {
                const wasFired = firedRules.some((f) => f.id === rule.id);
                return (
                  <div key={rule.id} className={`expert-rule-card ${wasFired ? 'was-fired' : ''}`}>
                    <div className="rule-card-header">
                      <div className="rule-id-cluster">
                        <span className="rule-id-tag">{rule.id}</span>
                        <strong className="rule-title-text">{rule.name}</strong>
                      </div>
                      <div className="rule-badges-cluster">
                        <span className="rule-category-pill">{rule.category}</span>
                        {wasFired && <span className="fired-badge">⚡ FIRED</span>}
                      </div>
                    </div>

                    <div className="rule-logic-clauses">
                      <div className="logic-clause if-clause">
                        <span className="clause-tag">IF</span>
                        <code className="clause-code">{rule.if}</code>
                      </div>
                      <div className="logic-clause then-clause">
                        <span className="clause-tag">THEN</span>
                        <code className="clause-code">{rule.then}</code>
                      </div>
                    </div>

                    {rule.description && (
                      <p className="rule-desc-footer">{rule.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <StageConnector
            stepFrom="Rule Base"
            stepTo="Working Memory"
            label="Matched and Derived Facts Asserted into System Working Memory"
            icon="↓"
          />

          {/* Derived Facts Terminal */}
          <section className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-blue">WORKING MEMORY</span>
                  <span className="stage-category-label">DERIVED PREDICATES</span>
                </div>
                <h2 className="stage-main-title">Matched &amp; Derived Facts Trace</h2>
                <p className="stage-description">
                  Real-time assertions derived by the inference engine during the recommendation session.
                </p>
              </div>
            </div>

            <div className="fact-terminal-box expanded">
              <div className="terminal-titlebar">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="terminal-title">libraai-working-memory-facts ({result.derivedFacts?.length || 0} assertions)</span>
              </div>
              <ul className="fact-code-list">
                {(result.derivedFacts || []).slice(0, 40).map((f, i) => (
                  <li key={i} className="fact-line-item">
                    <span className="fact-line-num">{(i + 1).toString().padStart(2, '0')}</span>
                    <span className="fact-syntax">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================
          TAB 3: HILL CLIMBING OPTIMIZATION DEEP DIVE
          =================================================================== */}
      {activeTab === 'hill-climbing' && (
        <div className="reasoning-tab-view">
          {/* Hill Climbing Flowchart */}
          <HillClimbingFlowchart
            restartsCount={result.restarts?.length || 8}
            bestScore={hc.bestScore || 18}
          />

          <StageConnector
            stepFrom="Algorithm Architecture"
            stepTo="Restart Runs"
            label={`Analyze ${result.restarts?.length || 8} Independent Search Paths & Local Optima`}
            icon="↓"
          />

          {/* Random Restarts Explorer */}
          <section className="reasoning-stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-title-group">
                <div className="stage-meta-row">
                  <span className="stage-badge-pill stage-pill-amber">LOCAL SEARCH TRACE</span>
                  <span className="stage-category-label">RANDOM RESTARTS EXPLORER</span>
                </div>
                <h2 className="stage-main-title">Interactive Random Restarts ({result.restarts?.length || 8} Runs)</h2>
                <p className="stage-description">
                  Click on any restart below to inspect its detailed state-space trajectory and evaluated semantic neighbors.
                </p>
              </div>
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
                        <span className="flow-label">Start Seed:</span>
                        <span className="flow-book" title={r.startTitle}>{r.startTitle}</span>
                        <span className="flow-score">({r.startScore})</span>
                      </div>
                      <span className="flow-arrow">→</span>
                      <div className="flow-step">
                        <span className="flow-label">Local Optimum:</span>
                        <span className="flow-book" title={r.localOptimumTitle}>{r.localOptimumTitle}</span>
                        <span className="flow-score highlight">({r.score})</span>
                      </div>
                    </div>
                    <div className="restart-status-bar">
                      <span>{r.pathSummary || `Final Peak Score: ${r.score}`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <StageConnector
            stepFrom="Restart Runs"
            stepTo="State-Space Trace"
            label={`Execution Timeline for Restart #${activeRestartIdx + 1}`}
            icon="↓"
          />

          {/* Detailed Selected Run Trace */}
          {selectedRun && (
            <section className="reasoning-stage-frame">
              <div className="stage-frame-header">
                <div className="stage-frame-title-group">
                  <div className="stage-meta-row">
                    <span className="stage-badge-pill stage-pill-emerald">DETAILED EXECUTION</span>
                    <span className="stage-category-label">TRAJECTORY TIMELINE</span>
                  </div>
                  <h2 className="stage-main-title">
                    Search Path Trace — Restart #{activeRestartIdx + 1}
                  </h2>
                  <p className="stage-description">
                    {selectedRun.steps?.length || 0} iteration steps executed. Terminated at local optimum with score {selectedRun.score}.
                  </p>
                </div>
              </div>

              {/* Starting Candidate Box */}
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
                              <span className="score-tag optimum-score">Peak Score: {step.score}</span>
                            </div>
                          ) : (
                            <div className="start-title">
                              <span>Initial Candidate: <strong>{step.current_book || step.candidate?.title}</strong></span>
                              <span className="score-tag">Score: {step.score}</span>
                            </div>
                          )}
                        </div>

                        <p className="step-desc-text">
                          {step.reason || step.description || (isOptimum ? 'No neighboring candidate with higher score found. Search terminated at local optimum peak.' : 'Evaluating neighboring candidate space...')}
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
            </section>
          )}
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}
