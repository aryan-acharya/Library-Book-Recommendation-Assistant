import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import quoteReaderImg from '../assets/quote_reader.jpg';
import { getNotifications, markNotificationsRead } from '../libraryStore';

const navItems = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
  },
  {
    to: '/recommend',
    label: 'Get Recommendations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    ),
  },
  {
    to: '/reasoning',
    label: 'AI Reasoning',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Book Search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    ),
  },
  {
    to: '/similar',
    label: 'Similar Books',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8"></polyline>
        <line x1="4" y1="20" x2="21" y2="3"></line>
        <polyline points="21 16 21 21 16 21"></polyline>
        <line x1="15" y1="15" x2="21" y2="21"></line>
        <line x1="4" y1="4" x2="9" y2="9"></line>
      </svg>
    ),
  },
  {
    to: '/study',
    label: 'Study Companion',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="M9 16l2 2 4-4"></path>
      </svg>
    ),
  },
  {
    to: '/library',
    label: 'My Library',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
  },
  {
    to: '/favorites',
    label: 'Favorites',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    ),
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
  },
];

const LITERARY_QUOTES = [
  {
    quote: '“A reader lives a thousand lives before they die.”',
    author: '— George R.R. Martin',
  },
  {
    quote: '“There is no friend as loyal as a book.”',
    author: '— Ernest Hemingway',
  },
  {
    quote: '“I have always imagined that Paradise will be a kind of a library.”',
    author: '— Jorge Luis Borges',
  },
  {
    quote: '“Books are mirrors: you only see in them what you already have inside you.”',
    author: '— Carlos Ruiz Zafón',
  },
  {
    quote: '“A room without books is like a body without a soul.”',
    author: '— Marcus Tullius Cicero',
  },
  {
    quote: '“Books are a uniquely portable magic.”',
    author: '— Stephen King',
  },
];

export default function Layout() {
  const [globalQuery, setGlobalQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setNotifications(getNotifications());
    function onStorage() {
      setNotifications(getNotifications());
    }
    window.addEventListener('libraai_store_update', onStorage);
    return () => window.removeEventListener('libraai_store_update', onStorage);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = globalQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setMobileMenuOpen(false);
  }

  function handleToggleNotif() {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        markNotificationsRead();
        setNotifications(getNotifications());
      }
      return next;
    });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="libra-app-container">
      {/* Top Navigation Bar */}
      <header className="libra-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <NavLink to="/" className="topbar-brand">
            <span className="brand-book-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </span>
            <div className="brand-titles">
              <span className="brand-name">LibraAI</span>
              <span className="brand-sub">Library Book Recommendation Assistant</span>
            </div>
          </NavLink>
        </div>

        {/* Global Search Center */}
        <form className="topbar-search" onSubmit={handleSearchSubmit}>
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search for books, authors, genres..."
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
          />
        </form>

        {/* Right User & Notifications */}
        <div className="topbar-right">
          {/* Notification Button */}
          <div className="notif-wrapper" ref={notifRef}>
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={handleToggleNotif}
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 ? <span className="notif-badge">{unreadCount}</span> : null}
            </button>

            {notifOpen ? (
              <div className="notif-dropdown">
                <div className="dropdown-head">
                  <h4>Notifications</h4>
                  <span className="muted-count">{notifications.length} updates</span>
                </div>
                <div className="dropdown-list">
                  {notifications.map((n) => (
                    <div key={n.id} className="dropdown-item">
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                      <span className="time-tag">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* User Profile Dropdown */}
          <div className="user-profile-wrapper" ref={userRef}>
            <button
              type="button"
              className="user-btn"
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              <div className="user-avatar">A</div>
              <div className="user-info">
                <span className="user-name">User</span>
                <span className="user-role">Book Lover</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`chevron ${userMenuOpen ? 'open' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {userMenuOpen ? (
              <div className="user-dropdown-menu">
                <NavLink to="/library" onClick={() => setUserMenuOpen(false)}>
                  📚 My Library
                </NavLink>
                <NavLink to="/favorites" onClick={() => setUserMenuOpen(false)}>
                  ♥ Saved Favorites
                </NavLink>
                <NavLink to="/study" onClick={() => setUserMenuOpen(false)}>
                  📖 Study Companion
                </NavLink>
                <NavLink to="/analytics" onClick={() => setUserMenuOpen(false)}>
                  📊 Reading Analytics
                </NavLink>
                <div className="menu-divider"></div>
                <NavLink to="/how-ai-works" onClick={() => setUserMenuOpen(false)}>
                  💡 How AI Works
                </NavLink>
                <NavLink to="/knowledge-base" onClick={() => setUserMenuOpen(false)}>
                  🗃️ Knowledge Base (10,538 books)
                </NavLink>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="libra-body">
        {/* Left Sidebar */}
        <aside className={`libra-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom Sidebar Quote Card */}
          {(() => {
            const currentQuote = LITERARY_QUOTES[quoteIndex % LITERARY_QUOTES.length];
            return (
              <div
                className="sidebar-quote-card"
                onClick={() => setQuoteIndex((i) => (i + 1) % LITERARY_QUOTES.length)}
                title="Click to discover another inspiring book quote"
                style={{ cursor: 'pointer' }}
              >
                <div className="quote-image-wrap">
                  <img src={quoteReaderImg} alt="Reader in library" className="quote-image" />
                </div>
                <div className="quote-text-wrap">
                  <p className="quote-text">{currentQuote.quote}</p>
                  <p className="quote-author">{currentQuote.author}</p>
                </div>
              </div>
            );
          })()}
        </aside>

        {/* Mobile backdrop */}
        {mobileMenuOpen ? (
          <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
        ) : null}

        {/* Main Routed Page Content */}
        <main className="libra-content">
          <Outlet />

          <footer className="libra-footer">
            <div className="footer-links">
              <NavLink to="/knowledge-base">Knowledge Base</NavLink>
              <span>·</span>
              <NavLink to="/reasoning">AI Reasoning</NavLink>
              <span>·</span>
              <NavLink to="/peas">PEAS Model</NavLink>
              <span>·</span>
              <NavLink to="/how-ai-works">Inference Details</NavLink>
              <span>·</span>
              <NavLink to="/about">About Project</NavLink>
            </div>
            <p className="footer-credits">
              LibraAI · 10,538 books in Knowledge Base · Rule-Based Reasoning · Forward &amp; Backward Chaining · Hill Climbing Search
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
