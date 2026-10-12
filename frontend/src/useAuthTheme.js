import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'libraai_auth_theme';
const THEME_EVENT = 'libraai_auth_theme_change';

export function getInitialAuthTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // fallback
  }

  // Dark mode by default for the premium glassmorphism library atmosphere
  return 'dark';
}

export function useAuthTheme() {
  const [theme, setTheme] = useState(getInitialAuthTheme);

  useEffect(() => {
    function handleThemeChange(e) {
      if (e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    }
    window.addEventListener(THEME_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_EVENT, handleThemeChange);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: nextTheme } }));
  }

  return { theme, toggleTheme };
}
