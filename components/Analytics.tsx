import React, { useMemo } from 'react';
import { Transaction, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions, categories }) => {
  const expenseData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat?.name || id,
          value,
          color: cat?.color || '#cbd5e1'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const monthlyData = useMemo(() => {
    // Simple mock for monthly comparison (Income vs Expense)
    const data = [
      { name: 'Income', value: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), color: '#10b981' },
      { name: 'Expense', value: transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), color: '#f43f5e' },
    ];
    return data;
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Expenses by Category</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{color: '#94a3b8'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Income vs Expense</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  cursor={{fill: '#334155', opacity: 0.2}} 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;