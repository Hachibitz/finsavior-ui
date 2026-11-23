import type { Asset, Bill, CardTransaction } from '../types';

export type DashboardFilter = 'recent' | 'fixed' | 'installments' | 'top';
export type DashboardTransaction =
  | (Bill & { type: 'expense' })
  | (CardTransaction & { type: 'expense' })
  | (Omit<Asset, 'type'> & { type: 'income'; category: 'salary' });

function dateSortKey(tx: DashboardTransaction): string {
  const purchase = tx.purchaseDate?.match(/^(\d{4}-\d{2}-\d{2})/);
  if (purchase) return purchase[1];
  const iso = tx.date.match(/^(\d{4}-\d{2})(?:-(\d{2}))?/);
  if (iso) return `${iso[1]}-${iso[2] || '00'}`;
  const billing = tx.date.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!billing) return '';
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const index = months.indexOf(billing[1].toLowerCase());
  return index < 0 ? '' : `${billing[2]}-${String(index + 1).padStart(2, '0')}-00`;
}

export function filterDashboardTransactions(
  transactions: DashboardTransaction[],
  filter: DashboardFilter,
  search: string,
  locale: string
): DashboardTransaction[] {
  const query = search.trim().toLocaleLowerCase(locale);
  const filtered = transactions.filter(tx => {
    if (query && !tx.description.toLocaleLowerCase(locale).includes(query)) return false;
    if (filter === 'recent') return true;
    if (tx.type === 'income') return false;
    if (filter === 'fixed') return Boolean(tx.isRecurrent || tx.fixedBillId);
    if (filter === 'installments') return Boolean(tx.installments && tx.installments.total > 1);
    return true;
  });
  if (filter === 'top') return filtered.sort((a, b) => b.amount - a.amount);
  filtered.sort((a, b) => dateSortKey(b).localeCompare(dateSortKey(a)));
  return filter === 'recent' && !query ? filtered.slice(0, 6) : filtered;
}
