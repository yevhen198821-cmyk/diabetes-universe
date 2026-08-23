export const THEME_STORAGE_KEY = 'du-ui-theme';

export type ThemePreference = 'dark' | 'light' | 'system';

export function resolveThemeClass(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): 'dark' | 'light' {
  if (preference === 'dark') {
    return 'dark';
  }

  if (preference === 'light') {
    return 'light';
  }

  return systemPrefersDark ? 'dark' : 'light';
}

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var p=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t='light';if(p==='dark'){t='dark';}else if(p==='system'||!p){t=d?'dark':'light';}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);}catch(e){}})();`;
