const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/** Converts calendar selection (yyyy-MM) to backend billing month ("Jan 2026"). */
export function yyyyMMToBillDate(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTHS[idx] ?? 'Jan'} ${year}`;
}

/** Normalizes any bill date representation to yyyy-MM for month inputs. */
export function billDateToYYYYMM(dateStr?: string | null): string | null {
  if (!dateStr) return null;

  const iso = dateStr.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;

  const mon = dateStr.match(/([A-Za-z]{3,})\s*(\d{4})/);
  if (mon) {
    const mm = MONTH_MAP[mon[1].slice(0, 3).toLowerCase()] || '01';
    return `${mon[2]}-${mm}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
}

export function resolveBillDateForDto(bill: {
  billingMonth?: string;
  date?: string;
}, existingBillDate?: string): string {
  if (bill.billingMonth) return yyyyMMToBillDate(bill.billingMonth);
  if (bill.date && /^[A-Za-z]{3}\s+\d{4}$/.test(bill.date.trim())) return bill.date.trim();
  if (existingBillDate && /^[A-Za-z]{3}\s+\d{4}$/.test(existingBillDate.trim())) return existingBillDate;

  const isoDay = (bill.date ? String(bill.date) : '').split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
    const [y, m] = isoDay.split('-');
    return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
  }

  return existingBillDate || yyyyMMToBillDate(new Date().toISOString().slice(0, 7));
}

export function resolvePurchaseDateForDto(
  purchaseDate?: string | null,
  existingPurchaseDate?: string | null
): string | undefined {
  const raw = purchaseDate || existingPurchaseDate;
  if (!raw) return undefined;
  const day = raw.split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
}
