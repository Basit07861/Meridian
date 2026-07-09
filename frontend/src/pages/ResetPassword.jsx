import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const S = {
    page: {
      minHeight: 'calc(100vh - 68px)',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '34px 24px 42px',
      fontFamily: "'Outfit', sans-serif",
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 20% 0%, var(--brand-tint-07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 100%, var(--purple-tint-05) 0%, transparent 60%)
      `,
    },
    wrap: { width: '100%', maxWidth: 430 },
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
    },
    fieldWrap: { marginBottom: 18 },
    passWrap: { position: 'relative' },
    eyeBtn: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: 'var(--text-faint)',
      cursor: 'pointer',
      fontSize: 16,
      padding: 0,
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
      marginTop: 4,
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

    if (!form.password || !form.confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await resetPassword(token, { password: form.password });
      setMessage(data.message || 'Password reset successful. You can now login.');
      setForm({ password: '', confirmPassword: '' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="responsive-auth-page" style={S.page}>
      <div style={S.wrap} className="fade-up responsive-auth-wrap">

        <section className="responsive-auth-card" style={S.card}>
          <div style={S.badge}>🔑 Secure reset</div>
          <h1 style={S.heading}>Create new password</h1>
          <p style={S.sub}>Choose a new password for your Meridian email account. This reset link expires automatically.</p>

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
            <div style={S.fieldWrap}>
              <label style={S.label} htmlFor="new-password">New Password</label>
              <div style={S.passWrap}>
                <input
                  id="new-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  style={{ ...S.input, paddingRight: 42 }}
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  required
                />
                <button
                  type="button"
                  style={S.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label} htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                style={S.input}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onFocus={focusStyle}
                onBlur={blurStyle}
                required
              />
            </div>

            <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Updating password...' : 'Reset Password →'}
            </button>
          </form>

          <Link to="/login" style={S.secondaryLink}>← Back to login</Link>
        </section>
      </div>
    </main>
  );
}
