// ScrapOS service worker.
// Caches only the app shell (HTML, CSS, JS, locales, icons) from this origin.
// API requests, cross-origin requests and non-GET requests are never cached,
// so business data and tokens are never served from storage.

const CACHE_NAME = "scrapos-shell-v2";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/app.css",
  "./assets/fonts/Kalameh-Bold.ttf",
  "./assets/icons/icon.svg",
  "./locales/fa.json",
  "./locales/en.json",
  "./assets/js/main.js",
  "./assets/js/core/api-pages.js",
  "./assets/js/core/api.js",
  "./assets/js/core/auth-ui.js",
  "./assets/js/core/csv-export.js",
  "./assets/js/core/dom.js",
  "./assets/js/core/html.js",
  "./assets/js/core/i18n.js",
  "./assets/js/core/modal.js",
  "./assets/js/core/router.js",
  "./assets/js/core/table-filter.js",
  "./assets/js/core/theme.js",
  "./assets/js/core/toast.js",
  "./assets/js/data/pages.js",
  "./assets/js/data/transactions.js",
  "./assets/js/features/actions.js",
  "./assets/js/features/shortcuts.js",
  "./assets/js/features/sidebar.js",
  "./assets/js/features/transaction-form.js",
  "./assets/js/views/dashboard.js",
  "./assets/js/views/reports.js",
  "./assets/js/views/settings.js",
  "./assets/js/views/table.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only same-origin files are handled here. API calls (other origin or /api/ paths) go straight to the network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/api/")) return;

  event.respondWith(networkFirst(request));
});

// Network first keeps the app fresh while online and falls back to the cached copy when offline.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    if (request.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }

    return Response.error();
  }
}
