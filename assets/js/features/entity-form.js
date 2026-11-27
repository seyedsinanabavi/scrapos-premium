// One modal for creating parties, materials, warehouses, vehicles and finance transactions. Each kind lists its fields and its API endpoint.
import { $ } from "../core/dom.js";
import { esc } from "../core/html.js";
import { api, unwrap } from "../core/api.js";
import { toast } from "../core/toast.js";
import { renderPage, currentPageKey } from "../core/router.js";

const KINDS = {
  party: {
    title: "شخص جدید",
    endpoint: "/parties",
    fields: [
      { key: "name", label: "نام", required: true },
      { key: "phone", label: "تلفن" },
      { key: "address", label: "آدرس" },
      { key: "roles", type: "checks", options: [["is_customer", "مشتری"], ["is_supplier", "تأمین‌کننده"], ["is_driver", "راننده"], ["is_contractor", "پیمانکار"]] },
      { key: "notes", label: "یادداشت" },
    ],
  },
  material: {
    title: "ماده‌ی جدید",
    endpoint: "/materials",
    fields: [
      { key: "category_id", label: "گروه", type: "select", source: "categories", required: true },
      { key: "code", label: "کد", required: true, ltr: true },
      { key: "name_fa", label: "نام فارسی", required: true },
      { key: "name_en", label: "نام انگلیسی", ltr: true },
      { key: "unit", label: "واحد", required: true, value: "kg" },
      { key: "suggested_buy_price_minor", label: "قیمت پیشنهادی خرید (تومان)", type: "number" },
      { key: "suggested_sell_price_minor", label: "قیمت پیشنهادی فروش (تومان)", type: "number" },
      { key: "reorder_level", label: "حد سفارش مجدد", type: "number" },
    ],
  },
  warehouse: {
    title: "انبار جدید",
    endpoint: "/warehouses",
    fields: [
      { key: "code", label: "کد انبار", required: true, ltr: true },
      { key: "name", label: "نام انبار", required: true },
      { key: "address", label: "آدرس" },
    ],
  },
  vehicle: {
    title: "خودروی جدید",
    endpoint: "/vehicles",
    fields: [
      { key: "plate", label: "پلاک", required: true, ltr: true },
      { key: "type", label: "نوع خودرو" },
      { key: "capacity_kg", label: "ظرفیت (کیلوگرم)", type: "number" },
      { key: "driver_id", label: "راننده", type: "select", source: "drivers" },
      { key: "notes", label: "یادداشت" },
    ],
  },
  finance: {
    title: "تراکنش مالی جدید",
    endpoint: "/finance/transactions",
    fields: [
      { key: "account_id", label: "حساب", type: "select", source: "accounts", required: true },
      {
        key: "direction", label: "نوع", type: "select", required: true,
        options: [["in", "دریافت (ورودی)"], ["out", "پرداخت (خروجی)"]],
      },
      { key: "amount_minor", label: "مبلغ (تومان)", type: "number", required: true },
      { key: "reason", label: "شرح", required: true },
    ],
  },
};

// Options for a select field: either fixed options or a list loaded from the API.
async function optionsFor(f) {
  if (f.options) return f.options;
  try {
    if (f.source === "categories") {
      return (await api("/material-categories").then(unwrap)).map((c) => [c.id, c.name]);
    }
    if (f.source === "accounts") {
      return (await api("/finance/accounts?per_page=200").then(unwrap)).map((a) => [a.id, a.name]);
    }
    if (f.source === "drivers") {
      return (await api("/parties?per_page=200").then(unwrap)).filter((p) => p.is_driver).map((p) => [p.id, p.name]);
    }
  } catch (err) {
    toast(err.message);
  }
  return [];
}

let currentKind = null;

async function renderFields(kind) {
  const config = KINDS[kind];
  $("#entityTitle").textContent = config.title;

  const selects = await Promise.all(
    config.fields.map((f) => (f.type === "select" ? optionsFor(f) : Promise.resolve(null))),
  );

  $("#entityFields").innerHTML = config.fields
    .map((f, i) => {
      if (f.type === "checks") {
        return `<div class="field wide"><span>نقش‌ها</span><div class="check-row">${f.options
          .map(([k, label]) => `<label><input type="checkbox" data-check="${esc(k)}"> ${esc(label)}</label>`)
          .join("")}</div></div>`;
      }
      if (f.type === "select") {
        const options = selects[i].map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("");
        return `<label class="field"><span>${esc(f.label)}${f.required ? " *" : ""}</span><select data-key="${esc(f.key)}" ${f.required ? "required" : ""}><option value="">انتخاب کنید</option>${options}</select></label>`;
      }
      const type = f.type === "number" ? "number" : "text";
      return `<label class="field"><span>${esc(f.label)}${f.required ? " *" : ""}</span><input data-key="${esc(f.key)}" type="${type}" ${f.required ? "required" : ""} ${f.ltr ? 'dir="ltr"' : ""} value="${esc(f.value ?? "")}"></label>`;
    })
    .join("");
}

export async function openEntityForm(kind) {
  currentKind = kind;
  $("#entityBackdrop").classList.add("open");
  await renderFields(kind);
}

function closeEntity() {
  $("#entityBackdrop").classList.remove("open");
  $("#entityForm").reset();
}

function collect(kind) {
  const config = KINDS[kind];
  const body = {};
  for (const f of config.fields) {
    if (f.type === "checks") {
      f.options.forEach(([key]) => {
        body[key] = document.querySelector(`[data-check="${key}"]`)?.checked === true;
      });
      continue;
    }
    const el = document.querySelector(`#entityForm [data-key="${f.key}"]`);
    const raw = el ? el.value.trim() : "";
    if (f.type === "number") body[f.key] = raw === "" ? null : Number(raw);
    else body[f.key] = raw === "" ? null : raw;
  }
  return body;
}

export function bindEntityForm() {
  $("#entityClose").onclick = closeEntity;
  $("#entityCancel").onclick = closeEntity;
  $("#entityBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "entityBackdrop") closeEntity();
  });

  $("#entityForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentKind) return;
    const form = e.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await api(KINDS[currentKind].endpoint, { method: "POST", body: collect(currentKind), idempotent: true });
      toast(`${KINDS[currentKind].title} ثبت شد.`);
      closeEntity();
      if (currentPageKey()) renderPage(currentPageKey());
    } catch (err) {
      toast(err.message);
    } finally {
      submit.disabled = false;
    }
  });
}
