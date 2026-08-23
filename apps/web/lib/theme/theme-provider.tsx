'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  resolveThemeClass,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme-config';

interface ThemeContextValue {
  readonly preference: ThemePreference;
  readonly resolvedTheme: 'dark' | 'light';
  readonly setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

function applyDocumentTheme(preference: ThemePreference): 'dark' | 'light' {
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;
  const resolved = resolveThemeClass(preference, systemPrefersDark);
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);

  return resolved;
}

function readResolvedThemeFromDocument(): 'dark' | 'light' {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() =>
    readResolvedThemeFromDocument(),
  );

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    setPreferenceState(nextPreference);
    setResolvedTheme(applyDocumentTheme(nextPreference));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (readStoredPreference() === 'system') {
        setResolvedTheme(applyDocumentTheme('system'));
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemePreference(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemePreference must be used within ThemeProvider');
  }

  return context;
}
