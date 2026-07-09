import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, sendRegisterCode } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState('details');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [focused, setFocused] = useState('');

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getPasswordStrength = () => {
    const password = form.password;
    if (!password) return 0;

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const strengthColors = ['', 'var(--danger)', 'var(--orange)', 'var(--brand-primary)', 'var(--success)'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const validateDetails = () => {
    const username = form.username.trim();
    const email = form.email.trim();

    if (!username || !email || !form.password || !form.confirmPassword) {
      setError('Please fill username, email, password, and confirm password.');
      return false;
    }

    if (username.length < 3 || username.length > 40) {
      setError('Username must be between 3 and 40 characters.');
      return false;
    }

    if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, dots, underscores, and hyphens.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.');
      return false;
    }

    return true;
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!validateDetails()) return;

    setLoading(true);

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      };

      const { data } = await sendRegisterCode(payload);
      setMaskedEmail(data.email || payload.email);
      setNotice(data.message || 'Registration verification code sent to your email.');
      setVerificationCode('');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send registration code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!validateDetails()) return;

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError('Please enter the 6-digit registration code.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await register({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        code: verificationCode.trim(),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/review');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToDetails = () => {
    setStep('details');
    setVerificationCode('');
    setError('');
    setNotice('');
  };

  const inputStyle = (name, extra = {}) => ({
    width: '100%',
    padding: '11px 15px',
    borderRadius: 10,
    fontSize: 14,
    background: 'var(--bg-card)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: focused === name ? 'var(--brand-tint-40)' : 'var(--border)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused === name ? '0 0 0 3px var(--brand-tint-07)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...extra,
  });

  const labelStyle = (name) => ({
    display: 'block',
    fontSize: 11.5,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 7,
    color: focused === name ? 'var(--brand-primary)' : 'var(--text-muted)',
    fontFamily: "'JetBrains Mono', monospace",
  });

  const featureCards = [
    { icon: '🎯', title: 'Precise detection', desc: 'Find bugs and quality issues beyond basic linting.', accent: 'var(--brand-primary)', tint: 'var(--brand-tint-10)' },
    { icon: '⚡', title: 'Fast analysis', desc: 'Get quick AI feedback for faster reviews.', accent: 'var(--orange)', tint: 'var(--orange-tint-10)' },
    { icon: '🔐', title: 'Verified signup', desc: 'Confirm your email before the account is created.', accent: 'var(--success)', tint: 'var(--success-tint-10)' },
    { icon: '🛠️', title: 'Actionable fixes', desc: 'Get cleaner suggestions and refactor ideas.', accent: 'var(--brand-purple-soft)', tint: 'var(--purple-tint-10)' },
  ];

  return (
    <div
      className="register-responsive-page"
      style={{
        minHeight: 'calc(100vh - 72px)',
        background: 'var(--bg-page)',
        display: 'flex',
        fontFamily: "'Outfit', sans-serif",
        backgroundImage: `
          radial-gradient(ellipse 60% 50% at 100% 50%, var(--brand-tint-06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 0% 50%, var(--purple-tint-04) 0%, transparent 60%)
        `,
      }}
    >
      <div
        className="register-form-pane"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div className="fade-up register-card-wrap" style={{ width: '100%', maxWidth: 430 }}>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 999,
                background: 'var(--brand-tint-08)',
                border: '1px solid var(--brand-tint-20)',
                color: 'var(--brand-primary)',
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 0.3,
                marginBottom: 12,
              }}
            >
              <span>{step === 'details' ? '✦' : '✉️'}</span>
              {step === 'details' ? 'Secure AI review signup' : 'Email verification required'}
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 850, color: 'var(--text-heading)', letterSpacing: -1, margin: '0 0 6px' }}>
              {step === 'details' ? 'Create account' : 'Verify your email'}
            </h1>

            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              {step === 'details'
                ? 'Create your Meridian account. We will send a verification code before creating it.'
                : `Enter the 6-digit code sent to ${maskedEmail || 'your email'} to finish signup.`}
            </p>
          </div>

          {error && (
            <div style={{ background: 'var(--danger-tint-06)', border: '1px solid var(--danger-tint-20)', borderLeft: '3px solid var(--danger)', color: 'var(--danger-text)', borderRadius: '0 8px 8px 0', padding: '9px 13px', fontSize: 13, marginBottom: 13, lineHeight: 1.5 }}>
              ⚠ {error}
            </div>
          )}

          {notice && (
            <div style={{ background: 'var(--success-tint-08)', border: '1px solid var(--success-tint-20)', borderLeft: '3px solid var(--success)', color: 'var(--success-text)', borderRadius: '0 8px 8px 0', padding: '9px 13px', fontSize: 13, marginBottom: 13, lineHeight: 1.5 }}>
              ✅ {notice}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleSendCode} noValidate>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="register-username" style={labelStyle('username')}>Username</label>
                <input id="register-username" type="text" placeholder="johndoe" value={form.username} onChange={(e) => updateForm('username', e.target.value)} onFocus={() => setFocused('username')} onBlur={() => setFocused('')} required style={inputStyle('username')} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="register-email" style={labelStyle('email')}>Email</label>
                <input id="register-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} required style={inputStyle('email')} />
              </div>

              <div className="register-password-stack" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                <div style={{ marginBottom: 0 }}>
                  <label htmlFor="register-password" style={labelStyle('password')}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="register-password" type={showPass ? 'text' : 'password'} placeholder="Create password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} onFocus={() => setFocused('password')} onBlur={() => setFocused('')} required style={inputStyle('password', { paddingRight: 42 })} />
                    <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 15 }}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label htmlFor="register-confirm-password" style={labelStyle('confirmPassword')}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="register-confirm-password" type={showConfirmPass ? 'text' : 'password'} placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused('')} required style={inputStyle('confirmPassword', { paddingRight: 42, borderColor: passwordMismatch ? 'var(--danger-tint-40)' : passwordsMatch ? 'var(--success-tint-30)' : (focused === 'confirmPassword' ? 'var(--brand-tint-40)' : 'var(--border)') })} />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 15 }}>
                      {showConfirmPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              </div>

              {form.password && (
                <div style={{ margin: '0 0 14px' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} style={{ flex: 1, height: 3, borderRadius: 2, background: item <= passwordStrength ? strengthColors[passwordStrength] : 'var(--border-soft)' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: strengthColors[passwordStrength], fontFamily: "'JetBrains Mono', monospace" }}>
                      {strengthLabels[passwordStrength]} password
                    </span>
                    {form.confirmPassword && (
                      <span style={{ fontSize: 11, color: passwordsMatch ? 'var(--success)' : 'var(--danger)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 850, background: loading ? 'var(--brand-glow-strong)' : 'linear-gradient(135deg,var(--brand-blue),var(--brand-purple))', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 30px var(--brand-tint-25)' }}>
                {loading ? <><span className="spinner" /> Sending code...</> : 'Send verification code →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateAccount} noValidate>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="register-code" style={labelStyle('code')}>Verification Code</label>
                <input id="register-code" type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onFocus={() => setFocused('code')} onBlur={() => setFocused('')} required style={inputStyle('code', { textAlign: 'center', letterSpacing: 8, fontSize: 22, fontWeight: 850 })} />
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 850, background: loading ? 'var(--brand-glow-strong)' : 'linear-gradient(135deg,var(--brand-blue),var(--brand-purple))', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 30px var(--brand-tint-25)' }}>
                {loading ? <><span className="spinner" /> Creating account...</> : 'Create verified account →'}
              </button>

              <button type="button" onClick={goBackToDetails} disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 800, background: 'var(--surface-04)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10 }}>
                ← Edit details
              </button>

              <button type="button" onClick={handleSendCode} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: 'transparent', border: '1px solid var(--border)', color: 'var(--brand-primary)', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10 }}>
                Resend code
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          </div>

          <button type="button" onClick={() => { window.location.href = `${API_BASE_URL}/github/login`; }} style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 750, background: 'var(--surface-03)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            Sign up with GitHub
          </button>

          <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 650, color: 'var(--text-muted)', margin: '15px 0 0' }}>
            Coming back?{' '}
            <Link to="/login" style={{ color: 'var(--brand-primary)', fontSize: 16, fontWeight: 900, textDecoration: 'none', borderBottom: '2px solid var(--brand-primary)', paddingBottom: 2 }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>

      <div
        className="hide-mobile register-feature-pane"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 42px',
          boxSizing: 'border-box',
          borderLeft: '1px solid var(--border-soft)',
          background: `
            linear-gradient(145deg, var(--card-alpha), var(--surface-03)),
            radial-gradient(circle at 20% 15%, var(--brand-tint-10), transparent 34%),
            radial-gradient(circle at 95% 85%, var(--purple-tint-10), transparent 34%)
          `,
        }}
      >
        <div style={{ maxWidth: 460, width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, background: 'linear-gradient(135deg, var(--surface-08), var(--surface-03))', border: '1px solid var(--brand-tint-25)', boxShadow: '0 8px 24px var(--shadow)', marginBottom: 16 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-blue), var(--brand-purple))', boxShadow: '0 0 14px var(--brand-tint-25)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 850, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-heading)' }}>Platform Features</span>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 850, color: 'var(--text-heading)', letterSpacing: -1.2, lineHeight: 1.12, margin: '0 0 10px' }}>
            Built for cleaner,<br />safer code reviews
          </h2>

          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 410, margin: '0 0 22px' }}>
            A focused review workspace with verified accounts, security checks, and practical fixes in one place.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 13 }}>
            {featureCards.map((card, index) => (
              <div key={index} style={{ minHeight: 158, padding: 15, borderRadius: 18, background: `linear-gradient(160deg, var(--bg-card), var(--surface-03)), radial-gradient(circle at 15% 12%, ${card.tint}, transparent 52%)`, border: '1px solid var(--border-strong)', boxShadow: '0 12px 30px var(--shadow), inset 0 1px 0 var(--surface-10)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${card.accent}, transparent 75%)` }} />
                <div>
                  <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: card.tint, border: '1px solid var(--border-strong)', fontSize: 17, marginBottom: 12 }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 850, color: 'var(--text-heading)', margin: '0 0 6px' }}>{card.title}</h3>
                  <p style={{ fontSize: 12.2, color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>{card.desc}</p>
                </div>
                <span style={{ marginTop: 14, color: card.accent, fontSize: 18 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
