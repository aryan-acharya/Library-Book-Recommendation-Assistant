import { useEffect, useState } from 'react';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';
import BookDetailsModal from '../components/BookDetailsModal';
import { PageHeader, LoadingState, EmptyState } from '../components/UIComponents';

export default function Availability() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ books: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [alternativesModal, setAlternativesModal] = useState(null);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [alternativesList, setAlternativesList] = useState([]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError('');

    async function fetchData() {
      try {
        if (searchQuery.trim()) {
          // Use search endpoint with query
          const res = await api.search(searchQuery.trim(), page, 16);
          if (!isCancelled) {
            let books = res.books || [];
            if (statusFilter) {
              const sf = statusFilter.toLowerCase();
              books = books.filter((b) => {
                const a = (b.availability || '').toLowerCase();
                if (sf === 'available') return a === 'available';
                if (sf === 'limited') return a === 'limited';
                if (sf === 'unavailable' || sf === 'issued' || sf === 'reserved')
                  return a === 'unavailable';
                return true;
              });
            }
            setData({
              books,
              total: books.length,
              page: res.page || page,
              pages: res.pages || 1,
            });
          }
        } else {
          // Catalog browse with availability filter
          const params = { page, limit: 16 };
          if (statusFilter) {
            if (statusFilter === 'Issued' || statusFilter === 'Reserved') {
              params.availability = 'Unavailable';
            } else {
              params.availability = statusFilter;
            }
          }
          const res = await api.books(params);
          if (!isCancelled) {
            setData(res);
          }
        }
      } catch (e) {
        if (!isCancelled) {
          console.error(e);
          setError(e.message || 'Failed to load book availability.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [statusFilter, searchQuery, page]);

  function handleFilter(status) {
    setStatusFilter(status);
    setPage(1);
  }

  async function handleFindAlternatives(book, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    setAlternativesModal(book);
    setAlternativesLoading(true);
    try {
      const res = await api.similar(book.id);
      // Filter for strictly Available books
      const availableOnly = (res.similar || []).filter(
        (b) => (b.availability || '').toLowerCase() === 'available'
      );
      setAlternativesList(availableOnly);
    } catch (err) {
      console.error(err);
      setAlternativesList([]);
    } finally {
      setAlternativesLoading(false);
    }
  }

  const statusTabs = [
    { id: '', label: 'All Catalog' },
    { id: 'Available', label: '● Available (5,990)', color: 'available' },
    { id: 'Limited', label: '● Limited (4,323)', color: 'limited' },
    { id: 'Issued', label: '● Issued (225)', color: 'issued' },
    { id: 'Reserved', label: '● Reserved', color: 'reserved' },
  ];

  return (
    <div className="availability-page">
      <PageHeader
        title="Library Book Availability"
        description="Monitor real-time circulation status across the 10,538-book digital collection. If a book is limited or issued, instantly find available alternatives using the similarity engine."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        }
      />

      {/* KPI Status Grid */}
      <div className="availability-kpi-grid">
        <div
          className={`avail-kpi-card available ${statusFilter === 'Available' ? 'selected' : ''}`}
          onClick={() => handleFilter(statusFilter === 'Available' ? '' : 'Available')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-header-row">
            <span className="avail-status-dot green">●</span>
            <span className="avail-badge green">56.8% of Catalog</span>
          </div>
          <strong className="kpi-count">Available</strong>
          <span className="kpi-sub">5,990 copies ready for immediate checkout</span>
        </div>

        <div
          className={`avail-kpi-card limited ${statusFilter === 'Limited' ? 'selected' : ''}`}
          onClick={() => handleFilter(statusFilter === 'Limited' ? '' : 'Limited')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-header-row">
            <span className="avail-status-dot amber">●</span>
            <span className="avail-badge amber">41.0% of Catalog</span>
          </div>
          <strong className="kpi-count">Limited</strong>
          <span className="kpi-sub">4,323 copies in high demand with low stock</span>
        </div>

        <div
          className={`avail-kpi-card issued ${statusFilter === 'Issued' ? 'selected' : ''}`}
          onClick={() => handleFilter(statusFilter === 'Issued' ? '' : 'Issued')}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-header-row">
            <span className="avail-status-dot red">●</span>
            <span className="avail-badge red">2.2% of Catalog</span>
          </div>
          <strong className="kpi-count">Issued / Checked Out</strong>
          <span className="kpi-sub">225 titles currently on loan or reserved</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="availability-controls-card">
        {/* Search input */}
        <div className="avail-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="avail-search-input"
            placeholder="Search books, authors, genres..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="avail-filter-pills-row">
          <span className="filter-label">Status Filter:</span>
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pill-btn ${tab.color || ''} ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => handleFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meta Results Bar */}
      <div className="avail-results-meta-row">
        <span>
          Showing {data.books?.length || 0} books (Page {data.page || page} of {data.pages || 1})
          {data.total ? ` · Total matches: ${data.total.toLocaleString()}` : ''}
          {statusFilter ? ` · Filtered by: ${statusFilter}` : ''}
        </span>
      </div>

      {/* Content State */}
      {loading ? (
        <LoadingState message="Loading catalog circulation data..." />
      ) : error ? (
        <div className="error-alert-card">
          <p>{error}</p>
          <button
            type="button"
            className="btn-small-primary"
            onClick={() => {
              setStatusFilter('');
              setSearchQuery('');
              setPage(1);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : data.books?.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No Books Found"
          message="No catalog titles matched your current search and availability filters."
          actionText="Clear Filters"
          onAction={() => {
            setStatusFilter('');
            setSearchQuery('');
            setPage(1);
          }}
        />
      ) : (
        <div className="books-grid">
          {data.books.map((book) => {
            const availLower = (book.availability || '').toLowerCase();
            const isUnavailableOrLimited = availLower !== 'available';

            return (
              <div key={book.id} className="avail-book-card-wrap">
                <BookCard
                  book={book}
                  onSelect={() => setSelectedBook(book)}
                  extraAction={
                    isUnavailableOrLimited ? (
                      <button
                        type="button"
                        className="btn-find-alternatives-pill"
                        onClick={(e) => handleFindAlternatives(book, e)}
                      >
                        ⚡ Find Available Alternatives
                      </button>
                    ) : null
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {data.pages > 1 && (
        <div className="pagination-bar">
          <button
            type="button"
            className="btn-page"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span className="page-indicator">
            Page {page} of {data.pages}
          </span>
          <button
            type="button"
            className="btn-page"
            disabled={page >= data.pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Selected Book Details Modal */}
      {selectedBook && (
        <BookDetailsModal
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Available Alternatives Modal */}
      {alternativesModal && (
        <div className="modal-backdrop" onClick={() => setAlternativesModal(null)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setAlternativesModal(null)}
            >
              ✕
            </button>

            <div className="alternatives-modal-content">
              <div className="alt-modal-header">
                <span className="status-pill warning">
                  Currently {alternativesModal.availability || 'Unavailable'}
                </span>
                <h3>
                  Available Alternatives for “{alternativesModal.title}”
                </h3>
                <p className="alt-sub">
                  Recommended available books with matching genre ({alternativesModal.genre}), themes, and reading style computed by semantic similarity.
                </p>
              </div>

              {alternativesLoading ? (
                <LoadingState message="Finding available alternatives..." />
              ) : alternativesList.length === 0 ? (
                <EmptyState
                  icon="🔍"
                  title="No Direct Available Alternatives"
                  message="We couldn’t find direct available semantic alternatives for this title."
                />
              ) : (
                <div className="alt-results-grid">
                  {alternativesList.map((altBook) => (
                    <div key={altBook.id} className="alt-book-item">
                      <BookCard
                        book={altBook}
                        onSelect={() => {
                          setAlternativesModal(null);
                          setSelectedBook(altBook);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
