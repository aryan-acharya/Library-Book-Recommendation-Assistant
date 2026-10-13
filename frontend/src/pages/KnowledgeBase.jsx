import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { PageHeader, LoadingState, ErrorState } from '../components/UIComponents';

const PRESET_BOOKS = [
  { id: 'B00001', label: 'B00001 · The English Assassin', genre: 'Thriller' },
  { id: 'B00788', label: 'B00788 · The Huntress', genre: 'Historical' },
  { id: 'B06643', label: 'B06643 · A Reaper at the Gates', genre: 'Fantasy' },
  { id: 'B07800', label: 'B07800 · These Silent Woods', genre: 'Mystery' },
  { id: 'B00010', label: 'B00010 · Harry Potter', genre: 'Adventure' },
];

const SCHEMA_CATEGORIES = [
  {
    id: 'identity',
    title: 'Core Identity & Bibliographic Info',
    badge: '3 Attributes',
    color: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.25)',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    description: 'Fundamental bibliographic identifiers and catalog authorship records.',
    attributes: [
      {
        name: 'Title',
        type: 'String',
        predicate: 'Title(BookID, "Title String")',
        description: 'Primary title as cataloged in Goodreads / library records.',
        sample: '"The English Assassin"',
        role: 'Unique entity representation & textual search index',
      },
      {
        name: 'Author',
        type: 'String',
        predicate: 'Author(BookID, "Author Name")',
        description: 'Creator / primary novelist. Drives strong semantic neighborhood affinities (+3.0 pts).',
        sample: '"Daniel Silva"',
        role: 'Semantic neighbor affinity & author matching',
      },
      {
        name: 'Publication Year',
        type: 'Integer',
        predicate: 'Published(BookID, Year)',
        description: 'First publication timestamp. Used for era alignment rules (Classic vs Modern).',
        sample: '2002',
        role: 'Rule R9 (Classic vs Contemporary)',
      },
    ],
  },
  {
    id: 'taxonomy',
    title: 'Literary Taxonomy & Demographics',
    badge: '5 Attributes',
    color: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.25)',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    ),
    description: 'Hierarchical literary genre taxonomy, atmospheric mood, and reader suitability.',
    attributes: [
      {
        name: 'Genre',
        type: 'Categorical',
        predicate: 'Genre(BookID, "Genre")',
        description: 'Broad classification category (32 unique genres). Carries highest objective scoring weight.',
        sample: '"Thriller"',
        weight: '+4.0 pts',
        role: 'Dominant scoring factor & Rule R1',
      },
      {
        name: 'Subgenre',
        type: 'Categorical',
        predicate: 'Subgenre(BookID, "Subgenre")',
        description: 'Fine-grained literary subcategory (85 subgenres). Crucial for discrete neighborhood discovery.',
        sample: '"Spy Thriller"',
        weight: '+2.5 affinity',
        role: 'Hill Climbing neighbor clustering',
      },
      {
        name: 'Mood',
        type: 'Affective Tag',
        predicate: 'Mood(BookID, "Mood")',
        description: 'Emotional atmosphere (e.g. Suspenseful, Reflective, Whimsical, Dark, Inspiring).',
        sample: '"Suspenseful"',
        weight: '+2.0 pts',
        role: 'Atmospheric alignment & Rule R3',
      },
      {
        name: 'Reading Level',
        type: 'Discrete Scale',
        predicate: 'ReadingLevel(BookID, "Level")',
        description: 'Linguistic & syntactic complexity scale: Beginner, Intermediate, or Advanced.',
        sample: '"Intermediate"',
        weight: '+2.0 pts',
        role: 'Comprehension matching & Rule R4',
      },
      {
        name: 'Age Group',
        type: 'Demographic',
        predicate: 'AgeGroup(BookID, "Group")',
        description: 'Target reader demographic: Children, Young Adult, Adult, or General.',
        sample: '"General"',
        weight: '+1.0 pt',
        role: 'Demographic appropriateness & Rule R5',
      },
    ],
  },
  {
    id: 'semantics',
    title: 'Content Descriptors & Narrative Themes',
    badge: '2 Attributes',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.25)',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
    ),
    description: 'Multi-attribute thematic motifs and subject keywords that bridge semantic distance.',
    attributes: [
      {
        name: 'Themes',
        type: 'Set of Strings',
        predicate: 'Theme(BookID, "ThemeTag")',
        description: 'Narrative core concepts (e.g., Crime, Identity, Survival, Love, Revenge, Magic).',
        sample: '["Crime"]',
        weight: '+2.0 pts / +2.0 affinity',
        role: 'Thematic match & Rule R6',
      },
      {
        name: 'Keywords',
        type: 'Multiset of Strings',
        predicate: 'Keyword(BookID, "KeywordTag")',
        description: 'Enriched subject tags and key motifs used for keyword indexing and micro-affinity.',
        sample: '["murder", "spy", "assassin", "secret"]',
        weight: '+1.0 pt / +0.8 affinity',
        role: 'Topical match & Rule R7',
      },
    ],
  },
  {
    id: 'metrics',
    title: 'Popularity & Social Proof Metrics',
    badge: '3 Attributes',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.25)',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
    description: 'Quantitative reader ratings and shelving volume across over 10,000 community readers.',
    attributes: [
      {
        name: 'Rating (Score)',
        type: 'Float [1.0–5.0]',
        predicate: 'Rating(BookID, ScoreVal)',
        description: 'Average verified Goodreads reader score (1.0 to 5.0). Threshold: ≥ 4.0 for High Quality.',
        sample: '4.16',
        weight: '+1.0 pt',
        role: 'Quality filtering & Rule R2',
      },
      {
        name: 'Ratings Count',
        type: 'Integer',
        predicate: 'RatingsCount(BookID, Count)',
        description: 'Total number of individual ratings submitted by readers. Minimum dataset threshold: 10,000.',
        sample: '40,122',
        role: 'Statistical significance filter',
      },
      {
        name: 'Popularity (Shelvings)',
        type: 'Integer',
        predicate: 'Popularity(BookID, ShelvingsCount)',
        description: 'Number of times added to reader bookshelves. Indicates broad catalog traction.',
        sample: '44,602',
        weight: '+1.0 pt',
        role: 'Popularity scoring & Rule R8',
      },
    ],
  },
  {
    id: 'circulation',
    title: 'Physical Circulation & Volume (Simulated)',
    badge: '2 Attributes',
    color: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.25)',
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.35)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
    description: 'Simulated library logistics attributes for realistic academic recommendation simulation.',
    attributes: [
      {
        name: 'Length',
        type: 'Simulated Enum',
        predicate: 'Length(BookID, "LengthType")',
        description: 'Estimated reading commitment: Short (<300p), Medium (300-500p), or Long (>500p).',
        sample: '"Medium"',
        weight: '+1.0 pt',
        role: 'Schedule generator & Rule R10',
      },
      {
        name: 'Availability',
        type: 'Simulated State',
        predicate: 'Availability(BookID, "Status")',
        description: 'Physical shelf availability: Available, Limited, or Unavailable.',
        sample: '"Available"',
        weight: '+1.0 pt',
        role: 'Circulation viability & Rule R11',
      },
    ],
  },
];

