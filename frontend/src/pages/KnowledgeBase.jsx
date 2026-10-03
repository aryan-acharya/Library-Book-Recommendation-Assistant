import { useEffect, useState } from 'react';
import { api } from '../api';

export default function KnowledgeBase() {
  const [data, setData] = useState(null);
  const [bookId, setBookId] = useState('');
  const [error, setError] = useState('');

  function load(id) {
    api
      .knowledgeBase(id || undefined)
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <header className="section-head">
        <h1>Knowledge Base</h1>
        <p>
          The complete <strong>Popular-Books-10000plus-Ratings-Enriched.csv</strong> dataset
          ({data?.totalBooks || '10,538'} books) is LibraAI’s Knowledge Base. Every book is represented with
          structured facts.
        </p>
      </header>

      <div className="kb-layout">
        <article className="panel">
          <h2>Book Structure</h2>
          <ul className="tree">
            <li>
              Book
              <ul>
                {(data?.tree?.Book || []).map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </li>
          </ul>
          <p className="muted">{data?.tree?.note}</p>
        </article>

        <article className="panel">
          <h2>Inspect a Book</h2>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              load(bookId.trim());
            }}
          >
            <input
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              placeholder="Book ID e.g. B00001"
            />
            <button className="btn primary" type="submit">
              Load Facts
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
          {data?.sample ? (
            <>
              <h3>
                {data.sample.book.title}{' '}
                <span className="muted">({data.sample.book.id})</span>
              </h3>
              <p className="muted">{data.sample.book.author} · {data.sample.book.genre}</p>
              <pre className="code-block">{(data.sample.facts || []).join('\n')}</pre>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}
