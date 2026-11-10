// Language switching. Translations live in locales/<lang>.json.
import { $, $$ } from "./dom.js";
import { toast } from "./toast.js";

const cache = {};
let current = "fa";

export const getLanguage = () => current;

async function loadLocale(lang) {
  if (!cache[lang]) {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok)
      throw new Error(`Locale "${lang}" could not be loaded (${res.status})`);
    cache[lang] = await res.json();
  }
  return cache[lang];
}

// Page title used in headings and breadcrumbs. Persian keeps the long page titles.
export function pageTitle(page, faTitle) {
  if (current === "fa") return faTitle;
  return cache[current]?.nav?.[page] ?? faTitle;
}

function applyDictionary(lang, dict) {
  current = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach((el) => {
    const value = dict.ui[el.dataset.i18n];
    if (value) el.textContent = value;
  });
}

// Silent apply, used on first load.
export async function applyLocale(lang) {
  const dict = await loadLocale(lang);
  applyDictionary(lang, dict);
}

// User-triggered switch: updates the chrome, shows feedback, keeps the current page.
export async function setLanguage(lang) {
  const dict = await loadLocale(lang);
  applyDictionary(lang, dict);

  const page = (location.hash || "#dashboard").slice(1);
  $("#pageCrumb").textContent = dict.nav[page] || page;
  $("#languageToggle").textContent = lang === "fa" ? "文" : "فا";
  toast(lang === "fa" ? "زبان فارسی فعال شد." : "English interface enabled.");
}