function parseFactLine(line) {
  const match = line.match(/^([A-Za-z0-9_]+)\((B\d{5})(?:,\s*(.+))?\)$/);
  if (!match) {
    return { predicate: line, id: '', value: null, isString: false };
  }
  const [, predicate, id, rawVal] = match;
  const isString = rawVal ? rawVal.startsWith('"') : false;
  return { predicate, id, value: rawVal || null, isString };
}

export default function KnowledgeBase() {
  const [data, setData] = useState(null);
  const [bookIdInput, setBookIdInput] = useState('');
  const [currentBookId, setCurrentBookId] = useState('B00001');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'tree' | 'table'
  const [copiedFacts, setCopiedFacts] = useState(false);

  function load(id) {
    setLoading(true);
    const targetId = id || undefined;
    api
      .knowledgeBase(targetId)
      .then((res) => {
        setData(res);
        setError('');
        if (res?.sample?.book?.id) {
          setCurrentBookId(res.sample.book.id);
          setBookIdInput(res.sample.book.id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load('B00001');
  }, []);

  function handleRandomBook() {
    const randomNum = Math.floor(Math.random() * 10538) + 1;
    const randomId = `B${String(randomNum).padStart(5, '0')}`;
    setBookIdInput(randomId);
    load(randomId);
  }

  function handleCopyAllFacts() {
    if (!data?.sample?.facts) return;
    const text = data.sample.facts.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFacts(true);
      setTimeout(() => setCopiedFacts(false), 2000);
    });
  }

  const filteredCategories = useMemo(() => {
    return SCHEMA_CATEGORIES.map((cat) => {
      if (activeCategory !== 'all' && cat.id !== activeCategory) {
        return null;
      }
      if (!schemaSearch.trim()) {
        return cat;
      }
      const query = schemaSearch.toLowerCase();
      const matchedAttrs = cat.attributes.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.predicate.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
      if (matchedAttrs.length === 0 && !cat.title.toLowerCase().includes(query)) {
        return null;
      }
      return {
        ...cat,
        attributes: matchedAttrs.length > 0 ? matchedAttrs : cat.attributes,
      };
    }).filter(Boolean);
  }, [activeCategory, schemaSearch]);

  const totalAttributeCount = 15;

  return (
    <div className="kb-page-container">
      {/* Page Header Strip */}
      <PageHeader
        title="Knowledge Base (KB)"
        description="The complete 10,538-book enriched dataset modeled as an in-memory First-Order Logic Knowledge Base. Every book is represented as structured, typed ground facts enabling transparent rule-based inference and Hill Climbing local search optimization."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        }
      />

      {/* 1. Telemetry Top Banner Cards */}
      <div className="kb-telemetry-grid">
        <div className="kb-telemetry-card" style={{ '--card-accent': '#38BDF8', '--icon-bg': 'rgba(56, 189, 248, 0.12)', '--icon-border': 'rgba(56, 189, 248, 0.25)' }}>
          <div className="kb-telemetry-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div className="kb-telemetry-info">
            <span className="kb-telemetry-label">Knowledge Base Size</span>
            <span className="kb-telemetry-value">10,538</span>
            <span className="kb-telemetry-sub">Enriched catalog books in memory</span>
          </div>
        </div>

        <div className="kb-telemetry-card" style={{ '--card-accent': '#A855F7', '--icon-bg': 'rgba(168, 85, 247, 0.12)', '--icon-border': 'rgba(168, 85, 247, 0.25)' }}>
          <div className="kb-telemetry-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div className="kb-telemetry-info">
            <span className="kb-telemetry-label">FOL Schema Attributes</span>
            <span className="kb-telemetry-value">15 Predicates</span>
            <span className="kb-telemetry-sub">5 semantic dimension clusters</span>
          </div>
        </div>

        <div className="kb-telemetry-card" style={{ '--card-accent': '#10B981', '--icon-bg': 'rgba(16, 185, 129, 0.12)', '--icon-border': 'rgba(16, 185, 129, 0.25)' }}>
          <div className="kb-telemetry-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="kb-telemetry-info">
            <span className="kb-telemetry-label">Inference System</span>
            <span className="kb-telemetry-value">17 Domain Rules</span>
            <span className="kb-telemetry-sub">Forward &amp; Backward Chaining</span>
          </div>
        </div>

        <div className="kb-telemetry-card" style={{ '--card-accent': '#F59E0B', '--icon-bg': 'rgba(245, 158, 11, 0.12)', '--icon-border': 'rgba(245, 158, 11, 0.25)' }}>
          <div className="kb-telemetry-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="kb-telemetry-info">
            <span className="kb-telemetry-label">Search Space</span>
            <span className="kb-telemetry-value">Local Optima</span>
            <span className="kb-telemetry-sub">Random-Restart Hill Climbing</span>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <LoadingState message="Loading Knowledge Base schema and ontology..." />
      ) : (
        <div className="kb-main-layout">
          {/* =========================================================================
              SECTION 1: Book Schema & Fact Hierarchy (Primary Focus)
              ========================================================================= */}
          <section className="kb-section-card glow-cyan">
            {/* Section Header */}
            <div className="kb-section-header">
              <div className="kb-section-title-wrap">
                <span className="kb-section-tag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  First-Order Logic Ontology
                </span>
                <h2 className="kb-section-title">
                  Book Schema &amp; Fact Hierarchy
                </h2>
                <p className="kb-section-desc">
                  Explore the structured attributes and First-Order Logic predicates defined for every book entity in LibraAI.
                  Filter across semantic categories, inspect predicate signatures, and see mathematical logic representations.
                </p>
              </div>

              {/* View Switchers */}
              <div className="kb-view-toggles">
                <button
                  type="button"
                  className={`kb-toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`}
                  onClick={() => setViewMode('matrix')}
                  title="Grouped Cards Matrix View"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  Cards Matrix
                </button>
                <button
                  type="button"
                  className={`kb-toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
                  onClick={() => setViewMode('tree')}
                  title="Interactive Knowledge Tree View"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  Visual Tree
                </button>
                <button
                  type="button"
                  className={`kb-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="FOL Formal Table View"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  Logic Table
                </button>
              </div>
            </div>

            {/* Root Entity Showcase Card */}
            <div className="kb-root-entity-card">
              <div className="kb-root-entity-left">
                <div className="kb-root-icon-halo">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <div className="kb-root-title-box">
                  <div className="kb-root-title-row">
                    <span className="kb-root-name">Root Entity Node: Book</span>
                    <span className="kb-root-badge">Primary Knowledge Object</span>
                    <code className="kb-root-formula">Book(Book_ID) ≡ Ground Instance</code>
                  </div>
                  <p className="kb-root-desc">
                    Every candidate in the 10,538-book catalog is instantiated as a unique entity instance (<code>B00001</code> to <code>B10538</code>) possessing 15 structured domain attributes.
                  </p>
                </div>
              </div>
              <div className="kb-root-stats">
                <div className="kb-root-stat-item">
                  <span className="kb-root-stat-val">10,538</span>
                  <span className="kb-root-stat-lbl">Instantiated Entities</span>
                </div>
                <div className="kb-root-stat-item">
                  <span className="kb-root-stat-val">{totalAttributeCount}</span>
                  <span className="kb-root-stat-lbl">FOL Predicates</span>
                </div>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="kb-controls-bar">
              <div className="kb-category-pills">
                <button
                  type="button"
                  className={`kb-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All Attributes
                  <span className="kb-cat-count">{totalAttributeCount}</span>
                </button>
                {SCHEMA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`kb-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.title.split('&')[0].trim()}
                    <span className="kb-cat-count">{cat.attributes.length}</span>
                  </button>
                ))}
              </div>

              {/* Instant Search in Schema */}
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Filter predicates..."
                  value={schemaSearch}
                  onChange={(e) => setSchemaSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.75rem 0.4rem 1.85rem',
                    background: 'rgba(5, 12, 22, 0.85)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: '#F8FAFC',
                    outline: 'none',
                  }}
                />
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {/* Mode 1: Categorized Cards Matrix */}
            {viewMode === 'matrix' && (
              <div className="kb-categories-stack">
                {filteredCategories.map((category) => (
                  <article key={category.id} className="kb-category-block">
                    <div className="kb-cat-header-row">
                      <div className="kb-cat-header-left">
                        <span className="kb-cat-icon">{category.icon}</span>
                        <div>
                          <h3 className="kb-cat-title">{category.title}</h3>
                          <p className="kb-cat-desc">{category.description}</p>
                        </div>
                      </div>
                      <span className="kb-cat-badge">{category.badge}</span>
                    </div>

                    <div className="kb-attributes-grid">
                      {category.attributes.map((attr) => (
                        <div key={attr.name} className="kb-attr-card">
                          <div className="kb-attr-head">
                            <h4 className="kb-attr-name">
                              <span style={{ color: category.color }}>●</span> {attr.name}
                            </h4>
                            <span className="kb-attr-type-pill">{attr.type}</span>
                          </div>

                          <div className="kb-attr-formula">
                            <code>{attr.predicate}</code>
                          </div>

                          <p className="kb-attr-desc">{attr.description}</p>

                          <div className="kb-attr-footer">
                            <span className="kb-attr-sample">
                              Sample: <strong>{attr.sample}</strong>
                            </span>
                            {attr.weight ? (
                              <span className="kb-attr-weight">{attr.weight}</span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>FOL Term</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Mode 2: Interactive Knowledge Tree Visualizer */}
            {viewMode === 'tree' && (
              <div className="kb-tree-visual-container">
                <div className="kb-tree-root-box">
                  <div className="kb-tree-root-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Book Entity Root ➔ Book(ID)
                  </div>
                </div>

                <div className="kb-tree-branches-grid">
                  {SCHEMA_CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      className="kb-tree-branch-card"
                      style={{
                        '--branch-color': cat.color,
                        '--branch-glow': cat.glow,
                        '--branch-border': cat.border,
                      }}
                    >
                      <div className="kb-tree-branch-title">
                        {cat.icon}
                        <span>{cat.title.split('&')[0].trim()}</span>
                      </div>
                      <ul className="kb-tree-leaves-list">
                        {cat.attributes.map((attr) => (
                          <li key={attr.name} className="kb-tree-leaf-item">
                            <span>{attr.name}</span>
                            <span className="kb-tree-leaf-dot"></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 3: Formal FOL Syntax Table */}
            {viewMode === 'table' && (
              <div className="kb-table-container">
                <table className="kb-fol-table">
                  <thead>
                    <tr>
                      <th>Predicate Signature</th>
                      <th>Category</th>
                      <th>Data Type</th>
                      <th>Sample Term</th>
                      <th>Scoring Role / Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEMA_CATEGORIES.flatMap((c) => c.attributes.map((a) => ({ ...a, catTitle: c.title, catColor: c.color }))).map((attr) => (
                      <tr key={attr.name}>
                        <td>
                          <code>{attr.predicate}</code>
                        </td>
                        <td>
                          <span style={{ color: attr.catColor, fontWeight: 600 }}>
                            {attr.catTitle.split('&')[0].trim()}
                          </span>
                        </td>
                        <td>
                          <span className="kb-attr-type-pill">{attr.type}</span>
                        </td>
                        <td>
                          <code style={{ color: '#34D399' }}>{attr.sample}</code>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {attr.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Academic Prototype Note Strip */}
            <div style={{
              background: 'rgba(8, 19, 33, 0.9)',
              border: '1px dashed var(--border-color)',
              borderRadius: '10px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}>
              <span style={{ color: '#38BDF8', fontSize: '1rem' }}>ℹ️</span>
              <span>
                <strong>Academic Prototype Note:</strong> {data?.tree?.note || 'Length and Availability are derived/simulated fields for this academic prototype. All other 13 fields are loaded directly from the enriched Goodreads dataset.'}
              </span>
            </div>
          </section>

          {/* =========================================================================
              SECTION 2: Live Book Fact Inspector (Interactive Terminals & Presets)
              ========================================================================= */}
          <section className="kb-section-card glow-purple">
            <div className="kb-section-header">
              <div className="kb-section-title-wrap">
                <span className="kb-section-tag" style={{ color: '#A855F7' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Interactive Knowledge Inspector
                </span>
                <h2 className="kb-section-title">
                  Inspect Knowledge Representation for a Book
                </h2>
                <p className="kb-section-desc">
                  Select a featured catalog book or enter any Book ID (<code>B00001</code> – <code>B10538</code>) to inspect its exact asserted First-Order Logic facts in real-time.
                </p>
              </div>
            </div>

            {/* Quick Presets & Search */}
            <div className="kb-inspector-controls">
              <div className="kb-preset-pills-row">
                <span className="kb-preset-label">Quick Select:</span>
                {PRESET_BOOKS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`kb-preset-btn ${currentBookId === preset.id ? 'active' : ''}`}
                    onClick={() => {
                      setBookIdInput(preset.id);
                      load(preset.id);
                    }}
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="kb-preset-btn"
                  onClick={handleRandomBook}
                  style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#C084FC' }}
                >
                  🎲 Surprise Book
                </button>
              </div>

              {/* Search Form */}
              <form
                className="kb-search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (bookIdInput.trim()) {
                    load(bookIdInput.trim());
                  }
                }}
              >
                <div className="kb-search-input-wrap">
                  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    className="kb-search-input"
                    value={bookIdInput}
                    onChange={(e) => setBookIdInput(e.target.value)}
                    placeholder="Enter Book ID e.g. B00001, B00788, B07470"
                  />
                </div>
                <button type="submit" className="kb-search-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Inspect Facts
                </button>
              </form>
            </div>

            {error ? <ErrorState error={error} onRetry={() => load('B00001')} /> : null}

            {/* Showcase: Book Details & FOL Code Terminal */}
            {data?.sample?.book && (
              <div className="kb-book-showcase">
                {/* Left: Book Cover & Metadata Card */}
                <div className="kb-book-card-preview">
                  <div className="kb-book-cover-wrap">
                    {data.sample.book.image ? (
                      <img
                        src={data.sample.book.image}
                        alt={data.sample.book.title}
                        className="kb-book-cover-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>📖</span>
                    )}
                  </div>

                  <div className="kb-book-meta-col">
                    <h3 className="kb-book-title">{data.sample.book.title}</h3>
                    <p className="kb-book-author">
                      by <strong>{data.sample.book.author}</strong>
                    </p>

                    <div className="kb-book-badges-row">
                      <span className="kb-book-id-pill">{data.sample.book.id}</span>
                      {data.sample.book.genre && (
                        <span className="badge-pill" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                          {data.sample.book.genre}
                        </span>
                      )}
                      {data.sample.book.score && (
                        <span className="kb-book-score-pill">
                          ★ {data.sample.book.score}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Predicate Assertions:</span>
                      <strong style={{ color: '#38BDF8' }}>{(data.sample.facts || []).length} Facts</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Rule Engine State:</span>
                      <strong style={{ color: '#10B981' }}>Active / Ready</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Colorized FOL Facts Code Terminal */}
                <div className="kb-facts-terminal-card">
                  <div className="kb-terminal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="kb-terminal-dots">
                        <span className="kb-terminal-dot red"></span>
                        <span className="kb-terminal-dot yellow"></span>
                        <span className="kb-terminal-dot green"></span>
                      </div>
                      <span className="kb-terminal-title">
                        {data.sample.book.id}.fol — First-Order Logic Predicates ({(data.sample.facts || []).length} Assertions)
                      </span>
                    </div>

                    <div className="kb-terminal-actions">
                      <button
                        type="button"
                        className="kb-copy-btn"
                        onClick={handleCopyAllFacts}
                        title="Copy all logic facts to clipboard"
                      >
                        {copiedFacts ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span style={{ color: '#10B981' }}>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>Copy Facts</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="kb-terminal-body">
                    {(data.sample.facts || []).map((factLine, index) => {
                      const { predicate, id, value, isString } = parseFactLine(factLine);
                      return (
                        <div key={index} className="kb-fact-line">
                          <span className="kb-fact-num">{index + 1}</span>
                          <span className="kb-fact-code">
                            <span className="kb-fact-predicate">{predicate}</span>
                            <span className="kb-fact-paren">(</span>
                            <span className="kb-fact-id">{id}</span>
                            {value !== null && (
                              <>
                                <span className="kb-fact-comma">, </span>
                                <span className={isString ? 'kb-fact-string' : 'kb-fact-number'}>
                                  {value}
                                </span>
                              </>
                            )}
                            <span className="kb-fact-paren">)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* =========================================================================
              SECTION 3: Knowledge Base Architecture & Inference Lifecycle
              ========================================================================= */}
          <section className="kb-section-card">
            <div className="kb-section-header">
              <div className="kb-section-title-wrap">
                <span className="kb-section-tag" style={{ color: '#10B981' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Architecture &amp; Data Pipeline
                </span>
                <h2 className="kb-section-title">
                  How the Knowledge Base Powers LibraAI Inference
                </h2>
                <p className="kb-section-desc">
                  LibraAI operates on pure symbolic reasoning. Rather than sending queries to a third-party black-box model, all decisions flow transparently through formal logic deduction.
                </p>
              </div>
            </div>

            <div className="kb-pipeline-grid">
              <div className="kb-pipeline-step-card">
                <span className="kb-step-num-badge">1</span>
                <h3 className="kb-step-title">Enriched CSV Catalog</h3>
                <p className="kb-step-desc">
                  10,538 books with 15 dimensions are indexed in-memory using Pandas and structured into hash indices for ultra-fast candidate lookups.
                </p>
                <span className="kb-step-tech-tag">CSV Dataframe · 10,538 Records</span>
              </div>

              <div className="kb-pipeline-step-card">
                <span className="kb-step-num-badge">2</span>
                <h3 className="kb-step-title">FOL Fact Generator</h3>
                <p className="kb-step-desc">
                  User preferences and catalog attributes are converted into formal First-Order Logic ground facts: <code>Genre(x, Thriller)</code>, <code>Rating(x, r) ≥ 4.0</code>.
                </p>
                <span className="kb-step-tech-tag">FOL Ground Assertions</span>
              </div>

              <div className="kb-pipeline-step-card">
                <span className="kb-step-num-badge">3</span>
                <h3 className="kb-step-title">Rule Chaining Engine</h3>
                <p className="kb-step-desc">
                  17 expert domain rules fire systematically. <strong>Forward Chaining</strong> deduces matching candidates; <strong>Backward Chaining</strong> proves recommendation eligibility.
                </p>
                <span className="kb-step-tech-tag">17 IF–THEN Rules · FC &amp; BC</span>
              </div>

              <div className="kb-pipeline-step-card">
                <span className="kb-step-num-badge">4</span>
                <h3 className="kb-step-title">Hill Climbing Search</h3>
                <p className="kb-step-desc">
                  Starting from multiple random candidates, the local search climbs semantic neighborhoods (author, mood, subgenre) to reach optimal recommendations.
                </p>
                <span className="kb-step-tech-tag">Random Restarts · Objective ≤ 20</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
