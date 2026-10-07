import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isFavorite, toggleFavorite } from '../libraryStore';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
      <rect fill="#0B1726" width="200" height="300"/>
      <rect x="10" y="10" width="180" height="280" fill="none" stroke="#18314A" stroke-width="2" rx="8"/>
      <text x="100" y="145" fill="#38BDF8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="28" font-weight="bold" text-anchor="middle">📖</text>
      <text x="100" y="175" fill="#94A3B8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="600" text-anchor="middle">LibraAI Book</text>
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

/**
 * TopBookCard: Primary card for Top 5 Recommendations on the Home Page.
 * Matches reference layout:
 * - Rank circle badge on top-left (#1)
 * - Bookmark icon button on top-right (add/remove favorite)
 * - Book cover
 * - Title
 * - Author
 * - Rating (★ 4.2)
 * - Badges (Genre / Subgenre / Themes)
 * - Availability dot (● Available / ● Limited)
 */
export function TopBookCard({ book, rank, onSelect }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(book?.id));
    function handleUpdate() {
      setFav(isFavorite(book?.id));
    }
    window.addEventListener('libraai_store_update', handleUpdate);
    return () => window.removeEventListener('libraai_store_update', handleUpdate);
  }, [book?.id]);

  function handleBookmark(e) {
    e.stopPropagation();
    const updated = toggleFavorite(book);
    setFav(updated);
  }

  const avail = book?.availability || 'Available';
  const availClass = avail.toLowerCase() === 'limited' ? 'limited' : avail.toLowerCase() === 'unavailable' ? 'unavailable' : 'available';

  // Badges to display: genre + subgenre or first theme
  const badges = [];
  if (book?.genre && book.genre !== 'Unknown') badges.push(book.genre);
  if (book?.subgenre && book.subgenre !== 'General' && book.subgenre !== book.genre) {
    badges.push(book.subgenre);
  } else if (book?.themes && book.themes.length > 0 && book.themes[0] !== book.genre) {
    badges.push(book.themes[0]);
  } else if (book?.mood && book.mood !== 'Neutral') {
    badges.push(book.mood);
  }

  return (
    <div
      className="top-book-card"
      onClick={() => onSelect?.(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(book)}
    >
      <div className="top-card-header">
        <span className="rank-badge">{rank}</span>
        <button
          type="button"
          className={`bookmark-btn ${fav ? 'favorited' : ''}`}
          onClick={handleBookmark}
          title={fav ? 'Remove from Favorites' : 'Add to Favorites'}
          aria-label={fav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? '#38BDF8' : 'none'} stroke={fav ? '#38BDF8' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>

      <div className="top-card-cover-wrap">
        <Cover src={book.image} alt={book.title} className="top-card-cover" />
      </div>

      <div className="top-card-info">
        <h3 className="top-card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="top-card-author">{book.author}</p>

        <div className="top-card-rating">
          <span className="star">★</span>
          <span className="rating-num">{book.score ? Number(book.score).toFixed(1) : '4.0'}</span>
        </div>

        <div className="top-card-badges">
          {badges.slice(0, 2).map((b) => (
            <span key={b} className="tag-pill">
              {b}
            </span>
          ))}
        </div>

        <div className={`top-card-status ${availClass}`}>
          <span className="status-dot"></span>
          <span>{avail}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * SuggestionCard: Compact card for the "Other Suggestions" row.
 */
export function SuggestionCard({ book, onSelect }) {
  return (
    <div
      className="suggestion-card"
      onClick={() => onSelect?.(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(book)}
    >
      <Cover src={book.image} alt={book.title} className="suggestion-thumb" />
      <div className="suggestion-meta">
        <h4 className="suggestion-title" title={book.title}>
          {book.title}
        </h4>
        <p className="suggestion-author">{book.author}</p>
        <div className="suggestion-rating">
          <span className="star">★</span>
          <span>{book.score ? Number(book.score).toFixed(1) : '4.0'}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard BookCard for search, explore, and lists.
 */
export function BookCard({ book, onSelect }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(book?.id));
    function handleUpdate() {
      setFav(isFavorite(book?.id));
    }
    window.addEventListener('libraai_store_update', handleUpdate);
    return () => window.removeEventListener('libraai_store_update', handleUpdate);
  }, [book?.id]);

  function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleFavorite(book);
    setFav(updated);
  }

  const content = (
    <>
      <div className="book-card-cover-wrap">
        <Cover src={book.image} alt={book.title} />
        <button
          type="button"
          className={`card-quick-fav ${fav ? 'active' : ''}`}
          onClick={handleBookmark}
          title={fav ? 'Remove from favorites' : 'Add to favorites'}
        >
          {fav ? '♥' : '♡'}
        </button>
      </div>
      <div className="book-card-body">
        <h3 title={book.title}>{book.title}</h3>
        <p className="author">{book.author}</p>
        <div className="meta-row">
          <span className="card-genre">{book.genre}</span>
          <span className="card-score">★ {book.score}</span>
        </div>
        <div className="card-footer-tags">
          {book.availability ? (
            <span className={`status-pill-small ${book.availability?.toLowerCase()}`}>
              ● {book.availability}
            </span>
          ) : null}
          {book.published ? <span className="muted-year">{book.published}</span> : null}
        </div>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <div
        className="book-card"
        onClick={() => onSelect(book)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(book)}
      >
        {content}
      </div>
    );
  }

  return (
    <Link to={`/books/${book.id}`} className="book-card">
      {content}
    </Link>
  );
}

export function RecommendationCard({ book, rank, onSelect }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(book?.id));
    function handleUpdate() {
      setFav(isFavorite(book?.id));
    }
    window.addEventListener('libraai_store_update', handleUpdate);
    return () => window.removeEventListener('libraai_store_update', handleUpdate);
  }, [book?.id]);

  function handleBookmark(e) {
    e.stopPropagation();
    const updated = toggleFavorite(book);
    setFav(updated);
  }

  return (
    <article className="rec-card">
      <div className="rec-rank-badge">#{rank}</div>
      <div className="rec-card-cover-col">
        <Cover src={book.image} alt={book.title} />
        <button
          type="button"
          className={`rec-fav-btn ${fav ? 'active' : ''}`}
          onClick={handleBookmark}
        >
          {fav ? '♥ In Library' : '♡ Save Book'}
        </button>
      </div>
      <div className="rec-body">
        <div className="rec-header-row">
          <div>
            <h3>
              {onSelect ? (
                <button
                  type="button"
                  className="rec-title-btn"
                  onClick={() => onSelect(book)}
                >
                  {book.title}
                </button>
              ) : (
                <Link to={`/books/${book.id}`}>{book.title}</Link>
              )}
            </h3>
            <p className="author">{book.author}</p>
          </div>
          <div className="rec-score-pill">
            Score {book.recommendationScore}/{book.maxScore || 20}
          </div>
        </div>

        <div className="chip-row">
          <span className="chip">{book.genre}</span>
          <span className="chip">{book.subgenre}</span>
          <span className="chip">{book.mood}</span>
          <span className="chip">{book.readingLevel}</span>
          <span className={`chip availability ${book.availability?.toLowerCase()}`}>
            ● {book.availability}
          </span>
        </div>

        <div className="meta-grid">
          <span>★ {book.score} Rating</span>
          <span>{book.ratings?.toLocaleString?.() || book.ratings} ratings</span>
          <span>{book.shelvings?.toLocaleString?.() || book.shelvings} shelvings</span>
          <span>Published {book.published}</span>
          <span>Length: {book.length}</span>
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

        {book.hillClimbingPath && book.hillClimbingPath.length > 0 ? (
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
        ) : null}
      </div>
    </article>
  );
}
