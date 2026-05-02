import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviews, deleteReview, shareReview } from '../services/api';

function SeverityBadge({ severity }) {
  const s = {
    high:   { background: 'rgba(252,129,129,0.1)', color: '#FEB2B2', border: '1px solid rgba(252,129,129,0.25)' },
    medium: { background: 'rgba(246,173,85,0.1)',  color: '#FBD38D', border: '1px solid rgba(246,173,85,0.25)' },
    low:    { background: 'rgba(104,211,145,0.1)', color: '#9AE6B4', border: '1px solid rgba(104,211,145,0.25)' },
  };
  return <span style={{ ...s[severity] || s.low, padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{severity}</span>;
}

function ReviewDetail({ review }) {
  const [expanded, setExpanded] = useState(null);
  if (!review) return (
    <div style={{ background: '#0F1625', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 14, padding: 48, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
      <p style={{ fontSize: 14, color: '#2D3748' }}>Select a review to see details</p>
    </div>
  );

  const scoreColor = review.overallScore >= 70 ? '#68D391' : review.overallScore >= 40 ? '#F6E05E' : '#FC8181';
  const progressGrad = review.overallScore >= 70 ? 'linear-gradient(90deg,#38A169,#68D391)' : review.overallScore >= 40 ? 'linear-gradient(90deg,#B7791F,#F6E05E)' : 'linear-gradient(90deg,#C53030,#FC8181)';
  const high = review.suggestions?.filter(s => s.severity === 'high').length || 0;
  const med  = review.suggestions?.filter(s => s.severity === 'medium').length || 0;
  const low  = review.suggestions?.filter(s => s.severity === 'low').length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.3s ease' }}>
      {/* Score */}
      <div style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F7FAFC', marginBottom: 3 }}>{review.title || 'Untitled Review'}</h3>
            <p style={{ fontSize: 12, color: '#4A5568' }}>
              {review.language !== 'unknown' && <span style={{ color: '#63B3ED', fontFamily: "'JetBrains Mono',monospace" }}>{review.language} · </span>}
              {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor, lineHeight: 1, letterSpacing: -1 }}>{review.overallScore}</div>
            <div style={{ fontSize: 12, color: '#4A5568' }}>/ 100</div>
          </div>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', borderRadius: 2, background: progressGrad, width: `${review.overallScore}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { n: high, l: 'High', c: '#FC8181', bg: 'rgba(252,129,129,0.06)', b: 'rgba(252,129,129,0.15)' },
            { n: med,  l: 'Med',  c: '#F6AD55', bg: 'rgba(246,173,85,0.06)',  b: 'rgba(246,173,85,0.15)' },
            { n: low,  l: 'Low',  c: '#68D391', bg: 'rgba(104,211,145,0.06)', b: 'rgba(104,211,145,0.15)' },
          ].map(({ n, l, c, bg, b }) => (
            <div key={l} style={{ background: bg, border: `1px solid ${b}`, borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{n}</div>
              <div style={{ fontSize: 10, color: '#4A5568', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 10, color: '#4A5568', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Summary</div>
        <p style={{ fontSize: 13, color: '#CBD5E0', lineHeight: 1.7 }}>{review.summary}</p>
      </div>

      {/* Suggestions */}
      <div style={{ background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 10, color: '#4A5568', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Suggestions ({review.suggestions?.length || 0})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {review.suggestions?.map((s, i) => {
            const bc = s.severity === 'high' ? '#FC8181' : s.severity === 'medium' ? '#F6AD55' : '#68D391';
            return (
              <div key={i} onClick={() => setExpanded(expanded === i ? null : i)}
                style={{ borderLeft: `2px solid ${bc}`, background: '#080C18', borderRadius: '0 8px 8px 0', cursor: 'pointer', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <SeverityBadge severity={s.severity} />
                      {s.line > 0 && <span style={{ fontSize: 10, color: '#4A5568', fontFamily: "'JetBrains Mono',monospace" }}>L{s.line}</span>}
                    </div>
                    <span style={{ color: '#4A5568', fontSize: 11 }}>{expanded === i ? '▲' : '▼'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#CBD5E0' }}>{s.issue}</p>
                </div>
                {expanded === i && s.refactoredCode && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, color: '#9AE6B4', marginBottom: 8 }}>✅ {s.suggestion}</p>
                    <pre style={{ background: '#020408', padding: 10, borderRadius: 6, fontSize: 11, color: '#7EC8E3', fontFamily: "'JetBrains Mono',monospace", overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                      {s.refactoredCode}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  if (!token) { navigate('/login'); return null; }

  useEffect(() => {
    getReviews().then(({ data }) => setReviews(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this review?')) return;
    await deleteReview(id);
    setReviews(r => r.filter(x => x._id !== id));
    if (selected?._id === id) setSelected(null);
  };

  const handleShare = async (e, id) => {
    e.stopPropagation();
    try {
      const { data } = await shareReview(id);
      navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareableLink}`);
      alert('Link copied!');
    } catch { alert('Failed to share'); }
  };

  const filtered = reviews.filter(r => {
    const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.language?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'good' && r.overallScore >= 70) || (filter === 'fair' && r.overallScore >= 40 && r.overallScore < 70) || (filter === 'poor' && r.overallScore < 40);
    return matchSearch && matchFilter;
  });

  const scoreColor = (s) => s >= 70 ? '#68D391' : s >= 40 ? '#F6E05E' : '#FC8181';
  const scoreBg    = (s) => s >= 70 ? 'rgba(104,211,145,0.08)' : s >= 40 ? 'rgba(246,224,94,0.08)' : 'rgba(252,129,129,0.08)';
  const scoreBorder= (s) => s >= 70 ? 'rgba(104,211,145,0.2)' : s >= 40 ? 'rgba(246,224,94,0.2)' : 'rgba(252,129,129,0.2)';

  const S = {
    page: { minHeight: '100vh', background: '#04060D', fontFamily: "'Outfit', sans-serif" },
    container: { maxWidth: 1280, margin: '0 auto', padding: '32px 24px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 26, fontWeight: 800, color: '#F7FAFC', letterSpacing: -0.5 },
    newBtn: {
      padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
      background: 'linear-gradient(135deg,#3182CE,#6B46C1)', color: 'white',
      border: 'none', cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(49,130,206,0.3)',
    },
    toolbar: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
    searchWrap: { position: 'relative', flex: 1, minWidth: 200 },
    searchInput: {
      width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, fontSize: 13,
      background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)',
      color: '#E2E8F0', outline: 'none', boxSizing: 'border-box',
    },
    searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#4A5568' },
    filterBtns: { display: 'flex', gap: 6 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' },
    listWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
    reviewCard: {
      background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 16, cursor: 'pointer',
      transition: 'all 0.2s',
    },
    reviewCardActive: {
      background: 'rgba(99,179,237,0.05)', border: '1px solid rgba(99,179,237,0.25)',
      borderRadius: 12, padding: 16, cursor: 'pointer',
    },
    emptyWrap: { background: '#0F1625', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 60, textAlign: 'center' },
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.header} className="fade-up">
          <div>
            <h1 style={S.title}>Review History</h1>
            <p style={{ fontSize: 13, color: '#4A5568', marginTop: 4 }}>{reviews.length} total review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => navigate('/review')} style={S.newBtn}>⚡ New Review</button>
        </div>

        {/* Toolbar */}
        <div style={S.toolbar} className="fade-up-1">
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input type="text" placeholder="Search reviews..." value={search}
              onChange={e => setSearch(e.target.value)} style={S.searchInput}
              onFocus={e => e.target.style.borderColor = 'rgba(99,179,237,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>
          <div style={S.filterBtns}>
            {[
              { key: 'all', label: 'All' },
              { key: 'good', label: '✅ Good' },
              { key: 'fair', label: '⚠️ Fair' },
              { key: 'poor', label: '🔴 Poor' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: filter === key ? 'rgba(99,179,237,0.1)' : 'rgba(255,255,255,0.03)',
                border: filter === key ? '1px solid rgba(99,179,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                color: filter === key ? '#63B3ED' : '#4A5568',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(49,130,206,0.2)', borderTopColor: '#3182CE', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#4A5568', fontSize: 14 }}>Loading reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyWrap}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2D3748', marginBottom: 8 }}>{search ? 'No matching reviews' : 'No reviews yet'}</h3>
            <p style={{ fontSize: 14, color: '#2D3748', marginBottom: 24 }}>{search ? 'Try a different search term' : 'Start by reviewing some code!'}</p>
            {!search && <button onClick={() => navigate('/review')} style={{ padding: '9px 22px', borderRadius: 9, background: 'linear-gradient(135deg,#3182CE,#6B46C1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Review Code →</button>}
          </div>
        ) : (
          <div style={{ ...S.grid, gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '1fr 1fr' }} className="fade-up-2">
            {/* List */}
            <div style={S.listWrap}>
              {filtered.map(r => (
                <div key={r._id}
                  onClick={() => setSelected(r)}
                  style={selected?._id === r._id ? S.reviewCardActive : S.reviewCard}
                  onMouseEnter={e => { if (selected?._id !== r._id) e.currentTarget.style.borderColor = 'rgba(99,179,237,0.2)'; }}
                  onMouseLeave={e => { if (selected?._id !== r._id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#F7FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {r.title || 'Untitled Review'}
                        </span>
                        {r.language && r.language !== 'unknown' && (
                          <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", background: 'rgba(99,179,237,0.08)', color: '#63B3ED', border: '1px solid rgba(99,179,237,0.15)' }}>
                            {r.language}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#4A5568' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{r.suggestions?.length || 0} issues
                      </p>
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: 7, background: scoreBg(r.overallScore), border: `1px solid ${scoreBorder(r.overallScore)}`, color: scoreColor(r.overallScore), fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      {r.overallScore}/100
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={e => handleShare(e, r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4A5568', padding: '2px 6px', borderRadius: 5 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#63B3ED'}
                      onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
                    >🔗 Share</button>
                    <button onClick={e => handleDelete(e, r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4A5568', padding: '2px 6px', borderRadius: 5 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FC8181'}
                      onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}
                    >🗑 Delete</button>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2D3748' }}>Click to view →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail */}
            <div style={{ position: 'sticky', top: 80 }}>
              <ReviewDetail review={selected} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}