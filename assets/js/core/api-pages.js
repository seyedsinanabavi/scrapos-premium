// Pages that load their rows from the Laravel API. Each loader returns rows in the column order of data/pages.js.
import { api, unwrap } from "./api.js";

const fmtNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("fa-IR") : "—";
};
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("fa-IR") : "—");
const STATUS = { draft: "پیش‌نویس", confirmed: "تأیید شده", cancelled: "ابطال شده" };
const statusLabel = (s) => STATUS[s] ?? s ?? "—";
const ROLE = {
  owner: "مالک", admin: "مدیر", sales: "فروش", buyer: "خرید",
  weighbridge_operator: "اپراتور باسکول", warehouse_operator: "اپراتور انبار", viewer: "مشاهده‌گر",
};
const get = (path) => api(`${path}${path.includes("?") ? "&" : "?"}per_page=200`).then(unwrap);

// Name lookups shared by several pages.
async function lookups() {
  const [parties, materials, warehouses, accounts] = await Promise.all([
    get("/parties"), get("/materials"), get("/warehouses"), get("/finance/accounts"),
  ]);
  return {
    parties: new Map(parties.map((p) => [p.id, p])),
    materials: new Map(materials.map((m) => [m.id, m])),
    warehouses: new Map(warehouses.map((w) => [w.id, w])),
    accounts: new Map(accounts.map((a) => [a.id, a])),
  };
}

// Lists used by the create-transaction form (parties, materials, warehouses).
export async function loadLists() {
  const [parties, materials, warehouses] = await Promise.all([get("/parties"), get("/materials"), get("/warehouses")]);
  return { parties, materials, warehouses };
}

async function documentRows(path) {
  const [{ parties, materials }, docs] = await Promise.all([lookups(), get(path)]);
  return docs.map((d) => {
    const items = d.items || [];
    const kg = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const names = [...new Set(items.map((it) => materials.get(it.material_id)?.name_fa).filter(Boolean))];
    return [
      d.number,
      parties.get(d.party_id)?.name || "—",
      names.join("، ") || "—",
      fmtDate(d.confirmed_at || d.created_at),
      items.length ? fmtNum(kg) : "—",
      fmtNum(d.total_minor),
      statusLabel(d.status),
    ];
  });
}

export const apiPages = {
  weighbridge: async () => {
    const [{ parties, materials }, tickets] = await Promise.all([lookups(), get("/weighbridge-tickets")]);
    return tickets.map((t) => [
      t.number,
      t.vehicle_plate || "—",
      parties.get(t.party_id)?.name || "—",
      materials.get(t.material_id)?.name_fa || "—",
      fmtNum(t.gross_weight),
      fmtNum(t.net_weight),
      statusLabel(t.status),
    ]);
  },

  purchases: () => documentRows("/purchases"),
  sales: () => documentRows("/sales"),

  // Stock per material, summed over warehouses (the ledger balance endpoint returns one row per warehouse).
  inventory: async () => {
    const [{ materials }, balances] = await Promise.all([lookups(), get("/inventory")]);
    const totals = new Map();
    for (const row of balances) {
      totals.set(row.material_id, (totals.get(row.material_id) || 0) + Number(row.quantity));
    }
    return [...totals].map(([id, qty]) => {
      const m = materials.get(id) || {};
      return [m.code || "—", m.name_fa || "—", "—", fmtNum(qty), m.unit || "—", "—", qty > 0 ? "موجود" : "تمام شده"];
    });
  },

  materials: async () => {
    const materials = await get("/materials");
    return materials.map((m) => [
      m.code,
      m.name_fa,
      "—",
      "—",
      m.unit,
      fmtNum(m.suggested_buy_price_minor),
      m.is_active ? "فعال" : "غیرفعال",
    ]);
  },

  processing: async () => {
    const [{ warehouses }, batches] = await Promise.all([lookups(), get("/processing-batches")]);
    // Input and output weights need the batch lines, which the list does not include yet.
    return batches.map((b) => [
      b.number,
      warehouses.get(b.warehouse_id)?.name || "—",
      "—", "—", "—", "—",
      statusLabel(b.status),
    ]);
  },

  contacts: async () => {
    const [{ parties }, balances] = await Promise.all([lookups(), api("/reports/party-balances").then(unwrap)]);
    const balanceOf = new Map(balances.map((b) => [b.party_id, b.receivable_minor - b.payable_minor]));
    return [...parties.values()].map((p) => {
      const type = p.is_customer && p.is_supplier ? "مشتری و تأمین‌کننده" : p.is_customer ? "مشتری" : p.is_supplier ? "تأمین‌کننده" : "—";
      return [
        p.id.slice(-8),
        p.name,
        type,
        p.phone || "—",
        fmtNum(balanceOf.get(p.id) ?? 0),
        "—",
        p.is_active ? "فعال" : "غیرفعال",
      ];
    });
  },

  finance: async () => {
    const [{ accounts }, transactions] = await Promise.all([lookups(), get("/finance/transactions")]);
    return transactions.map((t) => {
      const amount = fmtNum(t.amount_minor);
      return [
        t.id.slice(-8),
        t.reason,
        accounts.get(t.account_id)?.name || "—",
        fmtDate(t.occurred_at),
        t.direction === "in" ? amount : "—",
        t.direction === "out" ? amount : "—",
        t.reverses_id ? "برگشتی" : "ثبت شده",
      ];
    });
  },

  fleet: async () => {
    const [{ parties }, vehicles] = await Promise.all([lookups(), get("/vehicles")]);
    return vehicles.map((v) => [
      "—",
      v.plate,
      parties.get(v.driver_id)?.name || "—",
      "—", "—", "—",
      v.is_active ? "فعال" : "غیرفعال",
    ]);
  },

  team: async () => {
    const members = await api("/members").then(unwrap);
    return members.map((m) => [m.name, m.email, ROLE[m.role] || m.role || "—", "—", "—", "فعال"]);
  },
};
