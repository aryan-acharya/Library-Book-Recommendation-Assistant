import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { RecommendationCard } from '../components/BookComponents';

const emptyForm = {
  genre: '',
  interest: '',
  mood: '',
  readingLevel: 'Intermediate',
  ageGroup: 'Adult',
  length: 'Any',
  theme: '',
  minimumRating: '4.0',
  keywords: '',
  reasoningMethod: 'forward',
  restarts: '8',
};

export default function Recommend() {
  const [searchParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.meta().then(setMeta).catch((e) => setError(e.message));
  }, []);

  // Pre-fill from URL query parameters (e.g. from "Find Similar Books" on BookDetails)
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const moodParam = searchParams.get('mood');
    const themeParam = searchParams.get('theme');
    const levelParam = searchParams.get('readingLevel');
    const interestParam = searchParams.get('interest');
    const ratingParam = searchParams.get('minimumRating');

    if (genreParam || moodParam || themeParam || levelParam || interestParam) {
      setForm((prev) => ({
        ...prev,
        genre: genreParam || prev.genre,
        mood: moodParam || prev.mood,
        theme: themeParam || prev.theme,
        readingLevel: levelParam || prev.readingLevel,
        interest: interestParam || prev.interest,
        minimumRating: ratingParam || prev.minimumRating,
      }));
    }
  }, [searchParams]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        keywords: form.keywords
          ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        minimumRating: form.minimumRating === 'any' ? null : Number(form.minimumRating),
        restarts: Number(form.restarts || 8),
      };
      const data = await api.recommend(payload);
      setResult(data);
      sessionStorage.setItem('libraai_last_reasoning', JSON.stringify(data));
    } catch (err) {
      setError(err.message || 'Recommendation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="recommend-page">
      <header className="section-head">
        <h1>AI Recommendations</h1>
        <p>
          Enter preferences. LibraAI converts them into facts, evaluates IF–THEN rules, applies forward/backward chaining,
          scores candidates dynamically, and optimizes the Top 5 via Random-Restart Hill Climbing.
        </p>
      </header>

      <form className="pref-form" onSubmit={onSubmit}>
        <label>
          Genre
          <select value={form.genre} onChange={(e) => update('genre', e.target.value)}>
            <option value="">Any</option>
            {(meta?.genres || []).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label>
          Interest / Topic
          <input
            value={form.interest}
            onChange={(e) => update('interest', e.target.value)}
            placeholder="e.g. Mystery, Programming, Psychology"
          />
        </label>

        <label>
          Mood
          <select value={form.mood} onChange={(e) => update('mood', e.target.value)}>
            <option value="">Any</option>
            {(meta?.moods || []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label>
          Reading Level
          <select value={form.readingLevel} onChange={(e) => update('readingLevel', e.target.value)}>
            {(meta?.readingLevels || ['Beginner', 'Intermediate', 'Advanced']).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          Age Group
          <select value={form.ageGroup} onChange={(e) => update('ageGroup', e.target.value)}>
            {(meta?.ageGroups || []).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          Preferred Length
          <select value={form.length} onChange={(e) => update('length', e.target.value)}>
            {(meta?.lengths || ['Short', 'Medium', 'Long', 'Any']).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          Theme
          <select value={form.theme} onChange={(e) => update('theme', e.target.value)}>
            <option value="">Any</option>
            {(meta?.themes || []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          Minimum Rating
          <select value={form.minimumRating} onChange={(e) => update('minimumRating', e.target.value)}>
            <option value="any">Any</option>
            <option value="3.0">3.0+</option>
            <option value="3.5">3.5+</option>
            <option value="4.0">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </label>

        <label>
          Hill Climbing Restarts
          <select value={form.restarts} onChange={(e) => update('restarts', e.target.value)}>
            <option value="5">5 Restarts</option>
            <option value="8">8 Restarts (Recommended)</option>
            <option value="10">10 Restarts</option>
          </select>
        </label>

        <label className="full">
          Keywords (comma-separated)
          <input
            value={form.keywords}
            onChange={(e) => update('keywords', e.target.value)}
            placeholder="ghost, murder, robot"
          />
        </label>

        <fieldset className="full reasoning-method">
          <legend>Reasoning Method</legend>
          <label className="radio">
            <input
              type="radio"
              name="reasoningMethod"
              checked={form.reasoningMethod === 'forward'}
              onChange={() => update('reasoningMethod', 'forward')}
            />
            Forward Chaining
          </label>
          <label className="radio">
            <input
              type="radio"
              name="reasoningMethod"
              checked={form.reasoningMethod === 'backward'}
              onChange={() => update('reasoningMethod', 'backward')}
            />
            Backward Chaining
          </label>
        </fieldset>

        <div className="full actions">
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Optimizing with Hill Climbing…' : 'Get AI Recommendations'}
          </button>
          {result ? (
            <button className="btn" type="button" onClick={() => navigate('/reasoning')}>
              Open AI Reasoning Page
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="results-block">
          <div className="insight-strip">
            <div>
              <strong>{result.facts?.length || 0}</strong>
              <span>User Facts</span>
            </div>
            <div>
              <strong>{result.candidateBooks?.length || 0}</strong>
              <span>Candidates</span>
            </div>
            <div>
              <strong>{result.restarts?.length || 0}</strong>
              <span>HC Restarts</span>
            </div>
            <div>
              <strong>{result.hillClimbing?.bestScore || 0}/20</strong>
              <span>Best HC Score</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.2rem 0' }}>
            <h2 style={{ margin: 0 }}>Top 5 Recommendations (Hill Climbing Optimized)</h2>
            <button
              className="btn"
              type="button"
              onClick={() => navigate('/reasoning')}
              style={{ fontSize: '0.85rem' }}
            >
              ⛰️ View Full Hill Climbing Search Trace →
            </button>
          </div>

          <div className="rec-list">
            {(result.recommendations || []).map((book, i) => (
              <RecommendationCard key={book.id} book={book} rank={i + 1} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
