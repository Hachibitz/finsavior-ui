import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'Tela' | 'Funcionalidade';
  action: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchItems: SearchItem[] = [
    { id: 'summary', title: 'Dashboard', description: 'Visão geral das suas finanças', icon: LayoutDashboard, category: 'Tela', action: () => setActiveTab('summary') },
    { id: 'debits', title: 'Débitos', description: 'Gerenciar contas e boletos', icon: Receipt, category: 'Tela', action: () => setActiveTab('debits') },
    { id: 'cards', title: 'Cartões', description: 'Faturas e gastos no crédito', icon: CreditCard, category: 'Tela', action: () => setActiveTab('cards') },
    { id: 'assets', title: 'Rendas', description: 'Ganhos e investimentos', icon: Wallet, category: 'Tela', action: () => setActiveTab('assets') },
    { id: 'ai', title: 'IA Advisor', description: 'Análises e insights inteligentes', icon: BrainCircuit, category: 'Tela', action: () => setActiveTab('ai') },
    { id: 'plans', title: 'Planos Premium', description: 'Upgrade e benefícios', icon: ShieldCheck, category: 'Tela', action: () => setActiveTab('plans') },
    { id: 'categories', title: 'Categorias', description: 'Organize seus gastos', icon: Tags, category: 'Tela', action: () => setActiveTab('categories') },
    { id: 'profile', title: 'Minha Conta', description: 'Perfil e configurações', icon: User, category: 'Tela', action: () => setActiveTab('profile') },
    { id: 'new-analysis', title: 'Gerar Análise', description: 'Criar novo relatório de IA', icon: Sparkles, category: 'Funcionalidade', action: () => setActiveTab('ai') },
    { id: 'chat-savi', title: 'Chat com Savi', description: 'Tire dúvidas com a assistente', icon: Bot, category: 'Funcionalidade', action: () => setActiveTab('ai') },
    { id: 'add-bill', title: 'Adicionar Conta', description: 'Registrar novo débito', icon: PlusCircle, category: 'Funcionalidade', action: () => setActiveTab('debits') },
    { id: 'add-asset', title: 'Adicionar Renda', description: 'Registrar novo ganho', icon: PlusCircle, category: 'Funcionalidade', action: () => setActiveTab('assets') },
  ];

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
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#0b1121] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <Search className="text-primary" size={24} />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você está procurando?"
            className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder:text-slate-500"
          />
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {query.trim() === '' ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-medium">Busque por telas, funcionalidades ou informações.</p>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Dashboard', 'IA', 'Planos', 'Contas', 'Rendas', 'Chat'].map(tag => (
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
                        {item.category}
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
              <p className="text-slate-500">Nenhum resultado encontrado para "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">ESC</kbd>
              <span>para fechar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd>
              <span>para selecionar</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest">
            FinSavior Search
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
