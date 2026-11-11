// Hash-based routing: #dashboard, #sales, ... Each route renders into #pageContent.
import { pages } from "../data/pages.js";
import { $, $$ } from "./dom.js";
import { pageTitle } from "./i18n.js";
import { closeSidebar } from "../features/sidebar.js";
import { dashboardMarkup, bindDashboard } from "../views/dashboard.js";
import { tablePageMarkup, bindTableSearch } from "../views/table.js";
import { reportsMarkup, bindReports } from "../views/reports.js";
import { settingsMarkup } from "../views/settings.js";
import { apiPages } from "./api-pages.js";
import { esc } from "./html.js";

export const currentPageKey = () => (location.hash || "#dashboard").slice(1);

function pageHeadingMarkup(page, title, subtitle) {
  const isWeighbridge = page === "weighbridge";
  const addAction = isWeighbridge ? "weigh" : "add";
  const addLabel = isWeighbridge ? "ثبت توزین جدید" : "افزودن مورد جدید";
  return `<div class="page-heading"><div><div class="eyebrow"><span class="live-dot"></span> SCRAPOS WORKSPACE</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions"><button class="btn btn-quiet" data-action="toast" data-message="بازه زمانی انتخاب شد.">▦ ۳۰ روز گذشته ⌄</button><button class="btn btn-primary" data-action="${addAction}"><span>＋</span>${addLabel}</button></div></div>`;
}

async function renderApiPage(page, p) {
  const heading = pageHeadingMarkup(page, pageTitle(page, p.title), p.sub);
  $("#pageContent").innerHTML = heading + '<article class="panel"><p class="muted">در حال بارگذاری اطلاعات…</p></article>';
  try {
    const rows = await apiPages[page]();
    if (currentPageKey() !== page) return;
    $("#pageContent").innerHTML = heading + tablePageMarkup(page, { ...p, rows });
    bindTableSearch();
  } catch (err) {
    if (currentPageKey() !== page) return;
    $("#pageContent").innerHTML = heading + `<article class="panel"><p class="status status-danger">${esc(err.message)}</p></article>`;
  }
}

export function renderPage(page) {
  const p = pages[page];

  if (apiPages[page]) {
    renderApiPage(page, p);
    return;
  }

  if (p.kind === "dashboard") {
    location.hash = page;
    $("#pageContent").innerHTML = dashboardMarkup();
    bindDashboard();
    return;
  }

  let body;
  if (p.kind === "reports") body = reportsMarkup();
  else if (p.kind === "settings") body = settingsMarkup();
  else body = tablePageMarkup(page, p);

  $("#pageContent").innerHTML =
    pageHeadingMarkup(page, pageTitle(page, p.title), p.sub) + body;
  bindTableSearch();
  if (page === "reports") bindReports();
}

export function navigate(requested) {
  const page = pages[requested] ? requested : "dashboard";
  location.hash = page;
  renderPage(page);
  $$(".nav-link").forEach((a) =>
    a.classList.toggle("active", a.dataset.page === page),
  );
  $("#pageCrumb").textContent = pageTitle(page, pages[page].title);
  closeSidebar();
}

export function initRouter() {
  window.addEventListener("hashchange", () => navigate(currentPageKey()));
  $$(".nav-link").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(a.dataset.page);
    }),
  );
}

export function startRouter() {
  if (location.hash) navigate(location.hash.slice(1));
  else renderPage("dashboard");
}
