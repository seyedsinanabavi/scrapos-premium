// Dashboard: totals for the last 30 days and the latest documents, all read from the API.
import { $ } from "../core/dom.js";
import { api, unwrap } from "../core/api.js";
import { loadLists } from "../core/api-pages.js";
import { filterRows } from "../core/table-filter.js";
import { esc } from "../core/html.js";
import { toast } from "../core/toast.js";

const fmt = (v) => (Number.isFinite(Number(v)) ? Number(v).toLocaleString("fa-IR") : "—");
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const STATUS = { draft: "پیش‌نویس", confirmed: "تأیید شده", cancelled: "ابطال شده" };
const STATUS_CLASS = { draft: "status-warning", confirmed: "status-success", cancelled: "status-danger" };

export function dashboardMarkup() {
  return `<div class="page-heading"><div><div class="eyebrow"><span class="live-dot"></span> نمای کلی کسب‌وکار</div><h1>داشبورد</h1><p>خلاصه‌ی ۳۰ روز اخیر و آخرین اسناد مجموعه.</p></div><div class="heading-actions"><button class="btn btn-primary" data-action="new-transaction"><span>＋</span>ثبت معامله جدید</button></div></div><div class="metric-grid"><article class="metric-card"><div class="metric-top">فروش ۳۰ روز اخیر <span class="metric-icon icon-emerald">↗</span></div><div class="metric-value" id="mSales">…</div><div class="metric-foot" id="mSalesFoot">اسناد تأییدشده</div></article><article class="metric-card"><div class="metric-top">خرید ۳۰ روز اخیر <span class="metric-icon icon-blue">↙</span></div><div class="metric-value" id="mPurchases">…</div><div class="metric-foot" id="mPurchasesFoot">اسناد تأییدشده</div></article><article class="metric-card"><div class="metric-top">مطالبات از مشتری‌ها <span class="metric-icon icon-amber">◫</span></div><div class="metric-value" id="mReceivable">…</div><div class="metric-foot">مانده‌ی اسناد فروش</div></article><article class="metric-card"><div class="metric-top">بدهی به تأمین‌کننده‌ها <span class="metric-icon icon-violet">◫</span></div><div class="metric-value" id="mPayable">…</div><div class="metric-foot">مانده‌ی اسناد خرید</div></article></div><div class="lower-grid"><article class="panel table-panel"><div class="panel-heading"><div><h2>آخرین اسناد</h2><p>آخرین خریدها و فروش‌های ثبت‌شده</p></div><button class="btn btn-outline btn-sm" data-action="navigate" data-target="purchases">مشاهده همه</button></div><div class="table-toolbar"><label class="table-search">⌕ <input id="transactionSearch" placeholder="جستجو در اسناد..."></label></div><div class="table-scroll"><table class="data-table"><thead><tr><th>شماره سند</th><th>نوع</th><th>طرف حساب</th><th>تاریخ</th><th>وزن (کیلوگرم)</th><th>مبلغ (تومان)</th><th>وضعیت</th></tr></thead><tbody id="transactionRows"><tr><td colspan="7">در حال بارگذاری…</td></tr></tbody></table></div></article></div>`;
}

function rowsMarkup(rows) {
  if (!rows.length) return `<tr><td colspan="7">سندی ثبت نشده است.</td></tr>`;
  return rows
    .map(
      (r) =>
        `<tr><td><strong class="mono">${esc(r.number)}</strong></td><td>${esc(r.kind)}</td><td>${esc(r.party)}</td><td>${esc(r.date)}</td><td>${esc(r.weight)}</td><td class="amount-cell">${esc(r.total)}</td><td><span class="status ${STATUS_CLASS[r.status] || ""}">${esc(STATUS[r.status] || r.status)}</span></td></tr>`,
    )
    .join("");
}

async function loadMetrics() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  try {
    const trade = await api(`/reports/trade-summary?from=${isoDay(from)}&to=${isoDay(to)}`);
    $("#mSales").textContent = fmt(trade.sales.total_minor);
    $("#mSalesFoot").textContent = `${fmt(trade.sales.documents)} سند تأییدشده`;
    $("#mPurchases").textContent = fmt(trade.purchases.total_minor);
    $("#mPurchasesFoot").textContent = `${fmt(trade.purchases.documents)} سند تأییدشده`;
  } catch (err) {
    toast(err.message);
  }

  // Receivables and payables are open balances, not limited to the period.
  try {
    const balances = await api("/reports/party-balances").then(unwrap);
    const receivable = balances.reduce((sum, b) => sum + Number(b.receivable_minor || 0), 0);
    const payable = balances.reduce((sum, b) => sum + Number(b.payable_minor || 0), 0);
    $("#mReceivable").textContent = fmt(receivable);
    $("#mPayable").textContent = fmt(payable);
  } catch {
    $("#mReceivable").textContent = "—";
    $("#mPayable").textContent = "—";
  }
}

async function loadRecent() {
  try {
    const [{ parties, materials }, sales, purchases] = await Promise.all([
      loadLists(),
      api("/sales?per_page=20").then(unwrap),
      api("/purchases?per_page=20").then(unwrap),
    ]);
    const partyName = new Map(parties.map((p) => [p.id, p.name]));
    const materialName = new Map(materials.map((m) => [m.id, m.name_fa]));

    const rows = [
      ...sales.map((d) => ({ doc: d, kind: "فروش" })),
      ...purchases.map((d) => ({ doc: d, kind: "خرید" })),
    ]
      .sort((a, b) => String(b.doc.created_at).localeCompare(String(a.doc.created_at)))
      .slice(0, 10)
      .map(({ doc, kind }) => {
        const items = doc.items || [];
        const kg = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
        return {
          number: doc.number,
          kind,
          party: partyName.get(doc.party_id) || "—",
          date: doc.created_at ? new Date(doc.created_at).toLocaleDateString("fa-IR") : "—",
          weight: items.length ? fmt(kg) : "—",
          total: fmt(doc.total_minor),
          status: doc.status,
        };
      });

    $("#transactionRows").innerHTML = rowsMarkup(rows);
  } catch (err) {
    $("#transactionRows").innerHTML = `<tr><td colspan="7">${esc(err.message)}</td></tr>`;
  }
}

export function bindDashboard() {
  const search = $("#transactionSearch");
  if (search) search.oninput = () => filterRows("#transactionRows", search.value);

  loadMetrics();
  loadRecent();
}
