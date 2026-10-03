import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Cover } from '../components/BookComponents';

export default function BookDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .book(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading book details…</p>;

  const book = data.book;

  return (
    <section className="book-detail">
      <div className="detail-hero">
        <Cover src={book.image} alt={book.title} className="detail-cover" />
        <div>
          <h1>{book.title}</h1>
          <p className="author">{book.author}</p>
          <div className="chip-row">
            <span className="chip">{book.genre}</span>
            <span className="chip">{book.subgenre}</span>
            <span className="chip">{book.mood}</span>
            <span className="chip">{book.readingLevel}</span>
            <span className="chip">{book.ageGroup}</span>
            <span className="chip">{book.length}</span>
            <span className="chip">{book.availability}</span>
          </div>
          <div className="meta-grid">
            <span>★ Score {book.score}</span>
            <span>{book.ratings?.toLocaleString()} ratings</span>
            <span>{book.shelvings?.toLocaleString()} shelvings</span>
            <span>Published {book.published}</span>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link
              className="btn primary"
              to={`/recommend?genre=${encodeURIComponent(book.genre || '')}&mood=${encodeURIComponent(book.mood || '')}&theme=${encodeURIComponent(book.themes?.[0] || '')}&readingLevel=${encodeURIComponent(book.readingLevel || '')}&interest=${encodeURIComponent(book.subgenre || '')}`}
            >
              ⛰️ Find Similar Books via AI (Hill Climbing)
            </Link>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <article className="panel">
          <h2>Description</h2>
          <p>{book.description || 'No description available.'}</p>
          <h3>Themes</h3>
          <p>{(book.themes || []).join(', ') || '—'}</p>
          <h3>Keywords</h3>
          <p>{(book.keywords || []).join(', ') || '—'}</p>
          <p className="muted">
            Note: Length and Availability are derived/simulated fields for this academic prototype.
          </p>
        </article>

        <article className="panel">
          <h2>Knowledge Representation</h2>
          <pre className="code-block">{(data.knowledgeRepresentation || []).join('\n')}</pre>
        </article>
      </div>

      <h2>Related Books</h2>
      <div className="related-row">
        {(data.related || []).map((b) => (
          <Link key={b.id} to={`/books/${b.id}`} className="related-item">
            <Cover src={b.image} alt={b.title} />
            <span>{b.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
