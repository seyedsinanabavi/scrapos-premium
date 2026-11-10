import { $ } from "./dom.js";

const TOAST_DURATION_MS = 3200;

export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  $("#toastStack").append(el);
  setTimeout(() => el.remove(), TOAST_DURATION_MS);
}
