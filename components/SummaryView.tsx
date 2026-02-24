import React, { useMemo, useState, useEffect } from 'react';
import { SummaryData, Bill, Asset, CardTransaction, Category } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Zap, 
  Target, 
  Sparkles, 
  ChevronRight, 
  Wallet, 
  CreditCard,
  PieChart as PieIcon,
  Activity,
  BrainCircuit,
  RotateCcw,
  X
} from 'lucide-react';
import { getCategoryIcon } from '../constants';
import { aiAdviceService } from '../services/aiAdviceService';
import { Notification } from '../types/notifications';
import ReactMarkdown from 'react-markdown';

interface SummaryViewProps {
  summary: SummaryData;
  bills: Bill[];
  assets: Asset[];
  cardTransactions: CardTransaction[];
  categories: Category[];
  selectedMonth: string;
  aiTip?: string | null;
  loadingTip?: boolean;
  onRefreshInsight?: () => void;
  onAddNotification?: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  initialInsightOpen?: boolean;
  onCloseInsight?: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ 
  summary, 
  bills, 
  assets, 
  cardTransactions, 
  categories, 
  selectedMonth,
  aiTip,
  loadingTip,
  onRefreshInsight,
  onAddNotification,
  initialInsightOpen,
  onCloseInsight
}) => {
  const [isModalOpen, setIsModalOpen] = useState(initialInsightOpen || false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (initialInsightOpen) {
      setIsModalOpen(true);
    }
  }, [initialInsightOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onCloseInsight?.();
  };

  // Combine all expenses for analysis
  const allExpenses = useMemo(() => [
    ...bills.map(b => ({ ...b, type: 'expense' as const })),
    ...cardTransactions.map(t => ({ ...t, type: 'expense' as const }))
  ], [bills, cardTransactions]);

  // Combine all transactions for recent list
  const recentTransactions = useMemo(() => {
    const combined = [
      ...bills.map(b => ({ ...b, type: 'expense' as const })),
      ...cardTransactions.map(t => ({ ...t, type: 'expense' as const })),
      ...assets.map(a => ({ ...a, type: 'income' as const, category: 'salary' }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [bills, cardTransactions, assets]);

  // Category breakdown data
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    allExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    return Object.entries(totals).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || catId,
        value,
        color: cat?.color || '#64748b'
      };
    }).sort((a, b) => b.value - a.value);
  }, [allExpenses, categories]);

  const evolutionData = [
    { name: 'Set', income: 4000, expense: 3200 },
    { name: 'Out', income: 5500, expense: 4100 },
    { name: 'Nov', income: 4800, expense: 4600 },
    { name: 'Dez', income: 7200, expense: 5000 },
    { name: 'Jan', income: 6100, expense: 4800 },
    { name: 'Fev', income: summary.totalIncome, expense: summary.totalExpense },
  ];

  const savingsRate = useMemo(() => {
    if (summary.totalIncome === 0) return 0;
    return Math.max(0, ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100);
  }, [summary]);

  // AI Insight logic moved to App.tsx for caching

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const finishDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const response = await aiAdviceService.generateFullReport({
        analysisTypeId: 1, // Full report
        temperature: 0.7,
        startDate,
        finishDate,
        isUsingCoins: false
      });

      onAddNotification?.({
        title: 'Relatório Completo Pronto!',
        message: `O relatório financeiro detalhado de ${selectedMonth} foi gerado com sucesso.`,
        type: 'success',
        actionUrl: 'ai',
        actionData: { reportId: response.id.toString() }
      });
    } catch (error) {
      console.error('Error generating report:', error);
      onAddNotification?.({
        title: 'Erro ao Gerar Relatório',
        message: 'Não foi possível gerar seu relatório no momento. Tente novamente mais tarde.',
        type: 'error'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Hero Section - Modern Glassmorphism */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl border border-white/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-300/80 mb-2">
              <Wallet size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Patrimônio Líquido</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
              R$ {summary.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-400 font-bold text-sm">
                <TrendingUp size={16} />
                <span>+R$ {summary.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl text-rose-400 font-bold text-sm">
                <TrendingDown size={16} />
                <span>-R$ {summary.totalExpense.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
             <div className="text-right">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Taxa de Poupança</p>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${savingsRate}%` }}
                      />
                   </div>
                   <span className="text-white font-black text-lg">{Math.round(savingsRate)}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* AI Quick Insight - Minimalist & Atmospheric */}
      <div 
        className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-white/5 p-5 rounded-3xl flex items-center gap-4 group hover:border-primary/20 transition-all cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
          <BrainCircuit size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Savi Insight</span>
             {loadingTip && <div className="w-1 h-1 bg-primary rounded-full animate-ping" />}
          </div>
          <p className="text-slate-300 text-sm font-medium truncate italic">
            {loadingTip ? "Analisando seus padrões de gastos..." : aiTip || "Mantenha o foco nos seus objetivos de longo prazo!"}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRefreshInsight?.();
          }}
          disabled={loadingTip}
          className={`p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all ${loadingTip ? 'animate-spin opacity-50' : ''}`}
          title="Atualizar Insight"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Insight Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={handleCloseModal}>
          <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Savi Insight</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Análise de Inteligência</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-200 text-lg leading-relaxed italic font-medium">
                  {aiTip || "Nenhum insight disponível para este período."}
                </p>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {selectedMonth}
                </div>
                <button 
                  onClick={() => {
                    onRefreshInsight?.();
                    handleCloseModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all"
                >
                  <RotateCcw size={14} />
                  Regerar Análise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Evolution Chart */}
          <div className="glass-card p-6 rounded-[2rem] border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Activity size={20} />
                </div>
                <h3 className="font-bold text-white">Fluxo de Caixa</h3>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[10px] font-bold bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors">6M</button>
                <button className="px-3 py-1 text-[10px] font-bold bg-primary text-white rounded-lg">1Y</button>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px' }} 
                    cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={4} />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown & Forecast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="glass-card p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                    <PieIcon size={20} />
                  </div>
                  <h3 className="font-bold text-white">Gastos por Categoria</h3>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                   {categoryData.slice(0, 3).map(cat => (
                     <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                           <span className="text-slate-400">{cat.name}</span>
                        </div>
                        <span className="text-white font-bold">R$ {cat.value.toLocaleString()}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="glass-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                      <Zap size={20} />
                    </div>
                    <h3 className="font-bold text-white">Previsão de Fechamento</h3>
                  </div>
                  <p className="text-4xl font-black text-white tracking-tight">
                    R$ {summary.forecastBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Baseado na média dos últimos 3 meses e gastos fixos pendentes.</p>
                </div>
                
                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Saúde Financeira</span>
                      <span className={`text-[10px] font-black uppercase ${
                        savingsRate > 30 ? 'text-emerald-400' : savingsRate > 10 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {savingsRate > 30 ? 'Excelente' : savingsRate > 10 ? 'Boa' : 'Atenção'}
                      </span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          savingsRate > 30 ? 'bg-emerald-500' : savingsRate > 10 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(5, savingsRate * 1.5))}%` }}
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
           <div className="glass-card p-6 rounded-[2rem] border border-white/5 h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-white">Atividade Recente</h3>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">Ver Tudo</button>
              </div>

              <div className="space-y-6">
                {recentTransactions.map((t, idx) => {
                  const category = categories.find(c => c.id === (t as any).category);
                  const isIncome = t.type === 'income';
                  return (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}
                          style={!isIncome && category ? { backgroundColor: `${category.color}15`, color: category.color } : {}}
                        >
                          {isIncome ? <TrendingUp size={20} /> : getCategoryIcon(category?.icon || 'coffee', 20)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate w-32 md:w-40">{t.description}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                          {isIncome ? '+' : '-'} R$ {t.amount.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                          {isIncome ? 'Depósito' : (t as any).cardId ? 'Cartão' : 'Débito'}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {recentTransactions.length === 0 && (
                  <div className="text-center py-20">
                     <Activity size={40} className="mx-auto text-slate-800 mb-4" />
                     <p className="text-slate-500 text-sm">Nenhuma atividade recente.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className={`w-full mt-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${isGeneratingReport ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                 <Sparkles size={14} className={isGeneratingReport ? 'animate-spin' : 'text-primary'} />
                 {isGeneratingReport ? 'Gerando Relatório...' : 'Gerar Relatório Completo'}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SummaryView;