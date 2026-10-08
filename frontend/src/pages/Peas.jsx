import { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, LoadingState, ErrorState } from '../components/UIComponents';

export default function Peas() {
  const [peas, setPeas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .peas()
      .then(setPeas)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="peas-page">
        <PageHeader
          title="Intelligent Agent — PEAS Framework"
          description="Formal AI task environment specification for the LibraAI recommendation agent."
        />
        <LoadingState message="Loading PEAS model..." />
      </div>
    );
  }

  if (error || !peas) {
    return (
      <div className="peas-page">
        <PageHeader
          title="Intelligent Agent — PEAS Framework"
          description="Error loading PEAS specification."
        />
        <ErrorState message={error || 'Failed to load PEAS.'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const blocks = [
    { key: 'performanceMeasure', title: 'Performance Measure', accent: 'p', icon: '🎯' },
    { key: 'environment', title: 'Environment', accent: 'e', icon: '🌐' },
    { key: 'actuators', title: 'Actuators', accent: 'a', icon: '⚙️' },
    { key: 'sensors', title: 'Sensors', accent: 's', icon: '📡' },
  ];

  return (
    <div className="peas-page">
      <PageHeader
        title="Intelligent Agent — PEAS Framework"
        description={peas.agent || 'Formal AI agent model: Performance, Environment, Actuators, and Sensors.'}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        }
      />

      <div className="peas-grid">
        {blocks.map((block) => (
          <article key={block.key} className={`peas-card accent-${block.accent}`}>
            <div className="peas-card-top">
              <span className="peas-icon">{block.icon}</span>
              <h2>{block.title}</h2>
            </div>
            <ul>
              {(peas[block.key] || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
