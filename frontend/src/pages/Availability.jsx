import { useEffect, useState } from 'react';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';

export default function Availability() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ books: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [alternativesModal, setAlternativesModal] = useState(null);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [alternativesList, setAlternativesList] = useState([]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 16 };
    if (statusFilter) params.availability = statusFilter;

    api
      .books(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  function handleFilter(status) {
    setStatusFilter(status);
    setPage(1);
  }

  async function handleFindAlternatives(book, e) {
    e?.stopPropagation();
    setAlternativesModal(book);
    setAlternativesLoading(true);
    try {
      const res = await api.similar(book.id);
      // Filter for strictly Available books
      const availableOnly = (res.similar || []).filter(
        (b) => (b.availability || '').toLowerCase() === 'available'
      );
      setAlternativesList(availableOnly);
    } catch {
      setAlternativesList([]);
    } finally {
      setAlternativesLoading(false);
    }
  }

  return (
    <div className="availability-page">
      <header className="page-header-strip">
        <div className="header-titles">
          <h1>Library Book Availability Status</h1>
          <p>
            Real-time catalog circulation statuses across the 10,538-book digital collection. If a book is limited or checked out, instantly find available alternatives.
          </p>
        </div>

        {/* Availability Filter Buttons */}
        <div className="availability-filter-tabs">
          <button
            type="button"
            className={`tab-btn ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => handleFilter('')}
          >
            All Catalog
          </button>
          <button
            type="button"
            className={`tab-btn available ${statusFilter === 'Available' ? 'active' : ''}`}
            onClick={() => handleFilter('Available')}
          >
            ● Available
          </button>
          <button
            type="button"
            className={`tab-btn limited ${statusFilter === 'Limited' ? 'active' : ''}`}
            onClick={() => handleFilter('Limited')}
          >
            ● Limited
          </button>
          <button
            type="button"
            className={`tab-btn unavailable ${statusFilter === 'Unavailable' ? 'active' : ''}`}
            onClick={() => handleFilter('Unavailable')}
          >
            ● Unavailable / Issued
          </button>
        </div>
      </header>

      {/* Overview Status Cards */}
      <div className="availability-stats-grid">
        <div className="avail-stat-card available" onClick={() => handleFilter('Available')}>
          <span className="dot">●</span>
          <div className="meta">
            <strong>Available</strong>
            <span>Ready for immediate checkout</span>
          </div>
        </div>
        <div className="avail-stat-card limited" onClick={() => handleFilter('Limited')}>
          <span className="dot">●</span>
          <div className="meta">
            <strong>Limited Copies</strong>
            <span>High demand, low copy count</span>
          </div>
        </div>
        <div className="avail-stat-card unavailable" onClick={() => handleFilter('Unavailable')}>
          <span className="dot">●</span>
          <div className="meta">
            <strong>Issued / Unavailable</strong>
            <span>Reserved or out on loan</span>
          </div>
        </div>
      </div>

      <div className="results-count-row">
        <span>
          Showing {data.books?.length || 0} books (Page {data.page || page} of {data.pages || 1}) · Total matches: {data.total?.toLocaleString?.() || 0}
        </span>
      </div>

      {loading ? (
        <div className="loading-state-banner">
          <div className="loading-pulse-spinner"></div>
          <p>Loading circulation data...</p>
        </div>
      ) : null}

      {error ? <div className="error-alert-card">{error}</div> : null}

      {/* Book Grid with Alternatives Button for Limited/Unavailable */}
      <div className="availability-books-grid">
        {(data.books || []).map((book) => {
          const isLimitedOrOut =
            (book.availability || '').toLowerCase() !== 'available';
          return (
            <div key={book.id} className="availability-card-wrapper">
              <BookCard book={book} onSelect={() => setSelectedBook(book)} />
              {isLimitedOrOut ? (
                <button
                  type="button"
                  className="btn-find-alternatives"
                  onClick={(e) => handleFindAlternatives(book, e)}
                >
                  ⚡ Find Available Alternatives
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="pagination-bar">
        <button
          type="button"
          className="btn-page"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span className="page-indicator">
          Page {page} / {data.pages || 1}
        </span>
        <button
          type="button"
          className="btn-page"
          disabled={page >= (data.pages || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {/* Selected Book Details Modal */}
      {selectedBook ? (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}

      {/* Alternatives Modal */}
      {alternativesModal ? (
        <div className="modal-backdrop" onClick={() => setAlternativesModal(null)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setAlternativesModal(null)}
            >
              ✕
            </button>
            <div className="alternatives-modal-content">
              <h3>
                Available Alternatives for “{alternativesModal.title}” ({alternativesModal.availability})
              </h3>
              <p className="muted">
                Since this book is currently {alternativesModal.availability.toLowerCase()}, here are matching available books with similar genres, themes, and ratings:
              </p>

              {alternativesLoading ? (
                <div className="loading-state-banner">
                  <div className="loading-pulse-spinner"></div>
                  <p>Searching for available alternatives...</p>
                </div>
              ) : alternativesList.length === 0 ? (
                <p>No immediate available alternatives found with high similarity.</p>
              ) : (
                <div className="alternatives-grid-modal">
                  {alternativesList.map((altBook) => (
                    <div
                      key={altBook.id}
                      className="alt-book-item"
                      onClick={() => {
                        setAlternativesModal(null);
                        setSelectedBook(altBook);
                      }}
                    >
                      <img src={altBook.image} alt={altBook.title} className="alt-thumb" />
                      <div className="alt-info">
                        <strong>{altBook.title}</strong>
                        <span>{altBook.author}</span>
                        <div className="alt-badge-row">
                          <span className="match-pill">{altBook.similarityScore}% Match</span>
                          <span className="status-pill available">● Available</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
