import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { getCategoryIcon } from '../constants';
import { Search, Filter, ArrowDown, ArrowUp } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories }) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter;
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Transactions</h2>
        
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="bg-surface border border-slate-700/50 text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full md:w-64"
             />
           </div>
           
           <div className="flex bg-surface border border-slate-700/50 rounded-xl p-1">
             <button 
               onClick={() => setFilter('all')}
               className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               All
             </button>
             <button 
               onClick={() => setFilter('income')}
               className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
             >
               Income
             </button>
             <button 
               onClick={() => setFilter('expense')}
               className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
             >
               Expense
             </button>
           </div>
        </div>
      </div>

      <div className="bg-surface border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-sm">
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTransactions.map((t) => {
                const category = categories.find(c => c.id === t.category) || categories[0];
                return (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category?.color || '#64748b'}20`, color: category?.color || '#64748b' }}
                        >
                          {getCategoryIcon(category?.icon || 'coffee', 16)}
                        </div>
                        <span className="text-slate-200 text-sm hidden sm:inline">{category?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">{t.description}</span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                       <span className={`font-semibold flex items-center justify-end gap-1 ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {t.type === 'income' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                         ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;