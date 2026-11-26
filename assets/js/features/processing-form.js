// Processing modal: records a batch (inputs turned into outputs), then confirms it so stock moves.
import { $ } from "../core/dom.js";
import { esc } from "../core/html.js";
import { api } from "../core/api.js";
import { loadLists } from "../core/api-pages.js";
import { renderPage, currentPageKey } from "../core/router.js";
import { toast } from "../core/toast.js";

let materialOptions = "";

const rowMarkup = (kind) => `<div class="proc-row" data-kind="${kind}">
  <select data-role="material" required>${materialOptions}</select>
  <input data-role="quantity" type="number" min="0.001" step="0.001" placeholder="وزن (کیلوگرم)" required>
  <button type="button" class="icon-btn" data-role="remove" title="حذف">×</button>
</div>`;

function addRow(kind) {
  const holder = $(kind === "in" ? "#procInputs" : "#procOutputs");
  holder.insertAdjacentHTML("beforeend", rowMarkup(kind));
}

function collectRows(kind) {
  return [...document.querySelectorAll(`.proc-row[data-kind="${kind}"]`)].map((row) => ({
    material_id: row.querySelector('[data-role="material"]').value,
    quantity: Number(row.querySelector('[data-role="quantity"]').value),
  }));
}

export async function openProcessingForm() {
  $("#procBackdrop").classList.add("open");
  try {
    const { warehouses, materials } = await loadLists();
    materialOptions = `<option value="">انتخاب کنید</option>${materials.map((m) => `<option value="${esc(m.id)}">${esc(m.name_fa)}</option>`).join("")}`;
    $("#procWarehouse").innerHTML = `<option value="">انتخاب کنید</option>${warehouses.map((w) => `<option value="${esc(w.id)}">${esc(w.name)}</option>`).join("")}`;
    $("#procInputs").innerHTML = "";
    $("#procOutputs").innerHTML = "";
    addRow("in");
    addRow("out");
  } catch (err) {
    toast(err.message);
  }
}

function closeProcessing() {
  $("#procBackdrop").classList.remove("open");
  $("#procForm").reset();
}

export function bindProcessingForm() {
  $("#procClose").onclick = closeProcessing;
  $("#procCancel").onclick = closeProcessing;
  $("#procBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "procBackdrop") closeProcessing();
  });
  $("#procAddIn").onclick = () => addRow("in");
  $("#procAddOut").onclick = () => addRow("out");

  document.getElementById("procBackdrop").addEventListener("click", (e) => {
    if (e.target.dataset.role === "remove") e.target.closest(".proc-row").remove();
  });

  $("#procForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submit = form.querySelector('button[type="submit"]');

    const inputs = collectRows("in");
    const outputs = collectRows("out");
    if (!inputs.length || !outputs.length) {
      toast("حداقل یک ورودی و یک خروجی لازم است.");
      return;
    }

    submit.disabled = true;
    let batch;
    try {
      batch = (await api("/processing-batches", {
        method: "POST",
        body: { warehouse_id: $("#procWarehouse").value, notes: $("#procNotes").value.trim() || null, inputs, outputs },
        idempotent: true,
      })).data;
    } catch (err) {
      submit.disabled = false;
      toast(err.message);
      return;
    }

    try {
      await api(`/processing-batches/${batch.id}/confirm`, { method: "POST", idempotent: true });
    } catch (err) {
      submit.disabled = false;
      toast(`عملیات ${batch.number} ذخیره شد، اما تأیید نشد: ${err.message}`);
      return;
    }

    submit.disabled = false;
    closeProcessing();
    if (currentPageKey()) renderPage(currentPageKey());
    toast(`عملیات ${batch.number} ثبت و تأیید شد.`);
  });
}
