import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useThemeLogo from '../hooks/useThemeLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MOBILE_BREAKPOINT = 900;

const PRESET_AVATARS = {
  'avatar-1': { icon: '👩‍💻', bg: 'linear-gradient(135deg, #2563eb, #7c3aed)' },
  'avatar-2': { icon: '🧑‍💻', bg: 'linear-gradient(135deg, #0891b2, #4f46e5)' },
  'avatar-3': { icon: '🤖', bg: 'linear-gradient(135deg, #7c3aed, #db2777)' },
  'avatar-4': { icon: '🚀', bg: 'linear-gradient(135deg, #ea580c, #7c3aed)' },
  'avatar-5': { icon: '🛡️', bg: 'linear-gradient(135deg, #059669, #2563eb)' },
  'avatar-6': { icon: '✨', bg: 'linear-gradient(135deg, #9333ea, #2563eb)' },
};

const getSavedTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('theme') || 'dark';
};

const getIsMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [theme, setTheme] = useState(getSavedTheme);

  const navbarLogo = useThemeLogo('navbar', theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setUser(null);
      return undefined;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };

    fetchUser();
    window.addEventListener('meridian-profile-updated', fetchUser);

    return () => {
      isMounted = false;
      window.removeEventListener('meridian-profile-updated', fetchUser);
    };
  }, [token]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onResize = () => {
      const nextIsMobile = getIsMobile();
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) setOpen(false);
    };

    onScroll();
    onResize();

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setOpen(false);
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const isActive = (path) => location.pathname === path;

  const c = {
    bg: scrolled ? 'var(--nav-bg-solid)' : 'var(--nav-bg)',
    border: scrolled ? 'var(--border-strong)' : 'var(--surface-04)',
    text: 'var(--text-primary)',
    muted: 'var(--text-muted)',
  };

  const getDisplayName = () => {
    return user?.displayName || user?.username || user?.githubUsername || 'User';
  };

  const renderAvatar = (size = 26, fontSize = 12) => {
    const isGithubUser = user?.accountType === 'github' || user?.githubConnected;

    if (isGithubUser && user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt=""
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      );
    }

    const selected = PRESET_AVATARS[user?.selectedAvatar] || PRESET_AVATARS['avatar-1'];

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          flexShrink: 0,
          background: selected.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 900,
          color: 'white',
          boxShadow: '0 0 16px var(--brand-tint-20)',
        }}
      >
        {selected.icon}
      </div>
    );
  };

  const pillStyle = ({ active = false, minWidth = 104, mobileIconOnly = false } = {}) => ({
    height: mobileIconOnly ? 38 : 42,
    minWidth: mobileIconOnly ? 42 : minWidth,
    padding: mobileIconOnly ? '0 12px' : '0 17px',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: active ? 'var(--brand-tint-35)' : 'var(--border-strong)',
    background: active ? 'var(--brand-tint-10)' : 'var(--surface-04)',
    color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
    boxShadow: active ? '0 10px 26px var(--brand-tint-15)' : '0 8px 20px var(--surface-05)',
    fontSize: 14,
    fontWeight: 850,
    letterSpacing: 0.1,
    lineHeight: 1,
    textDecoration: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.2s ease',
  });

  const setHover = (element) => {
    element.style.color = 'var(--brand-primary)';
    element.style.borderColor = 'var(--brand-tint-40)';
    element.style.background = 'var(--brand-tint-10)';
    element.style.transform = 'translateY(-1px)';
  };

  const removeHover = (element, active = false) => {
    element.style.color = active ? 'var(--brand-primary)' : 'var(--text-primary)';
    element.style.borderColor = active ? 'var(--brand-tint-35)' : 'var(--border-strong)';
    element.style.background = active ? 'var(--brand-tint-10)' : 'var(--surface-04)';
    element.style.transform = 'translateY(0)';
  };

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={pillStyle({ minWidth: 96, mobileIconOnly: isMobile })}
      onMouseEnter={(event) => setHover(event.currentTarget)}
      onMouseLeave={(event) => removeHover(event.currentTarget)}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
      {!isMobile && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  );

  const desktopNavLink = ({ path, label, icon, minWidth }) => {
    const active = isActive(path);

    return (
      <Link
        key={path}
        to={path}
        style={pillStyle({ active, minWidth })}
        onMouseEnter={(event) => setHover(event.currentTarget)}
        onMouseLeave={(event) => removeHover(event.currentTarget, active)}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: c.bg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${c.border}`,
        fontFamily: "'Outfit', sans-serif",
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1360,
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 28px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 12 : 24,
          boxSizing: 'border-box',
        }}
      >
        <Link
          to="/"
          aria-label="Go to Meridian home"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          <img
            src={navbarLogo}
            alt="Meridian"
            style={{
              width: isMobile ? 122 : 148,
              maxWidth: '44vw',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              filter: theme === 'dark' ? 'drop-shadow(0 0 8px var(--brand-tint-20))' : 'none',
            }}
          />
        </Link>

        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              flexWrap: 'nowrap',
              minWidth: 0,
            }}
          >
            {token ? (
              <>
                {desktopNavLink({ path: '/review', label: 'Review', icon: '⚡', minWidth: 116 })}
                {desktopNavLink({ path: '/history', label: 'History', icon: '📜', minWidth: 118 })}

                <div
                  style={{
                    width: 1,
                    height: 30,
                    background: 'var(--border-soft)',
                    margin: '0 6px',
                    flexShrink: 0,
                  }}
                />

                {themeButton}

                <Link
                  to="/profile"
                  title="View profile"
                  aria-label="View profile"
                  style={{
                    ...pillStyle({ active: isActive('/profile'), minWidth: 112 }),
                    padding: '0 14px 0 10px',
                    maxWidth: 158,
                  }}
                  onMouseEnter={(event) => setHover(event.currentTarget)}
                  onMouseLeave={(event) => removeHover(event.currentTarget, isActive('/profile'))}
                >
                  {renderAvatar(26, 12)}
                  <span
                    style={{
                      maxWidth: 88,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getDisplayName()}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  style={pillStyle({ minWidth: 110 })}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.color = 'var(--danger)';
                    event.currentTarget.style.borderColor = 'var(--danger-tint-25)';
                    event.currentTarget.style.background = 'var(--danger-tint-06)';
                    event.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.color = 'var(--text-primary)';
                    event.currentTarget.style.borderColor = 'var(--border-strong)';
                    event.currentTarget.style.background = 'var(--surface-04)';
                    event.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>↗</span>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {themeButton}

                <Link
                  to="/login"
                  style={pillStyle({ active: isActive('/login'), minWidth: 104 })}
                  onMouseEnter={(event) => setHover(event.currentTarget)}
                  onMouseLeave={(event) => removeHover(event.currentTarget, isActive('/login'))}
                >
                  <span style={{ fontSize: 15, lineHeight: 1 }}>🔐</span>
                  <span>Login</span>
                </Link>

                <Link
                  to="/register"
                  style={{
                    height: 42,
                    minWidth: 132,
                    padding: '0 20px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: 0.15,
                    background: 'linear-gradient(135deg,var(--brand-blue),var(--brand-purple))',
                    color: 'white',
                    boxShadow: '0 10px 28px var(--brand-glow)',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.boxShadow = '0 0 30px var(--brand-glow)';
                    event.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.boxShadow = '0 10px 28px var(--brand-glow)';
                    event.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1 }}>🚀</span>
                  <span>Get started</span>
                </Link>
              </>
            )}
          </div>
        )}

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {themeButton}

            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--border-strong)',
                background: 'var(--surface-04)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 5,
                boxShadow: '0 8px 20px var(--surface-05)',
              }}
            >
              {[0, 1, 2].map((item) => (
                <span
                  key={item}
                  style={{
                    display: 'block',
                    width: 18,
                    height: 2,
                    background: 'currentColor',
                    borderRadius: 2,
                    transition: 'all 0.25s ease',
                    transform:
                      open && item === 0
                        ? 'rotate(45deg) translate(5px, 5px)'
                        : open && item === 1
                          ? 'scaleX(0)'
                          : open && item === 2
                            ? 'rotate(-45deg) translate(5px, -5px)'
                            : 'none',
                    opacity: open && item === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        )}
      </div>

      {isMobile && open && (
        <div
          style={{
            borderTop: '1px solid var(--border-soft)',
            background: 'var(--nav-menu-bg)',
            padding: '14px 20px 20px',
            animation: 'fadeUp 0.2s ease',
          }}
        >
          {token ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0 14px',
                  borderBottom: '1px solid var(--border-soft)',
                  marginBottom: 10,
                }}
              >
                {renderAvatar(34, 15)}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: c.text,
                      maxWidth: '74vw',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getDisplayName()}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: c.muted,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    signed in
                  </div>
                </div>
              </div>

              {[
                { path: '/review', label: '⚡ Review' },
                { path: '/history', label: '📜 History' },
                { path: '/profile', label: '👤 Profile' },
              ].map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 0',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 800,
                    color: isActive(path) ? 'var(--brand-primary)' : 'var(--text-primary)',
                    borderBottom: '1px solid var(--surface-04)',
                  }}
                >
                  {label}
                </Link>
              ))}

              <button
                type="button"
                onClick={logout}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 0',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--danger)',
                  marginTop: 4,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                → Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 0',
                  textDecoration: 'none',
                  fontSize: 15,
                  fontWeight: 800,
                  color: isActive('/login') ? 'var(--brand-primary)' : 'var(--text-primary)',
                }}
              >
                🔐 Login
              </Link>

              <Link
                to="/register"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '11px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 900,
                  background: 'linear-gradient(135deg,var(--brand-blue),var(--brand-purple))',
                  color: 'white',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                🚀 Get Started Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
