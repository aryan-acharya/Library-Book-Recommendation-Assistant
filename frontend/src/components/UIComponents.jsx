import { Link } from 'react-router-dom';

/**
 * Shared Page Header Strip / Card for application-wide consistency.
 */
export function PageHeader({
  title,
  accentText,
  description,
  icon,
  action,
  image,
  className = '',
}) {
  return (
    <div className={`shared-page-header ${className}`}>
      <div className="header-text-col">
        <div className="header-title-row">
          {icon ? <span className="header-icon-badge">{icon}</span> : null}
          <h1 className="header-title">
            {title} {accentText ? <span className="header-accent">{accentText}</span> : null}
          </h1>
        </div>
        {description ? <p className="header-desc">{description}</p> : null}
      </div>

      {action ? <div className="header-action-col">{action}</div> : null}

      {image ? (
        <div className="header-image-col">
          <img src={image} alt={title} className="header-image" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Shared Empty State Card.
 */
export function EmptyState({
  icon = '📖',
  title = 'No items found',
  message,
  actionText,
  onAction,
  actionLink,
  className = '',
}) {
  return (
    <div className={`shared-empty-state ${className}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message ? <p className="empty-state-message">{message}</p> : null}
      {actionLink ? (
        <Link to={actionLink} className="btn-primary-action">
          {actionText}
        </Link>
      ) : actionText && onAction ? (
        <button type="button" className="btn-primary-action" onClick={onAction}>
          {actionText}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Shared Loading Banner / Spinner.
 */
export function LoadingState({ message = 'Loading catalog data...', className = '' }) {
  return (
    <div className={`shared-loading-banner ${className}`}>
      <div className="loading-pulse-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}

/**
 * Shared Error Alert Card.
 */
export function ErrorState({
  error,
  onRetry,
  onBack,
  className = '',
}) {
  return (
    <div className={`shared-error-card ${className}`}>
      <div className="error-icon-box">⚠️</div>
      <div className="error-text-col">
        <strong className="error-title">Unable to complete request</strong>
        <p className="error-desc">{error || 'An unexpected error occurred while communicating with the server.'}</p>
      </div>
      <div className="error-actions-col">
        {onRetry ? (
          <button type="button" className="btn-small-primary" onClick={onRetry}>
            Try Again
          </button>
        ) : null}
        {onBack ? (
          <button type="button" className="btn-small-outline" onClick={onBack}>
            Go Back
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Shared Tab Navigation Bar.
 */
export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`shared-tabs-bar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`shared-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon ? <span className="tab-icon">{tab.icon}</span> : null}
            <span className="tab-label">{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null ? (
              <span className={`tab-badge ${isActive ? 'active' : ''}`}>{tab.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
