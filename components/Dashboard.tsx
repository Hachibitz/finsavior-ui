import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  BrainCircuit
} from 'lucide-react';
import { Transaction, SummaryData, Category } from '../types';
import { getCategoryIcon } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFinancialAdvice } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  transactions: Transaction[];
  summary: SummaryData;
  categories: Category[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, summary, categories }) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  const chartData = useMemo(() => {
    // Group transactions by date for the chart
    const dataMap = new Map<string, number>();
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap.set(dateStr, 0);
    }

    transactions.forEach(t => {
      const dateStr = t.date.split('T')[0];
      if (dataMap.has(dateStr)) {
        // Net value for chart
        const val = t.type === 'income' ? t.amount : -t.amount;
        dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + val);
      }
    });

    return Array.from(dataMap.entries()).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount
    }));
  }, [transactions]);

  const handleGetAdvice = async () => {
    setIsLoadingAdvice(true);
    const advice = await getFinancialAdvice(transactions);
    setAiAdvice(advice);
    setIsLoadingAdvice(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Financial Overview</h2>
          <p className="text-slate-400 mt-1">Track your wealth and spending habits</p>
        </div>
        
        <button 
          onClick={handleGetAdvice}
          disabled={isLoadingAdvice}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-indigo-300 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
        >
          <BrainCircuit size={18} />
          {isLoadingAdvice ? 'Analyzing...' : 'Get AI Insights'}
        </button>
      </div>

      {/* AI Insight Box */}
      {aiAdvice && (
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 p-6 rounded-2xl animate-slide-up">
          <div className="flex items-center gap-2 mb-3 text-indigo-300">
            <BrainCircuit size={20} />
            <h3 className="font-semibold">FinSavior AI Advisor</h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown>{aiAdvice}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-medium text-sm">Total Balance</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                ${summary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-primary/20 rounded-xl text-primary">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
            <ArrowUpRight size={14} />
            <span>+2.4% this month</span>
          </div>
        </div>

        <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-medium text-sm">Monthly Income</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">
                ${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-medium text-sm">Monthly Expenses</p>
              <h3 className="text-3xl font-bold text-rose-400 mt-1">
                ${summary.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-500">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20">
          <h3 className="text-lg font-semibold text-white mb-6">Net Cash Flow (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`$${Math.abs(value)}`, value >= 0 ? 'Net Income' : 'Net Expense']}
                />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl shadow-black/20">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((t) => {
              const category = categories.find(c => c.id === t.category) || categories[0];
              return (
                <div key={t.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${category?.color || '#64748b'}20`, color: category?.color || '#64748b' }}
                    >
                      {getCategoryIcon(category?.icon || 'coffee', 18)}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{t.description}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className="text-slate-500 text-center py-4">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;