import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AiAnalysis, Bill, CardTransaction, Asset, UserProfile, AiAdviceDTO } from '../types';
import { getCategoryLabel } from '../utils/categoryLabel';
import { BrainCircuit, Sparkles, MessageSquare, ChevronRight, Play, X, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiAdviceService } from '../services/aiAdviceService';
import { useToast } from '../contexts/ToastContext';
import { translateApiError } from '../utils/apiError';
import { formatMonthYear, formatShortDate } from '../i18n/localeFormat';
import AiAnalysisModal from './AiAnalysisModal';
import ChatView from './ChatView';
import { SaviIcon } from './Logo';

interface AiAdvisorViewProps {
  bills: Bill[];
  transactions: CardTransaction[];
  assets: Asset[];
  initialReportId?: string | null;
  onCloseReport?: () => void;
  profile: UserProfile | null;
  selectedMonth: string;
  onRefreshCoins?: () => void;
}

const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({ 
  bills, 
  transactions, 
  assets,
  initialReportId,
  onCloseReport,
  profile,
  selectedMonth,
  onRefreshCoins
}) => {
  const { t } = useTranslation();
  const [analyses, setAnalyses] = useState<AiAnalysis[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AiAnalysis | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'chat'>('reports');
  const { showToast } = useToast();

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await aiAdviceService.getAnalyses();
      setAnalyses(data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    if (initialReportId && analyses.length > 0) {
      const found = analyses.find(a => a.id === initialReportId);
      if (found) {
        setSelectedAnalysis(found);
      }
    }
  }, [initialReportId, analyses]);

  const handleCloseReport = () => {
    setSelectedAnalysis(null);
    onCloseReport?.();
  };

  const handleDeleteAnalysis = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(t('ai.deleteConfirm'))) return;
    
    setIsDeleting(id);
    try {
      await aiAdviceService.deleteAnalysis(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      showToast(t('ai.deleteSuccess'), 'success');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      showToast(translateApiError(error, t('ai.deleteError')), 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleNewAnalysis = () => {
    setIsModalOpen(true);
  };

  const handleConfirmAnalysis = async (data: AiAdviceDTO) => {
    setIsGenerating(true);
    try {
      const result = await aiAdviceService.generateFullReport(data);
      
      // Fetch the new analysis details immediately to show it
      const newAnalysis = await aiAdviceService.getAdviceById(result.id);
      
      showToast(t('ai.generateSuccess'), 'success');
      
      // Refresh list and open the new one
      await fetchAnalyses();
      setSelectedAnalysis(newAnalysis);
    } catch (error: any) {
      console.error('Error generating new analysis:', error);
      showToast(translateApiError(error, t('ai.generateError')), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeSubTab === 'chat') {
    return (
      <ChatView 
        profile={profile} 
        onBack={() => setActiveSubTab('reports')} 
        onRefreshCoins={onRefreshCoins}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in min-h-[80vh] flex flex-col">
      {/* Header AI Identity */}
      <div className="text-center py-6">
        <div className="relative w-32 h-32 mx-auto mb-4">
           <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <div className="relative w-full h-full bg-gradient-to-tr from-slate-800 to-slate-900 rounded-full border border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden">
              <SaviIcon className="w-full h-full" />
           </div>
           <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full"></div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">{t('ai.title')}</h1>
        <p className="text-slate-400 text-sm">{t('ai.subtitle')}</p>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mx-auto w-full max-w-lg">
        <div className="glass-card p-1 rounded-2xl flex-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
           <button 
              onClick={handleNewAnalysis}
              disabled={isGenerating}
              className="w-full bg-surface hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
           >
              {isGenerating && <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>}
              <Sparkles size={18} className={`text-blue-400 ${isGenerating ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
              {isGenerating ? t('ai.processing') : t('ai.generateNew')}
           </button>
        </div>
        
        <div className="glass-card p-1 rounded-2xl flex-1 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-indigo-500/20">
           <button 
              onClick={() => setActiveSubTab('chat')}
              className="w-full bg-surface hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 group"
           >
              <SaviIcon className="w-8 h-8" />
              {t('ai.chatWithSavi')}
           </button>
        </div>
      </div>

      {/* Analysis Stream */}
      <div className="flex-1 space-y-6 mt-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">{t('ai.historyTitle')}</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">{t('ai.loadingHistory')}</p>
          </div>
        ) : analyses.length > 0 ? (
          analyses.map((analysis, index) => (
            <div key={analysis.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="bg-surface border border-slate-700/50 rounded-tl-3xl rounded-tr-3xl rounded-br-3xl rounded-bl-sm p-6 shadow-xl relative ml-4">
                {/* Decorative Tail */}
                <div className="absolute top-0 -left-2 w-4 h-4 bg-surface border-l border-t border-slate-700/50 transform -rotate-45"></div>
                
                <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit size={16} className="text-purple-400" />
                      <span className="text-slate-300 font-semibold text-sm">{t('ai.monthlyAnalysis')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{formatShortDate(analysis.date)}</span>
                      <button 
                        onClick={(e) => handleDeleteAnalysis(e, analysis.id)}
                        disabled={isDeleting === analysis.id}
                        className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title={t('ai.deleteAnalysis')}
                      >
                        {isDeleting === analysis.id ? (
                          <div className="w-4 h-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-300 line-clamp-4">
                  <ReactMarkdown 
                      components={{
                          ul: ({node, ...props}) => <ul className="space-y-2 my-2" {...props} />,
                          li: ({node, ...props}) => (
                              <li className="flex gap-2 items-start text-sm">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                  <span {...props} />
                              </li>
                          ),
                          strong: ({node, ...props}) => <span className="text-white font-semibold" {...props} />
                      }}
                  >
                      {analysis.resultAnalysis}
                  </ReactMarkdown>
                </div>
                
                <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => setSelectedAnalysis(analysis)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      {t('ai.viewDetails')} <ChevronRight size={14} />
                    </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-800">
            <MessageSquare size={40} className="mx-auto text-slate-800 mb-4" />
            <p className="text-slate-500 text-sm">{t('ai.noAnalysis')}</p>
            <p className="text-slate-600 text-xs mt-1">{t('ai.noAnalysisHint')}</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={handleCloseReport}>
          <div className="bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{t('ai.reportTitle')}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('ai.detailedAnalysis')} • {formatMonthYear(selectedAnalysis.date.slice(0, 7))}</p>
                </div>
              </div>
              <button onClick={handleCloseReport} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown 
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-black text-white mb-4 mt-8 first:mt-0" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-blue-400 mb-3 mt-6" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="space-y-3 my-4 list-none" {...props} />,
                    li: ({node, ...props}) => (
                      <li className="flex gap-3 items-start">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        <span className="text-slate-300" {...props} />
                      </li>
                    ),
                    strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-500 bg-blue-500/5 p-4 rounded-r-xl italic text-slate-400 my-6" {...props} />
                    )
                  }}
                >
                  {selectedAnalysis.resultAnalysis}
                </ReactMarkdown>
              </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end shrink-0">
               <button 
                onClick={handleCloseReport}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all"
               >
                 {t('ai.closeReport')}
               </button>
            </div>
          </div>
        </div>
      )}

      <AiAnalysisModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAnalysis}
        profile={profile}
        initialDate={selectedMonth}
      />
    </div>
  );
};

export default AiAdvisorView;