import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isFavorite, toggleFavorite } from '../libraryStore';

/**
 * Universal Shared BookCover Component.
 * Ensures the COMPLETE book cover is always visible inside a consistent,
 * properly sized frame with object-fit: contain (never cropped or stretched).
 * Displays a styled fallback if the image fails or is missing.
 */
export function BookCover({
  src,
  alt,
  title,
  className = '',
  containerClassName = '',
}) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
  }

  const isInvalid = !src || hasError;

  return (
    <div
      className={`book-cover-container ${containerClassName} ${className}`.trim()}
    >
      {isInvalid ? (
        <div className="book-cover-fallback">
          <span className="fallback-book-icon">📖</span>
          <span className="fallback-text">Cover Unavailable</span>
        </div>
      ) : (
        <img
          className="book-cover"
          src={src}
          alt={alt || title || 'Book cover'}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

/**
 * Backward compatibility wrapper for existing usages of Cover.
 * Delegates to BookCover to guarantee universal consistency.
 */
export function Cover(props) {
  return <BookCover {...props} />;
}

/**
 * Universal Standard BookCard used across all pages of LibraAI:
 * - Home (Top 5 & suggestions)
 * - Get Recommendations
 * - Book Search
 * - Similar Books
 * - Favorites
 * - My Library (Recently Viewed, Saved, Currently Reading, Completed)
 * - Availability
 * - AI Reasoning
 *
 * Image is displayed completely inside the consistent frame,
 * with text and actions cleanly separated below it.
 */
export function BookCard({
  book,
  rank,
  onSelect,
  scoreBadge,
  similarity,
  extraAction,
  onRemove,
  className = '',
}) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!book?.id) return;
    setFav(isFavorite(book.id));
    function handleUpdate() {
      setFav(isFavorite(book.id));
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

  if (!book) return null;

  const avail = book.availability || 'Available';
  const availClass =
    avail.toLowerCase() === 'limited'
      ? 'limited'
      : avail.toLowerCase() === 'unavailable' || avail.toLowerCase() === 'issued'
      ? 'unavailable'
      : 'available';

  // Badges to display: genre + subgenre or first theme/mood
  const badges = [];
  if (book.genre && book.genre !== 'Unknown') badges.push(book.genre);
  if (book.subgenre && book.subgenre !== 'General' && book.subgenre !== book.genre) {
    badges.push(book.subgenre);
  } else if (book.themes && book.themes.length > 0 && book.themes[0] !== book.genre) {
    badges.push(book.themes[0]);
  } else if (book.mood && book.mood !== 'Neutral') {
    badges.push(book.mood);
  }

  const scoreText =
    scoreBadge ||
    (similarity !== undefined ? `${similarity}% Match` : null) ||
    (book.recommendationScore !== undefined
      ? `Score ${book.recommendationScore}/${book.maxScore || 20}`
      : null);

  const cardContent = (
    <div
      className={`universal-book-card ${className}`}
      onClick={() => onSelect?.(book)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(book)}
    >
      <div className="book-card-top-bar">
        <div className="card-top-left-badges">
          {rank !== undefined && rank !== null ? (
            <span className="rank-badge">#{rank}</span>
          ) : null}
          {scoreText ? <span className="score-badge-pill">{scoreText}</span> : null}
        </div>

        <div className="card-top-actions">
          {onRemove ? (
            <button
              type="button"
              className="card-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(book);
              }}
              title="Remove from list"
              aria-label="Remove from list"
            >
              ✕
            </button>
          ) : null}

          <button
            type="button"
            className={`bookmark-btn ${fav ? 'favorited' : ''}`}
            onClick={handleBookmark}
            title={fav ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label={fav ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={fav ? '#38BDF8' : 'none'}
              stroke={fav ? '#38BDF8' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Consistent dedicated book cover container with complete image visible */}
      <BookCover src={book.image} alt={book.title} />

      {/* 3. Text and actions clearly structured below the cover frame */}
      <div className="book-card-info-body">
        <h3 className="book-card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-card-author">{book.author}</p>

        <div className="book-card-rating-line">
          <span className="star-icon">★</span>
          <span className="rating-value">
            {book.score ? Number(book.score).toFixed(1) : '4.0'}
          </span>
          {book.ratings ? (
            <span className="ratings-count">
              ({Number(book.ratings).toLocaleString()})
            </span>
          ) : null}
        </div>

        <div className="book-card-tags-line">
          {badges.slice(0, 2).map((b) => (
            <span key={b} className="tag-pill">
              {b}
            </span>
          ))}
        </div>

        <div className={`book-card-status-dot ${availClass}`}>
          <span className="status-dot"></span>
          <span>{avail}</span>
        </div>

        <div className="book-card-footer-actions">
          <button
            type="button"
            className="btn-card-details"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(book);
            }}
          >
            View Details →
          </button>

          {extraAction ? (
            <div className="extra-action-slot" onClick={(e) => e.stopPropagation()}>
              {extraAction}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (onSelect) {
    return cardContent;
  }

  return (
    <Link to={`/books/${book.id}`} className="card-link-wrapper">
      {cardContent}
    </Link>
  );
}

/**
 * TopBookCard: Retained for backwards compatibility, delegates to BookCard.
 */
export function TopBookCard({ book, rank, onSelect }) {
  return <BookCard book={book} rank={rank} onSelect={onSelect} />;
}

/**
 * SuggestionCard: Compact card for suggestions strips.
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
      <BookCover
        src={book.image}
        alt={book.title}
        containerClassName="suggestion-thumb"
      />
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
 * RecommendationCard: Detailed recommendation card used in AI Reasoning trace.
 */
export function RecommendationCard({ book, rank, onSelect }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!book?.id) return;
    setFav(isFavorite(book.id));
    function handleUpdate() {
      setFav(isFavorite(book.id));
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
        <BookCover
          src={book.image}
          alt={book.title}
          containerClassName="rec-card-cover-wrap"
        />
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
      </div>
    </article>
  );
}
