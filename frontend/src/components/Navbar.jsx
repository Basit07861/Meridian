import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track resize
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    setOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: 'rgba(4,6,13,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 20px',
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* ── LOGO ── */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 9,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#3182CE,#6B46C1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 4px 12px rgba(49,130,206,0.3)',
          }}>⚡</div>
          <span style={{
            fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px',
            background: 'linear-gradient(135deg,#63B3ED,#B794F4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
          }}>CodeReview.ai</span>
        </Link>

        {/* ── DESKTOP NAV ── */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {token ? (
              <>
                {/* Nav links */}
                {[
                  { path: '/review', label: '⚡ Review' },
                  { path: '/history', label: '📜 History' },
                ].map(({ path, label }) => (
                  <Link key={path} to={path} style={{
                    textDecoration: 'none',
                    padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    color: isActive(path) ? '#63B3ED' : '#718096',
                    background: isActive(path) ? 'rgba(99,179,237,0.08)' : 'transparent',
                    border: isActive(path) ? '1px solid rgba(99,179,237,0.2)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}>{label}</Link>
                ))}

                {/* Divider */}
                <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                {/* User chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '4px 12px 4px 6px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  height: 34,
                }}>
                  {/* Avatar */}
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      style={{
                        width: 22, height: 22, borderRadius: '50%',
                        objectFit: 'cover', flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#3182CE,#6B46C1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'white',
                    }}>
                      {(user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 13, color: '#CBD5E0', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username || user.githubUsername || 'User'}
                  </span>
                </div>

                {/* Logout */}
                <button onClick={logout} style={{
                  padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#718096', cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FC8181'; e.currentTarget.style.borderColor = 'rgba(252,129,129,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  textDecoration: 'none', padding: '7px 16px', borderRadius: 8,
                  fontSize: 14, fontWeight: 500, color: '#718096',
                  border: '1px solid transparent', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E2E8F0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#718096'}
                >Login</Link>
                <Link to="/register" style={{
                  textDecoration: 'none', padding: '7px 18px', borderRadius: 8,
                  fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg,#3182CE,#6B46C1)',
                  color: 'white', boxShadow: '0 4px 14px rgba(49,130,206,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(49,130,206,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(49,130,206,0.3)'; }}
                >Get Started</Link>
              </>
            )}
          </div>
        )}

        {/* ── MOBILE HAMBURGER ── */}
        {isMobile && (
          <button onClick={() => setOpen(!open)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, color: '#718096', display: 'flex', flexDirection: 'column',
            gap: 4, alignItems: 'center',
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: 18, height: 2,
                background: 'currentColor', borderRadius: 2,
                transition: 'all 0.25s ease',
                transform: open && i === 0 ? 'rotate(45deg) translate(4px, 4px)'
                  : open && i === 1 ? 'scaleX(0)'
                  : open && i === 2 ? 'rotate(-45deg) translate(4px, -4px)'
                  : 'none',
                opacity: open && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        )}
      </div>

      {/* ── MOBILE MENU ── */}
      {isMobile && open && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 20px 16px',
          background: 'rgba(8,12,24,0.98)',
          animation: 'fadeUp 0.2s ease',
        }}>
          {token ? (
            <>
              {/* User info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 10,
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#3182CE,#6B46C1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'white',
                  }}>
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: '#4A5568' }}>Signed in</div>
                </div>
              </div>

              {[
                { path: '/review', label: '⚡ New Review' },
                { path: '/history', label: '📜 History' },
              ].map(({ path, label }) => (
                <Link key={path} to={path} onClick={() => setOpen(false)} style={{
                  display: 'block', padding: '10px 8px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 14, color: '#CBD5E0',
                  marginBottom: 2,
                }}>{label}</Link>
              ))}

              <button onClick={logout} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 8px', borderRadius: 8, border: 'none',
                background: 'none', cursor: 'pointer', fontSize: 14, color: '#FC8181',
                marginTop: 6,
              }}>→ Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} style={{
                display: 'block', padding: '10px 8px', borderRadius: 8,
                textDecoration: 'none', fontSize: 14, color: '#CBD5E0', marginBottom: 6,
              }}>Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} style={{
                display: 'block', padding: '11px', borderRadius: 9,
                textDecoration: 'none', fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg,#3182CE,#6B46C1)',
                color: 'white', textAlign: 'center',
              }}>Get Started Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}