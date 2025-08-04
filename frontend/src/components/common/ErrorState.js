// components/common/ErrorState.js - Common Error Component
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const ErrorState = ({
  title = "Something went wrong",
  message = "An unexpected error occurred",
  showRetry = true,
  onRetry,
  showBackButton = true,
  backTo = "/users",
  backText = "Back to Users",
  showDebugInfo = true,
  debugInfo = {},
  className = ""
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <AlertCircle className="empty-state-icon" style={{color: 'var(--error-text)'}} />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">
        {message}
      </p>
      
      {/* Action Buttons */}
      <div style={{
        marginTop: 'var(--spacing-lg)', 
        display: 'flex', 
        gap: 'var(--spacing-md)', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {showRetry && onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
        {showBackButton && (
          <Link to={backTo} className="btn btn-secondary">
            <ArrowLeft size={16} />
            {backText}
          </Link>
        )}
      </div>
      
      {/* Debug Information */}
      {showDebugInfo && Object.keys(debugInfo).length > 0 && (
        <div style={{
          marginTop: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          background: 'var(--bg-glass-light)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'left',
          maxWidth: '600px',
          margin: 'var(--spacing-xl) auto 0'
        }}>
          <h4 style={{
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--spacing-sm)'
          }}>
            Debug Information:
          </h4>
          <ul style={{
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            lineHeight: '1.5',
            listStyle: 'none',
            padding: 0
          }}>
            {Object.entries(debugInfo).map(([key, value]) => (
              <li key={key} style={{marginBottom: '0.25rem'}}>
                • <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
          <p style={{
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            marginTop: 'var(--spacing-sm)',
            fontStyle: 'italic'
          }}>
            <strong>Note:</strong> Make sure the API is running and the requested resource exists in the database.
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorState;