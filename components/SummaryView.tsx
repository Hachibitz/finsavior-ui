import React, { useMemo, useState, useEffect } from 'react';
import { SummaryData, Bill, Asset, CardTransaction, Category, UserProfile, AiAdviceDTO } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
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
  X,
  Loader2,
  ShieldCheck,
  Info,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { getCategoryIcon } from '../constants';
import { aiAdviceService } from '../services/aiAdviceService';
import { billService } from '../services/billService';
import { Notification } from '../types/notifications';
import ReactMarkdown from 'react-markdown';
import AiAnalysisModal from './AiAnalysisModal';
import { SaviIcon } from './Logo';

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
  profile: UserProfile | null;
  onNavigate?: (tab: string) => void;
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
  onCloseInsight,
  profile,
  onNavigate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(initialInsightOpen || false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(() => {
    return !sessionStorage.getItem('dashboard_scroll_hint_shown');
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollHint(false);
        sessionStorage.setItem('dashboard_scroll_hint_shown', 'true');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isSavingsVisible, setIsSavingsVisible] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isBannerClosed, setIsBannerClosed] = useState(() => {
    const closedAt = sessionStorage.getItem('summary_banner_closed_at');
    if (!closedAt) return false;
    const tenMinutes = 10 * 60 * 1000;
    return (Date.now() - parseInt(closedAt, 10)) < tenMinutes;
  });

  const handleCloseBanner = () => {
    setIsBannerClosed(true);
    sessionStorage.setItem('summary_banner_closed_at', Date.now().toString());
  };

  const getLastSixMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
      });
    }
    return months;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      const months = getLastSixMonths();
      
      try {
        const results = await Promise.all(months.map(async (m) => {
          // Fetch data for each month
          const [billsData, cardData, assetsData] = await Promise.all([
            billService.getBills(m.key),
            billService.getCardBills(m.key),
            billService.getAssetsBills(m.key)
          ]);
          
          // Calculate values
          // Receitas: Assets that are not "Poupança"
          const income = assetsData
            .filter(a => a.type !== 'savings')
            .reduce((acc, a) => acc + a.amount, 0);
          
          // Despesas: Bills + Card Transactions
          const cardExpense = cardData.reduce((acc, t) => acc + t.amount, 0);
          const billsExpense = billsData.reduce((acc, b) => acc + b.amount, 0);
          const totalExpense = billsExpense + cardExpense;
          
          // Poupança: Assets with type "savings"
          const savings = assetsData
            .filter(a => a.type === 'savings')
            .reduce((acc, a) => acc + a.amount, 0);

          return {
            name: m.label.charAt(0).toUpperCase() + m.label.slice(1),
            income,
            expense: totalExpense,
            savings,
            card: cardExpense
          };
        }));
        
        setHistoricalData(results);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

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
      // Find category by ID or Name
      const cat = categories.find(c => 
        c.id === e.category || 
        c.name.toLowerCase() === e.category.toLowerCase()
      );
      const key = cat?.id || e.category;
      totals[key] = (totals[key] || 0) + e.amount;
    });

    return Object.entries(totals).map(([catId, value]) => {
      const cat = categories.find(c => c.id === catId || c.name.toLowerCase() === catId.toLowerCase());
      return {
        name: cat?.name || catId,
        value,
        color: cat?.color || '#64748b'
      };
    }).sort((a, b) => b.value - a.value);
  }, [allExpenses, categories]);

  const totalSavings = useMemo(() => {
    return assets.filter(a => a.type === 'savings').reduce((acc, a) => acc + a.amount, 0);
  }, [assets]);

  const netWorth = useMemo(() => {
    // User wants PL including savings
    // summary.totalBalance already includes (Income - Expenses)
    // Since filteredAssets includes savings, totalIncome includes savings, so totalBalance includes savings.
    return summary.totalBalance;
  }, [summary.totalBalance]);

  const savingsRate = useMemo(() => {
    if (summary.totalIncome === 0) return 0;
    return Math.max(0, ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100);
  }, [summary]);

  // AI Insight logic moved to App.tsx for caching

  const handleGenerateReport = () => {
    setIsAnalysisModalOpen(true);
  };

  const handleConfirmAnalysis = async (data: AiAdviceDTO) => {
    setIsGeneratingReport(true);
    
    try {
      const response = await aiAdviceService.generateFullReport(data);

      onAddNotification?.({
        title: 'Relatório Completo Pronto!',
        message: `O relatório financeiro detalhado foi gerado com sucesso.`,
        type: 'success',
        actionUrl: 'ai',
        actionData: { reportId: response.id.toString() }
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      onAddNotification?.({
        title: 'Erro ao Gerar Relatório',
        message: error?.message || 'Não foi possível gerar seu relatório no momento. Tente novamente mais tarde.',
        type: 'error'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      {/* Upsell Banner for Free Users */}
      {(!profile?.plan || profile.plan.planId === 'FREE' || profile.plan.planDs === 'FREE') && !isBannerClosed && (
        <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          
          <button 
            onClick={handleCloseBanner}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all z-20"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 shrink-0">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Evolua para o Premium</h3>
              <p className="text-slate-400 text-sm">Análises ilimitadas, comandos de voz e integração com WhatsApp.</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-plans'));
            }}
            className="px-8 py-3 bg-white text-slate-900 font-black rounded-xl text-sm hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10"
          >
            Ver Planos
          </button>
        </div>
      )}

      {/* Hero Section - Modern Glassmorphism */}
      <div className="relative rounded-[2.5rem] bg-slate-900 p-6 md:p-8 shadow-2xl border border-white/5">
        {/* Blur circles contained in a separate absolute div with overflow hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-indigo-300/80 mb-2">
              <Wallet size={16} />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Patrimônio Líquido</span>
                <div className="relative group">
                  <Info size={12} className="text-indigo-400/60 cursor-help hover:text-white transition-colors" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none">
                    <p className="text-[10px] text-slate-300 leading-relaxed normal-case font-medium">
                      O Patrimônio Líquido é calculado somando todas as suas receitas e economias (incluindo poupança) e subtraindo todas as suas despesas do mês.
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="p-1 hover:bg-white/5 rounded-full transition-colors"
                title={isBalanceVisible ? "Ocultar Saldo" : "Mostrar Saldo"}
              >
                {isBalanceVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                {isBalanceVisible 
                  ? `R$ ${netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'R$ ••••••••'}
              </h1>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                  <TrendingUp size={12} />
                  <span>{isBalanceVisible ? `+R$ ${summary.totalIncome.toLocaleString()}` : 'R$ •••'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-rose-400 font-black text-[10px] uppercase tracking-wider">
                  <TrendingDown size={12} />
                  <span>{isBalanceVisible ? `-R$ ${summary.totalExpense.toLocaleString()}` : 'R$ •••'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
             <div className="text-left md:text-right">
                <div className="flex items-center md:justify-end gap-1.5 mb-1">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Taxa de Poupança</p>
                  <div className="relative group">
                    <Info size={12} className="text-slate-600 cursor-help hover:text-primary transition-colors" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none">
                      <p className="text-[10px] text-slate-300 leading-relaxed normal-case font-medium">
                        Percentual da sua renda que foi economizado ou investido este mês.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center md:justify-end gap-2">
                   <span className={`text-2xl font-black ${
                     savingsRate > 30 ? 'text-emerald-400' : savingsRate > 10 ? 'text-amber-400' : 'text-rose-400'
                   }`}>
                     {savingsRate.toFixed(1)}%
                   </span>
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                     savingsRate > 30 ? 'bg-emerald-500/10 text-emerald-400' : savingsRate > 10 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                   }`}>
                     {savingsRate > 30 ? 'Excelente' : savingsRate > 10 ? 'Boa' : 'Atenção'}
                   </span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Scroll Hint - Only on mobile and once per session */}
      {showScrollHint && (
        <div className="md:hidden flex flex-col items-center gap-1 py-4 animate-bounce opacity-50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role para ver mais</p>
          <ChevronDown size={16} className="text-slate-500" />
        </div>
      )}

      {/* AI Quick Insight - Minimalist & Atmospheric */}
      <div 
        className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-white/5 p-5 rounded-3xl flex items-center gap-4 group hover:border-primary/20 transition-all cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-16 h-16 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <SaviIcon className="w-16 h-16" />
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
                <SaviIcon className="w-16 h-16" />
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
                <h3 className="font-bold text-white">Evolução Mensal</h3>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-4 px-3 py-1 bg-white/5 rounded-xl">
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Receitas</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Despesas</span>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full relative">
              {isLoadingHistory ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/20 backdrop-blur-sm rounded-2xl z-10">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculando tendências...</p>
                </div>
              ) : null}
              
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px', 
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                    itemStyle={{ padding: '2px 0' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Receitas"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name="Despesas"
                    stroke="#f43f5e" 
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    name="Poupança"
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorSavings)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="card" 
                    name="Total de Cartão"
                    stroke="#f59e0b" 
                    fillOpacity={1} 
                    fill="url(#colorCard)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Receitas</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-rose-500 bg-rose-500/20" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Despesas</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500/20" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Poupança</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-500/20" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Cartão</span>
               </div>
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
                    {isBalanceVisible 
                    ? `R$ ${summary.forecastBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'R$ ••••••••'}
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
                <button 
                  onClick={() => onNavigate?.('debits')}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                >
                  Ver Tudo
                </button>
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
      <AiAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onConfirm={handleConfirmAnalysis}
        profile={profile}
        initialDate={selectedMonth}
      />
    </div>
  );
};

export default SummaryView;