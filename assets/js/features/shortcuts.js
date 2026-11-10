// Global search box (Enter to jump to a page) and keyboard shortcuts (Ctrl/⌘+K, Esc).
import { $ } from "../core/dom.js";
import { closeModal } from "../core/modal.js";
import { navigate } from "../core/router.js";
import { toast } from "../core/toast.js";
import { pages } from "../data/pages.js";

function findPage(query) {
  const lower = query.toLowerCase();
  return Object.entries(pages).find(
    ([key, page]) => page.title.includes(query) || key.includes(lower),
  );
}

export function bindGlobalSearch() {
  $("#globalSearch").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const query = e.target.value.trim();
    if (!query) return;

    const match = findPage(query);
    if (match) navigate(match[0]);
    else toast("نتیجه‌ای برای جستجوی شما پیدا نشد.");
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("#globalSearch").focus();
    }
    if (e.key === "Escape") closeModal();
  });
}
