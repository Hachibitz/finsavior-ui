import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Category, Transaction } from '../types';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  forcedType?: 'income' | 'expense';
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, categories, forcedType }) => {
  const [type, setType] = useState<'income' | 'expense'>(forcedType || 'expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequencyType, setFrequencyType] = useState<'SINGLE' | 'RECURRENT' | 'INSTALLMENT'>('SINGLE');
  const [installmentCount, setInstallmentCount] = useState('2');

  // Update type if forcedType changes
  React.useEffect(() => {
    if (forcedType) setType(forcedType);
  }, [forcedType, isOpen]);

  // Update category when categories prop changes
  React.useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === category)) {
      setCategory(categories[0].id);
    }
  }, [categories, category]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onSubmit({
      amount: parseFloat(amount),
      description,
      category,
      date: new Date(date).toISOString(),
      type,
      frequencyType,
      isRecurrent: frequencyType === 'RECURRENT',
      isInstallment: frequencyType === 'INSTALLMENT',
      installmentCount: frequencyType === 'INSTALLMENT' ? parseInt(installmentCount) : undefined
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
            {forcedType === 'income' ? 'Adicionar Renda' : forcedType === 'expense' ? 'Adicionar Despesa' : 'Nova Transação'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Type Toggle - Only show if not forced */}
          {!forcedType && (
            <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  type === 'expense' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                  type === 'income' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Renda
              </button>
            </div>
          )}

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
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Descrição</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Salário, Aluguel, etc"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

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

          {/* Frequency Selection */}
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

          {frequencyType === 'INSTALLMENT' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Número de Parcelas</label>
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