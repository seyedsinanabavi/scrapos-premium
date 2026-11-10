// "New transaction" modal form.
import { $ } from "../core/dom.js";
import { closeModal } from "../core/modal.js";
import { renderPage, currentPageKey } from "../core/router.js";
import { toast } from "../core/toast.js";
import { addTransaction, nextTransactionId } from "../data/transactions.js";

const DEMO_DATE = "۱۴۰۳/۰۷/۳۰";

export function bindTransactionForm() {
  $("#transactionForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const weight = `${Number($("#txWeight").value).toLocaleString("fa-IR")} kg`;
    const amount = Number($("#txAmount").value).toLocaleString("fa-IR");

    addTransaction([
      nextTransactionId(),
      $("#txMaterial").value,
      $("#txParty").value,
      DEMO_DATE,
      weight,
      amount,
      $("#txStatus").value,
    ]);

    closeModal();
    e.target.reset();
    if (currentPageKey() === "dashboard") renderPage("dashboard");
    toast("معامله جدید با موفقیت ثبت شد.");
  });
}
