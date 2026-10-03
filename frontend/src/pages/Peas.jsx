import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Peas() {
  const [peas, setPeas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.peas().then(setPeas).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!peas) return <p>Loading PEAS…</p>;

  const blocks = [
    { key: 'performanceMeasure', title: 'Performance Measure', accent: 'p' },
    { key: 'environment', title: 'Environment', accent: 'e' },
    { key: 'actuators', title: 'Actuators', accent: 'a' },
    { key: 'sensors', title: 'Sensors', accent: 's' },
  ];

  return (
    <section>
      <header className="section-head">
        <h1>Intelligent Agent – PEAS</h1>
        <p>{peas.agent}</p>
      </header>

      <div className="peas-grid">
        {blocks.map((block) => (
          <article key={block.key} className={`peas-card accent-${block.accent}`}>
            <h2>{block.title}</h2>
            <ul>
              {(peas[block.key] || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
