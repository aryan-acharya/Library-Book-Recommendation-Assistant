import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader } from '../components/UIComponents';

const workflow = [
  'User Preferences',
  'Fact Extraction',
  'Knowledge Base Match',
  'Rule Evaluation (R1–R10)',
  'Forward / Backward Chaining',
  'Candidate Selection',
  'Objective Scoring',
  'Hill Climbing Local Search',
  'Random Restarts',
  'Top 5 Recommendations',
];

export default function HowAIWorks() {
  const [fol, setFol] = useState([]);

  useEffect(() => {
    api.rules().then((data) => {
      setFol(data.folExamples || []);
    });
  }, []);

  return (
    <div className="how-page">
      <PageHeader
        title="How AI Works in LibraAI"
        description="LibraAI is a pure symbolic, explainable intelligent assistant. It does not use opaque third-party black-box LLMs for core recommendation. All inference executes deterministically in Python using Rule-Based Reasoning and Hill Climbing search."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        }
      />

      <div className="workflow-card">
        <h3>End-to-End Decision Flow</h3>
        <div className="workflow-steps-chain">
          {workflow.map((step, i) => (
            <div key={step} className="workflow-step-node">
              <span className="step-badge">{i + 1}</span>
              <span className="step-name">{step}</span>
              {i < workflow.length - 1 && <span className="arrow-next">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="explain-grid">
        <article className="panel">
          <h2>1. Intelligent Agent &amp; PEAS</h2>
          <p>
            LibraAI receives user criteria as percepts, queries its digital library environment, evaluates candidate states using an objective recommendation scoring function, and produces explainable recommendations as agent actions.
          </p>
        </article>

        <article className="panel">
          <h2>2. Knowledge Representation (FOL)</h2>
          <p>Books and user criteria are translated into predicate logic facts:</p>
          <pre className="code-block">{fol.slice(0, 8).join('\n') || 'Genre(B00001, "Horror")\nMood(B00001, "Suspenseful")'}</pre>
        </article>

        <article className="panel">
          <h2>3. Rule-Based Reasoning &amp; Chaining</h2>
          <p>
            <strong>Forward Chaining:</strong> Starts from known user facts (e.g. UserGenre, UserMood) and applies rules forward to derive matches.
          </p>
          <p>
            <strong>Backward Chaining:</strong> Hypothesizes goal <code>Recommend(Book)</code> and proves prerequisites recursively.
          </p>
        </article>

        <article className="panel">
          <h2>4. ⛰️ Hill Climbing Search</h2>
          <p>
            Candidate solutions are navigated by inspecting semantic neighbors (shared genres, mood, themes, author). Moves occur only if a neighbor strictly improves recommendation score. <strong>Random restarts</strong> escape sub-optimal local plateaus.
          </p>
        </article>
      </div>
    </div>
  );
}
