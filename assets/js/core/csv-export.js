import { $ } from "./dom.js";
import { toast } from "./toast.js";

const escapeCell = (text) => `"${text.replace(/"/g, '""')}"`;

// Exports the visible table on the current page as a UTF-8 CSV (with BOM for Excel).
export function exportTable() {
  const table = $("#pageTable") || $(".data-table");
  if (!table) {
    toast("جدولی برای خروجی وجود ندارد.");
    return;
  }

  const lines = [...table.querySelectorAll("tr")].map((tr) =>
    [...tr.children].map((td) => escapeCell(td.innerText)).join(","),
  );
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "scrapos-export.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast("فایل CSV آماده شد.");
}
