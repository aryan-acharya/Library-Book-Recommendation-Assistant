import { Link } from 'react-router-dom';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
      <rect fill="#1e3a34" width="200" height="300"/>
      <text x="100" y="150" fill="#9fc6b4" font-family="Georgia,serif" font-size="18" text-anchor="middle">No Cover</text>
    </svg>`
  );

export function Cover({ src, alt, className = '' }) {
  return (
    <img
      className={`cover ${className}`}
      src={src || PLACEHOLDER}
      alt={alt || 'Book cover'}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = PLACEHOLDER;
      }}
    />
  );
}

export function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <Cover src={book.image} alt={book.title} />
      <div className="book-card-body">
        <h3>{book.title}</h3>
        <p className="author">{book.author}</p>
        <div className="meta-row">
          <span>{book.genre}</span>
          <span>★ {book.score}</span>
        </div>
        {book.published ? <p className="muted">{book.published}</p> : null}
      </div>
    </Link>
  );
}

export function RecommendationCard({ book, rank }) {
  return (
    <article className="rec-card">
      <div className="rec-rank">#{rank}</div>
      <Cover src={book.image} alt={book.title} />
      <div className="rec-body">
        <h3>
          <Link to={`/books/${book.id}`}>{book.title}</Link>
        </h3>
        <p className="author">{book.author}</p>
        <div className="chip-row">
          <span className="chip">{book.genre}</span>
          <span className="chip">{book.subgenre}</span>
          <span className="chip">{book.mood}</span>
          <span className="chip score-chip">Score {book.recommendationScore}/{book.maxScore || 20}</span>
        </div>
        <div className="meta-grid">
          <span>★ {book.score}</span>
          <span>{book.ratings?.toLocaleString?.() || book.ratings} ratings</span>
          <span>{book.shelvings?.toLocaleString?.() || book.shelvings} shelvings</span>
          <span>{book.published}</span>
          <span>{book.availability}</span>
          <span>{book.length}</span>
        </div>

        <details open={rank === 1}>
          <summary>Why This Book?</summary>
          <ul className="check-list">
            {(book.whyRecommended || []).map((reason) => (
              <li key={reason}>✓ {reason}</li>
            ))}
          </ul>
        </details>

        <details>
          <summary>Triggered IF–THEN Rules</summary>
          <ul className="rule-list">
            {(book.triggeredRules || []).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </details>

        <details>
          <summary>
            Hill Climbing Search Path {book.restartOrigin ? `(Restart ${book.restartOrigin})` : ''}
          </summary>
          <div className="card-hc-path">
            {book.restartOrigin ? (
              <div className="hc-origin-tag">
                🎯 Discovered via Random Restart #{book.restartOrigin}
              </div>
            ) : null}
            <div className="hc-step-chain">
              {(book.hillClimbingPath || []).map((step, i) => (
                <span key={`${step.id}-${i}`} className="step-chain-node">
                  <span className="node-title">{step.title}</span>
                  <span className="node-score">({step.score})</span>
                  {i < (book.hillClimbingPath?.length || 0) - 1 ? (
                    <span className="chain-arrow">→</span>
                  ) : (
                    <span className="node-badge-optimum">★ Local Optimum</span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ marginTop: '0.6rem' }}>
              <Link className="btn small" to="/reasoning">
                Inspect Full Step Trace in AI Reasoning →
              </Link>
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}
