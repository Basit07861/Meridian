import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import meridianLogo from '../assets/meridian-logo.png';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const S = {
    page: {
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Outfit', sans-serif",
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 20% 0%, var(--brand-tint-07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 100%, var(--purple-tint-05) 0%, transparent 60%)
      `,
    },
    wrap: { width: '100%', maxWidth: 430 },
    logoWrap: { textAlign: 'center', marginBottom: 28 },
    logoText: {
      display: 'block',
      fontWeight: 800,
      fontSize: 20,
      background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-purple-soft))',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    card: {
      background: 'var(--panel-alpha)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: '36px 32px',
      boxShadow: 'var(--shadow)',
    },
    badge: {
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
      marginBottom: 16,
    },
    heading: {
      fontSize: 24,
      fontWeight: 850,
      color: 'var(--text-heading)',
      margin: '0 0 6px',
      letterSpacing: '-0.6px',
    },
    sub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px' },
    alert: {
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      marginBottom: 18,
      lineHeight: 1.5,
    },
    label: {
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-muted)',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 7,
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 10,
      fontSize: 14,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-strong)',
      color: 'var(--text-primary)',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
      marginBottom: 18,
    },
    btn: {
      width: '100%',
      padding: '13px',
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 800,
      background: 'linear-gradient(135deg, var(--brand-blue), var(--brand-purple))',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 12px 34px var(--brand-tint-30)',
    },
    secondaryLink: {
      display: 'block',
      marginTop: 18,
      textAlign: 'center',
      color: 'var(--brand-primary)',
      fontWeight: 800,
      fontSize: 14,
      textDecoration: 'none',
    },
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = 'var(--brand-tint-40)';
    e.target.style.boxShadow = '0 0 0 3px var(--brand-tint-08)';
  };

  const blurStyle = (e) => {
    e.target.style.borderColor = 'var(--border-strong)';
    e.target.style.boxShadow = 'none';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await forgotPassword({ identifier });
      setMessage(data.message || 'If your account exists, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create password reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={S.page}>
      <div style={S.wrap} className="fade-up">
        <div style={S.logoWrap}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <img src={meridianLogo} alt="Meridian.ai" style={{ width: 58, height: 58, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
            <span style={S.logoText}>Meridian.ai</span>
          </Link>
        </div>

        <section style={S.card}>
          <div style={S.badge}>🔐 Account recovery</div>
          <h1 style={S.heading}>Forgot password?</h1>
          <p style={S.sub}>
            Enter your registered email or username. We will send a secure reset link to the email linked with your account.
          </p>

          {error && (
            <div style={{ ...S.alert, background: 'var(--danger-tint-08)', border: '1px solid var(--danger-tint-20)', color: 'var(--danger-text)' }} role="alert">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div style={{ ...S.alert, background: 'var(--success-tint-10)', border: '1px solid var(--success-tint-20)', color: 'var(--success)' }} role="status">
              ✅ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label style={S.label} htmlFor="forgot-identifier">Email or Username</label>
            <input
              id="forgot-identifier"
              type="text"
              autoComplete="username"
              style={S.input}
              placeholder="you@example.com or your_username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              required
            />

            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating reset link...' : 'Send Reset Link →'}
            </button>
          </form>

          <Link to="/login" style={S.secondaryLink}>← Back to login</Link>
        </section>
      </div>
    </main>
  );
}
