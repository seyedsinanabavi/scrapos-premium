// Delegated handler for every element with a data-action attribute.
import { exportTable } from "../core/csv-export.js";
import { openModal } from "../core/modal.js";
import { navigate } from "../core/router.js";
import { toast } from "../core/toast.js";

export function bindActions() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    switch (el.dataset.action) {
      case "toast":
        toast(el.dataset.message || "عملیات با موفقیت انجام شد.");
        break;
      case "navigate":
        navigate(el.dataset.target);
        break;
      case "new-transaction":
      case "add":
        openModal();
        break;
      case "weigh":
        toast("فرم ثبت توزین در نسخه کامل به باسکول متصل می‌شود.");
        break;
      case "date-range":
        toast("بازه زمانی: ۳۰ روز گذشته");
        break;
      case "export":
        exportTable();
        break;
      case "save-settings":
        toast("تنظیمات نمونه ذخیره شد.");
        break;
      case "switch":
        el.classList.toggle("on");
        break;
      default:
        break;
    }
  });
}
