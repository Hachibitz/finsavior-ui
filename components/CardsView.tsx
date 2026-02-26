import React, { useState } from 'react';
import { CardTransaction, Category, CreditCard, UserProfile, Transaction } from '../types';
import { Plus, CreditCard as CardIcon, Calendar, ArrowRight, UploadCloud, ChevronRight, X, Check, FileText, Mic } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ImportDocButton from './ImportDocButton';
import VoiceFab from './VoiceFab';
import { useToast } from '../contexts/ToastContext';
import TransactionForm from './TransactionForm';

interface CardsViewProps {
  transactions: CardTransaction[];
  cards: CreditCard[];
  categories: Category[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onImportInvoice: (file: File) => void;
  onRefresh: () => void;
  onRefreshCoins: () => void;
  onNavigateToPlans: () => void;
  profile: UserProfile | null;
}

const CardsView: React.FC<CardsViewProps> = ({ 
  transactions, cards, categories, onAddCard, onAddTransaction, onImportInvoice, onRefresh, onRefreshCoins, onNavigateToPlans, profile 
}) => {
  const { showToast } = useToast();
  const [activeCardId, setActiveCardId] = useState<string>(cards[0]?.id || '');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBannerClosed, setIsBannerClosed] = useState(() => {
    const closedAt = sessionStorage.getItem('cards_banner_closed_at');
    if (!closedAt) return false;
    const tenMinutes = 10 * 60 * 1000;
    return (Date.now() - parseInt(closedAt, 10)) < tenMinutes;
  });

  const handleCloseBanner = () => {
    setIsBannerClosed(true);
    sessionStorage.setItem('cards_banner_closed_at', Date.now().toString());
  };
  
