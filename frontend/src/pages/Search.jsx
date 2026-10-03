import { useState } from 'react';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';

export default function Search() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runSearch(e, nextPage = 1) {
    e?.preventDefault?.();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setPage(nextPage);
    try {
      const result = await api.search(query.trim(), nextPage, 20);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <header className="section-head">
        <h1>Search Library</h1>
        <p>
          Library Search Results are distinct from AI Recommendations. Search matches title, author, description,
          genre, subgenre, themes, and keywords in the dataset.
        </p>
      </header>

      <form className="search-form" onSubmit={(e) => runSearch(e, 1)}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: Artificial Intelligence"
        />
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {data ? (
        <>
          <h2>Library Search Results</h2>
          <p className="muted">
            {data.total} matches for “{data.query}”
          </p>
          <div className="book-grid">
            {(data.books || []).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <div className="pager">
            <button className="btn" disabled={page <= 1} onClick={() => runSearch(null, page - 1)}>
              Previous
            </button>
            <span>
              Page {page} / {data.pages || 1}
            </span>
            <button
              className="btn"
              disabled={page >= (data.pages || 1)}
              onClick={() => runSearch(null, page + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
