import { useEffect, useState } from 'react';

import pageLogoDark from '../assets/meridian-logo-dark.png';
import pageLogoLight from '../assets/meridian-logo-light.png';
import navbarLogoDark from '../assets/meridian-navbar-logo-dark.png';
import navbarLogoLight from '../assets/meridian-navbar-logo-light.png';

const getCurrentTheme = () => {
  if (typeof window === 'undefined') return 'dark';

  return (
    document.documentElement.getAttribute('data-theme') ||
    localStorage.getItem('theme') ||
    'dark'
  );
};

export default function useThemeLogo(variant = 'page', themeOverride = null) {
  const [theme, setTheme] = useState(getCurrentTheme);

  useEffect(() => {
    if (typeof window === 'undefined' || themeOverride) return undefined;

    const syncTheme = () => setTheme(getCurrentTheme());

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    window.addEventListener('storage', syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', syncTheme);
    };
  }, [themeOverride]);

  const activeTheme = themeOverride || theme;
  const isDark = activeTheme !== 'light';

  if (variant === 'navbar') {
    return isDark ? navbarLogoDark : navbarLogoLight;
  }

  return isDark ? pageLogoDark : pageLogoLight;
}
