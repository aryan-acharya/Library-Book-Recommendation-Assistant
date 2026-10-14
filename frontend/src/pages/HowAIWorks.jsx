import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './HowAIWorks.css';

const WORKFLOW_STEPS = [
  {
    id: 'step-1',
    num: '01',
    title: 'User Preferences',
    sub: 'Input Percepts',
    icon: '🎛️',
    desc: 'The user defines target constraints: Genre, Mood, Reading Level, Age Group, Preferred Length, Keywords, and Minimum Rating.',
    formal: 'Percepts = { Genre, Mood, Level, Age, Rating, Themes, Keywords }',
    example: 'Input: Genre="Horror", Mood="Suspenseful", Level="Intermediate", MinRating=4.0',
  },
  {
    id: 'step-2',
    num: '02',
    title: 'Fact Extraction',
    sub: 'FOL Conversion',
    icon: '🔬',
    desc: 'User constraints are converted into First-Order Logic ground facts asserted into the engine working memory.',
    formal: 'UserGenre(Horror) ∧ UserMood(Suspenseful) ∧ UserLevel(Intermediate)',
    example: 'Asserted: UserGenre("Horror"), UserMood("Suspenseful"), UserMinRating(4.0)',
  },
  {
    id: 'step-3',
    num: '03',
    title: 'Knowledge Base Match',
    sub: 'Catalog Indexing',
    icon: '📚',
    desc: 'The engine queries the 10,538-book enriched Knowledge Base to select books matching primary predicate criteria.',
    formal: '∀x Book(x) ∧ [Genre(x, "Horror") ∨ Mood(x, "Suspenseful")]',
    example: '10,538 books indexed → 500 initial candidates identified for deep rule verification.',
  },
  {
    id: 'step-4',
    num: '04',
    title: 'Rule Evaluation (R1–R17)',
    sub: 'IF–THEN Domain Rules',
    icon: '⚖️',
    desc: '17 domain inference rules check candidate books against user criteria, quality metrics, popularity, and compound affinities.',
    formal: 'R1: user.genre = book.genre → GenreMatch(book)\nR14: GenreMatch ∧ MoodMatch ∧ RatingMatch → SuitableForSuspense(book)',
    example: 'Rules checked: R1, R2, R3, R5, R8, R13, R14, R16...',
  },
  {
    id: 'step-5',
    num: '05',
    title: 'Chaining Engine',
    sub: 'Forward / Backward',
    icon: '⛓️',
    desc: 'Forward Chaining (data-driven) derives new assertions from user facts; Backward Chaining (goal-driven) proves Recommend(Book) recursively.',
    formal: 'Forward: Facts → Rules → Derived Facts\nBackward: Goal(Recommend(b)) → Subgoals → Ground Facts',
    example: 'Forward Chaining derives: GenreMatch(B00428), MoodMatch(B00428), HighQuality(B00428)',
  },
  {
    id: 'step-6',
    num: '06',
    title: 'Candidate Selection',
    sub: 'Pruning & Filtering',
    icon: '🔍',
    desc: 'Books that successfully satisfy required domain inference rules and availability thresholds qualify for the candidate evaluation pool.',
    formal: 'CandidatePool = { b ∈ Books | RuleSatisfaction(b) ≥ Threshold }',
    example: 'Filtered pool: 48 highly matching candidate books selected for objective scoring.',
  },
  {
    id: 'step-7',
    num: '07',
    title: 'Objective Scoring',
    sub: 'Max 20.0 Pts Formula',
    icon: '📊',
    desc: 'Every candidate is dynamically evaluated across 11 preference dimensions with fixed transparent weights (never pre-baked).',
    formal: 'Score = 4·Genre + 4·Interest + 2·Mood + 2·Level + 2·Theme + 1·Age + 1·KW + 1·Rate + 1·Pub + 1·Pop + 1·Avail',
    example: 'Book B00428 evaluated: Genre(4) + Mood(2) + Level(2) + Rating(1) + Pop(1) = 15.0 / 20.0',
  },
  {
    id: 'step-8',
    num: '08',
    title: 'Hill Climbing Search',
    sub: 'Strict Uphill Transitions',
    icon: '⛰️',
    desc: 'Beginning at an initial candidate, the agent inspects semantic neighbors (author, subgenre, themes) and steps strictly to neighbors with higher scores.',
    formal: 'State Transition: s_{t+1} = argmax_{n ∈ Neighbors(s_t)} Score(n) if Score(n) > Score(s_t)',
    example: 'Transition: B00428 (15.0 pts) → B00124 (17.5 pts) via shared Author & Subgenre affinity.',
  },
  {
    id: 'step-9',
    num: '09',
    title: 'Random Restarts',
    sub: 'Escape Local Optima',
    icon: '🔄',
    desc: 'To prevent entrapment on sub-optimal local peaks, 8 independent climbs are launched from diverse catalog clusters.',
    formal: 'Restarts = { Climb(s_0^{(i)}) | i = 1..8, s_0^{(i)} distributed across catalog }',
    example: '8 restarts launched → Explored distinct clusters → Deduplicated unique peak recommendations.',
  },
  {
    id: 'step-10',
    num: '10',
    title: 'Top 5 Recommendations',
    sub: 'Explainable Proof Output',
    icon: '🏆',
    desc: 'The best unique local optima are ranked by final score and returned with complete fired rule explanations and climb traces.',
    formal: 'Top5 = argmax5_{b ∈ Optima} Score(b) ∪ Explanation(b)',
    example: 'Top recommendation: "The Huntress" (Score: 18.0/20) with verified proof chain.',
  },
];

