'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  normalizeStoredThemePreference,
  THEME_STORAGE_KEY,
  type UserThemePreference,
} from './theme-config';

interface ThemeContextValue {
  readonly preference: UserThemePreference;
  readonly resolvedTheme: UserThemePreference;
  readonly setPreference: (preference: UserThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): UserThemePreference {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  const normalized = normalizeStoredThemePreference(stored);

  if (stored === 'system') {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
  }

  return normalized;
}

function applyDocumentTheme(
  preference: UserThemePreference,
): UserThemePreference {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(preference);

  return preference;
}

function readResolvedThemeFromDocument(): UserThemePreference {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<UserThemePreference>(readStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<UserThemePreference>(() =>
    readResolvedThemeFromDocument(),
  );

  const setPreference = useCallback((nextPreference: UserThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    setPreferenceState(nextPreference);
    setResolvedTheme(applyDocumentTheme(nextPreference));
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
