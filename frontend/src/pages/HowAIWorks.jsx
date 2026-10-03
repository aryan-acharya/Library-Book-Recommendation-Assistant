import { useEffect, useState } from 'react';
import { api } from '../api';

const workflow = [
  'USER',
  'USER PREFERENCES',
  'FACT REPRESENTATION',
  'KNOWLEDGE BASE',
  'RULE-BASED SYSTEM',
  'FORWARD / BACKWARD CHAINING',
  'CANDIDATE BOOKS',
  'RECOMMENDATION SCORE',
  'HILL CLIMBING',
  'NEIGHBOR SEARCH',
  'RANDOM RESTARTS',
  'TOP 5 BOOKS',
  'EXPLANATION',
];

export default function HowAIWorks() {
  const [rules, setRules] = useState([]);
  const [fol, setFol] = useState([]);

  useEffect(() => {
    api.rules().then((data) => {
      setRules(data.rules || []);
      setFol(data.folExamples || []);
    });
  }, []);

  return (
    <section className="how-page">
      <header className="section-head">
        <h1>How AI Works</h1>
        <p>
          LibraAI is an explainable intelligent assistant. It does not use an external LLM for core reasoning. All
          inference runs in Python on the Knowledge Base.
        </p>
      </header>

      <div className="workflow">
        {workflow.map((step, i) => (
          <div key={step} className="workflow-step">
            <span>{step}</span>
            {i < workflow.length - 1 ? <div className="arrow">↓</div> : null}
          </div>
        ))}
      </div>

      <div className="explain-grid">
        <article className="panel">
          <h2>Intelligent Agent</h2>
          <p>
            LibraAI receives preferences, observes the library Knowledge Base, reasons with rules, searches candidate
            solutions, and produces ranked recommendations with explanations.
          </p>
        </article>
        <article className="panel">
          <h2>PEAS</h2>
          <p>
            Performance measures relevance and explanation quality. The environment is the digital library. Sensors are
            preference inputs. Actuators are recommendations and reasoning traces.
          </p>
        </article>
        <article className="panel">
          <h2>Knowledge Representation</h2>
          <p>Books and preferences are stored as structured facts and simple FOL-style implications.</p>
          <pre className="code-block">{fol.join('\n')}</pre>
        </article>
        <article className="panel">
          <h2>Knowledge Base</h2>
          <p>
            The Knowledge Base is the full 10,538-book enriched CSV. Length and Availability are derived/simulated for
            this academic prototype.
          </p>
        </article>
        <article className="panel">
          <h2>Rule-Based Reasoning</h2>
          <p>IF–THEN rules match user facts to book attributes and derive new facts such as GenreMatch(book).</p>
        </article>
        <article className="panel">
          <h2>Forward Chaining</h2>
          <p>
            Starts from known user facts and fires applicable rules to derive matches until no useful new facts remain.
          </p>
        </article>
        <article className="panel">
          <h2>Backward Chaining</h2>
          <p>
            Starts from the goal Recommend(Book) and works backward through subgoals like genre, mood, interest, and
            rating matches.
          </p>
        </article>
        <article className="panel">
          <h2>Inference Engine</h2>
          <p>
            Coordinates facts → rules → chaining → candidates → scoring → hill climbing → final Top 5 ranking.
          </p>
        </article>
        <article className="panel">
          <h2>Hill Climbing Search</h2>
          <p>
            Hill Climbing is a local search optimization algorithm that starts from an initial candidate book and repeatedly evaluates its
            neighborhood, moving strictly to a neighboring candidate with a higher recommendation score.
          </p>
          <p>
            <strong>Objective Function:</strong> Evaluates Genre (×4), Interest (×4), Mood (×2), Reading Level (×2), Theme (×2),
            Age Group (×1), Keywords (×1), Rating (×1), Publication (×1), Popularity (×1), and Availability (×1) up to 20 points.
          </p>
          <p>
            <strong>Neighbor Definition:</strong> Meaningful affinity based on shared author, subgenre, genre, mood, themes, keywords,
            and reading level — strictly <em>not</em> adjacent rows in the dataset.
          </p>
          <p>
            <strong>Local Optimum vs Global Optimum:</strong> Hill Climbing stops when no neighboring candidate has a better score.
            Because it can become trapped in a local optimum, LibraAI implements <strong>Random-Restart Hill Climbing</strong> (5–10 restarts)
            to explore distinct candidate regions. It does <em>not</em> falsely claim to guarantee the globally best book.
          </p>
        </article>
        <article className="panel">
          <h2>Top 5 Recommendation Ranking</h2>
          <p>
            Unique local optima discovered across all random restarts (supplemented by high-scoring candidates if needed) are
            ranked by recommendation score. The resulting Top 5 books are returned with dynamic, explainable justifications.
          </p>
        </article>
      </div>

      <h2>IF–THEN Rules</h2>
      <div className="rule-cards">
        {rules.map((rule) => (
          <article key={rule.id} className="rule-card">
            <h3>
              {rule.id} – {rule.name}
            </h3>
            <p>
              <strong>IF</strong> {rule.if}
            </p>
            <p>
              <strong>THEN</strong> {rule.then}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
