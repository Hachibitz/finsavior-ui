import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { Category, Transaction, CreditCard, FixedBillGenerationStrategy } from '../types';
import { billDateToYYYYMM } from '../utils/billDate';
import { getCategoryLabel } from '../utils/categoryLabel';

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
  const { t } = useTranslation();
  const [type, setType] = useState<'income' | 'expense'>(forcedType || 'expense');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [description, setDescription] = useState(initialTitle || '');
  const [category, setCategory] = useState(categories[0]?.id || '');
  const [cardId, setCardId] = useState(initialCardId || cards[0]?.id || '');

  const getDefaultBillingMonth = React.useCallback(() => selectedMonth || new Date().toISOString().slice(0, 7), [selectedMonth]);

  const [billingMonth, setBillingMonth] = useState(getDefaultBillingMonth());
  const [purchaseDate, setPurchaseDate] = useState('');
  const [frequencyType, setFrequencyType] = useState<'SINGLE' | 'RECURRENT' | 'INSTALLMENT'>('SINGLE');
  const [fixedBillGenerationStrategy, setFixedBillGenerationStrategy] = useState<FixedBillGenerationStrategy>('YEARLY_UPFRONT');
  const [installmentCount, setInstallmentCount] = useState('2');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [paymentType, setPaymentType] = useState<'Total' | 'Parcial' | 'Mínimo'>('Total');
  const [currentMode, setCurrentMode] = useState<string>(() => {
    if (mode !== 'DEFAULT') return mode;
    if (forcedType === 'income') return 'ASSETS';
    return 'MAIN';
  });

  const [hasSynced, setHasSynced] = useState(false);

  const paymentTypeLabels: Record<'Total' | 'Parcial' | 'Mínimo', string> = {
    Total: t('transaction.paymentTotal'),
    Parcial: t('transaction.paymentPartial'),
    Mínimo: t('transaction.paymentMinimum'),
  };

  const formatPurchaseDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    return '';
  };

  const formatBillingMonthForInput = (dateStr?: string) => {
    if (!dateStr) return getDefaultBillingMonth();
    return billDateToYYYYMM(dateStr) || getDefaultBillingMonth();
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
        
        setBillingMonth(formatBillingMonthForInput(initialData.billingMonth || initialData.date));
        setPurchaseDate(formatPurchaseDateForInput(initialData.purchaseDate));

        setFrequencyType(initialData.isInstallment ? 'INSTALLMENT' : initialData.isRecurrent ? 'RECURRENT' : 'SINGLE');
        setFixedBillGenerationStrategy(initialData.fixedBillGenerationStrategy || 'YEARLY_UPFRONT');
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

        setBillingMonth(getDefaultBillingMonth());
        setPurchaseDate('');

        if (!initialTitle && !initialAmount) {
          setAmount('');
          setDescription('');
          setCategory(categories[0]?.id || '');
          setFrequencyType('SINGLE');
          setFixedBillGenerationStrategy('YEARLY_UPFRONT');
        }
        setHasSynced(true);
      }
    }
  }, [isOpen, initialData, initialTitle, initialAmount, forcedType, categories, cards, initialCardId, hasSynced, selectedMonth, getDefaultBillingMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onSubmit({
      amount: parseFloat(amount),
      description,
      category: currentMode === 'PAYMENT_CARD' ? 'payment' : category,
      billingMonth,
      purchaseDate: purchaseDate || undefined,
      date: billingMonth,
      type,
      frequencyType,
      isRecurrent: frequencyType === 'RECURRENT',
      fixedBillGenerationStrategy: frequencyType === 'RECURRENT' ? fixedBillGenerationStrategy : undefined,
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
    setFixedBillGenerationStrategy('YEARLY_UPFRONT');
    setInstallmentCount('2');
    onClose();
  };

  const formTitle = currentMode === 'PAYMENT_CARD'
    ? t('transaction.payInvoice')
    : currentMode === 'ASSETS' || type === 'income'
      ? t('transaction.addIncome')
      : currentMode === 'CREDIT_CARD'
        ? t('transaction.cardExpense')
        : t('transaction.newTransaction');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {formTitle}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Type/Mode Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{t('transaction.recordType')}</label>
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
                {t('transaction.expense')}
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
                {t('transaction.card')}
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
                {t('transaction.income')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">R$</span>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                max="9999999999.99"
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
              {mode === 'PAYMENT_CARD' ? t('transaction.cardTitle') : t('transaction.description')}
            </label>
            <input 
              type="text" 
              required
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={mode === 'PAYMENT_CARD' ? t('transaction.cardTitlePlaceholder') : t('transaction.descriptionPlaceholder')}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {currentMode === 'PAYMENT_CARD' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.paymentType')}</label>
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
                    {paymentTypeLabels[pType]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {currentMode === 'CREDIT_CARD' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.selectCard')}</label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.category')}</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{getCategoryLabel(cat, t)}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.billingMonth')}</label>
                    <input 
                      type="month" 
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">{t('transaction.billingMonthHint')}</p>
                 </div>
                 <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.purchaseDate')}</label>
                    <input 
                      type="date" 
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">{t('transaction.purchaseDateHint')}</p>
                 </div>
              </div>
            </div>
          )}

          {/* Frequency Selection - Only show if not payment */}
          {mode !== 'PAYMENT_CARD' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{t('transaction.frequency')}</label>
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
                  {t('transaction.single')}
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
                  {t('transaction.recurrent')}
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
                  {t('transaction.installment')}
                </button>
              </div>
            </div>
          )}

          {frequencyType === 'INSTALLMENT' && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.currentInstallment')}</label>
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
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t('transaction.totalInstallments')}</label>
                <input 
                  type="number" 
                  min="2"
                  required
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  placeholder={t('transaction.installmentPlaceholder')}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {frequencyType === 'RECURRENT' && (
            <div className="space-y-3 animate-fade-in">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{t('transaction.fixedBillStrategy')}</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setFixedBillGenerationStrategy('YEARLY_UPFRONT')}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    fixedBillGenerationStrategy === 'YEARLY_UPFRONT'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-100'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="block text-sm font-bold">{t('transaction.yearlyUpfront')}</span>
                  <span className="block text-xs mt-1">{t('transaction.yearlyUpfrontDesc')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFixedBillGenerationStrategy('MONTHLY_FIRST_DAY')}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    fixedBillGenerationStrategy === 'MONTHLY_FIRST_DAY'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-100'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="block text-sm font-bold">{t('transaction.monthlyFirstDay')}</span>
                  <span className="block text-xs mt-1">{t('transaction.monthlyFirstDayDesc')}</span>
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Check size={20} />
            {t('transaction.saveTransaction')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
