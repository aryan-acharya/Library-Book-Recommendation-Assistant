import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import libraryBackdrop from '../assets/libraai-library-background.png';
import { getDemoCredentials, loginUser, resetPasswordRequest } from '../authStore';
import { useAuthTheme } from '../useAuthTheme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ text: '', isError: false });
  const [forgotLoading, setForgotLoading] = useState(false);

  const { theme, toggleTheme } = useAuthTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Handle auto-filling demo credentials
  function handleAutofillDemo() {
    const demo = getDemoCredentials();
    setEmail(demo.email);
    setPassword(demo.password);
    setErrorMessage('');
    setStatusMessage('Demo credentials filled successfully. You can review them before signing in.');
  }

  // Handle login submit
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(email, password, rememberMe);
      if (res.success) {
        setStatusMessage('Welcome back! Redirecting to library...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 400);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle forgot password request
  async function handleForgotSubmit(e) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ text: 'Please enter your email address.', isError: true });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await resetPasswordRequest(forgotEmail);
      if (res.success) {
        setForgotStatus({ text: res.message, isError: false });
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStatus({ text: '', isError: false });
          setForgotEmail('');
        }, 2200);
      } else {
        setForgotStatus({ text: res.error, isError: true });
      }
    } catch {
      setForgotStatus({ text: 'Could not process password reset request.', isError: true });
    } finally {
      setForgotLoading(false);
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

      {/* Centered Frosted-Glass Login Card */}
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
          <h1 className="auth-glass-title">Welcome back, reader.</h1>
          <p className="auth-glass-desc">Sign in to continue your literary journey.</p>
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

        {statusMessage ? (
          <div className="auth-alert auth-alert-success" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{statusMessage}</span>
          </div>
        ) : null}

        {/* Main Login Form */}
        <form className="auth-glass-form" onSubmit={handleSubmit} noValidate>
          {/* Grouped Translucent Input Card */}
          <div className="auth-input-group-card">
            {/* Email Field */}
            <div className="auth-field-row">
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </span>
              <div className="auth-field-content">
                <label htmlFor="glass-login-email" className="auth-field-label">
                  Email address
                </label>
                <input
                  id="glass-login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="e.g. reader@libraai.org"
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

            {/* Password Field */}
            <div className="auth-field-row">
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <div className="auth-field-content">
                <label htmlFor="glass-login-password" className="auth-field-label">
                  Password
                </label>
                <input
                  id="glass-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
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
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="auth-aux-row">
            <label className="auth-remember-label">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="auth-custom-radio" aria-hidden="true"></span>
              <span className="auth-remember-text">Remember me</span>
            </label>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => {
                setForgotEmail(email);
                setForgotStatus({ text: '', isError: false });
                setShowForgotModal(true);
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="auth-actions-row">
            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
              aria-label="Log in to your account"
            >
              {loading ? (
                <span className="auth-btn-loader">
                  <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20"></circle>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'LOGIN'
              )}
            </button>

            <Link to="/signup" className="auth-btn-secondary">
              SIGN UP
            </Link>
          </div>

          {/* Auto-Fill Demo Credentials Button */}
          <div className="auth-demo-wrapper">
            <button
              type="button"
              className="auth-btn-demo"
              onClick={handleAutofillDemo}
              title="Populate test account credentials for instant review"
            >
              <span className="auth-demo-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span>Auto-Fill Demo Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal ? (
        <div className="auth-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal-card auth-modal-glass" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-head">
              <h3>Reset Your Password</h3>
              <button
                type="button"
                className="auth-modal-close"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <p className="auth-modal-desc">
              Enter your registered library email address and we will dispatch a password recovery link.
            </p>

            {forgotStatus.text ? (
              <div
                className={`auth-alert ${forgotStatus.isError ? 'auth-alert-error' : 'auth-alert-success'}`}
              >
                {forgotStatus.text}
              </div>
            ) : null}

            <form onSubmit={handleForgotSubmit}>
              <div className="auth-modal-input-wrap">
                <input
                  type="email"
                  required
                  placeholder="name@libraai.org"
                  className="auth-modal-input"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="auth-modal-btn-cancel"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
