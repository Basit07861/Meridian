import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const strengthScore = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  

  const s = strengthScore();
  const strengthColor = ['', '#FC8181', '#F6AD55', '#63B3ED', '#68D391'][s];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][s];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/review');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const S = {
    page: {
      minHeight: '100vh', background: '#04060D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Outfit', sans-serif",
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 20% 0%, rgba(49,130,206,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 100%, rgba(107,70,193,0.05) 0%, transparent 60%)
      `,
    },
    wrap: { width: '100%', maxWidth: 420 },
    logoWrap: { textAlign: 'center', marginBottom: 32 },
    logoIcon: {
      width: 44, height: 44, borderRadius: 12,
      background: 'linear-gradient(135deg, #3182CE, #6B46C1)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, boxShadow: '0 8px 24px rgba(49,130,206,0.35)', marginBottom: 12,
    },
    logoText: {
      display: 'block', fontWeight: 800, fontSize: 20,
      background: 'linear-gradient(135deg, #63B3ED, #B794F4)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    card: {
      background: 'rgba(15,22,37,0.9)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '36px 32px',
      boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    },
    heading: { fontSize: 24, fontWeight: 800, color: '#F7FAFC', marginBottom: 4, letterSpacing: '-0.5px' },
    sub: { fontSize: 14, color: '#718096', marginBottom: 28 },
    error: {
      background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)',
      color: '#FEB2B2', borderRadius: 10, padding: '10px 14px',
      fontSize: 13, marginBottom: 20,
    },
    label: { display: 'block', fontSize: 11, fontWeight: 600, color: '#718096', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 },
    input: {
      width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14,
      background: '#0C1220', border: '1px solid rgba(255,255,255,0.08)',
      color: '#E2E8F0', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
    },
    fieldWrap: { marginBottom: 18 },
    passWrap: { position: 'relative' },
    eyeBtn: {
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', color: '#4A5568', cursor: 'pointer', fontSize: 16, padding: 0,
    },
    strengthBar: { display: 'flex', gap: 4, marginTop: 8 },
    strengthSeg: { height: 3, flex: 1, borderRadius: 2, transition: 'background 0.3s' },
    strengthText: { fontSize: 11, marginTop: 4, color: strengthColor },
    btn: {
      width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
      background: 'linear-gradient(135deg, #3182CE, #6B46C1)',
      color: 'white', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: '0 4px 20px rgba(49,130,206,0.3)', marginTop: 8,
    },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' },
    divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
    divText: { fontSize: 12, color: '#4A5568' },
    githubBtn: {
      width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      color: '#CBD5E0', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    foot: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#4A5568' },
    link: { color: '#63B3ED', fontWeight: 600 },
  };

  const focusStyle = (e) => { e.target.style.borderColor = 'rgba(99,179,237,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,179,237,0.08)'; };
  const blurStyle = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={S.page}>
      <div style={S.wrap} className="fade-up">
        <div style={S.logoWrap}>
          <Link to="/"><div style={S.logoIcon}>⚡</div><span style={S.logoText}>CodeReview.ai</span></Link>
        </div>

        <div style={S.card}>
          <h1 style={S.heading}>Create account</h1>
          <p style={S.sub}>Start reviewing your code with AI today</p>

          {error && <div style={S.error}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={S.fieldWrap}>
              <label style={S.label}>Username</label>
              <input type="text" style={S.input} placeholder="johndoe"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                onFocus={focusStyle} onBlur={blurStyle} required />
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Email Address</label>
              <input type="email" style={S.input} placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                onFocus={focusStyle} onBlur={blurStyle} required />
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>Password</label>
              <div style={S.passWrap}>
                <input type={showPass ? 'text' : 'password'} style={{ ...S.input, paddingRight: 42 }}
                  placeholder="Create a strong password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={focusStyle} onBlur={blurStyle} required />
                <button type="button" style={S.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {form.password && (
                <>
                  <div style={S.strengthBar}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ ...S.strengthSeg, background: i <= s ? strengthColor : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <div style={S.strengthText}>{strengthLabel} password</div>
                </>
              )}
            </div>

            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
            </button>
          </form>

          <div style={S.divider}>
            <div style={S.divLine} /><span style={S.divText}>or sign up with</span><div style={S.divLine} />
          </div>

          <button style={S.githubBtn} onClick={() => window.location.href = 'http://localhost:5000/api/github/login'}>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>

          <p style={S.foot}>Already have an account? <Link to="/login" style={S.link}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}