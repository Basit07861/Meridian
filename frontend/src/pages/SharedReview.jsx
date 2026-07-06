import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SeverityBadge from '../components/SeverityBadge';
import { getPublicReview } from '../services/api';

const getQuality = (score = 0) => {
  if (score >= 80) {
    return {
      label: 'Good',
      icon: '✅',
      color: 'var(--success)',
      bg: 'var(--success-tint-10)',
      border: 'var(--success-tint-25)',
    };
  }

  if (score >= 50) {
    return {
      label: 'Fair',
      icon: '⚠️',
      color: 'var(--warning)',
      bg: 'var(--warning-tint-10)',
      border: 'var(--warning-tint-25)',
    };
  }

  return {
    label: 'Poor',
    icon: '🔴',
    color: 'var(--danger)',
    bg: 'var(--danger-tint-10)',
    border: 'var(--danger-tint-25)',
  };
};

const getSeverityCount = (suggestions = [], severity) => {
  return suggestions.filter((item) => item.severity === severity).length;
};

function SuggestionList({ suggestions = [] }) {
  const [expanded, setExpanded] = useState(null);

  if (!suggestions.length) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-soft)',
          borderRadius: 12,
          padding: 18,
          color: 'var(--text-secondary)',
          fontSize: 14,
        }}
      >
        No suggestions were included in this shared review.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {suggestions.map((suggestion, index) => {
        const borderColor =
          suggestion.severity === 'high'
            ? 'var(--danger)'
            : suggestion.severity === 'medium'
              ? 'var(--warning)'
              : 'var(--success)';

        return (
          <div
            key={`${suggestion.line || 0}-${index}`}
            style={{
              borderLeft: `3px solid ${borderColor}`,
              background: 'var(--bg-card)',
              borderRadius: '0 12px 12px 0',
              overflow: 'hidden',
              borderTop: '1px solid var(--border-soft)',
              borderRight: '1px solid var(--border-soft)',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === index ? null : index)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <SeverityBadge severity={suggestion.severity} />
                    {suggestion.category && (
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          border: '1px solid var(--border-soft)',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-faint)',
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        {suggestion.category.replace(/_/g, ' ')}
                      </span>
                    )}
                    {suggestion.line > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
                        Line {suggestion.line}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {suggestion.issue}
                  </p>
                </div>
                <span style={{ color: 'var(--text-faint)', fontSize: 12, flexShrink: 0 }}>{expanded === index ? '▲' : '▼'}</span>
              </div>
            </button>

            {expanded === index && (
              <div style={{ borderTop: '1px solid var(--border-soft)', padding: '13px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--success-text)', lineHeight: 1.55, margin: 0 }}>
                  ✅ {suggestion.suggestion}
                </p>
                {suggestion.refactoredCode && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                    <div
                      style={{
                        background: 'var(--bg-elevated)',
                        padding: '7px 12px',
                        fontSize: 11,
                        color: 'var(--text-faint)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                      Suggested Fix
                    </div>
                    <pre
                      style={{
                        background: 'var(--bg-code)',
                        padding: 12,
                        fontSize: 12,
                        color: 'var(--brand-cyan)',
                        fontFamily: "'JetBrains Mono', monospace",
                        overflowX: 'hidden',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {suggestion.refactoredCode}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SharedReview() {
  const { token } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadReview = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await getPublicReview(token);

        if (active) {
          setReview(data);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'This shared review could not be opened.';

        if (active) {
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      active = false;
    };
  }, [token]);

  const quality = getQuality(review?.overallScore || 0);
  const highCount = getSeverityCount(review?.suggestions, 'high');
  const mediumCount = getSeverityCount(review?.suggestions, 'medium');
  const lowCount = getSeverityCount(review?.suggestions, 'low');

  const pageStyle = {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, var(--brand-tint-12), transparent 34%), radial-gradient(circle at top right, var(--purple-tint-10), transparent 32%), var(--bg-page)',
    fontFamily: "'Outfit', sans-serif",
  };

  const cardStyle = {
    background: 'linear-gradient(145deg, var(--bg-panel), var(--surface-03))',
    border: '1px solid var(--border)',
    borderRadius: 18,
    boxShadow: 'var(--shadow)',
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ ...cardStyle, padding: 42, textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>🔗</div>
            <h1 style={{ color: 'var(--text-heading)', fontSize: 24, marginBottom: 8 }}>Opening shared review...</h1>
            <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Please wait while Meridian loads this public review.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ ...cardStyle, padding: 42, textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ color: 'var(--text-heading)', fontSize: 25, marginBottom: 8 }}>Shared review unavailable</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 22 }}>{error}</p>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 18px',
                borderRadius: 12,
                color: 'white',
                background: 'linear-gradient(135deg, var(--brand-hover), var(--brand-purple-strong))',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 12px 28px var(--brand-tint-25)',
              }}
            >
              Go to Meridian
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 56px' }}>
        <div
          style={{
            ...cardStyle,
            padding: 24,
            marginBottom: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 11px',
                borderRadius: 999,
                background: 'var(--brand-tint-10)',
                border: '1px solid var(--brand-tint-25)',
                color: 'var(--brand-primary)',
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              🔗 Public shared review
            </div>
            <h1 style={{ color: 'var(--text-heading)', fontSize: 30, fontWeight: 900, letterSpacing: -0.7, marginBottom: 8 }}>
              {review.title || 'Untitled Review'}
            </h1>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, lineHeight: 1.6 }}>
              {review.language && review.language !== 'unknown' && (
                <span style={{ color: 'var(--brand-primary)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>
                  {review.language} ·{' '}
                </span>
              )}
              Shared read-only review
              {review.createdAt && ` · ${new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 52, fontWeight: 950, color: quality.color, lineHeight: 1, letterSpacing: -2 }}>
              {review.overallScore}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', fontWeight: 700, marginBottom: 8 }}>/ 100</div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 999,
                background: quality.bg,
                border: `1px solid ${quality.border}`,
                color: quality.color,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              <span>{quality.icon}</span>
              {quality.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, fontWeight: 900 }}>
                Original Code
              </h2>
              <pre
                style={{
                  margin: 0,
                  background: 'var(--bg-code)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 14,
                  padding: 18,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12.5,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  overflowX: 'hidden',
                  maxHeight: 560,
                  overflowY: 'auto',
                }}
              >
                {review.originalCode}
              </pre>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, fontWeight: 900 }}>
                Severity Breakdown
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                {[
                  { count: highCount, label: 'High', color: 'var(--danger)', bg: 'var(--danger-tint-06)', border: 'var(--danger-tint-15)' },
                  { count: mediumCount, label: 'Medium', color: 'var(--warning)', bg: 'var(--warning-tint-06)', border: 'var(--warning-tint-15)' },
                  { count: lowCount, label: 'Low', color: 'var(--success)', bg: 'var(--success-tint-06)', border: 'var(--success-tint-15)' },
                ].map(({ count, label, color, bg, border }) => (
                  <div
                    key={label}
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 12,
                      padding: '14px 10px',
                      textAlign: 'center',
                      boxShadow: 'inset 0 1px 0 var(--surface-10)',
                    }}
                  >
                    <div style={{ fontSize: 29, fontWeight: 950, color, lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 850, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, fontWeight: 900 }}>
                AI Summary
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {review.summary || 'No summary available.'}
              </p>
            </div>

            <div style={{ ...cardStyle, padding: 20 }}>
              <h2 style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, fontWeight: 900 }}>
                Suggestions ({review.suggestions?.length || 0})
              </h2>
              <SuggestionList suggestions={review.suggestions || []} />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link
            to="/"
            style={{
              color: 'var(--brand-primary)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Reviewed with Meridian.ai · Try your own code review →
          </Link>
        </div>
      </div>
    </div>
  );
}
