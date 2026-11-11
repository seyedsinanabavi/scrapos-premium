// Pages that load their rows from the Laravel API. Each loader returns rows in the column order of data/pages.js.
import { api, unwrap } from "./api.js";

const fmtNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("fa-IR") : "—";
};
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("fa-IR") : "—");
const STATUS = { draft: "پیش‌نویس", confirmed: "تأیید شده", cancelled: "ابطال شده" };
const statusLabel = (s) => STATUS[s] ?? s ?? "—";

async function nameMaps() {
  const [parties, materials] = await Promise.all([
    api("/parties?per_page=200").then(unwrap),
    api("/materials?per_page=200").then(unwrap),
  ]);
  return {
    party: new Map(parties.map((p) => [p.id, p.name])),
    material: new Map(materials.map((m) => [m.id, m.name_fa ?? m.code])),
  };
}

async function documentRows(path) {
  const [{ party }, docs] = await Promise.all([nameMaps(), api(`${path}?per_page=200`).then(unwrap)]);
  // The list does not include items yet, so material and weight show as "—" here.
  return docs.map((d) => [
    d.number,
    party.get(d.party_id) || "—",
    "—",
    fmtDate(d.confirmed_at || d.created_at),
    "—",
    fmtNum(d.total_minor),
    statusLabel(d.status),
  ]);
}

export const apiPages = {
  weighbridge: async () => {
    const [{ party, material }, tickets] = await Promise.all([
      nameMaps(),
      api("/weighbridge-tickets?per_page=200").then(unwrap),
    ]);
    return tickets.map((t) => [
      t.number,
      t.vehicle_plate || "—",
      party.get(t.party_id) || "—",
      material.get(t.material_id) || "—",
      fmtNum(t.gross_weight),
      fmtNum(t.net_weight),
      statusLabel(t.status),
    ]);
  },
  purchases: () => documentRows("/purchases"),
  sales: () => documentRows("/sales"),
};
