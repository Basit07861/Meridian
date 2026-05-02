import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const WORDS = ['JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'Go', 'Rust', 'PHP'];

const FEATURES = [
  { icon: '🐛', title: 'Bug Detection', desc: 'Instantly catch bugs, vulnerabilities and security flaws your eyes miss.', color: '#FC8181', bg: 'rgba(252,129,129,0.06)', border: 'rgba(252,129,129,0.15)' },
  { icon: '⚡', title: 'Severity Scoring', desc: 'Every issue tagged High, Medium, or Low so you fix what matters first.', color: '#F6AD55', bg: 'rgba(246,173,85,0.06)', border: 'rgba(246,173,85,0.15)' },
  { icon: '🔄', title: 'Refactoring Tips', desc: 'Side-by-side diff showing your original vs AI-improved code.', color: '#63B3ED', bg: 'rgba(99,179,237,0.06)', border: 'rgba(99,179,237,0.15)' },
  { icon: '🐙', title: 'GitHub Integration', desc: 'Login with GitHub and pick files directly from your repositories.', color: '#B794F4', bg: 'rgba(183,148,244,0.06)', border: 'rgba(183,148,244,0.15)' },
  { icon: '📜', title: 'Review History', desc: 'Every review saved. Search, revisit and track improvements over time.', color: '#68D391', bg: 'rgba(104,211,145,0.06)', border: 'rgba(104,211,145,0.15)' },
  { icon: '🔗', title: 'Team Sharing', desc: 'One-click shareable links so your whole team can view any review.', color: '#76E4F7', bg: 'rgba(118,228,247,0.06)', border: 'rgba(118,228,247,0.15)' },
];

const S = {
  page: {
    background: '#04060D',
    minHeight: '100vh',
    fontFamily: "'Outfit', sans-serif",
  },
  // Navbar
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(4,6,13,0.9)',
    backdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 24px',
  },
  navInner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 64,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
  },
  logoIcon: {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg, #3182CE, #6B46C1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, boxShadow: '0 4px 16px rgba(49,130,206,0.35)',
  },
  logoText: {
    fontWeight: 800, fontSize: 19, letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #63B3ED, #B794F4)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 8 },
  navBtn: {
    padding: '7px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: 'linear-gradient(135deg, #3182CE, #6B46C1)',
    color: 'white', border: 'none', cursor: 'pointer',
    textDecoration: 'none', display: 'inline-block',
    boxShadow: '0 4px 16px rgba(49,130,206,0.3)',
  },
  navLink: {
    padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: '#A0AEC0', textDecoration: 'none', border: '1px solid transparent',
    transition: 'color 0.2s',
  },
  // Hero
  hero: {
    minHeight: '92vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', padding: '80px 24px 60px',
    background: `
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(49,130,206,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(107,70,193,0.06) 0%, transparent 60%)
    `,
    position: 'relative', overflow: 'hidden',
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 16px', borderRadius: 100,
    background: 'rgba(99,179,237,0.08)',
    border: '1px solid rgba(99,179,237,0.2)',
    color: '#76E4F7', fontSize: 13, fontWeight: 500,
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 28,
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#76E4F7', animation: 'pulse 2s ease infinite',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 7vw, 72px)',
    fontWeight: 800, lineHeight: 1.1,
    letterSpacing: '-2px', marginBottom: 20,
    color: '#F7FAFC',
  },
  heroAccent: {
    background: 'linear-gradient(135deg, #63B3ED 0%, #76E4F7 50%, #B794F4 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 'clamp(15px, 2.5vw, 19px)',
    color: '#718096', maxWidth: 560, lineHeight: 1.7, marginBottom: 40,
  },
  heroCtas: {
    display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60,
  },
  ctaPrimary: {
    padding: '13px 28px', borderRadius: 10, fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg, #3182CE, #6B46C1)',
    color: 'white', border: 'none', cursor: 'pointer',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
    boxShadow: '0 8px 32px rgba(49,130,206,0.35)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  ctaSecondary: {
    padding: '12px 28px', borderRadius: 10, fontSize: 16, fontWeight: 600,
    background: 'rgba(255,255,255,0.04)',
    color: '#A0AEC0', border: '1px solid rgba(255,255,255,0.1)',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
    transition: 'all 0.2s',
  },
  stats: {
    display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center',
  },
  statItem: { textAlign: 'center' },
  statVal: {
    fontSize: 32, fontWeight: 800, letterSpacing: '-1px',
    background: 'linear-gradient(135deg, #63B3ED, #76E4F7)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  statLabel: { fontSize: 13, color: '#4A5568', marginTop: 4 },
  // Code preview
  codePreview: {
    maxWidth: 800, margin: '0 auto', padding: '0 24px 80px',
  },
  codeCard: {
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  codeBar: {
    background: '#0C1220', padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 8,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  codeDot: { width: 12, height: 12, borderRadius: '50%' },
  codeBody: {
    background: '#020408', padding: '24px',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8,
  },
  // Features
  features: {
    maxWidth: 1200, margin: '0 auto', padding: '60px 24px 100px',
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, color: '#4A5568', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 12, display: 'block',
  },
  sectionTitle: {
    fontSize: 'clamp(26px, 4vw, 42px)',
    fontWeight: 800, letterSpacing: '-1px', marginBottom: 48, color: '#F7FAFC',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  },
  featureCard: {
    padding: 28, borderRadius: 14,
    border: '1px solid',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  },
  featureIcon: {
    fontSize: 28, marginBottom: 14, display: 'block',
  },
  featureTitle: {
    fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#F7FAFC',
  },
  featureDesc: {
    fontSize: 14, color: '#718096', lineHeight: 1.7,
  },
  // CTA section
  ctaSection: {
    padding: '80px 24px 120px', textAlign: 'center',
  },
  ctaCard: {
    maxWidth: 600, margin: '0 auto',
    background: 'rgba(15,22,37,0.8)',
    border: '1px solid rgba(99,179,237,0.15)',
    borderRadius: 20, padding: '60px 40px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 80px rgba(49,130,206,0.08)',
  },
  ctaTitle: {
    fontSize: 'clamp(24px, 4vw, 36px)',
    fontWeight: 800, letterSpacing: '-1px', marginBottom: 12, color: '#F7FAFC',
  },
  ctaSub: { fontSize: 16, color: '#718096', marginBottom: 32 },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '24px', textAlign: 'center',
    fontSize: 13, color: '#4A5568',
  },
};

export default function Home() {
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
  const word = WORDS[wordIdx];
  
  let delay;
  
  if (!deleting && text.length < word.length) {
    // Still typing
    delay = 120;
    const t = setTimeout(() => setText(word.slice(0, text.length + 1)), delay);
    return () => clearTimeout(t);
  }
  
  if (!deleting && text.length === word.length) {
    // Finished typing — pause then start deleting
    delay = 1500;
    const t = setTimeout(() => setDeleting(true), delay);
    return () => clearTimeout(t);
  }
  
  if (deleting && text.length > 0) {
    // Still deleting
    delay = 60;
    const t = setTimeout(() => setText(word.slice(0, text.length - 1)), delay);
    return () => clearTimeout(t);
  }
  
  if (deleting && text.length === 0) {
    // Finished deleting — move to next word
    setDeleting(false);
    setWordIdx(i => (i + 1) % WORDS.length);
  }
  
}, [text, deleting, wordIdx]);

  return (
    <div style={S.page}>
      {/* HERO */}
      <section style={S.hero}>
        <div className="fade-up" style={S.heroBadge}>
          <div style={S.dot} />
          Powered by LLaMA 3.3 · 70B via Groq LPU
        </div>

        <h1 className="fade-up-1" style={S.heroTitle}>
          Review Your{' '}
          <span style={S.heroAccent}>{text}<span className="cursor-blink">|</span></span>
          <br />Code Instantly
        </h1>

        <p className="fade-up-2" style={S.heroSub}>
          Paste your code and get AI-driven bug detection, severity scoring,
          and refactoring suggestions in seconds — not hours.
        </p>

        <div className="fade-up-3" style={S.heroCtas}>
          <Link to="/register" style={S.ctaPrimary}>
            Start Reviewing Free →
          </Link>
          <Link to="/login" style={S.ctaSecondary}>
            Sign In
          </Link>
        </div>

        <div className="fade-up-4" style={S.stats}>
          {[['10+', 'Languages'], ['3', 'Severity Levels'], ['< 5s', 'Review Time'], ['100%', 'AI Powered']].map(([v, l]) => (
            <div key={l} style={S.statItem}>
              <div style={S.statVal}>{v}</div>
              <div style={S.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CODE PREVIEW */}
      <div className="fade-up-5" style={S.codePreview}>
        <div style={S.codeCard}>
          <div style={S.codeBar}>
            <div style={{ ...S.codeDot, background: '#FC8181' }} />
            <div style={{ ...S.codeDot, background: '#F6E05E' }} />
            <div style={{ ...S.codeDot, background: '#68D391' }} />
            <span style={{ marginLeft: 12, fontSize: 12, color: '#4A5568', fontFamily: "'JetBrains Mono', monospace" }}>
              review.js — AI Analysis
            </span>
          </div>
          <div style={S.codeBody}>
            <div style={{ color: '#4A5568' }}>{'// 🔍 CodeReview.ai — analyzing your code...'}</div>
            <br />
            <div><span style={{ color: '#B794F4' }}>function </span><span style={{ color: '#76E4F7' }}>fetchUserData</span><span style={{ color: '#718096' }}>(userId) {'{'}</span></div>
            <div style={{ paddingLeft: 20 }}><span style={{ color: '#B794F4' }}>var </span><span style={{ color: '#E2E8F0' }}>data </span><span style={{ color: '#718096' }}>= </span><span style={{ color: '#76E4F7' }}>fetch</span><span style={{ color: '#718096' }}>(`/api/users/${'{'}</span><span style={{ color: '#F6AD55' }}>userId</span><span style={{ color: '#718096' }}>{'}'}`)</span></div>
            <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#E2E8F0' }}>return data</span>
              <span style={{ background: 'rgba(252,129,129,0.12)', color: '#FEB2B2', border: '1px solid rgba(252,129,129,0.25)', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>HIGH</span>
            </div>
            <div style={{ color: '#718096' }}>{'}'}</div>
            <br />
            <div style={{ background: 'rgba(252,129,129,0.05)', border: '1px solid rgba(252,129,129,0.15)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ color: '#FC8181', fontSize: 13 }}>🐛 Missing <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>await</code> — fetch() returns a Promise, not data</div>
              <div style={{ color: '#68D391', fontSize: 13, marginTop: 6 }}>✅ Fix: Add <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>async/await</code> or <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>.then()</code> to handle the Promise</div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section style={S.features}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={S.sectionLabel}>// features</span>
          <h2 style={S.sectionTitle}>
            Everything to ship{' '}
            <span style={{ background: 'linear-gradient(135deg,#63B3ED,#B794F4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              clean code
            </span>
          </h2>
        </div>
        <div style={S.featureGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{ ...S.featureCard, background: f.bg, borderColor: f.border }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={S.featureIcon}>{f.icon}</span>
              <h3 style={{ ...S.featureTitle, color: f.color }}>{f.title}</h3>
              <p style={S.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={S.ctaSection}>
        <div style={S.ctaCard}>
          <h2 style={S.ctaTitle}>Ready to write better code?</h2>
          <p style={S.ctaSub}>Join developers who catch bugs before they ship.</p>
          <Link to="/register" style={{ ...S.ctaPrimary, display: 'inline-flex' }}>
            Get Started for Free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <span style={{ background: 'linear-gradient(135deg,#63B3ED,#B794F4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>
          CodeReview.ai
        </span>
        {' '}— Built with LLaMA 3.3 70B · FastAPI · React
      </footer>
    </div>
  );
}