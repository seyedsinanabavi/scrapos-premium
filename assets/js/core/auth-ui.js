import { $, } from "./dom.js";
import { apiBase, setApiBase, session, login, loadMe, api } from "./api.js";
import { toast } from "./toast.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function ensureStyles() {
  if (document.getElementById("scrapos-auth-style")) return;
  const style = document.createElement("style"); style.id = "scrapos-auth-style";
  style.textContent = `.auth-screen{position:fixed;inset:0;z-index:10000;background:var(--bg,#f5f6f8);display:grid;place-items:center;padding:20px}.auth-card{width:min(440px,100%);background:var(--panel,#fff);border:1px solid var(--border,#e5e7eb);border-radius:20px;padding:28px;box-shadow:0 24px 80px #0002}.auth-card h1{margin:0 0 8px;font-size:24px}.auth-card p{color:var(--muted,#667085);line-height:1.8}.auth-card .field{display:grid;gap:7px;margin:14px 0}.auth-card input,.auth-card select{width:100%;padding:12px;border:1px solid var(--border,#ddd);border-radius:10px;background:transparent;color:inherit}.auth-card button{width:100%;margin-top:12px}.auth-error{color:#dc2626;min-height:24px;font-size:13px}.auth-config{font-size:12px;color:var(--muted,#667085);margin-top:18px;word-break:break-all}.auth-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.auth-logo{font-weight:800;letter-spacing:2px;color:var(--accent,#16a34a)}`;
  document.head.append(style);
}

function screen(markup) {
  ensureStyles();
  let root = document.getElementById("scraposAuth");
  if (!root) { root = document.createElement("div"); root.id = "scraposAuth"; document.body.append(root); }
  root.innerHTML = `<div class="auth-screen"><section class="auth-card">${markup}</section></div>`;
  return root;
}

export function showLogin(message = "") {
  const root = screen(`<div class="auth-top"><span class="auth-logo">SCRAPOS</span><span class="eyebrow">WORKSPACE</span></div><h1>ورود به حساب کاربری</h1><p>برای مشاهده اطلاعات واقعی مجموعه، وارد حساب خود شوید.</p><form id="authLogin"><label class="field">آدرس API<input id="authApi" dir="ltr" value="${esc(apiBase())}" required></label><label class="field">ایمیل<input id="authEmail" type="email" autocomplete="username" required></label><label class="field">رمز عبور<input id="authPassword" type="password" autocomplete="current-password" required></label><div class="auth-error" id="authError">${esc(message)}</div><button class="btn btn-primary" type="submit">ورود امن</button></form><div class="auth-config">آدرس پیش‌فرض بک‌اند: ${esc(apiBase())}</div>`);
  root.querySelector("#authLogin").addEventListener("submit", async e => {
    e.preventDefault(); const btn = e.currentTarget.querySelector("button"); btn.disabled = true; btn.textContent = "در حال ورود…";
    try {
      setApiBase(root.querySelector("#authApi").value);
      const value = await login(root.querySelector("#authEmail").value, root.querySelector("#authPassword").value);
      if (value.businesses.length > 1) showBusinessPicker(value);
      else if (!value.business) { session.clear(); showLogin("این حساب به هیچ مجموعه‌ای متصل نیست."); }
      else { root.remove(); window.dispatchEvent(new Event("scrapos:authenticated")); }
    } catch (err) { root.querySelector("#authError").textContent = err.message; btn.disabled = false; btn.textContent = "ورود امن"; }
  });
}

function showBusinessPicker(value) {
  const root = screen(`<div class="auth-top"><span class="auth-logo">SCRAPOS</span><span>انتخاب مجموعه</span></div><h1>به کدام مجموعه وارد می‌شوید؟</h1><p>دسترسی‌ها و اطلاعات بر اساس مجموعه انتخاب‌شده محدود می‌شوند.</p><label class="field">مجموعه<select id="businessChoice">${value.businesses.map(b => `<option value="${esc(b.id)}">${esc(b.name)} — ${esc(b.role)}</option>`).join("")}</select></label><button class="btn btn-primary" id="chooseBusiness">ادامه</button><button class="btn btn-quiet" id="authLogout">خروج از حساب</button>`);
  root.querySelector("#chooseBusiness").onclick = () => {
    const business = value.businesses.find(b => b.id === root.querySelector("#businessChoice").value);
    session.save({ ...value, business }); root.remove(); window.dispatchEvent(new Event("scrapos:authenticated"));
  };
  root.querySelector("#authLogout").onclick = async () => { try { await api("/auth/logout", { method: "POST" }); } catch {} session.clear(); showLogin(); };
}

export async function initAuth() {
  window.addEventListener("scrapos:unauthorized", () => { session.clear(); showLogin("نشست شما منقضی شده است؛ دوباره وارد شوید."); });
  const current = session.value;
  if (!current?.token) { showLogin(); return false; }
  try {
    const value = await loadMe();
    if (!value.business && value.businesses.length > 1) showBusinessPicker(value);
    else if (!value.business) showLogin("برای این حساب مجموعه فعالی یافت نشد.");
    else window.dispatchEvent(new Event("scrapos:authenticated"));
    return Boolean(value.business);
  } catch (err) { session.clear(); showLogin(err.message); return false; }
}

export async function logout() {
  try { await api("/auth/logout", { method: "POST" }); } catch {}
  session.clear(); showLogin();
}
