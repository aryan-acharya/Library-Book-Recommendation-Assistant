import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/recommend', label: 'AI Recommendations' },
  { to: '/explore', label: 'Explore Library' },
  { to: '/search', label: 'Search' },
  { to: '/reasoning', label: 'AI Reasoning' },
  { to: '/knowledge-base', label: 'Knowledge Base' },
  { to: '/peas', label: 'PEAS' },
  { to: '/how-ai-works', label: 'How AI Works' },
  { to: '/about', label: 'About' },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">LA</span>
          <span className="brand-text">
            <strong>LibraAI</strong>
            <em>Library Book Recommendation Assistant</em>
          </span>
        </NavLink>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          LibraAI · Knowledge Base: 10,538 books · Rule-Based Reasoning · Forward / Backward Chaining ·
          Hill Climbing · College AI Mini-Project
        </p>
        <p className="muted">Length and Availability are derived/simulated fields for this academic prototype.</p>
      </footer>
    </div>
  );
}
