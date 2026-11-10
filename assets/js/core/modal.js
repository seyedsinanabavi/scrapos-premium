import { $ } from "./dom.js";

export function openModal() {
  $("#modalBackdrop").classList.add("open");
  $("#txParty").focus();
}

export function closeModal() {
  $("#modalBackdrop").classList.remove("open");
}

export function bindModal() {
  $("#modalClose").onclick = closeModal;
  $("#modalCancel").onclick = closeModal;
  $("#modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") closeModal();
  });
}
