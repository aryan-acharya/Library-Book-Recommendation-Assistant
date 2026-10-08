import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, LoadingState, ErrorState } from '../components/UIComponents';

export default function KnowledgeBase() {
  const [data, setData] = useState(null);
  const [bookId, setBookId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load(id) {
    setLoading(true);
    api
      .knowledgeBase(id || undefined)
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="knowledge-base-page">
      <PageHeader
        title="Knowledge Base (KB)"
        description="The complete Popular-Books-10000plus-Ratings-Enriched.csv dataset (10,538 books) serves as LibraAI’s Knowledge Base. Every book is represented as structured facts for rule-based inference."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        }
      />

      {loading && !data ? (
        <LoadingState message="Loading Knowledge Base schema..." />
      ) : (
        <div className="kb-layout">
          <article className="panel">
            <h2>Book Schema &amp; Fact Hierarchy</h2>
            <ul className="tree">
              <li>
                <strong>Book Entity</strong>
                <ul>
                  {(data?.tree?.Book || []).map((field) => (
                    <li key={field}>
                      <code>{field}</code>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <p className="muted-hint" style={{ marginTop: '1rem' }}>
              {data?.tree?.note || '17 enriched metadata attributes per candidate.'}
            </p>
          </article>

          <article className="panel">
            <h2>Inspect Knowledge Representation for a Book</h2>
            <form
              className="study-search-bar"
              onSubmit={(e) => {
                e.preventDefault();
                load(bookId.trim());
              }}
            >
              <input
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="Enter Book ID e.g. B00001, B07470"
              />
              <button className="btn-small-primary" type="submit">
                Inspect Facts
              </button>
            </form>

            {error ? <ErrorState message={error} onRetry={() => load('B00001')} /> : null}

            {data?.sample ? (
              <div className="kb-sample-preview" style={{ marginTop: '1.25rem' }}>
                <div className="kb-sample-head">
                  <h3>
                    {data.sample.book.title}{' '}
                    <span className="badge-pill">ID: {data.sample.book.id}</span>
                  </h3>
                  <p className="muted-hint">
                    by <strong>{data.sample.book.author}</strong> · {data.sample.book.genre} (★ {data.sample.book.score})
                  </p>
                </div>
                <h4 style={{ color: '#38BDF8', margin: '1rem 0 0.5rem', fontSize: '0.9rem' }}>
                  Extracted Predicate Facts:
                </h4>
                <pre className="code-block">{(data.sample.facts || []).join('\n')}</pre>
              </div>
            ) : null}
          </article>
        </div>
      )}
    </div>
  );
}
