import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Category, Transaction, CreditCard } from '../types';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  cards?: CreditCard[];
  forcedType?: 'income' | 'expense';
  mode?: 'DEFAULT' | 'PAYMENT_CARD' | 'CREDIT_CARD';
  initialTitle?: string;
  initialAmount?: number;
  initialData?: Partial<Transaction>;
  initialCardId?: string;
  selectedMonth?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  isOpen, onClose, onSubmit, categories, cards = [], forcedType, mode = 'DEFAULT', initialTitle, initialAmount, initialData, initialCardId, selectedMonth 
}) => {
  const [type, setType] = useState<'income' | 'expense'>(forcedType || 'expense');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [description, setDescription] = useState(initialTitle || '');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [cardId, setCardId] = useState(initialCardId || cards[0]?.id || '');

  const getDefaultDate = React.useCallback(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const now = new Date();
      // If it's the current month, use today's day. Otherwise use the 1st.
      const day = (now.getFullYear() === year && (now.getMonth() + 1) === month) 
        ? now.getDate() 
        : 1;
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  }, [selectedMonth]);

  const [date, setDate] = useState(getDefaultDate());
  const [frequencyType, setFrequencyType] = useState<'SINGLE' | 'RECURRENT' | 'INSTALLMENT'>('SINGLE');
  const [installmentCount, setInstallmentCount] = useState('2');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [paymentType, setPaymentType] = useState<'Total' | 'Parcial' | 'Mínimo'>('Total');
  const [currentMode, setCurrentMode] = useState<string>(() => {
    if (mode !== 'DEFAULT') return mode;
    if (forcedType === 'income') return 'ASSETS';
    return 'MAIN';
  });

  const [hasSynced, setHasSynced] = useState(false);

  const formatToInputDate = (dateStr: string) => {
    if (!dateStr) return getDefaultDate();
    
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // If it has T (ISO string)
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    
    // If it's like "Oct 2023" or "10/2023"
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    const parts = dateStr.split(' ');
    if (parts.length === 2 && months[parts[0]]) {
      return `${parts[1]}-${months[parts[0]]}-01`;
    }

    // Try to parse as Date object
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}

    return getDefaultDate();
  };

  // Sync with initialData or props
  React.useEffect(() => {
    if (!isOpen) {
      setHasSynced(false);
      return;
    }

    if (isOpen && !hasSynced) {
      if (initialData) {
        setType(initialData.type || 'expense');
        setAmount(initialData.amount?.toString() || '');
        setDescription(initialData.description || '');
        
        // Robust category matching
        let initialCat = initialData.category || '';
        if (initialCat && !categories.some(c => c.id === initialCat)) {
          const found = categories.find(c => c.name.toLowerCase() === initialCat.toLowerCase());
          if (found) initialCat = found.id;
        }
        setCategory(initialCat || categories[0]?.id || '');
        
        setCardId(initialData.cardId || cards[0]?.id || '');
        
        // Fix: Ensure date is correctly pre-filled from initialData
        setDate(formatToInputDate(initialData.date || ''));

        setFrequencyType(initialData.isInstallment ? 'INSTALLMENT' : initialData.isRecurrent ? 'RECURRENT' : 'SINGLE');
        setInstallmentCount(initialData.installmentCount?.toString() || '2');
        setCurrentInstallment(initialData.currentInstallment?.toString() || '1');
        setPaymentType(initialData.paymentType as any || 'Total');
        if (initialData.billTable) {
          setCurrentMode(initialData.billTable);
          // Ensure type is synced with billTable
          if (initialData.billTable === 'ASSETS') setType('income');
          else if (initialData.billTable === 'CREDIT_CARD' || initialData.billTable === 'MAIN') setType('expense');
        }
        setHasSynced(true);
      } else {
        // New form or waiting for data
        if (forcedType) {
          setType(forcedType);
        }
        
        if (mode && mode !== 'DEFAULT') {
          setCurrentMode(mode);
        } else if (forcedType === 'income') {
          setCurrentMode('ASSETS');
        } else {
          setCurrentMode('MAIN');
        }
        if (initialTitle) setDescription(initialTitle);
        if (initialAmount !== undefined) setAmount(initialAmount.toString());
        if (initialCardId) setCardId(initialCardId);

        // Always set default date for new forms
        setDate(getDefaultDate());

        if (!initialTitle && !initialAmount) {
          setAmount('');
          setDescription('');
          setCategory(categories[0]?.id || '');
          setFrequencyType('SINGLE');
        }
        setHasSynced(true);
      }
    }
  }, [isOpen, initialData, initialTitle, initialAmount, forcedType, categories, cards, initialCardId, hasSynced, selectedMonth, getDefaultDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onSubmit({
      amount: parseFloat(amount),
      description,
      category: currentMode === 'PAYMENT_CARD' ? 'payment' : category,
      date: new Date(date).toISOString(),
      type,
      frequencyType,
      isRecurrent: frequencyType === 'RECURRENT',
      isInstallment: frequencyType === 'INSTALLMENT',
      installmentCount: frequencyType === 'INSTALLMENT' ? parseInt(installmentCount) : undefined,
      currentInstallment: frequencyType === 'INSTALLMENT' ? parseInt(currentInstallment) : undefined,
      billTable: currentMode,
      paymentType: currentMode === 'PAYMENT_CARD' ? paymentType : undefined,
      cardId: (currentMode === 'CREDIT_CARD' || currentMode === 'PAYMENT_CARD') ? cardId : undefined,
      billType: currentMode === 'PAYMENT_CARD' ? 'PAYMENT' : currentMode === 'CREDIT_CARD' ? 'EXPENSE' : undefined,
      entryMethod: 'MANUAL'
    });
    
    // Reset form
    setAmount('');
    setDescription('');
    setFrequencyType('SINGLE');
    setInstallmentCount('2');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {currentMode === 'PAYMENT_CARD' ? 'Pagar Fatura' : currentMode === 'ASSETS' || type === 'income' ? 'Adicionar Renda' : currentMode === 'CREDIT_CARD' ? 'Gasto no Cartão' : 'Nova Transação'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Type/Mode Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo de Registro</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('MAIN');
                  setType('expense');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  currentMode === 'MAIN'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('CREDIT_CARD');
                  setType('expense');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  (currentMode === 'CREDIT_CARD' || currentMode === 'PAYMENT_CARD')
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cartão
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('ASSETS');
                  setType('income');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  currentMode === 'ASSETS'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Receita
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">R$</span>
              <input 
                type="number" 
                step="0.01" 
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-slate-900 border border-slate-700 text-white text-2xl font-bold rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              {mode === 'PAYMENT_CARD' ? 'Título do Cartão' : 'Descrição'}
            </label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={mode === 'PAYMENT_CARD' ? "ex: Nubank" : "ex: Salário, Aluguel, etc"}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {currentMode === 'PAYMENT_CARD' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tipo de Pagamento</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-xl">
                {(['Total', 'Parcial', 'Mínimo'] as const).map((pType) => (
                  <button
                    key={pType}
                    type="button"
                    onClick={() => setPaymentType(pType)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      paymentType === pType 
                        ? 'bg-slate-700 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pType}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {currentMode === 'CREDIT_CARD' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Cartão</label>
                  <select 
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>{card.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Data</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]"
                    />
                 </div>
              </div>
            </div>
          )}

          {/* Frequency Selection - Only show if not payment */}
          {mode !== 'PAYMENT_CARD' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Frequência</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFrequencyType('SINGLE')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    frequencyType === 'SINGLE' 
                      ? 'bg-slate-700 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Único
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyType('RECURRENT')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    frequencyType === 'RECURRENT' 
                      ? 'bg-slate-700 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyType('INSTALLMENT')}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    frequencyType === 'INSTALLMENT' 
                      ? 'bg-slate-700 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Parcelado
                </button>
              </div>
            </div>
          )}

          {frequencyType === 'INSTALLMENT' && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Parcela Atual</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={currentInstallment}
                  onChange={(e) => setCurrentInstallment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total de Parcelas</label>
                <input 
                  type="number" 
                  min="2"
                  required
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  placeholder="Ex: 12"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {frequencyType === 'RECURRENT' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-fade-in">
              <p className="text-xs text-blue-400">
                Isso repetirá a conta todos os meses até o final do ano.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Check size={20} />
            Salvar Transação
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;