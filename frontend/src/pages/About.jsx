export default function About() {
  return (
    <section className="about-page">
      <header className="section-head">
        <h1>LibraAI – Library Book Recommendation Assistant</h1>
        <p>
          An explainable intelligent digital library assistant for discovering books from a 10,538-book Knowledge Base.
        </p>
      </header>

      <article className="panel">
        <h2>What LibraAI Combines</h2>
        <ul className="check-list">
          <li>✓ Intelligent Agent concepts</li>
          <li>✓ PEAS Representation</li>
          <li>✓ Knowledge Representation</li>
          <li>✓ Rule-Based Reasoning</li>
          <li>✓ Forward Chaining</li>
          <li>✓ Backward Chaining</li>
          <li>✓ Hill Climbing Search</li>
          <li>✓ Inference Engine</li>
          <li>✓ Recommendation Ranking</li>
        </ul>
      </article>

      <article className="panel">
        <h2>Viva Explanation</h2>
        <blockquote>
          LibraAI is an intelligent library assistant that uses Knowledge Representation and a Rule-Based System to
          reason about user preferences and book attributes. Forward Chaining or Backward Chaining is used for
          inference. After generating candidate books, a recommendation score is calculated based on genre, interest,
          mood, reading level, themes, rating, and other factors. Hill Climbing then searches through neighboring
          candidate books to move toward higher-scoring recommendations. Random restarts are used to reduce the chance
          of getting stuck at a local optimum.
        </blockquote>
      </article>

      <article className="panel">
        <h2>Dataset Notes</h2>
        <p>
          Knowledge Base file: <code>Popular-Books-10000plus-Ratings-Enriched.csv</code> (10,538 books, 17 fields).
        </p>
        <p>
          <strong>Length</strong> and <strong>Availability</strong> are derived/simulated fields for this academic
          prototype. All other fields come from the enriched dataset and are not fabricated at runtime.
        </p>
      </article>
    </section>
  );
}