  // New Card State
  const [newCardName, setNewCardName] = useState('');
  const [newCardLast4, setNewCardLast4] = useState('');

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];
  const activeTransactions = transactions.filter(t => !t.cardId || t.cardId === activeCard?.id);
  const total = activeTransactions.reduce((acc, t) => acc + t.amount, 0);

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newCardLast4) return;
    
    const newCard: CreditCard = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCardName,
        last4Digits: newCardLast4,
        color: 'from-slate-800 to-slate-900', // Default dark
        limit: 0,
        dueDateStr: '1'
    };
    onAddCard(newCard);
    setIsAddCardOpen(false);
    setNewCardName('');
    setNewCardLast4('');
    setActiveCardId(newCard.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upsell Banner for Free Users */}
      {(!profile?.plan || profile.plan.planId === 'FREE' || profile.plan.planDs === 'FREE') && !isBannerClosed && (
        <div className="bg-gradient-to-br from-indigo-600/20 to-primary/20 border border-indigo-500/30 p-6 rounded-3xl flex items-center justify-between gap-4 relative overflow-hidden group">
          <button 
            onClick={handleCloseBanner}
            className="absolute top-3 right-3 p-1 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all z-20"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <CardIcon size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white">Múltiplos Cartões?</h4>
              <p className="text-slate-400 text-xs">Assine o Premium para cartões ilimitados, comandos de voz e WhatsApp.</p>
            </div>
          </div>
          <button 
            onClick={onNavigateToPlans}
            className="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs hover:scale-105 transition-all relative z-10 whitespace-nowrap"
          >
            Ver Planos
          </button>
        </div>
      )}
      
      {/* Card Selector / Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {cards.map(card => (
             <button 
                key={card.id}
                onClick={() => setActiveCardId(card.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all text-sm font-medium whitespace-nowrap ${activeCardId === card.id ? 'bg-white text-black border-white' : 'bg-surface border-slate-700 text-slate-400 hover:text-white'}`}
             >
                {card.name}
             </button>
         ))}
         <button 
            onClick={() => setIsAddCardOpen(true)}
            className="flex-shrink-0 w-8 h-8 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-white transition-colors"
         >
            <Plus size={16} />
         </button>
      </div>

      {/* 3D Card Visual */}
      {activeCard ? (
        <div className="relative h-56 w-full max-w-sm mx-auto perspective-1000 group cursor-pointer transition-transform">
            <div className={`absolute inset-0 bg-gradient-to-bl ${activeCard.color} rounded-3xl transform translate-y-2 translate-x-2 opacity-30 blur-md`}></div>
            <div className={`relative h-full w-full rounded-3xl bg-gradient-to-br ${activeCard.color} p-6 shadow-2xl flex flex-col justify-between border border-white/20 overflow-hidden`}>
            {/* Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 -left-10 w-32 h-32 bg-black/20 rounded-full blur-xl"></div>
            
            <div className="flex justify-between items-start z-10">
                <CardIcon className="text-white/80" size={32} />
                <span className="font-mono text-white/90 tracking-widest text-lg">**** {activeCard.last4Digits}</span>
            </div>
            
            <div className="z-10">
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Fatura Atual</p>
                <h2 className="text-3xl font-bold text-white tracking-tight">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>

            <div className="flex justify-between items-end z-10">
                <div>
                <p className="text-xs text-white/70 uppercase">Titular</p>
                <p className="text-sm font-medium text-white tracking-wide truncate max-w-[150px]">{activeCard.name}</p>
                </div>
                <div className="flex flex-col items-end">
                <p className="text-xs text-white/70 uppercase">Vencimento</p>
                <div className="flex items-center gap-1 text-white font-medium">
                    <Calendar size={12} />
                    <span>{activeCard.dueDateStr}</span>
                </div>
                </div>
            </div>
            </div>
        </div>
      ) : (
          <div onClick={() => setIsAddCardOpen(true)} className="h-56 w-full max-w-sm mx-auto border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-primary hover:bg-slate-800/50 cursor-pointer transition-all">
              <Plus size={48} />
              <p className="font-bold mt-2">Adicionar Cartão</p>
          </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
         <button 
            className="bg-surface border border-slate-700 hover:bg-slate-800 text-white py-4 rounded-2xl font-medium transition-all shadow-lg flex flex-col items-center justify-center gap-2 group"
            onClick={() => {
              if (!activeCard) {
                showToast('Selecione um cartão para pagar a fatura', 'info');
                return;
              }
              setIsPaymentModalOpen(true);
            }}
         >
            <span className="text-emerald-400 group-hover:scale-110 transition-transform"><Check size={24} /></span>
            <span className="text-sm font-bold">Pagar Fatura</span>
         </button>

         <ImportDocButton 
            docType="CREDIT_CARD" 
            tableType="CARD" 
            onSaved={onRefresh}
            onRefreshCoins={onRefreshCoins}
            onNavigateToPlans={onNavigateToPlans}
            className="bg-surface border border-slate-700 hover:bg-slate-800 text-white py-4 rounded-2xl font-medium transition-all shadow-lg flex flex-col items-center justify-center gap-2 group"
         >
            <span className="text-blue-400 group-hover:scale-110 transition-transform"><UploadCloud size={24} /></span>
            <span className="text-sm font-bold">Importar Fatura</span>
         </ImportDocButton>
      </div>

      {/* Transaction Timeline */}
      <div className="glass-card rounded-3xl p-6 min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-lg">Últimos Lançamentos</h3>
          <button className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
            <Plus size={18} />
          </button>
        </div>

        <div className="relative border-l border-slate-700 ml-3 space-y-6">
          {activeTransactions.length > 0 ? activeTransactions.map((t, idx) => {
            const category = categories.find(c => c.id === t.category);
            return (
              <div key={t.id} className="relative pl-8 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-900 group-hover:bg-primary group-hover:scale-125 transition-all"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm group-hover:text-primary transition-colors">{t.description}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] text-slate-400 uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                          {category?.name || t.category}
                       </span>
                       {t.installments && (
                         <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                           {t.installments.current}/{t.installments.total}
                         </span>
                       )}
                    </div>
                  </div>
                  <span className="font-bold text-white text-sm">R$ {t.amount.toFixed(2)}</span>
                </div>
              </div>
            );
          }) : (
              <p className="text-slate-500 text-sm pl-8">Nenhum lançamento neste cartão.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <TransactionForm 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={onAddTransaction}
        categories={categories}
        mode="PAYMENT_CARD"
        initialTitle={activeCard?.name}
        forcedType="expense"
      />

      {/* Add Card Modal */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
           <div className="bg-surface w-full max-w-sm rounded-3xl border border-slate-700 shadow-2xl p-6 animate-scale-in">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-white">Adicionar Cartão</h3>
                   <button onClick={() => setIsAddCardOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
               </div>
               <form onSubmit={handleAddCardSubmit} className="space-y-4">
                   <div>
                       <label className="text-xs text-slate-400 uppercase font-bold">Nome do Cartão</label>
                       <input 
                          type="text" 
                          placeholder="Ex: Nubank, Inter..." 
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-primary outline-none"
                          value={newCardName}
                          onChange={(e) => setNewCardName(e.target.value)}
                          required
                       />
                   </div>
                   <div>
                       <label className="text-xs text-slate-400 uppercase font-bold">Últimos 4 dígitos</label>
                       <input 
                          type="text" 
                          maxLength={4}
                          placeholder="0000" 
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white mt-1 focus:border-primary outline-none"
                          value={newCardLast4}
                          onChange={(e) => setNewCardLast4(e.target.value.replace(/\D/g, ''))}
                          required
                       />
                   </div>
                   <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl mt-4 transition-colors">
                       Salvar Cartão
                   </button>
               </form>
           </div>
        </div>
      )}
      <VoiceFab 
        mode="BILL" 
        onBillDetected={(data) => {
          showToast(`Gasto no cartão "${data.billName}" detectado e processada!`, 'success');
          onRefresh();
        }}
        onNavigateToPlans={onNavigateToPlans}
        onRefreshCoins={onRefreshCoins}
      />
    </div>
  );
};

export default CardsView;