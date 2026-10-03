import { useEffect, useState } from 'react';
import { api } from '../api';
import { BookCard } from '../components/BookComponents';

const initialFilters = {
  genre: '',
  subgenre: '',
  mood: '',
  readingLevel: '',
  ageGroup: '',
  availability: '',
  minRating: '',
  publishedFrom: '',
  publishedTo: '',
};

export default function Explore() {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ books: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.meta().then(setMeta).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v != null) params[k] = v;
    });
    api
      .books(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, page]);

  function update(key, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section>
      <header className="section-head">
        <h1>Explore Library</h1>
        <p>Browse all 10,538 books from the Knowledge Base with server-side filters and pagination.</p>
      </header>

      <div className="filter-bar">
        <select value={filters.genre} onChange={(e) => update('genre', e.target.value)}>
          <option value="">All Genres</option>
          {(meta?.genres || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filters.subgenre} onChange={(e) => update('subgenre', e.target.value)}>
          <option value="">All Subgenres</option>
          {(meta?.subgenres || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filters.mood} onChange={(e) => update('mood', e.target.value)}>
          <option value="">All Moods</option>
          {(meta?.moods || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filters.readingLevel} onChange={(e) => update('readingLevel', e.target.value)}>
          <option value="">All Levels</option>
          {(meta?.readingLevels || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filters.ageGroup} onChange={(e) => update('ageGroup', e.target.value)}>
          <option value="">All Age Groups</option>
          {(meta?.ageGroups || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filters.availability} onChange={(e) => update('availability', e.target.value)}>
          <option value="">Any Availability</option>
          {(meta?.availabilities || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={filters.minRating} onChange={(e) => update('minRating', e.target.value)}>
          <option value="">Any Rating</option>
          <option value="3">3.0+</option>
          <option value="3.5">3.5+</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
        </select>
        <input
          type="number"
          placeholder="Year from"
          value={filters.publishedFrom}
          onChange={(e) => update('publishedFrom', e.target.value)}
        />
        <input
          type="number"
          placeholder="Year to"
          value={filters.publishedTo}
          onChange={(e) => update('publishedTo', e.target.value)}
        />
      </div>

      <p className="muted">
        Showing page {data.page || page} of {data.pages || 0} · {data.total?.toLocaleString?.() || 0} books
      </p>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading books…</p> : null}

      <div className="book-grid">
        {(data.books || []).map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      <div className="pager">
        <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {page} / {data.pages || 1}
        </span>
        <button className="btn" disabled={page >= (data.pages || 1)} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}
