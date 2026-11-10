import { $$ } from "./dom.js";

// Shows only table rows whose text contains the query (case-insensitive).
export function filterRows(selector, query) {
  const q = query.toLowerCase();
  $$(`${selector} tr`).forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
