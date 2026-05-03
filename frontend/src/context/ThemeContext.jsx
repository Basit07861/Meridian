import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    bg: '#030508',
    bg2: '#04060D',
    surface: '#080D16',
    surface2: '#0D1420',
    surface3: '#0F1625',
    surface4: '#0C1220',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.07)',
    border3: 'rgba(255,255,255,0.1)',
    text: '#F1F5F9',
    textMuted: '#64748B',
    textMuted2: '#4A5568',
    textMuted3: '#334155',
    blue: '#4F9CF9',
    cyan: '#22D3EE',
    purple: '#A78BFA',
    green: '#34D399',
    red: '#F87171',
    orange: '#FB923C',
    // Component specific
    navBg: 'rgba(3,5,8,0.7)',
    navBgScroll: 'rgba(3,5,8,0.95)',
    cardBg: 'rgba(15,22,37,0.9)',
    inputBg: '#0C1220',
    codeBg: '#020408',
  },
  light: {
    bg: '#F8FAFC',
    bg2: '#FFFFFF',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    surface3: '#E2E8F0',
    surface4: '#F8FAFC',
    border: 'rgba(15,23,42,0.08)',
    border2: 'rgba(15,23,42,0.12)',
    border3: 'rgba(15,23,42,0.15)',
    text: '#0F172A',
    textMuted: '#475569',
    textMuted2: '#64748B',
    textMuted3: '#94A3B8',
    blue: '#2563EB',
    cyan: '#0891B2',
    purple: '#7C3AED',
    green: '#16A34A',
    red: '#DC2626',
    orange: '#EA580C',
    // Component specific
    navBg: 'rgba(255,255,255,0.7)',
    navBgScroll: 'rgba(255,255,255,0.95)',
    cardBg: 'rgba(255,255,255,0.9)',
    inputBg: '#FFFFFF',
    codeBg: '#F8FAFC',
  }
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const theme = isDark ? themes.dark : themes.light;

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
