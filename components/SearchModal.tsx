import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronRight, 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Wallet, 
  BrainCircuit, 
  ShieldCheck, 
  Tags, 
  User,
  Sparkles,
  Bot,
  PlusCircle,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'screen' | 'feature';
  action: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, setActiveTab }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchItems: SearchItem[] = useMemo(() => [
    { id: 'summary', title: t('search.items.summary.title'), description: t('search.items.summary.description'), icon: LayoutDashboard, category: 'screen', action: () => setActiveTab('summary') },
    { id: 'debits', title: t('search.items.debits.title'), description: t('search.items.debits.description'), icon: Receipt, category: 'screen', action: () => setActiveTab('debits') },
    { id: 'cards', title: t('search.items.cards.title'), description: t('search.items.cards.description'), icon: CreditCard, category: 'screen', action: () => setActiveTab('cards') },
    { id: 'assets', title: t('search.items.assets.title'), description: t('search.items.assets.description'), icon: Wallet, category: 'screen', action: () => setActiveTab('assets') },
    { id: 'ai', title: t('search.items.ai.title'), description: t('search.items.ai.description'), icon: BrainCircuit, category: 'screen', action: () => setActiveTab('ai') },
    { id: 'plans', title: t('search.items.plans.title'), description: t('search.items.plans.description'), icon: ShieldCheck, category: 'screen', action: () => setActiveTab('plans') },
    { id: 'categories', title: t('search.items.categories.title'), description: t('search.items.categories.description'), icon: Tags, category: 'screen', action: () => setActiveTab('categories') },
    { id: 'account', title: t('search.items.account.title'), description: t('search.items.account.description'), icon: User, category: 'screen', action: () => setActiveTab('account') },
    { id: 'support', title: t('search.items.support.title'), description: t('search.items.support.description'), icon: HelpCircle, category: 'screen', action: () => setActiveTab('support') },
    { id: 'new-analysis', title: t('search.items.newAnalysis.title'), description: t('search.items.newAnalysis.description'), icon: Sparkles, category: 'feature', action: () => setActiveTab('ai') },
    { id: 'chat-savi', title: t('search.items.chatSavi.title'), description: t('search.items.chatSavi.description'), icon: Bot, category: 'feature', action: () => setActiveTab('ai') },
    { id: 'add-bill', title: t('search.items.addBill.title'), description: t('search.items.addBill.description'), icon: PlusCircle, category: 'feature', action: () => setActiveTab('debits') },
    { id: 'add-asset', title: t('search.items.addAsset.title'), description: t('search.items.addAsset.description'), icon: PlusCircle, category: 'feature', action: () => setActiveTab('assets') },
  ], [t, setActiveTab]);

  const quickTags = useMemo(() => [
    t('search.tags.dashboard'),
    t('search.tags.ai'),
    t('search.tags.plans'),
    t('search.tags.bills'),
    t('search.tags.income'),
    t('search.tags.chat'),
  ], [t]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = searchItems.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      (item.category === 'screen' ? t('search.categoryScreen') : t('search.categoryFeature')).toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query, searchItems, t]);

  if (!isOpen) return null;

  const categoryLabel = (category: SearchItem['category']) =>
    category === 'screen' ? t('search.categoryScreen') : t('search.categoryFeature');

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#0b1121] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <Search className="text-primary" size={24} />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder:text-slate-500"
          />
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {query.trim() === '' ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-medium">{t('search.emptyHint')}</p>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full p-4 rounded-2xl hover:bg-white/5 flex items-center gap-4 group transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    <item.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.title}</span>
                      <span className="text-[10px] font-black bg-white/5 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {categoryLabel(item.category)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-500">{t('search.noResults', { query })}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">ESC</kbd>
              <span>{t('search.escClose')}</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd>
              <span>{t('search.enterSelect')}</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest">
            {t('search.brand')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
