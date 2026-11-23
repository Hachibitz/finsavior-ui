import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterDashboardTransactions } from './dashboardTransactions.ts';

const entries = [
  { id: 'a', type: 'expense', description: 'Aluguel', amount: 800, date: 'Jan 2026', isRecurrent: true },
  { id: 'b', type: 'expense', description: 'Cartão fixo', amount: 200, date: 'Jan 2026', fixedBillId: 1 },
  { id: 'c', type: 'expense', description: 'Notebook', amount: 1000, date: 'Jan 2026', installments: { current: 1, total: 3 } },
  { id: 'd', type: 'income', description: 'Salário', amount: 9000, date: 'Jan 2026' },
];

test('filters fixed and installment bills across sources', () => {
  assert.deepEqual(filterDashboardTransactions(entries, 'fixed', '', 'pt-BR').map(x => x.id), ['a', 'b']);
  assert.deepEqual(filterDashboardTransactions(entries, 'installments', '', 'pt-BR').map(x => x.id), ['c']);
});

test('sorts expenses by amount and searches case-insensitively', () => {
  assert.deepEqual(filterDashboardTransactions(entries, 'top', '', 'pt-BR').map(x => x.id), ['c', 'a', 'b']);
  assert.deepEqual(filterDashboardTransactions(entries, 'recent', 'CARTÃO', 'pt-BR').map(x => x.id), ['b']);
});

test('limits only the default recent view', () => {
  const many = Array.from({ length: 8 }, (_, index) => ({ ...entries[0], id: String(index) }));
  assert.equal(filterDashboardTransactions(many, 'recent', '', 'pt-BR').length, 6);
  assert.equal(filterDashboardTransactions(many, 'recent', 'aluguel', 'pt-BR').length, 8);
});

test('orders actual dates ahead of unknown day in the same billing month', () => {
  const records = [
    { ...entries[0], id: 'unknown', date: 'Dec 2026' },
    { ...entries[1], id: 'known', date: 'Dec 2026', purchaseDate: '2026-12-30' },
    { ...entries[2], id: 'older', date: 'Nov 2026' },
  ];
  assert.deepEqual(filterDashboardTransactions(records, 'recent', '', 'pt-BR').map(x => x.id), ['known', 'unknown', 'older']);
});
