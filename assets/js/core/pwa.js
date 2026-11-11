// Registers the service worker that makes ScrapOS installable and usable offline (app shell only).
// Browsers only allow service workers on HTTPS or localhost; on other origins this is a silent no-op.

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Registration failure should never block the app.
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
