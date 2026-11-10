// Transactions list. Stored in localStorage for the demo only.
// TODO(backend): replace with GET/POST /api/v1/sales|purchases and remove localStorage use.
const STORAGE_KEY = "scrapos-transactions";

const SEED = [
  [
    "TRX-2408",
    "آهن سنگین",
    "شرکت فولاد آریا",
    "۱۴۰۳/۰۷/۲۹",
    "۱۲,۵۰۰ kg",
    "۱۸۷,۵۰۰,۰۰۰",
    "تسویه شده",
  ],
  [
    "TRX-2407",
    "مس کابلی",
    "احمد محمدی",
    "۱۴۰۳/۰۷/۲۹",
    "۸۵۰ kg",
    "۳۴۰,۰۰۰,۰۰۰",
    "در انتظار",
  ],
  [
    "TRX-2406",
    "پت شفاف",
    "پارس پلیمر",
    "۱۴۰۳/۰۷/۲۸",
    "۳,۲۰۰ kg",
    "۹۶,۰۰۰,۰۰۰",
    "تسویه شده",
  ],
  [
    "TRX-2405",
    "کارتن فشرده",
    "بازیافت نوین",
    "۱۴۰۳/۰۷/۲۸",
    "۵,۰۰۰ kg",
    "۴۲,۵۰۰,۰۰۰",
    "سررسید گذشته",
  ],
];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) return saved;
  } catch {
    /* corrupted or blocked storage: fall back to the seed data */
  }
  return SEED.map((row) => [...row]);
}

function save(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable: the change lasts until reload */
  }
}

let rows = load();

export const listTransactions = () => rows;

export const nextTransactionId = () => `TRX-${2409 + rows.length}`;

export function addTransaction(row) {
  rows.unshift(row);
  save(rows);
}
