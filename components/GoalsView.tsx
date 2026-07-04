import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Goal, UserProfile } from '../types';
import { Plus, Target, Calendar, TrendingUp, Trash2, Edit2, X, ChevronRight, Sparkles, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { goalService } from '../services/goalService';
import { coinService } from '../services/coinService';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatShortDate } from '../i18n/localeFormat';
import { translateApiError } from '../utils/apiError';

interface GoalsViewProps {
  profile: UserProfile | null;
  onRefreshCoins?: () => void;
  onNavigateToPlans?: () => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ profile, onRefreshCoins, onNavigateToPlans }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState<string | null>(null);
  const [goalAdvice, setGoalAdvice] = useState<Record<string, string>>({});
  const [expandedAdvice, setExpandedAdvice] = useState<Record<string, boolean>>({});
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const [adviceToView, setAdviceToView] = useState<string | null>(null);
  
  // Limit alert state
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState('');
  const [userFsCoins, setUserFsCoins] = useState(0);
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);
  const adviceCost = 5;

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetchGoals();
    refreshCoins();
  }, []);

  const refreshCoins = async () => {
    try {
      const balance = await coinService.getBalance();
      setUserFsCoins(balance);
      onRefreshCoins?.();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const data = await goalService.getGoals();
      setGoals(data);
      
      // Fetch history for each goal to populate advice
      data.forEach(async (goal) => {
        try {
          const history = await goalService.getGoalAdviceHistory(goal.id);
          if (history && history.length > 0) {
            // Use the latest advice (assuming history is sorted by date desc)
            setGoalAdvice(prev => ({ ...prev, [goal.id]: history[0].advice }));
          }
        } catch (e) {
          console.error(`Error fetching history for goal ${goal.id}`, e);
        }
      });
    } catch (error) {
      console.error('Error fetching goals:', error);
      showToast(translateApiError(error, t('goals.loadError')), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGoal = await goalService.addGoal({
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline
      });
      setGoals([...goals, newGoal]);
      setIsAddModalOpen(false);
      resetForm();
      showToast(t('goals.addSuccess'), 'success');
    } catch (error) {
      showToast(translateApiError(error, t('goals.addError')), 'error');
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      const updatedGoal = await goalService.updateGoal({
        ...selectedGoal,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline
      });
      setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setIsEditModalOpen(false);
      resetForm();
      showToast(t('goals.updateSuccess'), 'success');
    } catch (error) {
      showToast(translateApiError(error, t('goals.updateError')), 'error');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await goalService.deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
      showToast(t('goals.deleteSuccess'), 'success');
    } catch (error) {
      showToast(translateApiError(error, t('goals.deleteError')), 'error');
    }
  };

  const handleGetAdvice = async (goalId: string, forceRefresh = false, useCoins = false) => {
    // Se já temos o conselho e não é um refresh forçado e não estamos usando moedas, não chama a API
    if (goalAdvice[goalId] && !forceRefresh && !useCoins) return;

    setIsAdviceLoading(goalId);
    try {
      const { advice } = await goalService.getGoalAdvice(goalId, useCoins);
      setGoalAdvice(prev => ({ ...prev, [goalId]: advice }));
      if (useCoins) {
        refreshCoins();
        showToast(t('goals.adviceSuccess'), 'success');
      }
    } catch (error: any) {
      if (error.status === 403 || error.status === 400) {
        const msg = error.response?.data?.msg || error.message || t('goals.adviceError');
        setLimitErrorMessage(msg);
        setPendingGoalId(goalId);
        setShowLimitAlert(true);
      } else if (error.status === 412) {
        showToast(t('voice.insufficientCoins'), 'error');
      } else {
        setGoalAdvice(prev => ({ ...prev, [goalId]: t('goals.adviceError') }));
      }
    } finally {
      setIsAdviceLoading(null);
    }
  };

  const handleRetryWithCoins = async () => {
    if (pendingGoalId) {
      setShowLimitAlert(false);
      await handleGetAdvice(pendingGoalId, true, true);
      setPendingGoalId(null);
    }
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setSelectedGoal(null);
  };

  const calculateMonthlySaving = (goal: Goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    
    const now = new Date();
    const targetDate = new Date(goal.deadline);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    return diffMonths > 0 ? remaining / diffMonths : remaining;
  };

  const getProgress = (goal: Goal) => {
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('goals.title')}</h2>
          <p className="text-slate-400 text-sm">{t('goals.subtitle')}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('goals.loading')}</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="grid gap-4">
          {goals.map(goal => {
            const progress = getProgress(goal);
            const monthly = calculateMonthlySaving(goal);
            const isCompleted = progress >= 100;

            return (
              <div key={goal.id} className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-widest z-10">
                    {t('goals.completed')}
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'}`}>
                      <Target size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Calendar size={12} />
                        <span>{t('goals.until')} {formatShortDate(goal.deadline)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setSelectedGoal(goal);
                        setName(goal.name);
                        setTargetAmount(goal.targetAmount.toString());
                        setCurrentAmount(goal.currentAmount.toString());
                        setDeadline(goal.deadline.split('T')[0]);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-rose-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">{t('goals.progress')}</p>
                      <p className="text-white font-bold">{formatCurrency(goal.currentAmount)} <span className="text-slate-500 font-normal text-sm">/ {formatCurrency(goal.targetAmount)}</span></p>
                    </div>
                    <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : 'text-primary'}`}>{progress.toFixed(0)}%</span>
                  </div>

                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {!isCompleted && (
                    <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <TrendingUp size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{t('goals.savePerMonth')}</p>
                          <p className="text-white font-bold text-sm">{formatCurrency(monthly)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGetAdvice(goal.id, !!goalAdvice[goal.id])}
                        disabled={isAdviceLoading === goal.id}
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-white transition-colors"
                      >
                        {isAdviceLoading === goal.id ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {goalAdvice[goal.id] ? t('goals.updateTips') : t('goals.aiTips')}
                      </button>
                    </div>
                  )}

                  {goalAdvice[goal.id] && (
                    <div className="mt-4 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl animate-fade-in">
                      <div className="flex items-start gap-3">
                        <Sparkles className="text-indigo-400 shrink-0 mt-1" size={16} />
                        <div className="flex-1 overflow-hidden">
                          <div 
                            className="prose prose-invert prose-xs max-w-none text-slate-300 max-h-24 overflow-hidden relative cursor-pointer"
                            onClick={() => {
                              setAdviceToView(goalAdvice[goal.id]);
                              setIsAdviceModalOpen(true);
                            }}
                          >
                            <ReactMarkdown>{goalAdvice[goal.id]}</ReactMarkdown>
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-indigo-950/20 to-transparent" />
                          </div>
                          <button 
                            onClick={() => {
                              setAdviceToView(goalAdvice[goal.id]);
                              setIsAdviceModalOpen(true);
                            }}
                            className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-white transition-colors"
                          >
                            {t('goals.viewFullAdvice')} <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-6">
            <Target size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('goals.noGoals')}</h3>
          <p className="text-slate-400 text-sm max-w-xs">
            {t('goals.noGoalsDesc')}
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:scale-105 transition-all"
          >
            {t('goals.createFirst')}
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-3xl border border-slate-700 shadow-2xl p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{isEditModalOpen ? t('goals.editGoal') : t('goals.newGoal')}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <form onSubmit={isEditModalOpen ? handleUpdateGoal : handleAddGoal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">{t('goals.goalName')}</label>
                <input 
                  type="text" 
                  placeholder={t('goals.goalPlaceholder')} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-primary outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">{t('goals.targetAmount')}</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-primary outline-none"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">{t('goals.alreadyHave')}</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-primary outline-none"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">{t('goals.deadline')}</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-primary outline-none"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl mt-4 transition-all shadow-lg shadow-primary/20">
                {isEditModalOpen ? t('goals.saveChanges') : t('goals.createGoal')}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Advice Modal */}
      {isAdviceModalOpen && adviceToView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] animate-scale-in">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <h3 className="text-xl font-bold text-white">{t('goals.aiAdvice')}</h3>
              </div>
              <button onClick={() => setIsAdviceModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                <ReactMarkdown>{adviceToView}</ReactMarkdown>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700">
              <button 
                onClick={() => setIsAdviceModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Alert Modal */}
      {showLimitAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-8 animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2">{t('goals.limitTitle')}</h3>
            <p className="text-slate-400 text-sm mb-6">{t('goals.useCoinsPrompt', { msg: limitErrorMessage, cost: adviceCost, balance: userFsCoins })}</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleRetryWithCoins}
                disabled={userFsCoins < adviceCost}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {t('goals.useCoins', { count: adviceCost })}
              </button>
              <button 
                onClick={() => {
                  setShowLimitAlert(false);
                  onNavigateToPlans?.();
                }}
                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                {t('goals.viewPlans')}
              </button>
              <button 
                onClick={() => setShowLimitAlert(false)}
                className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsView;
