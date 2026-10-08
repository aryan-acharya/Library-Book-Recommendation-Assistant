import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Cover, BookCard } from '../components/BookComponents';
import { PageHeader, LoadingState, ErrorState } from '../components/UIComponents';
import {
  isFavorite,
  toggleFavorite,
  addRecentlyViewed,
} from '../libraryStore';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favored, setFavored] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError('');

    async function loadBookData() {
      try {
        const res = await api.book(id);
        if (isCancelled) return;
        setData(res);
        if (res.book) {
          setFavored(isFavorite(res.book.id));
          addRecentlyViewed(res.book);

          // Fetch similar books
          setLoadingSimilar(true);
          try {
            const simRes = await api.similar(res.book.id);
            if (!isCancelled) {
              setSimilarBooks(simRes.similar || []);
            }
          } catch (e) {
            console.error('Failed to load similar books:', e);
          } finally {
            if (!isCancelled) setLoadingSimilar(false);
          }
        }
      } catch (e) {
        if (!isCancelled) {
          setError(e.message || 'Failed to load book details.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadBookData();

    function onStorage() {
      if (data?.book) {
        setFavored(isFavorite(data.book.id));
      }
    }
    window.addEventListener('libraai_store_update', onStorage);

    return () => {
      isCancelled = true;
      window.removeEventListener('libraai_store_update', onStorage);
    };
  }, [id]);

  function handleToggleFavorite() {
    if (!data?.book) return;
    const nowFav = toggleFavorite(data.book);
    setFavored(nowFav);
  }

  function handleFindSimilar() {
    if (!data?.book) return;
    navigate(`/similar?bookId=${data.book.id}`);
  }

  function handleAddToStudy() {
    if (!data?.book) return;
    navigate(`/study?bookId=${data.book.id}`);
  }

  if (loading) {
    return (
      <div className="book-detail-page">
        <PageHeader title="Book Details" description="Loading book information..." />
        <LoadingState message="Fetching catalog details from Knowledge Base..." />
      </div>
    );
  }

  if (error || !data || !data.book) {
    return (
      <div className="book-detail-page">
        <PageHeader title="Book Details" description="Error loading book." />
        <ErrorState
          message={error || 'Book could not be found.'}
          onRetry={() => window.location.reload()}
          onBack={() => navigate('/search')}
        />
      </div>
    );
  }

  const book = data.book;
  const availLower = (book.availability || '').toLowerCase();
  const isAvailable = availLower === 'available';
  const isLimited = availLower === 'limited';

  // Compute estimated pages
  const estPages =
    (book.length || '').toLowerCase() === 'short'
      ? '180 pages'
      : (book.length || '').toLowerCase() === 'long'
      ? '540 pages'
      : '320 pages';

  return (
    <div className="book-detail-page">
      <PageHeader
        title={book.title}
        description={`by ${book.author} · Comprehensive catalog and AI recommendation analysis`}
        action={
          <button
            type="button"
            className="btn-back-pill"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        }
      />

      {/* Main Hero Card */}
      <div className="detail-hero-card">
        <div className="detail-cover-col">
          <Cover src={book.image} alt={book.title} className="detail-cover-large" />
          <div className="detail-cta-stack">
            <button
              type="button"
              className={`btn-detail-fav ${favored ? 'favorited' : ''}`}
              onClick={handleToggleFavorite}
            >
              {favored ? '♥ Saved in Favorites' : '♡ Add to Favorites'}
            </button>
            <button
              type="button"
              className="btn-detail-study"
              onClick={handleAddToStudy}
            >
              📖 Add to Study Companion
            </button>
            <button
              type="button"
              className="btn-detail-similar"
              onClick={handleFindSimilar}
            >
              ⚡ Find Similar Books
            </button>
          </div>
        </div>

        <div className="detail-body-col">
          <div className="detail-title-group">
            <div className="detail-header-badges">
              <span className={`status-pill ${isAvailable ? 'available' : isLimited ? 'limited' : 'unavailable'}`}>
                ● {book.availability || 'Available'}
              </span>
              <span className="badge-pill">ID: {book.id}</span>
              {book.score && (
                <span className="badge-pill gold">★ {book.score} Rating</span>
              )}
            </div>

            <h1 className="detail-book-title">{book.title}</h1>
            <p className="detail-book-author">by <strong>{book.author}</strong></p>
          </div>

          {/* Key Metadata Grid */}
          <div className="detail-metadata-grid">
            <div className="meta-box">
              <span className="meta-label">Rating</span>
              <strong className="meta-val">★ {book.score || '—'} / 5.0</strong>
              <span className="meta-sub">{book.ratings ? `${book.ratings.toLocaleString()} ratings` : 'Goodreads'}</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Pages</span>
              <strong className="meta-val">{estPages}</strong>
              <span className="meta-sub">{book.length || 'Medium'} Length</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Publication Year</span>
              <strong className="meta-val">{book.published || 'Classic'}</strong>
              <span className="meta-sub">Edition</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Difficulty / Level</span>
              <strong className="meta-val">{book.readingLevel || 'Intermediate'}</strong>
              <span className="meta-sub">{book.ageGroup || 'General'}</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Mood</span>
              <strong className="meta-val">{book.mood || 'Engaging'}</strong>
              <span className="meta-sub">Tone</span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Circulation Status</span>
              <strong className={`meta-val ${isAvailable ? 'green' : isLimited ? 'amber' : 'red'}`}>
                {book.availability || 'Available'}
              </strong>
              <span className="meta-sub">Library Stock</span>
            </div>
          </div>

          {/* Description */}
          <div className="detail-description-section">
            <h3>Description</h3>
            <p className="description-text">
              {book.description || 'No summary available for this catalog entry.'}
            </p>
          </div>

          {/* Genres, Themes, Keywords Chips */}
          <div className="detail-tags-section">
            <div className="tag-group">
              <span className="tag-group-title">Genres:</span>
              <div className="chips-wrap">
                <span className="chip primary">{book.genre}</span>
                {book.subgenre && <span className="chip">{book.subgenre}</span>}
              </div>
            </div>

            {(book.themes || []).length > 0 && (
              <div className="tag-group">
                <span className="tag-group-title">Themes:</span>
                <div className="chips-wrap">
                  {book.themes.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {(book.keywords || []).length > 0 && (
              <div className="tag-group">
                <span className="tag-group-title">Keywords:</span>
                <div className="chips-wrap">
                  {book.keywords.map((kw) => (
                    <span key={kw} className="chip">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Why You Might Like This */}
      <section className="detail-panel-section">
        <div className="section-title-wrap">
          <span className="section-icon">💡</span>
          <h2>Why You Might Like This</h2>
        </div>
        <div className="why-like-content-box">
          <p>
            <strong>{book.title}</strong> is characterized by a <strong>{book.mood || 'captivating'}</strong> narrative style within <strong>{book.genre || 'its genre'}</strong>.
            With a <strong>★ {book.score || 4.0}</strong> community rating across {book.ratings?.toLocaleString?.() || 'thousands of'} readers, it matches readers seeking a <strong>{book.readingLevel || 'standard'}</strong> reading curve.
          </p>
          <div className="why-badges-row">
            <span className="signal-pill">✓ Strong Genre Fit: {book.genre}</span>
            <span className="signal-pill">✓ Mood Match: {book.mood}</span>
            <span className="signal-pill">✓ Level: {book.readingLevel}</span>
            <span className="signal-pill">✓ Popularity: {book.ratings?.toLocaleString?.() || 'High'} readers</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Availability */}
      <section className="detail-panel-section">
        <div className="section-title-wrap">
          <span className="section-icon">📚</span>
          <h2>Availability Status</h2>
        </div>
        <div className={`availability-status-card ${isAvailable ? 'available' : isLimited ? 'limited' : 'unavailable'}`}>
          <div className="status-indicator-col">
            <span className="big-status-dot">●</span>
            <div>
              <h3>Status: {book.availability || 'Available'}</h3>
              <p>
                {isAvailable
                  ? 'Ready for checkout: multiple copies are currently on the shelf in the digital library.'
                  : isLimited
                  ? 'Limited copies remain: currently in high circulation demand.'
                  : 'Currently issued or reserved: consider checking available alternatives.'}
              </p>
            </div>
          </div>
          {!isAvailable && (
            <button
              type="button"
              className="btn-small-primary"
              onClick={handleFindSimilar}
            >
              Find Available Alternatives →
            </button>
          )}
        </div>
      </section>

      {/* SECTION 3: Similar Books */}
      <section className="detail-panel-section">
        <div className="section-title-wrap">
          <span className="section-icon">⚡</span>
          <h2>Similar Books</h2>
        </div>

        {loadingSimilar ? (
          <LoadingState message="Finding semantically related books..." />
        ) : similarBooks.length === 0 ? (
          <p className="empty-subtle">No similar books found in the immediate neighborhood.</p>
        ) : (
          <div className="books-grid">
            {similarBooks.slice(0, 4).map((simBook) => (
              <div key={simBook.id} className="similar-book-card-wrap">
                <BookCard
                  book={simBook}
                  similarityScore={simBook.similarityScore}
                  onSelect={() => navigate(`/books/${simBook.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
