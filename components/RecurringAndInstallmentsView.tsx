import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Repeat,
  Layers,
  Search,
  Edit2,
  Trash2,
  CalendarRange,
  CalendarClock,
  Pause,
  Play,
  CreditCard as CreditCardIcon,
  Receipt,
  Wallet,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import {
  Category,
  CreditCard,
  FixedBill,
  FixedBillGenerationStrategy,
  InstallmentGroup
} from '../types';
import { billService } from '../services/billService';
import { getCategoryIcon } from '../constants';
import { getCategoryLabel } from '../utils/categoryLabel';
import { formatCurrency } from '../i18n/localeFormat';

interface RecurringAndInstallmentsViewProps {
  categories: Category[];
  cards: CreditCard[];
  onDataChanged: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onBack?: () => void;
  initialSection?: 'fixed' | 'installments';
}

const RecurringAndInstallmentsView: React.FC<RecurringAndInstallmentsViewProps> = ({
  categories,
  cards,
  onDataChanged,
  showToast,
  onBack,
  initialSection = 'fixed'
}) => {
  const { t } = useTranslation();
  const [section, setSection] = useState<'fixed' | 'installments'>(initialSection);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'MAIN' | 'CREDIT_CARD' | 'ASSETS'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [installments, setInstallments] = useState<InstallmentGroup[]>([]);
  const [expandedInstallmentId, setExpandedInstallmentId] = useState<number | null>(null);

  // Edit Fixed Bill Modal
  const [editingFixed, setEditingFixed] = useState<FixedBill | null>(null);
  const [editFixedName, setEditFixedName] = useState('');
  const [editFixedValue, setEditFixedValue] = useState('');
  const [editFixedCategory, setEditFixedCategory] = useState('');
  const [editFixedCardId, setEditFixedCardId] = useState('');
  const [editFixedDayOfMonth, setEditFixedDayOfMonth] = useState('');
  const [editFixedStrategy, setEditFixedStrategy] = useState<FixedBillGenerationStrategy>('YEARLY_UPFRONT');
  const [editFixedActive, setEditFixedActive] = useState(true);
  const [applyFixedToFuture, setApplyFixedToFuture] = useState(true);

  // Delete Fixed Bill Modal
  const [deletingFixed, setDeletingFixed] = useState<FixedBill | null>(null);

  // Edit Installment Modal
  const [editingInstallment, setEditingInstallment] = useState<InstallmentGroup | null>(null);
  const [editInstName, setEditInstName] = useState('');
  const [editInstValue, setEditInstValue] = useState('');
  const [editInstCategory, setEditInstCategory] = useState('');
  const [editInstCardId, setEditInstCardId] = useState('');
  const [applyInstUnpaidOnly, setApplyInstUnpaidOnly] = useState(true);

  // Delete Installment Modal
  const [deletingInstallment, setDeletingInstallment] = useState<InstallmentGroup | null>(null);

  const [busyId, setBusyId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fixedData, instData] = await Promise.all([
        billService.getFixedBills(),
        billService.getInstallments()
      ]);
      setFixedBills(fixedData);
      setInstallments(instData);
    } catch (error) {
      console.error('Error loading recurring/installments:', error);
      showToast('Erro ao carregar contas fixas e parceladas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCategoryInfo = (catId?: string) => {
    const found = categories.find(c => c.id === catId || c.name.toLowerCase() === (catId || '').toLowerCase());
    return found || { id: catId || 'others', name: catId || 'Outros', icon: 'tag', color: '#64748b' };
  };

  const getCardName = (cardId?: string) => {
    if (!cardId) return null;
    return cards.find(c => c.id === cardId)?.name || `Cartão #${cardId}`;
  };

  const renderTableBadge = (billTable: string, cardId?: string) => {
    if (billTable === 'CREDIT_CARD') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
          <CreditCardIcon size={11} />
          {getCardName(cardId) || 'Cartão'}
        </span>
      );
    }
    if (billTable === 'ASSETS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
          <Wallet size={11} />
          Renda
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/20">
        <Receipt size={11} />
        Débito
      </span>
    );
  };

  // Fixed Bill Actions
  const handleMigrateStrategy = async (fb: FixedBill, targetStrategy: FixedBillGenerationStrategy) => {
    setBusyId(fb.id);
    try {
      const updated = await billService.migrateFixedBillStrategy(fb.id, targetStrategy);
      setFixedBills(prev => prev.map(item => item.id === fb.id ? updated : item));
      onDataChanged();
      showToast(
        targetStrategy === 'YEARLY_UPFRONT'
          ? `"${fb.billName}" migrada para Anual (meses até dezembro gerados)`
          : `"${fb.billName}" alterada para geração mensal`,
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast('Erro ao alterar estratégia da conta fixa', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (fb: FixedBill) => {
    setBusyId(fb.id);
    try {
      const updated = await billService.toggleFixedBillActive(fb.id, !fb.active);
      setFixedBills(prev => prev.map(item => item.id === fb.id ? updated : item));
      onDataChanged();
      showToast(
        updated.active ? `"${fb.billName}" reativada` : `"${fb.billName}" pausada para meses futuros`,
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar status da conta fixa', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openEditFixed = (fb: FixedBill) => {
    setEditingFixed(fb);
    setEditFixedName(fb.billName);
    setEditFixedValue(fb.billValue.toString());
    setEditFixedCategory(fb.billCategory || categories[0]?.id || 'others');
    setEditFixedCardId(fb.cardId || '');
    setEditFixedDayOfMonth(fb.dayOfMonth?.toString() || '');
    setEditFixedStrategy(fb.generationStrategy);
    setEditFixedActive(fb.active);
    setApplyFixedToFuture(true);
  };

  const handleSaveFixedEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixed) return;
    setBusyId(editingFixed.id);
    try {
      const updated = await billService.updateFixedBill(editingFixed.id, {
        billName: editFixedName.trim(),
        billValue: parseFloat(editFixedValue),
        billCategory: editFixedCategory,
        billTable: editingFixed.billTable,
        cardId: editingFixed.billTable === 'CREDIT_CARD' ? editFixedCardId : undefined,
        dayOfMonth: editFixedDayOfMonth ? parseInt(editFixedDayOfMonth, 10) : undefined,
        generationStrategy: editFixedStrategy,
        active: editFixedActive,
        applyToFutureOpenBills: applyFixedToFuture
      });
      setFixedBills(prev => prev.map(item => item.id === editingFixed.id ? updated : item));
      setEditingFixed(null);
      onDataChanged();
      showToast('Conta fixa atualizada com sucesso', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar conta fixa', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteFixed = async (deleteFutureOnly: boolean) => {
    if (!deletingFixed) return;
    setBusyId(deletingFixed.id);
    try {
      await billService.deleteFixedBill(deletingFixed.id, deleteFutureOnly);
      setFixedBills(prev => prev.filter(item => item.id !== deletingFixed.id));
      setDeletingFixed(null);
      onDataChanged();
      showToast(
        deleteFutureOnly
          ? 'Conta fixa encerrada e meses futuros em aberto removidos'
          : 'Conta fixa e todos os lançamentos removidos',
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast('Erro ao excluir conta fixa', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Installment Actions
  const openEditInstallment = (inst: InstallmentGroup) => {
    setEditingInstallment(inst);
    setEditInstName(inst.billName);
    setEditInstValue(inst.billValue.toString());
    setEditInstCategory(inst.billCategory || categories[0]?.id || 'others');
    setEditInstCardId(inst.cardId || '');
    setApplyInstUnpaidOnly(true);
  };

  const handleSaveInstallmentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment) return;
    setBusyId(editingInstallment.id);
    try {
      const updated = await billService.updateInstallment(editingInstallment.id, {
        billName: editInstName.trim(),
        billValue: parseFloat(editInstValue),
        billCategory: editInstCategory,
        billTable: editingInstallment.billTable,
        cardId: editingInstallment.billTable === 'CREDIT_CARD' ? editInstCardId : undefined,
        applyToUnpaidOnly: applyInstUnpaidOnly
      });
      setInstallments(prev => prev.map(item => item.id === editingInstallment.id ? updated : item));
      setEditingInstallment(null);
      onDataChanged();
      showToast('Parcelamento atualizado com sucesso', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar parcelamento', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteInstallment = async (deleteUnpaidOnly: boolean) => {
    if (!deletingInstallment) return;
    setBusyId(deletingInstallment.id);
    try {
      await billService.deleteInstallment(deletingInstallment.id, deleteUnpaidOnly);
      if (deleteUnpaidOnly) {
        await loadData();
      } else {
        setInstallments(prev => prev.filter(item => item.id !== deletingInstallment.id));
      }
      setDeletingInstallment(null);
      onDataChanged();
      showToast(
        deleteUnpaidOnly
          ? 'Parcelas em aberto removidas'
          : 'Parcelamento removido por completo',
        'success'
      );
    } catch (error) {
      console.error(error);
      showToast('Erro ao excluir parcelamento', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filteredFixed = fixedBills.filter(fb => {
    const matchesTable = tableFilter === 'ALL' || fb.billTable === tableFilter;
    const matchesSearch = fb.billName.toLowerCase().includes(search.toLowerCase());
    return matchesTable && matchesSearch;
  });

  const filteredInstallments = installments.filter(inst => {
    const matchesTable = tableFilter === 'ALL' || inst.billTable === tableFilter;
    const matchesSearch = inst.billName.toLowerCase().includes(search.toLowerCase());
    return matchesTable && matchesSearch;
  });

  const activeFixedExpensesTotal = fixedBills
    .filter(fb => fb.active && fb.billTable !== 'ASSETS')
    .reduce((acc, fb) => acc + Number(fb.billValue || 0), 0);

  const remainingInstallmentsTotal = installments
    .reduce((acc, inst) => acc + Number(inst.remainingValue || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-surface border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">Fixas & Parceladas</h1>
            <p className="text-slate-400 text-sm">
              Gerencie assinaturas, contas fixas mensais/anuais e parcelamentos em um só lugar
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fixas Ativas (Despesas/mês)</p>
            <p className="text-2xl font-extrabold text-white mt-1">{formatCurrency(activeFixedExpensesTotal)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {fixedBills.filter(f => f.active).length} ativa(s) de {fixedBills.length} cadastrada(s)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Repeat size={24} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo Restante Parcelado</p>
            <p className="text-2xl font-extrabold text-white mt-1">{formatCurrency(remainingInstallmentsTotal)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {installments.filter(i => i.remainingCount > 0).length} parcelamento(s) em andamento
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* Section Switcher + Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="grid grid-cols-2 gap-1.5 bg-surface border border-slate-700/60 p-1 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSection('fixed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              section === 'fixed'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Repeat size={16} />
            Contas Fixas ({fixedBills.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('installments')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              section === 'installments'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={16} />
            Parceladas ({installments.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar conta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 bg-surface border border-slate-700/60 text-slate-200 pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex bg-surface border border-slate-700/60 rounded-xl p-1 gap-1 overflow-x-auto">
            {([
              { id: 'ALL', label: 'Todas' },
              { id: 'MAIN', label: 'Débito' },
              { id: 'CREDIT_CARD', label: 'Cartão' },
              { id: 'ASSETS', label: 'Renda' }
            ] as const).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTableFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  tableFilter === f.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-10 rounded-2xl text-center text-slate-400">
          Carregando...
        </div>
      ) : section === 'fixed' ? (
        <div className="space-y-3">
          {filteredFixed.length === 0 ? (
            <div className="glass-card p-10 rounded-2xl text-center text-slate-400">
              Nenhuma conta fixa encontrada com os filtros atuais.
            </div>
          ) : (
            filteredFixed.map(fb => {
              const cat = getCategoryInfo(fb.billCategory);
              const isYearly = fb.generationStrategy === 'YEARLY_UPFRONT';
              const isBusy = busyId === fb.id;
              return (
                <div
                  key={fb.id}
                  className={`glass-card p-4 sm:p-5 rounded-2xl border transition-all ${
                    fb.active ? 'border-slate-700/60' : 'border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        {getCategoryIcon(cat.icon, 20)}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white text-base">{fb.billName}</h3>
                          {renderTableBadge(fb.billTable, fb.cardId)}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              isYearly
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                            }`}
                          >
                            {isYearly ? <CalendarRange size={11} /> : <CalendarClock size={11} />}
                            {isYearly ? 'Anual (até Dez)' : 'Mensal (1º dia)'}
                          </span>
                          {!fb.active && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-700 text-slate-300">
                              Pausada
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>Categoria: <strong className="text-slate-300">{getCategoryLabel(cat, t)}</strong></span>
                          <span>Início: <strong className="text-slate-300">{fb.startBillDate}</strong></span>
                          {fb.dayOfMonth && (
                            <span>Dia: <strong className="text-slate-300">{fb.dayOfMonth}</strong></span>
                          )}
                          <span>Lançamentos: <strong className="text-slate-300">{fb.paidCount}/{fb.instanceCount} pagos</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:shrink-0">
                      <div className="sm:text-right mr-2">
                        <p className="text-lg font-extrabold text-white">{formatCurrency(fb.billValue)}</p>
                        <p className="text-[11px] text-slate-400">/mês</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isYearly ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleMigrateStrategy(fb, 'MONTHLY_FIRST_DAY')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            title="Mudar renovação futura para mensal"
                          >
                            <CalendarClock size={14} />
                            Mudar p/ Mensal
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleMigrateStrategy(fb, 'YEARLY_UPFRONT')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            title="Migrar para anual e gerar os meses restantes até dezembro"
                          >
                            <CalendarRange size={14} />
                            Migrar p/ Anual
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(fb)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                          title={fb.active ? 'Pausar geração futura' : 'Reativar conta fixa'}
                        >
                          {fb.active ? <Pause size={15} /> : <Play size={15} />}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => openEditFixed(fb)}
                          className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 transition-colors disabled:opacity-50"
                          title="Editar conta fixa"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDeletingFixed(fb)}
                          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 transition-colors disabled:opacity-50"
                          title="Excluir conta fixa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInstallments.length === 0 ? (
            <div className="glass-card p-10 rounded-2xl text-center text-slate-400">
              Nenhum parcelamento encontrado com os filtros atuais.
            </div>
          ) : (
            filteredInstallments.map(inst => {
              const cat = getCategoryInfo(inst.billCategory);
              const isExpanded = expandedInstallmentId === inst.id;
              const progressPct = inst.totalInstallments > 0
                ? Math.round((inst.paidCount / inst.totalInstallments) * 100)
                : 0;
              const isBusy = busyId === inst.id;

              return (
                <div key={inst.id} className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-700/60 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        {getCategoryIcon(cat.icon, 20)}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white text-base">{inst.billName}</h3>
                          {renderTableBadge(inst.billTable, inst.cardId)}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {inst.paidCount}/{inst.totalInstallments} pagas
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>Categoria: <strong className="text-slate-300">{getCategoryLabel(cat, t)}</strong></span>
                          <span>Período: <strong className="text-slate-300">{inst.startBillDate} → {inst.endBillDate}</strong></span>
                          <span>Restante: <strong className="text-amber-300">{formatCurrency(inst.remainingValue)}</strong></span>
                        </div>

                        <div className="w-full max-w-xs bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:shrink-0">
                      <div className="sm:text-right mr-2">
                        <p className="text-lg font-extrabold text-white">{formatCurrency(inst.billValue)}<span className="text-xs font-normal text-slate-400">/mês</span></p>
                        <p className="text-[11px] text-slate-400">Total: {formatCurrency(inst.totalValue)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedInstallmentId(isExpanded ? null : inst.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Parcelas
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => openEditInstallment(inst)}
                          className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 transition-colors disabled:opacity-50"
                          title="Editar parcelamento"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDeletingInstallment(inst)}
                          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 transition-colors disabled:opacity-50"
                          title="Excluir parcelamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-700/50 pt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {inst.bills.map(b => (
                        <div
                          key={b.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            b.paid
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                              : 'bg-slate-900/60 border-slate-700/50 text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{b.currentInstallment}/{b.installmentCount} • {b.billDate}</p>
                            <p className="text-[11px] opacity-80">{formatCurrency(b.billValue)}</p>
                          </div>
                          {b.paid && <Check size={14} className="text-emerald-400 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Fixed Bill Modal */}
      {editingFixed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Editar Conta Fixa</h3>
              <button onClick={() => setEditingFixed(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveFixedEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Descrição</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editFixedName}
                  onChange={e => setEditFixedName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editFixedValue}
                    onChange={e => setEditFixedValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Dia do mês</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editFixedDayOfMonth}
                    onChange={e => setEditFixedDayOfMonth(e.target.value)}
                    placeholder="Ex: 18"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Categoria</label>
                <select
                  value={editFixedCategory}
                  onChange={e => setEditFixedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{getCategoryLabel(cat, t)}</option>
                  ))}
                </select>
              </div>

              {editingFixed.billTable === 'CREDIT_CARD' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Cartão</label>
                  <select
                    value={editFixedCardId}
                    onChange={e => setEditFixedCardId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                  >
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Estratégia de geração</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFixedStrategy('YEARLY_UPFRONT')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left ${
                      editFixedStrategy === 'YEARLY_UPFRONT'
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Anual (até Dez)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFixedStrategy('MONTHLY_FIRST_DAY')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left ${
                      editFixedStrategy === 'MONTHLY_FIRST_DAY'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Mensal (1º dia)
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={applyFixedToFuture}
                  onChange={e => setApplyFixedToFuture(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                />
                Aplicar alterações aos meses atuais/futuros em aberto
              </label>

              <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFixedActive}
                  onChange={e => setEditFixedActive(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                />
                Conta fixa ativa (continuar gerando automaticamente)
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFixed(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Fixed Bill Modal */}
      {deletingFixed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Excluir Conta Fixa</h3>
            </div>
            <p className="text-sm text-slate-300">
              Como deseja excluir <strong>"{deletingFixed.billName}"</strong>?
            </p>
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleDeleteFixed(true)}
                className="w-full p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-colors"
              >
                <span className="block text-sm font-bold text-amber-200">Encerrar e remover meses em aberto</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Mantém o histórico de meses já pagos e remove apenas o agendamento futuro.
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFixed(false)}
                className="w-full p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-left transition-colors"
              >
                <span className="block text-sm font-bold text-rose-200">Excluir tudo (todos os meses)</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Remove a conta fixa e todas as ocorrências passadas e futuras.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingFixed(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Installment Modal */}
      {editingInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Editar Parcelamento</h3>
              <button onClick={() => setEditingInstallment(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveInstallmentEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Descrição</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editInstName}
                  onChange={e => setEditInstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Valor da Parcela (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editInstValue}
                  onChange={e => setEditInstValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Categoria</label>
                <select
                  value={editInstCategory}
                  onChange={e => setEditInstCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{getCategoryLabel(cat, t)}</option>
                  ))}
                </select>
              </div>

              {editingInstallment.billTable === 'CREDIT_CARD' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Cartão</label>
                  <select
                    value={editInstCardId}
                    onChange={e => setEditInstCardId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary"
                  >
                    {cards.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={applyInstUnpaidOnly}
                  onChange={e => setApplyInstUnpaidOnly(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-primary focus:ring-primary"
                />
                Aplicar apenas às parcelas em aberto
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInstallment(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Installment Modal */}
      {deletingInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Excluir Parcelamento</h3>
            </div>
            <p className="text-sm text-slate-300">
              Como deseja excluir <strong>"{deletingInstallment.billName}"</strong>?
            </p>
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleDeleteInstallment(true)}
                className="w-full p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-colors"
              >
                <span className="block text-sm font-bold text-amber-200">Excluir apenas parcelas em aberto</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Preserva as parcelas já pagas e remove as futuras.
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInstallment(false)}
                className="w-full p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-left transition-colors"
              >
                <span className="block text-sm font-bold text-rose-200">Excluir todas as parcelas</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Remove todo o parcelamento do sistema.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingInstallment(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringAndInstallmentsView;
