import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { addRecentlyViewed, isFavorite, toggleFavorite } from '../libraryStore';
import { Cover } from './BookComponents';

export default function BookDetailsModal({ bookId, bookData, onClose }) {
  const [data, setData] = useState(bookData ? { book: bookData } : null);
  const [loading, setLoading] = useState(!bookData?.description);
  const [favorited, setFavorited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const id = bookId || bookData?.id;
    if (!id) return;
    setFavorited(isFavorite(id));

    if (!data?.book?.description) {
      setLoading(true);
      api
        .book(id)
        .then((res) => {
          setData(res);
          addRecentlyViewed(res.book);
        })
        .catch(() => {
          if (bookData) setData({ book: bookData });
        })
        .finally(() => setLoading(false));
    } else {
      addRecentlyViewed(data.book);
    }
  }, [bookId, bookData]);

  if (!bookId && !bookData) return null;
  const book = data?.book || bookData || {};

  function handleFavoriteToggle(e) {
    e.stopPropagation();
    const next = toggleFavorite(book);
    setFavorited(next);
  }

  function handleStudyCompanion() {
    onClose?.();
    navigate(`/study?bookId=${encodeURIComponent(book.id)}`);
  }

  function handleSimilarBooks() {
    onClose?.();
    navigate(`/similar?bookId=${encodeURIComponent(book.id)}`);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="modal-content">
          <div className="modal-cover-col">
            <Cover src={book.image} alt={book.title} className="modal-cover" />
            <button
              type="button"
              className={`btn-fav-toggle ${favorited ? 'active' : ''}`}
              onClick={handleFavoriteToggle}
            >
              {favorited ? '♥ Favorited' : '♡ Add to Favorites'}
            </button>
            <button
              type="button"
              className="btn-action-outline"
              onClick={handleStudyCompanion}
            >
              📖 Create Study Plan
            </button>
            <button
              type="button"
              className="btn-action-outline"
              onClick={handleSimilarBooks}
            >
              🔗 Find Similar Books
            </button>
          </div>

          <div className="modal-info-col">
            <div className="modal-header-info">
              <div className="modal-badges">
                <span className={`status-pill ${book.availability?.toLowerCase()}`}>
                  ● {book.availability || 'Available'}
                </span>
                <span className="badge-pill">{book.genre}</span>
                {book.subgenre && book.subgenre !== 'General' ? (
                  <span className="badge-pill">{book.subgenre}</span>
                ) : null}
              </div>
              <h2 className="modal-title">{book.title}</h2>
              <p className="modal-author">by {book.author}</p>
              <div className="modal-meta-row">
                <span className="rating-tag">★ {book.score || '4.0'}</span>
                {book.ratings ? <span>· {Number(book.ratings).toLocaleString()} ratings</span> : null}
                {book.published ? <span>· Published {book.published}</span> : null}
                {book.length ? <span>· {book.length} Length</span> : null}
                {book.readingLevel ? <span>· {book.readingLevel} Level</span> : null}
              </div>
            </div>

            {book.whyRecommended && book.whyRecommended.length > 0 ? (
              <div className="why-box">
                <h4>✨ Why this book was recommended:</h4>
                <ul className="why-list">
                  {book.whyRecommended.map((reason, idx) => (
                    <li key={idx}>✓ {reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="modal-description-box">
              <h4>Description</h4>
              <p>{book.description || 'No detailed description available in the knowledge base.'}</p>
            </div>

            {book.themes && book.themes.length > 0 ? (
              <div className="modal-tags-box">
                <h4>Themes</h4>
                <div className="tag-chips">
                  {book.themes.map((t) => (
                    <span key={t} className="tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {book.keywords && book.keywords.length > 0 ? (
              <div className="modal-tags-box">
                <h4>Keywords</h4>
                <div className="tag-chips">
                  {book.keywords.slice(0, 10).map((k) => (
                    <span key={k} className="tag-chip subtle">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="modal-footer-row">
              <Link
                to={`/books/${book.id}`}
                className="view-full-page-link"
                onClick={onClose}
              >
                Open Full Knowledge Base Page →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
