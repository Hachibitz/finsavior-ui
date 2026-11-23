import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { planPriceService, PlanDisplayPrice } from '../services/planPriceService';
import { translateApiError } from '../utils/apiError';
import { formatCurrency } from '../i18n/localeFormat';
import { useToast } from '../contexts/ToastContext';

const TIERS = ['BASIC', 'PLUS', 'PREMIUM'] as const;
const CYCLES = ['MONTHLY', 'ANNUAL'] as const;

const emptyForm = {
  planTier: 'BASIC',
  billingCycle: 'MONTHLY',
  currency: 'BRL',
  amount: '',
};

interface AdminPlanPricesViewProps {
  onBack?: () => void;
}

const AdminPlanPricesView: React.FC<AdminPlanPricesViewProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<PlanDisplayPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterCurrency, setFilterCurrency] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const data = await planPriceService.listAllAdmin();
      setRows(data);
    } catch (error) {
      showToast(translateApiError(error, 'Falha ao carregar preços'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currencies = useMemo(
    () => Array.from(new Set(rows.map((r) => r.currency))).sort(),
    [rows]
  );

  const visibleRows = useMemo(
    () =>
      filterCurrency === 'ALL'
        ? rows
        : rows.filter((r) => r.currency === filterCurrency),
    [rows, filterCurrency]
  );

  const handleSave = async () => {
    const amount = Number(form.amount);
    if (!form.currency.trim() || Number.isNaN(amount) || amount < 0) {
      showToast('Preencha moeda e valor válidos', 'error');
      return;
    }
    setSaving(true);
    try {
      await planPriceService.upsert({
        planTier: form.planTier,
        billingCycle: form.billingCycle,
        currency: form.currency.trim().toUpperCase(),
        amount,
      });
      showToast('Preço salvo', 'success');
      setForm(emptyForm);
      await load();
    } catch (error) {
      showToast(translateApiError(error, 'Falha ao salvar'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const counts = await planPriceService.syncProviders();
      showToast(
        `Sincronizado: Stripe (${counts.stripe ?? 0}), Google Play (${counts.googlePlay ?? 0})`,
        'success'
      );
      await load();
    } catch (error) {
      showToast(translateApiError(error, 'Falha ao sincronizar provedores'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Remover este preço de exibição?')) return;
    try {
      await planPriceService.remove(id);
      showToast('Removido', 'success');
      await load();
    } catch (error) {
      showToast(translateApiError(error, 'Falha ao remover'), 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Preços de exibição</h1>
          <p className="text-sm text-slate-400 mt-1">
            Valores mostrados na tela de Planos por moeda. Não alteram cobrança Stripe/Play.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-bold disabled:opacity-60"
          >
            <RefreshCw className={syncing ? 'animate-spin' : ''} size={16} />
            Sincronizar Stripe/Play
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm font-bold"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl border border-slate-700/50 p-5 space-y-4">
        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <Plus size={16} /> Novo / atualizar
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={form.planTier}
            onChange={(e) => setForm((f) => ({ ...f, planTier: e.target.value }))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={form.billingCycle}
            onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
          >
            {CYCLES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
            placeholder="BRL"
            maxLength={8}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
          />
          <input
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="19.90"
            inputMode="decimal"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white font-bold text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Salvar
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 font-bold uppercase tracking-widest">Filtrar</label>
        <select
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
        >
          <option value="ALL">Todas</option>
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {visibleRows.map((row) => (
            <div
              key={`${row.currency}-${row.planTier}-${row.billingCycle}-${row.id}`}
              className="glass-card rounded-2xl border border-slate-700/40 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-white font-bold text-sm">
                  {row.planTier} · {row.billingCycle}
                </p>
                <p className="text-slate-400 text-xs">
                  {row.currency} — {formatCurrency(Number(row.amount), row.currency)}
                  {row.provider ? ` · ${row.provider}` : ''}
                  {row.source ? ` (${row.source})` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(row.id)}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10"
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {visibleRows.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">Nenhum preço cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPlanPricesView;
