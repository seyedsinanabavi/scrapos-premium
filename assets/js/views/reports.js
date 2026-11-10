// Reports screen: summary metrics and report shortcuts (demo data).

export function reportsMarkup() {
  return `<div class="metric-grid"><article class="metric-card"><div class="metric-top">فروش دوره <span class="metric-icon icon-emerald">↗</span></div><div class="metric-value">۲.۴۸ <small>میلیارد تومان</small></div><div class="metric-foot"><span class="trend positive">↑ ۱۲.۸٪</span> نسبت به دوره قبل</div></article><article class="metric-card"><div class="metric-top">حاشیه سود <span class="metric-icon icon-blue">◈</span></div><div class="metric-value">۱۷.۲٪</div><div class="metric-foot">میانگین کل معاملات</div></article><article class="metric-card"><div class="metric-top">تناژ فرآوری <span class="metric-icon icon-violet">⚙</span></div><div class="metric-value">۲۱۴.۸ <small>تن</small></div><div class="metric-foot">بازده متوسط ۸۸.۴٪</div></article><article class="metric-card"><div class="metric-top">مطالبات <span class="metric-icon icon-amber">◫</span></div><div class="metric-value">۱۸۶ <small>میلیون تومان</small></div><div class="metric-foot">۳ فاکتور سررسید گذشته</div></article></div><div class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><h2>عملکرد ماهانه</h2><p>روند فروش و خرید در شش ماه اخیر</p></div><button class="filter-btn" data-action="export">⇩ خروجی</button></div><div class="report-bars">${[
    ["فروردین", 52, 38],
    ["اردیبهشت", 68, 48],
    ["خرداد", 58, 44],
    ["تیر", 78, 55],
    ["مرداد", 72, 51],
    ["شهریور", 91, 62],
  ]
    .map(
      (x) =>
        `<div class="bar-group"><div class="bars"><i style="height:${x[1]}%"></i><i style="height:${x[2]}%"></i></div><small>${x[0]}</small></div>`,
    )
    .join(
      "",
    )}</div><div class="legend"><span><i class="legend-dot sales-dot"></i>فروش</span><span><i class="legend-dot purchase-dot"></i>خرید</span></div></article><article class="panel"><div class="panel-heading"><div><h2>سودآوری بر اساس گروه</h2><p>سهم هر گروه در سود ناخالص</p></div></div><div class="profit-list">${[
    ["فلزات", "۵۸٪", "58%"],
    ["پلاستیک", "۲۲٪", "22%"],
    ["کاغذ و مقوا", "۱۲٪", "12%"],
    ["سایر", "۸٪", "8%"],
  ]
    .map(
      (x) =>
        `<div><div><span>${x[0]}</span><strong>${x[1]}</strong></div><i><b style="width:${x[2]}"></b></i></div>`,
    )
    .join(
      "",
    )}</div></article></div><article class="panel report-shortcuts"><div class="panel-heading"><div><h2>گزارش‌های آماده</h2><p>برای مشاهده جزئیات، گزارش موردنظر را انتخاب کنید.</p></div></div><div class="shortcut-grid">${["گزارش خرید و فروش", "تحلیل سود هر ماده", "گردش موجودی انبار", "عملکرد تأمین‌کنندگان", "گزارش فرآوری و افت", "گردش نقدینگی"].map((x, i) => `<button class="shortcut" data-action="toast" data-message="گزارش «${x}» در نسخه تجاری قابل توسعه است."><span>${["↗", "◈", "▧", "♙", "⚙", "◫"][i]}</span><strong>${x}</strong><small>مشاهده گزارش ←</small></button>`).join("")}</div></article>`;
}
