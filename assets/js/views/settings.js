import { $ } from "../core/dom.js";
import { api, unwrap } from "../core/api.js";
import { toast } from "../core/toast.js";
import { getLanguage, setLanguage } from "../core/i18n.js";
import { esc } from "../core/html.js";

// Settings screen (demo controls; persisting settings is part of the backend work).

export function settingsMarkup() {
  return `<div class="settings-grid"><article class="panel settings-panel"><div class="panel-heading"><div><h2>تنظیمات عمومی</h2><p>مشخصات پایه فضای کاری خود را مدیریت کنید.</p></div></div><div class="settings-form"><label class="field"><span>نام مجموعه</span><input id="sName" value=""></label><label class="field"><span>واحد پول</span><select id="sCurrency"><option value="IRT">تومان (IRT)</option><option value="IRR">ریال (IRR)</option><option value="USD">دلار (USD)</option></select></label><label class="field"><span>واحد وزن پیش‌فرض</span><select id="sWeight"><option value="kg">کیلوگرم</option><option value="ton">تن</option></select></label><label class="field"><span>زبان سیستم</span><select id="settingsLang"><option value="fa">فارسی</option><option value="en">English</option></select></label><button class="btn btn-primary" id="saveSettings">ذخیره تغییرات</button></div></article><article class="panel settings-panel"><div class="panel-heading"><div><h2>شخصی‌سازی ظاهر</h2><p>محیط کار را مطابق سلیقه خود تنظیم کنید.</p></div></div><div class="setting-row"><div><strong>حالت تاریک</strong><small>استفاده از پوسته تیره در محیط کار</small></div><button class="switch" id="settingsTheme"><i></i></button></div><div class="setting-row"><div><strong>نمایش اعلان‌ها</strong><small>اعلان رویدادهای مهم سیستم</small></div><button class="switch on" data-action="switch"><i></i></button></div><div class="setting-row"><div><strong>نمایش اعداد فارسی</strong><small>استفاده از ارقام فارسی در گزارش‌ها</small></div><button class="switch on" data-action="switch"><i></i></button></div></article><article class="panel settings-panel"><div class="panel-heading"><div><h2>دسته‌بندی مواد</h2><p>گروه‌های اصلی قابل استفاده در مجموعه.</p></div><button class="btn btn-outline btn-sm" id="addCategory">＋ افزودن گروه</button></div><form id="categoryForm" class="settings-form" hidden><label class="field"><span>کد گروه</span><input id="catCode" required maxlength="50" dir="ltr"></label><label class="field"><span>نام گروه</span><input id="catName" required maxlength="150"></label><button class="btn btn-primary" type="submit">ثبت گروه</button></form><div class="category-chips" id="categoryChips"><span>در حال بارگذاری…</span></div></article></div>`;
}

// Loads the business settings from the API and saves changes. Only owners and admins can save.
export async function bindSettings() {
  const save = $("#saveSettings");
  if (!save) return;
  const fields = ["#sName", "#sCurrency", "#sWeight", "#settingsLang"].map((id) => $(id));

  try {
    const business = await api("/business").then(unwrap);
    $("#sName").value = business.name;
    $("#sCurrency").value = business.currency;
    $("#sWeight").value = business.default_weight_unit;
    $("#settingsLang").value = business.language;

    if (!["owner", "admin"].includes(business.role)) {
      fields.forEach((el) => (el.disabled = true));
      save.disabled = true;
      save.title = "فقط مالک و مدیر می‌توانند تنظیمات را تغییر دهند.";
      $("#addCategory").disabled = true;
    }
  } catch (err) {
    toast(err.message);
  }

  bindCategories();

  save.onclick = async () => {
    save.disabled = true;
    try {
      const body = {
        name: $("#sName").value.trim(),
        currency: $("#sCurrency").value,
        default_weight_unit: $("#sWeight").value,
        language: $("#settingsLang").value,
      };
      const updated = await api("/business", { method: "PATCH", body, idempotent: true }).then(unwrap);
      if (updated.language !== getLanguage()) await setLanguage(updated.language);
      toast("تنظیمات ذخیره شد.");
    } catch (err) {
      toast(err.message);
    } finally {
      save.disabled = false;
    }
  };
}

// Material groups: the list comes from the API and owners or admins can add new groups.
async function loadCategories() {
  const chips = $("#categoryChips");
  try {
    const rows = await api("/material-categories").then(unwrap);
    chips.innerHTML = rows.length
      ? rows.map((c) => `<span>${esc(c.name)} <b>${esc(c.code)}</b></span>`).join("")
      : "<span>هنوز گروهی ثبت نشده است.</span>";
  } catch (err) {
    chips.innerHTML = `<span>${esc(err.message)}</span>`;
  }
}

export function bindCategories() {
  const form = $("#categoryForm");
  if (!form) return;

  $("#addCategory").onclick = () => {
    form.hidden = !form.hidden;
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await api("/material-categories", {
        method: "POST",
        body: { code: $("#catCode").value.trim(), name: $("#catName").value.trim() },
        idempotent: true,
      });
      form.reset();
      form.hidden = true;
      toast("گروه ثبت شد.");
      await loadCategories();
    } catch (err) {
      toast(err.message);
    } finally {
      submit.disabled = false;
    }
  };

  loadCategories();
}
