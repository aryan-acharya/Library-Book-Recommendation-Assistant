import { PageHeader } from '../components/UIComponents';

export default function About() {
  return (
    <div className="about-page">
      <PageHeader
        title="About LibraAI"
        description="Library Book Recommendation Assistant — An explainable, symbolic intelligent system built on Knowledge Representation, Rule-Based Reasoning, and Random-Restart Hill Climbing search."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        }
      />

      <div className="explain-grid">
        <article className="panel">
          <h2>Core AI Pillars Combined</h2>
          <ul className="check-list">
            <li>✓ Intelligent Agent Concepts &amp; PEAS Specification</li>
            <li>✓ Knowledge Representation (Predicate Logic / FOL Facts)</li>
            <li>✓ Rule-Based Reasoning with R1–R10 Production Rules</li>
            <li>✓ Forward Chaining (Data-Driven Inference)</li>
            <li>✓ Backward Chaining (Goal-Driven Proof Search)</li>
            <li>✓ Random-Restart Hill Climbing Local Search</li>
            <li>✓ Semantic Content Similarity &amp; Multi-Attribute Matching</li>
            <li>✓ Study Companion &amp; Real Reader Activity Analytics</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Viva &amp; Architecture Summary</h2>
          <blockquote>
            “LibraAI is an intelligent library assistant that combines Knowledge Representation and a Rule-Based System to reason about user criteria and book attributes. Either Forward Chaining or Backward Chaining is applied for inference. After filtering candidate books, a multi-attribute recommendation score is evaluated. Random-Restart Hill Climbing traverses semantic neighbor graphs to discover optimal recommendations while mitigating local optima.”
          </blockquote>
        </article>

        <article className="panel wide">
          <h2>Knowledge Base &amp; Dataset Attribution</h2>
          <p>
            Dataset Source: <code>Popular-Books-10000plus-Ratings-Enriched.csv</code> (10,538 books across 17 attributes).
          </p>
          <p className="muted-hint" style={{ marginTop: '0.5rem' }}>
            Attributes include Title, Author, Genre, Subgenre, Mood, Reading Level, Age Group, Themes, Keywords, Published Year, Ratings Count, and Goodreads Score. Length and Availability are simulated circulation attributes for this academic prototype.
          </p>
        </article>
      </div>
    </div>
  );
}
