export const THEME_STORAGE_KEY = 'du-ui-theme';

export type UserThemePreference = 'dark' | 'light';

/** @deprecated Legacy stored values only; never offered in UI. */
export type ThemePreference = UserThemePreference | 'system';

export function normalizeStoredThemePreference(
  stored: string | null | undefined,
): UserThemePreference {
  if (stored === 'light') {
    return 'light';
  }

  return 'dark';
}

export function resolveThemeClass(
  preference: ThemePreference,
): 'dark' | 'light' {
  return normalizeStoredThemePreference(preference);
}

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k);var t='dark';if(p==='light'){t='light';}else if(p==='system'){localStorage.setItem(k,'dark');}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);}catch(e){}})();`;
