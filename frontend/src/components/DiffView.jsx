import { useState } from 'react';

export default function DiffView({ originalCode, review }) {
  const [selected, setSelected] = useState(0);

  if (!originalCode || !review?.suggestions?.length) return (
    <div style={{
      background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 40, textAlign: 'center',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <p style={{ color: '#4A5568', fontSize: 14 }}>No refactored code available</p>
    </div>
  );

  const suggestionsWithFix = review.suggestions.filter(s => s.refactoredCode?.trim());

  if (suggestionsWithFix.length === 0) return (
    <div style={{
      background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 40, textAlign: 'center',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <p style={{ color: '#4A5568', fontSize: 14 }}>No refactored code available for this review</p>
    </div>
  );

  const activeSuggestion = suggestionsWithFix[selected];
  const origLines = originalCode.split('\n');
  const fixLines  = activeSuggestion.refactoredCode.split('\n');

  const severityColor = {
    high:   { text: '#FEB2B2', bg: 'rgba(252,129,129,0.1)', border: 'rgba(252,129,129,0.25)' },
    medium: { text: '#FBD38D', bg: 'rgba(246,173,85,0.1)',  border: 'rgba(246,173,85,0.25)' },
    low:    { text: '#9AE6B4', bg: 'rgba(104,211,145,0.1)', border: 'rgba(104,211,145,0.25)' },
  };

  return (
    <div style={{
      background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, overflow: 'hidden', fontFamily: "'Outfit', sans-serif"
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#0C1220',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F7FAFC', margin: 0 }}>
          🔄 Side-by-Side Diff View
        </h3>
        <span style={{ fontSize: 12, color: '#4A5568' }}>
          {suggestionsWithFix.length} fix{suggestionsWithFix.length !== 1 ? 'es' : ''} available
        </span>
      </div>

      {/* Suggestion Selector */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: '#4A5568', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
          Select Issue to View Fix
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggestionsWithFix.map((s, i) => {
            const sc = severityColor[s.severity] || severityColor.low;
            const isActive = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                  background: isActive ? 'rgba(79,156,249,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isActive ? '1px solid rgba(79,156,249,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              >
                {/* Active indicator */}
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? '#4F9CF9' : 'rgba(255,255,255,0.15)',
                  transition: 'background 0.2s',
                }} />

                {/* Severity badge */}
                <span style={{
                  padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0,
                  background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                }}>{s.severity}</span>

                {/* Line number */}
                {s.line > 0 && (
                  <span style={{ fontSize: 11, color: '#4A5568', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    Line {s.line}
                  </span>
                )}

                {/* Issue text */}
                <span style={{
                  fontSize: 12, color: isActive ? '#CBD5E0' : '#718096',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, transition: 'color 0.2s',
                }}>{s.issue}</span>

                {/* Arrow */}
                {isActive && <span style={{ color: '#4F9CF9', fontSize: 12, flexShrink: 0 }}>→</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active suggestion info */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(79,156,249,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span style={{ color: '#34D399', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✅</span>
        <p style={{ fontSize: 13, color: '#9AE6B4', lineHeight: 1.6, margin: 0 }}>
          {activeSuggestion.suggestion}
        </p>
      </div>

      {/* Diff panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

        {/* Original */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            padding: '8px 14px',
            background: 'rgba(252,129,129,0.06)',
            borderBottom: '1px solid rgba(252,129,129,0.15)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FC8181' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FC8181' }}>Original Code</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4A5568', fontFamily: "'JetBrains Mono',monospace" }}>
              {origLines.length} lines
            </span>
          </div>
          <div style={{
            background: '#020408', padding: '12px 8px',
            maxHeight: 400, overflowY: 'auto', overflowX: 'auto',
          }}>
            {origLines.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, minHeight: 20 }}>
                <span style={{
                  color: '#334155', fontSize: 11, minWidth: 28, textAlign: 'right',
                  fontFamily: "'JetBrains Mono',monospace", userSelect: 'none', flexShrink: 0, paddingTop: 1,
                }}>{i + 1}</span>
                <pre style={{
                  fontSize: 12, color: '#FCA5A5',
                  fontFamily: "'JetBrains Mono',monospace",
                  whiteSpace: 'pre', margin: 0, flex: 1,
                }}>{line || ' '}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Refactored */}
        <div>
          <div style={{
            padding: '8px 14px',
            background: 'rgba(52,211,153,0.06)',
            borderBottom: '1px solid rgba(52,211,153,0.15)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#34D399' }}>Suggested Fix</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4A5568', fontFamily: "'JetBrains Mono',monospace" }}>
              {fixLines.length} lines
            </span>
          </div>
          <div style={{
            background: '#020408', padding: '12px 8px',
            maxHeight: 400, overflowY: 'auto', overflowX: 'auto',
          }}>
            {fixLines.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, minHeight: 20 }}>
                <span style={{
                  color: '#334155', fontSize: 11, minWidth: 28, textAlign: 'right',
                  fontFamily: "'JetBrains Mono',monospace", userSelect: 'none', flexShrink: 0, paddingTop: 1,
                }}>{i + 1}</span>
                <pre style={{
                  fontSize: 12, color: '#6EE7B7',
                  fontFamily: "'JetBrains Mono',monospace",
                  whiteSpace: 'pre', margin: 0, flex: 1,
                }}>{line || ' '}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 20px',
        background: '#0C1220',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, color: '#334155' }}>
          Showing fix {selected + 1} of {suggestionsWithFix.length}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setSelected(i => Math.max(0, i - 1))}
            disabled={selected === 0}
            style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: selected === 0 ? '#334155' : '#A0AEC0', cursor: selected === 0 ? 'not-allowed' : 'pointer',
            }}
          >← Prev</button>
          <button
            onClick={() => setSelected(i => Math.min(suggestionsWithFix.length - 1, i + 1))}
            disabled={selected === suggestionsWithFix.length - 1}
            style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: selected === suggestionsWithFix.length - 1 ? '#334155' : '#A0AEC0',
              cursor: selected === suggestionsWithFix.length - 1 ? 'not-allowed' : 'pointer',
            }}
          >Next →</button>
        </div>
      </div>
    </div>
  );
}