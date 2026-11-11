const STORAGE_KEY = "scrapos.auth.v1";
const CONFIG_KEY = "scrapos.apiBase";

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

export const session = {
  get value() { return readSession(); },
  save(value) { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)); },
  clear() { sessionStorage.removeItem(STORAGE_KEY); },
};

export function apiBase() {
  return (localStorage.getItem(CONFIG_KEY) || window.SCRAPOS_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
}

export function setApiBase(value) {
  const clean = String(value || "").trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(clean)) throw new Error("آدرس API باید با http:// یا https:// شروع شود.");
  localStorage.setItem(CONFIG_KEY, clean);
}

export async function api(path, options = {}) {
  const auth = session.value;
  const { idempotent, raw, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers || {});
  headers.set("Accept", "application/json");
  if (requestOptions.body && !(requestOptions.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (auth?.token) headers.set("Authorization", `Bearer ${auth.token}`);
  if (auth?.business?.id) headers.set("X-Business-Id", auth.business.id);
  if (idempotent) headers.set("Idempotency-Key", crypto.randomUUID());

  let response;
  try {
    response = await fetch(`${apiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
      ...requestOptions, headers,
      body: requestOptions.body && typeof requestOptions.body !== "string" && !(requestOptions.body instanceof FormData)
        ? JSON.stringify(requestOptions.body) : requestOptions.body,
    });
  } catch {
    throw new Error("ارتباط با سرور برقرار نشد. آدرس API و تنظیمات CORS را بررسی کنید.");
  }

  if (raw) {
    if (!response.ok) throw new Error(`خطای سرور (${response.status})`);
    return response.blob();
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new CustomEvent("scrapos:unauthorized"));
    const validation = payload?.errors ? Object.values(payload.errors).flat().join("، ") : "";
    throw new Error(validation || payload?.message || `خطای سرور (${response.status})`);
  }
  return payload;
}

export async function login(email, password, deviceName = "ScrapOS Web") {
  const result = await api("/auth/login", { method: "POST", body: { email, password, device_name: deviceName } });
  const value = { token: result.token, user: result.user, businesses: result.businesses || [], business: null };
  if (value.businesses.length === 1) value.business = value.businesses[0];
  session.save(value);
  return value;
}

export async function loadMe() {
  const result = await api("/auth/me");
  const old = session.value || {};
  const businesses = result.businesses || [];
  const business = businesses.find(x => x.id === old.business?.id) || (businesses.length === 1 ? businesses[0] : null);
  const next = { ...old, user: result.user, businesses, business };
  session.save(next);
  return next;
}

export const unwrap = (payload) => Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
