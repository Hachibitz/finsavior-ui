import React, { useState } from 'react';
import { AiAnalysis, Bill, CardTransaction, Asset } from '../types';
import { MOCK_AI_ANALYSES } from '../constants';
import { BrainCircuit, Sparkles, MessageSquare, ChevronRight, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getFinancialAdvice } from '../services/geminiService';

interface AiAdvisorViewProps {
  bills: Bill[];
  transactions: CardTransaction[];
  assets: Asset[];
}

const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({ bills, transactions, assets }) => {
  const [analyses, setAnalyses] = useState<AiAnalysis[]>(MOCK_AI_ANALYSES);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNewAnalysis = async () => {
    setIsGenerating(true);
    // Data adaptation (mocked for demo logic)
    const allTransactions = [
        ...bills.map(b => ({ ...b, type: 'expense' as const })),
        ...transactions.map(t => ({ ...t, type: 'expense' as const })),
        ...assets.map(a => ({ ...a, type: 'income' as const, category: 'salary' }))
    ];

    const adviceText = await getFinancialAdvice(allTransactions);
    
    const newAnalysis: AiAnalysis = {
        id: Math.random().toString(),
        date: new Date().toISOString(),
        period: 'Atual',
        content: adviceText,
        creativityLevel: 50
    };

    setAnalyses([newAnalysis, ...analyses]);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-fade-in min-h-[80vh] flex flex-col">
      {/* Header AI Identity */}
      <div className="text-center py-6">
        <div className="relative w-20 h-20 mx-auto mb-4">
           <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <div className="relative w-full h-full bg-gradient-to-tr from-slate-800 to-slate-900 rounded-full border border-slate-700 flex items-center justify-center shadow-2xl">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Savi&backgroundColor=transparent" alt="Savi" className="w-14 h-14" />
           </div>
           <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold text-white">Savi AI</h1>
        <p className="text-slate-400 text-sm">Seu consultor financeiro pessoal</p>
      </div>

      {/* Main Action */}
      <div className="glass-card p-1 rounded-2xl mx-auto max-w-sm w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
         <button 
            onClick={handleNewAnalysis}
            disabled={isGenerating}
            className="w-full bg-surface hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
         >
            {isGenerating && <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>}
            <Sparkles size={18} className={`text-blue-400 ${isGenerating ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
            {isGenerating ? 'Processando dados...' : 'Gerar Nova Análise'}
         </button>
      </div>

      {/* Analysis Stream */}
      <div className="flex-1 space-y-6 mt-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Histórico de Insights</h2>
        
        {analyses.map((analysis, index) => (
          <div key={analysis.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="bg-surface border border-slate-700/50 rounded-tl-3xl rounded-tr-3xl rounded-br-3xl rounded-bl-sm p-6 shadow-xl relative ml-4">
               {/* Decorative Tail */}
               <div className="absolute top-0 -left-2 w-4 h-4 bg-surface border-l border-t border-slate-700/50 transform -rotate-45"></div>
               
               <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                     <BrainCircuit size={16} className="text-purple-400" />
                     <span className="text-slate-300 font-semibold text-sm">Análise Mensal</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(analysis.date).toLocaleDateString()}</span>
               </div>

               <div className="prose prose-invert prose-sm max-w-none text-slate-300">
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
                    {analysis.content}
                 </ReactMarkdown>
               </div>
               
               <div className="mt-4 flex justify-end">
                  <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                     Ver Detalhes <ChevronRight size={14} />
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiAdvisorView;