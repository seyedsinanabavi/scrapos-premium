// Application entry point: wires modules together and starts the router.
import { $ } from "./core/dom.js";
import { bindModal } from "./core/modal.js";
import { initTheme, toggleTheme } from "./core/theme.js";
import { applyLocale, getLanguage, setLanguage } from "./core/i18n.js";
import { initRouter, startRouter } from "./core/router.js";
import { toast } from "./core/toast.js";
import { bindActions } from "./features/actions.js";
import { bindSidebar } from "./features/sidebar.js";
import { bindGlobalSearch } from "./features/shortcuts.js";
import { bindTransactionForm } from "./features/transaction-form.js";
import { initAuth } from "./core/auth-ui.js";
import { registerServiceWorker } from "./core/pwa.js";

async function boot() {
  registerServiceWorker();
  initTheme();
  bindModal();
  bindActions();
  bindSidebar();
  bindGlobalSearch();
  bindTransactionForm();

  $("#themeToggle").onclick = toggleTheme;
  $("#languageToggle").onclick = () => {
    const next = getLanguage() === "fa" ? "en" : "fa";
    setLanguage(next).catch(() => toast("خطا در بارگذاری زبان."));
  };

  initRouter();
  await applyLocale("fa").catch(() => {});

  // Nothing is rendered from server data until the user is signed in and has a business selected.
  const ready = await initAuth();
  if (ready) startRouter();
  else window.addEventListener("scrapos:authenticated", () => startRouter(), { once: true });
}

boot();
