// Generic table screens (weighbridge, inventory, sales, ...) and the shared transactions table.
import { $ } from "../core/dom.js";
import { filterRows } from "../core/table-filter.js";
import { esc } from "../core/html.js";

export function tablePageMarkup(page, p) {
  return `<article class="panel table-panel"><div class="table-toolbar"><label class="table-search">⌕ <input id="pageSearch" placeholder="جستجو در اطلاعات..."></label><div class="toolbar-actions"><button class="filter-btn" data-action="export">⇩ خروجی CSV</button><button class="filter-btn" data-action="toast" data-message="فیلتر پیشرفته آماده استفاده است.">☷ فیلتر</button></div></div><div class="table-scroll"><table class="data-table" id="pageTable"><thead><tr>${p.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${p.rows.map((r, i) => `<tr>${r.map((c, j) => `<td>${j === 0 ? `<strong class="mono">${esc(c)}</strong>` : j === r.length - 1 ? `<span class="status ${["تکمیل شده", "تسویه شده", "موجود", "فعال", "تأیید شده", "تحویل شده", "ثبت شده"].includes(c) ? "status-success" : ["در انتظار", "در حال انجام", "در مسیر", "برنامه‌ریزی شده", "پیش‌نویس"].includes(c) ? "status-warning" : "status-danger"}">${esc(c)}</span>` : esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="table-pagination"><span>نمایش ${p.rows.length} مورد از ${p.rows.length} مورد</span><div><button disabled>قبلی</button><button class="current">۱</button><button disabled>بعدی</button></div></div></article>`;
}

export function bindTableSearch() {
  const search = $("#pageSearch");
  if (search)
    search.oninput = () => filterRows("#pageTable tbody", search.value);
}
