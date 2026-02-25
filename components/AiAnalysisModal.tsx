import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, Calendar, Sparkles, Coins, HelpCircle, Info, ChevronRight } from 'lucide-react';
import { UserProfile, AiAdviceDTO } from '../types';
import { aiAdviceService } from '../services/aiAdviceService';
import { useToast } from '../contexts/ToastContext';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AiAdviceDTO) => void;
  profile: UserProfile | null;
  initialDate?: string; // YYYY-MM
}

const ANALYSIS_TYPES = [
  { id: 1, label: 'Mensal', period: 1, coinCost: 10, description: 'Análise detalhada do seu mês atual.' },
  { id: 2, label: 'Trimestral', period: 3, coinCost: 20, description: 'Visão estratégica dos últimos 3 meses.' },
  { id: 3, label: 'Anual', period: 12, coinCost: 50, description: 'Retrospectiva e projeção para o ano todo.' },
];

const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  profile,
  initialDate 
}) => {
  const [analysisTypeId, setAnalysisTypeId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().slice(0, 7));
  const [temperature, setTemperature] = useState(0.7);
  const [isUsingCoins, setIsUsingCoins] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { showToast } = useToast();

  const isFreePlan = profile?.plan?.planDs === 'FREE';

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsValidating(true);
    try {
      // 1. Validate coverage if not using coins
      if (!isUsingCoins) {
        const hasCoverage = await aiAdviceService.validateHasCoverage(analysisTypeId);
        if (!hasCoverage) {
          showToast('Seu plano não cobre esta análise. Use FSCoins ou faça upgrade!', 'error');
          setIsValidating(false);
          return;
        }
      } else {
        // Validate coins
        const selectedType = ANALYSIS_TYPES.find(t => t.id === analysisTypeId);
        if (selectedType && (profile?.coins || 0) < selectedType.coinCost) {
          showToast('Saldo de FSCoins insuficiente!', 'error');
          setIsValidating(false);
          return;
        }
      }

      // 2. Prepare dates
      const [year, month] = selectedDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const selectedType = ANALYSIS_TYPES.find(t => t.id === analysisTypeId)!;
      
      const finishDate = new Date(startDate);
      finishDate.setMonth(startDate.getMonth() + selectedType.period);
      finishDate.setDate(finishDate.getDate() - 1);
      finishDate.setHours(23, 59, 59);
      startDate.setHours(0, 0, 0);

      const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - offset * 60000);
        return adjustedDate.toISOString().slice(0, -1);
      };

      onConfirm({
        analysisTypeId,
        temperature,
        startDate: toLocalISOString(startDate),
        finishDate: toLocalISOString(finishDate),
        isUsingCoins
      });
      onClose();
    } catch (error) {
      console.error('Validation error:', error);
      showToast('Erro ao validar análise. Tente novamente.', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Nova Análise</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configure sua inteligência</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          {/* Analysis Type */}
          <section>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Tipo de Análise</label>
            <div className="grid grid-cols-1 gap-3">
              {ANALYSIS_TYPES.map((type) => {
                const isRestricted = isFreePlan && type.id !== 1;
                return (
                  <button
                    key={type.id}
                    onClick={() => !isRestricted && setAnalysisTypeId(type.id)}
                    disabled={isRestricted}
                    className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-4 group relative ${
                      analysisTypeId === type.id 
                        ? 'bg-primary/10 border-primary text-white' 
                        : isRestricted
                          ? 'bg-slate-800/20 border-white/5 text-slate-600 cursor-not-allowed grayscale'
                          : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      analysisTypeId === type.id ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <BrainCircuit size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{type.label}</span>
                        {isUsingCoins && (
                          <span className="text-[10px] font-black bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Coins size={10} /> {type.coinCost}
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-60 mt-0.5">{type.description}</p>
                    </div>
                    {isRestricted && (
                      <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                        <span className="text-[8px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          Pro Feature
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Date Selection */}
          <section>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Mês de Início</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="month" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </section>

          {/* Temperature / Creativity */}
          <section className={isFreePlan ? 'opacity-50 grayscale pointer-events-none relative' : ''}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nível de Criatividade</label>
                {isFreePlan && (
                  <span className="text-[8px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    Pro Feature
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-primary">{Math.round(temperature * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={isFreePlan ? 0 : temperature}
              disabled={isFreePlan}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <span>Conservador</span>
              <span>Inovador</span>
            </div>
            {isFreePlan && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold text-white shadow-2xl">
                  Disponível em planos BASIC, PLUS ou PREMIUM
                </div>
              </div>
            )}
          </section>

          {/* FSCoins Toggle */}
          <section className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Coins size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Usar FSCoins
                    <button 
                      onClick={() => setShowHelp(!showHelp)} 
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </h4>
                  <p className="text-xs text-slate-400">Saldo: {profile?.coins || 0} moedas</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUsingCoins(!isUsingCoins)}
                className={`w-12 h-6 rounded-full transition-all relative ${isUsingCoins ? 'bg-amber-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isUsingCoins ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {showHelp && (
              <div className="mt-4 p-4 bg-slate-900/80 rounded-2xl border border-white/10 text-xs text-slate-300 animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-amber-500 uppercase tracking-widest text-[10px]">O que são FSCoins?</h5>
                  <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white"><X size={12} /></button>
                </div>
                <p className="leading-relaxed mb-3">
                  FSCoins são a moeda virtual do FinSavior. Você pode usá-las para pagar por análises de IA e outras funcionalidades premium sem precisar de uma assinatura.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/5 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Mensal</p>
                    <p className="text-white font-bold">10 moedas</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Trimestral</p>
                    <p className="text-white font-bold">20 moedas</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Anual</p>
                    <p className="text-white font-bold">50 moedas</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Chat Savi</p>
                    <p className="text-white font-bold">10 moedas</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Você pode ganhar moedas assistindo anúncios, realizando tarefas ou comprando pacotes na loja.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 shrink-0">
          <button 
            onClick={handleConfirm}
            disabled={isValidating}
            className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={24} />
                GERAR ANÁLISE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisModal;
