import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import libraryBackdrop from '../assets/libraai-library-background.png';
import { registerUser } from '../authStore';
import { useAuthTheme } from '../useAuthTheme';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { theme, toggleTheme } = useAuthTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({ name, email, password });
      if (res.success) {
        setSuccessMessage('Account created successfully! Preparing your library sanctuary...');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`auth-glass-page ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}
    >
      {/* Full-Screen Fixed Library Background Layer */}
      <div className="auth-bg-layer" aria-hidden="true">
        <img
          src={libraryBackdrop}
          alt=""
          className="auth-bg-img"
        />
        <div className="auth-bg-overlay" />
      </div>

      {/* Floating Theme Toggle in Top-Right Corner */}
      <button
        type="button"
        className="auth-floating-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      {/* Centered Frosted-Glass Signup Card */}
      <div className="auth-glass-card">
        {/* LibraAI Logo and Branding Header */}
        <div className="auth-glass-brand-head">
          <Link to="/" className="auth-glass-brand-link" aria-label="LibraAI Home">
            <span className="auth-glass-brand-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </span>
            <div className="auth-glass-brand-texts">
              <span className="auth-glass-brand-name">LibraAI</span>
              <span className="auth-glass-brand-sub">Book Recommendation Assistant</span>
            </div>
          </Link>
        </div>

        {/* Heading & Description */}
        <div className="auth-glass-head">
          <h1 className="auth-glass-title">Begin your reading journey.</h1>
          <p className="auth-glass-desc">Create an account to discover, save, and organize your favorite books.</p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage ? (
          <div className="auth-alert auth-alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="auth-alert auth-alert-success" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMessage}</span>
          </div>
        ) : null}

        {/* Main Signup Form */}
        <form className="auth-glass-form" onSubmit={handleSubmit} noValidate>
          {/* Grouped Translucent Input Card */}
          <div className="auth-input-group-card">
            {/* Full Name */}
            <div className="auth-field-row">
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <div className="auth-field-content">
                <label htmlFor="glass-signup-name" className="auth-field-label">
                  Full Name
                </label>
                <input
                  id="glass-signup-name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Elena Rostova"
                  className="auth-field-input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </div>
            </div>

            <div className="auth-card-divider" aria-hidden="true"></div>

            {/* Email Address */}
            <div className="auth-field-row">
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </span>
              <div className="auth-field-content">
                <label htmlFor="glass-signup-email" className="auth-field-label">
                  Email Address
                </label>
                <input
                  id="glass-signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="e.g. reader@example.com"
                  className="auth-field-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </div>
            </div>

            <div className="auth-card-divider" aria-hidden="true"></div>

            {/* Password */}
            <div className="auth-field-row">
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <div className="auth-field-content">
                <label htmlFor="glass-signup-password" className="auth-field-label">
                  Password
                </label>
                <input
                  id="glass-signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="At least 6 characters"
                  className="auth-field-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </div>
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            <div className="auth-card-divider" aria-hidden="true"></div>

            {/* Confirm Password */}
            <div className="auth-field-row">
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              <div className="auth-field-content">
                <label htmlFor="glass-signup-confirm" className="auth-field-label">
                  Confirm Password
                </label>
                <input
                  id="glass-signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter password"
                  className="auth-field-input"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </div>
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="auth-actions-row" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="auth-btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loader">
                  <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20"></circle>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </div>

          {/* Already have an account link */}
          <div className="auth-switch-link-wrap">
            <span>Already have an account? </span>
            <Link to="/login" className="auth-switch-link">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
