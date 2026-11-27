// Cancels a confirmed processing batch. The panel is added below the processing table.
// Cancelling writes reversing stock movements on the server, so the reason is required.
import { $ } from "../core/dom.js";
import { esc } from "../core/html.js";
import { api, unwrap } from "../core/api.js";
import { toast } from "../core/toast.js";
import { renderPage, currentPageKey } from "../core/router.js";

export async function renderProcessingCancel() {
  let batches;
  try {
    batches = await api("/processing-batches?status=confirmed&per_page=200").then(unwrap);
  } catch (err) {
    toast(err.message);
    return;
  }
  // The user may have left the page while the request was running.
  if (currentPageKey() !== "processing" || !$("#pageContent")) return;

  const options = batches.map((b) => `<option value="${esc(b.id)}">${esc(b.number)}</option>`).join("");
  $("#pageContent").insertAdjacentHTML(
    "beforeend",
    `<article class="panel report-shortcuts" id="procCancelPanel"><div class="panel-heading"><div><h2>ابطال دسته‌ی فرآوری</h2><p>ابطال یک دسته‌ی تأییدشده، حرکت برگشتی در موجودی ثبت می‌کند. دلیل ابطال الزامی است.</p></div></div>${
      batches.length
        ? `<form id="procCancelForm" class="form-grid"><label class="field"><span>دسته *</span><select id="procCancelBatch" required><option value="">انتخاب کنید</option>${options}</select></label><label class="field"><span>دلیل ابطال *</span><input id="procCancelReason" required minlength="3" maxlength="255"></label><div class="modal-actions"><button type="submit" class="btn btn-primary">ابطال دسته</button></div></form>`
        : `<p class="muted">دسته‌ی تأییدشده‌ای برای ابطال وجود ندارد.</p>`
    }</article>`,
  );

  const form = $("#procCancelForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const id = $("#procCancelBatch").value;
      await api(`/processing-batches/${id}/cancel`, {
        method: "POST",
        body: { reason: $("#procCancelReason").value.trim() },
        idempotent: true,
      });
      toast("دسته ابطال شد.");
      renderPage(currentPageKey());
    } catch (err) {
      toast(err.message);
      submit.disabled = false;
    }
  });
}
