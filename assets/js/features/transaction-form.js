// "New transaction" modal: creates a purchase or sale on the API and confirms it right away.
import { $ } from "../core/dom.js";
import { api } from "../core/api.js";
import { loadLists } from "../core/api-pages.js";
import { closeModal } from "../core/modal.js";
import { renderPage, currentPageKey } from "../core/router.js";
import { toast } from "../core/toast.js";

const fill = (select, items, placeholder) => {
  select.replaceChildren(
    new Option(placeholder, ""),
    ...items.map(([value, label]) => new Option(label, value)),
  );
};

// Purchases need suppliers and sales need customers; a party can be both.
async function populate() {
  try {
    const { parties, materials, warehouses } = await loadLists();
    const wanted = $("#txType").value === "خرید" ? "is_supplier" : "is_customer";
    fill($("#txParty"), parties.filter((p) => p[wanted]).map((p) => [p.id, p.name]), "انتخاب کنید");
    fill($("#txMaterial"), materials.map((m) => [m.id, m.name_fa]), "انتخاب کنید");
    fill($("#txWarehouse"), warehouses.map((w) => [w.id, w.name]), "انتخاب کنید");
  } catch (err) {
    toast(err.message);
  }
}

export function bindTransactionForm() {
  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="new-transaction"], [data-action="add"]')) populate();
  });
  $("#txType").addEventListener("change", populate);

  $("#transactionForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submit = form.querySelector('button[type="submit"]');

    const kg = Number($("#txWeight").value);
    const price = Number($("#txAmount").value);
    const isPurchase = $("#txType").value === "خرید";
    const path = isPurchase ? "/purchases" : "/sales";

    // Line total = quantity x unit price, computed by the server too. The client only sends the inputs.
    const body = {
      party_id: $("#txParty").value || null,
      warehouse_id: $("#txWarehouse").value,
      items: [{ material_id: $("#txMaterial").value, quantity: kg, unit_price_minor: price }],
      paid_minor: $("#txStatus").value === "تسویه شده" ? kg * price : 0,
    };

    submit.disabled = true;
    let doc;
    try {
      doc = (await api(path, { method: "POST", body, idempotent: true })).data;
    } catch (err) {
      submit.disabled = false;
      toast(err.message);
      return;
    }

    try {
      await api(`${path}/${doc.id}/confirm`, { method: "POST", idempotent: true });
    } catch (err) {
      submit.disabled = false;
      toast(`سند ${doc.number} به‌صورت پیش‌نویس ذخیره شد، اما تأیید نشد: ${err.message}`);
      return;
    }

    submit.disabled = false;
    closeModal();
    form.reset();
    if (currentPageKey()) renderPage(currentPageKey());
    toast(`سند ${doc.number} ثبت و تأیید شد.`);
  });
}
