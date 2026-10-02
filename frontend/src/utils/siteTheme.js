import API from '../api/axios';

const STORAGE_KEY = 'delta-public-theme';

export function getCachedSiteTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applySiteTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.publicTheme = nextTheme;
  try {
    localStorage.setItem(STORAGE_KEY, nextTheme);
  } catch {
    // The current page can still show the selected theme.
  }
  window.dispatchEvent(new CustomEvent('delta:theme-change', { detail: nextTheme }));
}

export async function refreshSiteTheme() {
  const response = await API.get('/site/theme');
  applySiteTheme(response.data.theme);
  return response.data.theme;
}

export async function updateSiteTheme(theme) {
  const response = await API.put('/admin/site/theme', { theme });
  applySiteTheme(response.data.theme);
  return response.data.theme;
}
