import type { Asset, Bill, CardTransaction } from '../types';

export type DashboardFilter = 'recent' | 'fixed' | 'installments' | 'top';
export type DashboardTransaction =
  | (Bill & { type: 'expense' })
  | (CardTransaction & { type: 'expense' })
  | (Omit<Asset, 'type'> & { type: 'income'; category: 'salary' });

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
  filtered.sort((a, b) => (b.purchaseDate || b.date).localeCompare(a.purchaseDate || a.date));
  return filter === 'recent' && !query ? filtered.slice(0, 6) : filtered;
}
