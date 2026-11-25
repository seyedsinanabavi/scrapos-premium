// "Weighing" modal: creates a weighbridge ticket on the API and confirms it right away.
import { $ } from "../core/dom.js";
import { api } from "../core/api.js";
import { loadLists } from "../core/api-pages.js";
import { renderPage, currentPageKey } from "../core/router.js";
import { toast } from "../core/toast.js";

const fill = (select, items, placeholder) => {
  select.replaceChildren(new Option(placeholder, ""), ...items.map(([value, label]) => new Option(label, value)));
};

const closeWeigh = () => $("#weighBackdrop").classList.remove("open");

export async function openWeighForm() {
  $("#weighBackdrop").classList.add("open");
  try {
    const { parties, materials, warehouses } = await loadLists();
    fill($("#wParty"), parties.map((p) => [p.id, p.name]), "بدون طرف حساب");
    fill($("#wMaterial"), materials.map((m) => [m.id, m.name_fa]), "انتخاب کنید");
    fill($("#wWarehouse"), warehouses.map((w) => [w.id, w.name]), "بدون انبار");
  } catch (err) {
    toast(err.message);
  }
}

export function bindWeighForm() {
  $("#weighClose").onclick = closeWeigh;
  $("#weighCancel").onclick = closeWeigh;
  $("#weighBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "weighBackdrop") closeWeigh();
  });

  $("#weighForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submit = form.querySelector('button[type="submit"]');

    const gross = Number($("#wGross").value);
    const tare = Number($("#wTare").value);
    if (tare >= gross) {
      toast("وزن ناخالص باید بیشتر از وزن تاره باشد.");
      return;
    }

    const optional = (id) => $(id).value.trim() || null;
    const body = {
      type: $("#wType").value,
      party_id: optional("#wParty"),
      material_id: $("#wMaterial").value,
      warehouse_id: optional("#wWarehouse"),
      vehicle_plate: optional("#wPlate"),
      driver_name: optional("#wDriver"),
      gross_weight: gross,
      tare_weight: tare,
      notes: optional("#wNotes"),
    };

    submit.disabled = true;
    let ticket;
    try {
      ticket = (await api("/weighbridge-tickets", { method: "POST", body, idempotent: true })).data;
    } catch (err) {
      submit.disabled = false;
      toast(err.message);
      return;
    }

    try {
      await api(`/weighbridge-tickets/${ticket.id}/confirm`, { method: "POST", idempotent: true });
    } catch (err) {
      submit.disabled = false;
      toast(`توزین ${ticket.number} ذخیره شد، اما تأیید نشد: ${err.message}`);
      return;
    }

    submit.disabled = false;
    closeWeigh();
    form.reset();
    if (currentPageKey()) renderPage(currentPageKey());
    toast(`توزین ${ticket.number} ثبت و تأیید شد.`);
  });
}