const DEFAULT_DIMENSIONS = [
  { id: 'genre', name: 'Genre Match', pts: 4, matched: true },
  { id: 'interest', name: 'Interest / Topic Match', pts: 4, matched: true },
  { id: 'mood', name: 'Mood Alignment', pts: 2, matched: true },
  { id: 'level', name: 'Reading Level Match', pts: 2, matched: true },
  { id: 'theme', name: 'Core Theme Match', pts: 2, matched: false },
  { id: 'age', name: 'Age Group Target', pts: 1, matched: true },
  { id: 'keyword', name: 'Keyword Semantic Match', pts: 1, matched: false },
  { id: 'rating', name: 'Rating Threshold Met', pts: 1, matched: true },
  { id: 'publication', name: 'Publication Era Match', pts: 1, matched: true },
  { id: 'popularity', name: 'Popularity & Shelvings', pts: 1, matched: false },
  { id: 'availability', name: 'Library Availability', pts: 1, matched: true },
];

export default function HowAIWorks() {
  const [fol, setFol] = useState([]);
  const [rules, setRules] = useState([]);
  const [peas, setPeas] = useState(null);
  const [selectedStep, setSelectedStep] = useState(WORKFLOW_STEPS[0]);
  const [activeTab, setActiveTab] = useState('agent');
  const [ruleFilter, setRuleFilter] = useState('all');
  const [sandboxDims, setSandboxDims] = useState(DEFAULT_DIMENSIONS);
  const [copiedFol, setCopiedFol] = useState(false);

  useEffect(() => {
    api.rules().then((data) => {
      setFol(data.folExamples || []);
      setRules(data.rules || []);
    }).catch(() => {});

    api.peas().then((data) => {
      setPeas(data);
    }).catch(() => {});
  }, []);

  // Sandbox total score calculation
  const sandboxScore = useMemo(() => {
    return sandboxDims.reduce((acc, dim) => (dim.matched ? acc + dim.pts : acc), 0);
  }, [sandboxDims]);

  const toggleDim = (id) => {
    setSandboxDims((prev) =>
      prev.map((d) => (d.id === id ? { ...d, matched: !d.matched } : d))
    );
  };

  const filteredRules = useMemo(() => {
    if (ruleFilter === 'all') return rules;
    return rules.filter((r) => r.category === ruleFilter);
  }, [rules, ruleFilter]);

  const copyFolToClipboard = () => {
    const text = fol.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedFol(true);
    setTimeout(() => setCopiedFol(false), 2000);
  };

  const getScoreQuality = (score) => {
    if (score >= 17) return { label: 'Exceptional Fit (Top 5 Priority)', class: 'excellent' };
    if (score >= 13) return { label: 'Strong Fit (High Candidate Quality)', class: 'good' };
    if (score >= 8) return { label: 'Moderate Fit (Secondary Match)', class: 'fair' };
    return { label: 'Weak Fit (Pruned in Inference)', class: 'low' };
  };

  return (
    <div className="how-ai-page">
      {/* 1. Hero Architectural Header */}
      <section className="how-hero-card">
        <div className="how-hero-badge-row">
          <span className="how-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Pure Symbolic AI Architecture
          </span>
          <span className="how-chip emerald">100% Deterministic &amp; Explainable</span>
          <span className="how-chip purple">Zero Black-Box LLMs</span>
          <span className="how-chip amber">10,538-Book Knowledge Base</span>
        </div>

        <h1 className="how-hero-title">
          How AI Works in <span className="how-gradient-text">LibraAI</span>
        </h1>

        <p className="how-hero-desc">
          LibraAI is an academic-grade, transparent digital library assistant. Core recommendations
          are computed deterministically in Python using <strong>First-Order Logic (FOL) facts</strong>,{' '}
          <strong>Forward &amp; Backward Chaining inference</strong>, an <strong>11-dimensional objective scoring function</strong>,
          and <strong>Random-Restart Hill Climbing local search</strong> across a discrete semantic affinity graph.
        </p>

        <div className="how-hero-stats-grid">
          <div className="how-hero-stat">
            <div className="how-stat-icon">📚</div>
            <div className="how-stat-content">
              <span className="how-stat-value">10,538</span>
              <span className="how-stat-label">Catalog Books</span>
            </div>
          </div>

          <div className="how-hero-stat">
            <div className="how-stat-icon">⚖️</div>
            <div className="how-stat-content">
              <span className="how-stat-value">17 Domain Rules</span>
              <span className="how-stat-label">IF–THEN FOL Engine</span>
            </div>
          </div>

          <div className="how-hero-stat">
            <div className="how-stat-icon">📊</div>
            <div className="how-stat-content">
              <span className="how-stat-value">20.0 Pts</span>
              <span className="how-stat-label">Objective Function Max</span>
            </div>
          </div>

          <div className="how-hero-stat">
            <div className="how-stat-icon">⛰️</div>
            <div className="how-stat-content">
              <span className="how-stat-value">8 Restarts</span>
              <span className="how-stat-label">Hill Climbing Search</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive End-to-End Decision Flow Stepper */}
      <section className="how-pipeline-section">
        <div className="how-section-header">
          <div className="how-section-title-wrap">
            <h2 className="how-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              End-to-End Decision Architecture Flow
            </h2>
            <p className="how-section-subtitle">
              Click any stage below to inspect its mathematical transformations, inputs, and outputs.
            </p>
          </div>
          <div className="how-interactive-hint">
            <span>💡 Click any step to inspect</span>
          </div>
        </div>

        {/* Horizontal Pipeline Track */}
        <div className="how-pipeline-track">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = selectedStep.id === step.id;
            return (
              <button
                type="button"
                key={step.id}
                className={`how-pipeline-node ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedStep(step)}
              >
                <div className="how-node-top">
                  <span className="how-node-num">{step.num}</span>
                  <span className="how-node-icon">{step.icon}</span>
                </div>
                <div>
                  <div className="how-node-title">{step.title}</div>
                  <div className="how-node-sub">{step.sub}</div>
                </div>
                <div className="how-node-arrow">
                  <span>{isActive ? '● Selected' : 'Inspect →'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Callout Panel */}
        <div className="how-stage-detail-panel">
          <div className="how-detail-header">
            <div className="how-detail-title-group">
              <span className="how-detail-badge">STAGE {selectedStep.num}</span>
              <h3 className="how-detail-name">
                {selectedStep.icon} {selectedStep.title} — {selectedStep.sub}
              </h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Step {selectedStep.num} of 10 in Execution Pipeline
            </span>
          </div>

          <div className="how-detail-grid">
            <div className="how-detail-box">
              <div className="how-detail-box-label">Transformation &amp; Purpose</div>
              <div className="how-detail-box-text">{selectedStep.desc}</div>
            </div>

            <div className="how-detail-box">
              <div className="how-detail-box-label">Formal Logic / Mathematical Definition</div>
              <pre className="how-detail-code">{selectedStep.formal}</pre>
            </div>

            <div className="how-detail-box">
              <div className="how-detail-box-label">Runtime Execution Example</div>
              <pre className="how-detail-code">{selectedStep.example}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Deep-Dive Architectural Pillar Tabs */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="how-tabs-container">
          <button
            type="button"
            className={`how-tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            <span>🌐</span> 1. Intelligent Agent &amp; PEAS
          </button>
          <button
            type="button"
            className={`how-tab-btn ${activeTab === 'fol' ? 'active' : ''}`}
            onClick={() => setActiveTab('fol')}
          >
            <span>🧠</span> 2. Knowledge Base &amp; FOL Rules
          </button>
          <button
            type="button"
            className={`how-tab-btn ${activeTab === 'chaining' ? 'active' : ''}`}
            onClick={() => setActiveTab('chaining')}
          >
            <span>⚖️</span> 3. Dual Chaining (Forward vs Backward)
          </button>
          <button
            type="button"
            className={`how-tab-btn ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoring')}
          >
            <span>📊</span> 4. 11-Dim Objective Scoring (Sandbox)
          </button>
          <button
            type="button"
            className={`how-tab-btn ${activeTab === 'hillclimbing' ? 'active' : ''}`}
            onClick={() => setActiveTab('hillclimbing')}
          >
            <span>⛰️</span> 5. Hill Climbing &amp; Restarts
          </button>
        </div>

        {/* Tab 1: Intelligent Agent & PEAS */}
        {activeTab === 'agent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="how-peas-grid">
              <article className="how-peas-card accent-p">
                <div className="how-peas-card-top">
                  <div className="how-peas-icon-box">🎯</div>
                  <div>
                    <span className="how-peas-letter">P — Component</span>
                    <h3 className="how-peas-title">Performance Measure</h3>
                  </div>
                </div>
                <ul className="how-peas-list">
                  {(peas?.performanceMeasure || [
                    'Recommendation relevance (dynamic 11-attribute score)',
                    'Preference satisfaction across genre, mood, level, rating',
                    'Reasoning correctness (rules fired and facts proved)',
                    'Search path efficiency and local optima discovery',
                    'Explanation transparency and auditability',
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="how-peas-card accent-e">
                <div className="how-peas-card-top">
                  <div className="how-peas-icon-box">🌐</div>
                  <div>
                    <span className="how-peas-letter">E — Component</span>
                    <h3 className="how-peas-title">Environment</h3>
                  </div>
                </div>
                <ul className="how-peas-list">
                  {(peas?.environment || [
                    'Curated 10,538-book digital library Knowledge Base',
                    'Discrete semantic affinity neighborhood graph',
                    'User preference state & active session context',
                    'Circulation availability (simulated derived status)',
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="how-peas-card accent-a">
                <div className="how-peas-card-top">
                  <div className="how-peas-icon-box">⚙️</div>
                  <div>
                    <span className="how-peas-letter">A — Component</span>
                    <h3 className="how-peas-title">Actuators</h3>
                  </div>
                </div>
                <ul className="how-peas-list">
                  {(peas?.actuators || [
                    'Top 5 explainable book recommendations',
                    'Triggered IF–THEN rule inference proofs',
                    'Step-by-step Hill Climbing transition traces',
                    'Reading companion schedule generation',
                    'Catalog search and dynamic similarity metrics',
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="how-peas-card accent-s">
                <div className="how-peas-card-top">
                  <div className="how-peas-icon-box">📡</div>
                  <div>
                    <span className="how-peas-letter">S — Component</span>
                    <h3 className="how-peas-title">Sensors</h3>
                  </div>
                </div>
                <ul className="how-peas-list">
                  {(peas?.sensors || [
                    'Target Genre & Specific Subgenre preferences',
                    'Desired Mood (Suspenseful, Dark, Humorous, etc.)',
                    'Reading Level (Beginner, Intermediate, Advanced)',
                    'Target Age Group and Book Length',
                    'Minimum Star Rating threshold (1.0 – 5.0 ★)',
                    'User-specified topic themes and keywords',
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            {/* Comparison Table: Symbolic AI vs Generative LLMs */}
            <div className="how-comparison-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Architectural Contrast: Symbolic Classical AI vs. Black-Box LLMs
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                Why LibraAI employs genuine symbolic logic and hill-climbing search rather than prompt-based generative models.
              </p>

              <div className="how-table-wrap">
                <table className="how-compare-table">
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>LibraAI (Symbolic AI Engine)</th>
                      <th>Third-Party Generative LLMs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Determinism</strong></td>
                      <td className="how-badge-good">✓ 100% Deterministic (Identical inputs yield exact proofs)</td>
                      <td className="how-badge-bad">✗ Non-deterministic (stochastic token sampling)</td>
                    </tr>
                    <tr>
                      <td><strong>Hallucination Risk</strong></td>
                      <td className="how-badge-good">✓ Zero (Strictly grounded in verified 10,538-book catalog)</td>
                      <td className="how-badge-bad">✗ High (Invented authors, phantom titles, false ratings)</td>
                    </tr>
                    <tr>
                      <td><strong>Explainability</strong></td>
                      <td className="how-badge-good">✓ Complete audit trail (Rule proofs + numeric score breakdown)</td>
                      <td className="how-badge-bad">✗ Opaque latent vectors / Post-hoc justifications</td>
                    </tr>
                    <tr>
                      <td><strong>Execution Latency</strong></td>
                      <td className="how-badge-good">✓ Sub-10ms compiled Python rule execution</td>
                      <td className="how-badge-bad">✗ 1.5s – 5.0s cloud API streaming latency</td>
                    </tr>
                    <tr>
                      <td><strong>Optimization</strong></td>
                      <td className="how-badge-good">✓ Mathematical hill climbing over explicit semantic graph</td>
                      <td className="how-badge-bad">✗ Heuristic language prediction without objective guarantee</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Knowledge Base & FOL Rules */}
        {activeTab === 'fol' && (
          <div className="how-fol-section">
            {/* Live FOL Code Card */}
            <div className="how-code-card">
              <div className="how-code-card-header">
                <span className="how-code-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  First-Order Logic (FOL) Assertions &amp; Domain Implication Rules
                </span>
                <button type="button" className="how-code-btn" onClick={copyFolToClipboard}>
                  {copiedFol ? '✓ Copied' : '📋 Copy FOL Rules'}
                </button>
              </div>

              <pre className="how-code-body">
                {fol.length > 0
                  ? fol.map((rule, idx) => {
                      const parts = rule.split('→');
                      return (
                        <div key={idx} style={{ marginBottom: '0.45rem' }}>
                          <span style={{ color: '#64748b', marginRight: '0.75rem' }}>#{idx + 1}</span>
                          <span className="how-token-predicate">{parts[0]}</span>
                          {parts[1] && (
                            <>
                              <span className="how-token-op"> → </span>
                              <span className="how-token-const">{parts[1]}</span>
                            </>
                          )}
                        </div>
                      );
                    })
                  : '// Loading FOL knowledge base rules...'}
              </pre>
            </div>

            {/* Interactive Domain Rules Library */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                    17 Domain IF–THEN Inference Rules Library
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    Each rule acts as a deterministic logical deduction over catalog facts.
                  </p>
                </div>

                <div className="how-rules-filter-bar" style={{ margin: 0 }}>
                  <button
                    type="button"
                    className={`how-filter-chip ${ruleFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setRuleFilter('all')}
                  >
                    All Rules ({rules.length})
                  </button>
                  <button
                    type="button"
                    className={`how-filter-chip ${ruleFilter === 'preference' ? 'active' : ''}`}
                    onClick={() => setRuleFilter('preference')}
                  >
                    Preferences
                  </button>
                  <button
                    type="button"
                    className={`how-filter-chip ${ruleFilter === 'quality' ? 'active' : ''}`}
                    onClick={() => setRuleFilter('quality')}
                  >
                    Quality &amp; Rating
                  </button>
                  <button
                    type="button"
                    className={`how-filter-chip ${ruleFilter === 'compound' ? 'active' : ''}`}
                    onClick={() => setRuleFilter('compound')}
                  >
                    Compound
                  </button>
                  <button
                    type="button"
                    className={`how-filter-chip ${ruleFilter === 'library' ? 'active' : ''}`}
                    onClick={() => setRuleFilter('library')}
                  >
                    Availability
                  </button>
                </div>
              </div>

              <div className="how-rules-grid">
                {filteredRules.map((r) => (
                  <div key={r.id} className="how-rule-card">
                    <div>
                      <div className="how-rule-header">
                        <span className="how-rule-id">{r.id}</span>
                        <span className="how-chip" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                          {r.category}
                        </span>
                      </div>
                      <div className="how-rule-name">{r.name}</div>
                      <div className="how-rule-premise">
                        <div><span className="label">IF: </span>{r.if}</div>
                        <div><span className="label">THEN: </span>{r.then}</div>
                      </div>
                    </div>
                    <div className="how-rule-desc">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dual Chaining Engine */}
        {activeTab === 'chaining' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="how-chaining-grid">
              {/* Forward Chaining */}
              <div className="how-chaining-card forward">
                <div className="how-chaining-top">
                  <span className="how-chaining-badge">Data-Driven (Bottom-Up)</span>
                  <h3 className="how-chaining-title">Forward Chaining</h3>
                </div>
                <p className="how-chaining-desc">
                  Starts with known user criteria facts, searches for IF premises satisfied in the Knowledge Base,
                  and asserts conclusions forward until eligible candidate books are derived.
                </p>

                <div className="how-chaining-steps">
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">1</span>
                    <div className="how-chaining-text">
                      <strong>Assert User Facts:</strong> UserGenre(Horror), UserMood(Suspenseful), UserMinRating(4.0)
                    </div>
                  </div>
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">2</span>
                    <div className="how-chaining-text">
                      <strong>Premise Matching:</strong> Scan KB records where Genre(b, Horror) and Mood(b, Suspenseful) hold.
                    </div>
                  </div>
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">3</span>
                    <div className="how-chaining-text">
                      <strong>Rule Firing:</strong> Rules R1, R2, R8, R13, and R14 fire and assert new facts: StrongMoodMatch(b), SuitableForSuspense(b).
                    </div>
                  </div>
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">4</span>
                    <div className="how-chaining-text">
                      <strong>Candidate Generation:</strong> Produces candidate pool for objective scoring &amp; local search.
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  ⚡ <strong>Ideal for:</strong> Catalog-wide exploration when discovering all books meeting multi-attribute criteria.
                </div>
              </div>

              {/* Backward Chaining */}
              <div className="how-chaining-card backward">
                <div className="how-chaining-top">
                  <span className="how-chaining-badge">Goal-Driven (Top-Down)</span>
                  <h3 className="how-chaining-title">Backward Chaining</h3>
                </div>
                <p className="how-chaining-desc">
                  Begins with the recommendation goal <code>Recommend(Book)</code>, formulates subgoals, and recursively
                  proves prerequisite facts against catalog assertions to establish recommendation validity.
                </p>

                <div className="how-chaining-steps">
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">1</span>
                    <div className="how-chaining-text">
                      <strong>State Hypothesis:</strong> Goal = <code>Recommend(Book_B00124)</code>
                    </div>
                  </div>
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">2</span>
                    <div className="how-chaining-text">
                      <strong>Subgoal Decomposition:</strong> Needs <code>GenreMatch(b) ∧ MoodMatch(b) ∧ RatingMatch(b)</code>.
                    </div>
                  </div>
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">3</span>
                    <div className="how-chaining-text">
                      <strong>Proof Verification:</strong> Queries Knowledge Base facts to confirm Genre(B00124, Horror) and Score(B00124) ≥ 4.0.
                    </div>
                  </div>
                  <div className="how-chaining-step-item">
                    <span className="how-chaining-num">4</span>
                    <div className="how-chaining-text">
                      <strong>Proof Tree Generated:</strong> Returns deterministic proof tree confirming or refuting candidate eligibility.
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.08)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  🎯 <strong>Ideal for:</strong> Auditing and verifying why a specific book qualifies or fails recommendation criteria.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 11-Dimensional Objective Scoring (Interactive Sandbox) */}
        {activeTab === 'scoring' && (
          <div className="how-scoring-container">
            {/* Mathematical Formula Banner */}
            <div className="how-formula-banner">
              <div className="how-formula-title">Objective Recommendation Scoring Function (Max 20.0 Pts)</div>
              <div className="how-formula-latex">
                Score(b) = (GenreMatch × 4) + (InterestMatch × 4) + (MoodMatch × 2) + (LevelMatch × 2) + (ThemeMatch × 2) + (AgeMatch × 1) + (KeywordMatch × 1) + (RatingMatch × 1) + (PublicationMatch × 1) + (PopularityMatch × 1) + (AvailabilityMatch × 1)
              </div>
            </div>

            {/* Interactive Live Scoring Sandbox */}
            <div className="how-scoring-sandbox-grid">
              <div className="how-sandbox-controls">
                <h3 className="how-sandbox-title">Interactive Objective Score Simulator</h3>
                <p className="how-sandbox-sub">
                  Toggle match dimensions below to simulate dynamic point accumulation for candidate books:
                </p>

                <div className="how-dimension-list">
                  {sandboxDims.map((dim) => (
                    <div
                      key={dim.id}
                      className={`how-dim-item ${dim.matched ? 'matched' : ''}`}
                      onClick={() => toggleDim(dim.id)}
                    >
                      <div className="how-dim-left">
                        <div className="how-checkbox">{dim.matched ? '✓' : ''}</div>
                        <span className="how-dim-name">{dim.name}</span>
                      </div>
                      <span className="how-dim-pts">+{dim.pts} Pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Result Gauge Card */}
              <div className="how-sandbox-meter-card">
                <div className="how-score-circle">
                  <span className="how-score-val">{sandboxScore.toFixed(1)}</span>
                  <span className="how-score-max">/ 20.0 Pts</span>
                </div>

                <div className={`how-score-quality ${getScoreQuality(sandboxScore).class}`}>
                  {getScoreQuality(sandboxScore).label}
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(24, 49, 74, 0.8)', borderRadius: '4px', overflow: 'hidden', margin: '0.85rem 0' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(sandboxScore / 20) * 100}%`,
                      background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                      transition: 'width 0.3s ease',
                    }}
                  ></div>
                </div>

                <p className="how-score-note">
                  Recommendation scores are computed on demand across candidate states. Only candidate books
                  with high scores are prioritized as start states and local peaks in Hill Climbing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Hill Climbing & Random Restarts */}
        {activeTab === 'hillclimbing' && (
          <div className="how-hc-container">
            {/* Affinity Metric Card */}
            <div className="how-affinity-card">
              <h3 className="how-affinity-title">
                Discrete Semantic Neighborhood Affinity (Strictly Non-Adjacent CSV Rows)
              </h3>
              <p className="how-affinity-desc">
                In classical local search, candidates must have genuine neighborhood relationships. Adjacent rows
                in a catalog CSV are arbitrary and mathematically invalid. LibraAI calculates semantic edge affinities:
              </p>

              <div className="how-affinity-grid">
                <div className="how-affinity-node">
                  <span className="how-affinity-factor">Same Author</span>
                  <span className="how-affinity-weight highlight">+3.0 Affinity</span>
                </div>
                <div className="how-affinity-node">
                  <span className="how-affinity-factor">Specific Subgenre</span>
                  <span className="how-affinity-weight">+2.5 Affinity</span>
                </div>
                <div className="how-affinity-node">
                  <span className="how-affinity-factor">Same Genre &amp; Mood</span>
                  <span className="how-affinity-weight">+2.5 Affinity</span>
                </div>
                <div className="how-affinity-node">
                  <span className="how-affinity-factor">Shared Themes</span>
                  <span className="how-affinity-weight">+2.0 / theme</span>
                </div>
                <div className="how-affinity-node">
                  <span className="how-affinity-factor">Shared Keywords</span>
                  <span className="how-affinity-weight">+0.8 / keyword</span>
                </div>
                <div className="how-affinity-node">
                  <span className="how-affinity-factor">Same Reading Level</span>
                  <span className="how-affinity-weight">+0.5 Affinity</span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#38bdf8', marginTop: '1rem' }}>
                📌 <strong>Neighborhood Threshold:</strong> Two books qualify as valid neighbors if Affinity Score ≥ 1.5.
                The active search space is bounded to the top 8–10 closest neighbors per book.
              </p>
            </div>

            {/* Restarts & Uphill Trace Card */}
            <div className="how-restarts-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.35rem' }}>
                Why Random Restarts (8 Iterations) Guarantee High-Quality Local Peaks
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                Standard Hill Climbing risks premature convergence on weak local plateaus. LibraAI initializes
                8 climbs from disparate catalog clusters:
              </p>

              <div className="how-climb-steps">
                <div className="how-climb-step-row">
                  <span className="how-climb-badge">Restart 1</span>
                  <span className="how-climb-label">Start: Initial Candidate (Score: 11.0)</span>
                  <span className="how-climb-arrow">→</span>
                  <span className="how-climb-label">Neighbor Move (Score: 14.5)</span>
                  <span className="how-climb-arrow">→</span>
                  <span className="how-climb-label" style={{ color: '#34d399', fontWeight: 700 }}>
                    Peak Found: "Dracula" (Score: 16.5) [Local Peak]
                  </span>
                </div>

                <div className="how-climb-step-row">
                  <span className="how-climb-badge">Restart 4</span>
                  <span className="how-climb-label">Start: Diverse Cluster (Score: 12.0)</span>
                  <span className="how-climb-arrow">→</span>
                  <span className="how-climb-label">Author Transition (Score: 15.0)</span>
                  <span className="how-climb-arrow">→</span>
                  <span className="how-climb-label" style={{ color: '#34d399', fontWeight: 700 }}>
                    Peak Found: "The Shining" (Score: 18.0) [Global Peak]
                  </span>
                </div>

                <div className="how-climb-step-row">
                  <span className="how-climb-badge">Deduplication</span>
                  <span className="how-climb-label" style={{ color: '#cbd5e1' }}>
                    Peaks from all 8 restarts are gathered, deduplicated by Book ID, ranked by score, and returned as Top 5 recommendations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Action Callout Banner */}
      <section className="how-cta-banner">
        <div className="how-cta-text">
          <h2 className="how-cta-title">Ready to Experience the AI Reasoning Engine?</h2>
          <p className="how-cta-desc">
            Test the live recommendation assistant with your custom preferences, or inspect active proof trees
            and hill-climbing restart traces in the reasoning debugger.
          </p>
        </div>

        <div className="how-cta-actions">
          <Link to="/recommend" className="how-btn-primary">
            <span>✨</span> Get Recommendations
          </Link>
          <Link to="/reasoning" className="how-btn-secondary">
            <span>🔬</span> AI Reasoning Traces
          </Link>
          <Link to="/knowledge-base" className="how-btn-secondary">
            <span>📚</span> Browse 10,538 Books
          </Link>
        </div>
      </section>
    </div>
  );
}
