import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="home-hero">
      <div className="hero-panel">
        <p className="eyebrow">Intelligent Digital Library Assistant</p>
        <h1>LibraAI – Library Book Recommendation Assistant</h1>
        <p className="lede">Find the right book using intelligent reasoning.</p>
        <div className="cta-row">
          <Link className="btn primary" to="/recommend">
            Get Recommendations
          </Link>
          <Link className="btn" to="/explore">
            Explore Library
          </Link>
          <Link className="btn" to="/search">
            Search Books
          </Link>
          <Link className="btn ghost" to="/how-ai-works">
            How AI Works
          </Link>
        </div>
      </div>
      <div className="hero-side">
        <div className="stat-stack">
          <div>
            <strong>10,538</strong>
            <span>Books in Knowledge Base</span>
          </div>
          <div>
            <strong>17</strong>
            <span>Knowledge fields per book</span>
          </div>
          <div>
            <strong>17</strong>
            <span>IF–THEN inference rules</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Chaining methods + Hill Climbing</span>
          </div>
        </div>
        <p className="hero-note">
          Preferences become facts. Rules derive matches. Hill Climbing searches neighboring candidates for higher
          recommendation scores. Random restarts reduce local-optimum traps.
        </p>
      </div>
    </section>
  );
}
