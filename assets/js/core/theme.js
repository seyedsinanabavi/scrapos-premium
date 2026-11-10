// Theme preference (light/dark) is a per-browser UI setting, so localStorage is fine here.

const STORAGE_KEY = "scrapos-theme";

function readSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage can be blocked (private mode, disabled site data)
  }
}

function saveTheme(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore: the theme still applies for this page view */
  }
}

export function initTheme() {
  if (readSavedTheme() === "dark") document.body.classList.add("dark-mode");
}

export function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  saveTheme(isDark ? "dark" : "light");
}
