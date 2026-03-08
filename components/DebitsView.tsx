import React, { useState } from 'react';
import { Bill, Category } from '../types';
import { getCategoryIcon } from '../constants';
import { Plus, CheckCircle2, Circle, Edit2, Trash2, FileText, Loader2, Mic } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ImportDocButton from './ImportDocButton';
import { useToast } from '../contexts/ToastContext';
import { AiBillExtractionDTO } from '../services/aiTranscriptionService';

interface DebitsViewProps {
  bills: Bill[];
  onAdd: () => void;
  onDelete: (id: string, deleteAll?: boolean) => void;
  onEdit: (bill: Bill) => Promise<Bill>;
  onEditClick?: (bill: Bill) => void;
  categories: Category[];
  onRefresh: () => void;
  onRefreshCoins: () => void;
  onNavigateToPlans: () => void;
}

const DebitsView: React.FC<DebitsViewProps> = ({ bills, onAdd, onDelete, onEdit, onEditClick, categories, onRefresh, onRefreshCoins, onNavigateToPlans }) => {
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [updatingBillId, setUpdatingBillId] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Temporary state for inline editing (simplified for UX)
  // In a full app, this might open a modal or navigate to a form
  const handleEditClick = (bill: Bill) => {
    if (onEditClick) {
      onEditClick(bill);
    } else {
      onAdd();
    }
  };

  const togglePaid = async (bill: Bill) => {
    setUpdatingBillId(bill.id);
    try {
      await onEdit({ ...bill, isPaid: !bill.isPaid });
    } catch (e: any) {
      console.error('Error updating bill:', e);
      showToast(e?.message || 'Erro ao atualizar conta', 'error');
    } finally {
      setUpdatingBillId(null);
    }
  };

  const total = bills.reduce((acc, bill) => acc + bill.amount, 0);
  const paid = bills.filter(b => b.isPaid).reduce((acc, bill) => acc + bill.amount, 0);
  const progress = total > 0 ? (paid / total) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stat */}
      <div className="glass-card p-6 rounded-3xl flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
        <div>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total a Pagar</p>
           <h1 className="text-3xl font-extrabold text-white">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h1>
        </div>
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
           <span className="text-xl font-bold text-white">{bills.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-slate-700/50">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Progresso mensal</span>
          <span className="text-white font-bold">{Math.round(progress)}% Pago</span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
         <h2 className="text-lg font-bold text-white">Contas do Mês</h2>
         <div className="flex items-center gap-4">
            <ImportDocButton 
              docType="BANK_STATEMENT" 
              tableType="MAIN" 
              onSaved={onRefresh} 
              onRefreshCoins={onRefreshCoins}
              onNavigateToPlans={onNavigateToPlans}
            />
            <button onClick={onAdd} className="flex items-center gap-1 text-sm text-primary font-medium hover:text-white transition-colors">
               <Plus size={16} /> Nova Conta
            </button>
         </div>
      </div>

      {/* Interactive List */}
      <div className="space-y-3">
        {bills.map((bill) => {
          const category = categories.find(c => c.id === bill.category) || categories[0];
          return (
            <div 
              key={bill.id} 
              className={`relative bg-surface border ${bill.isPaid ? 'border-emerald-900/30 bg-emerald-950/10' : 'border-slate-700/50 hover:border-slate-600'} p-4 rounded-2xl flex items-center gap-4 transition-all group overflow-hidden`}
            >
              {bill.isPaid && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
              
              {/* Category Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${bill.isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}`} style={{ backgroundColor: !bill.isPaid ? `${category?.color}20` : undefined, color: !bill.isPaid ? category?.color : undefined }}>
                {getCategoryIcon(category?.icon || 'coffee', 20)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <h3 className={`font-semibold text-base truncate ${bill.isPaid ? 'text-emerald-100 line-through decoration-emerald-500/50' : 'text-white'}`}>
                     {bill.description}
                   </h3>
                   <span className={`font-bold text-sm ${bill.isPaid ? 'text-emerald-400' : 'text-slate-200'}`}>
                     R$ {bill.amount.toFixed(0)}
                   </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-xs text-slate-500 uppercase font-medium">{category?.name || 'Unknown'}</span>
                   <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded">Venc. 15/02</span>
                </div>
              </div>

              {/* Actions (Hover on Desktop, Always visible layout on mobile but handled via flex) */}
              <div className="flex items-center gap-2">
                  {/* Edit/Delete Actions */}
                  <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => handleEditClick(bill)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => setBillToDelete(bill)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Custom Checkbox Interaction */}
                  <div className="relative cursor-pointer shrink-0" onClick={() => togglePaid(bill)}>
                    {updatingBillId === bill.id ? (
                      <Loader2 className="animate-spin text-slate-400" size={24} />
                    ) : bill.isPaid ? (
                      <CheckCircle2 className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={28} />
                    ) : (
                      <Circle className="text-slate-600 group-hover:text-slate-400 transition-colors" size={28} />
                    )}
                  </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmationModal 
        isOpen={!!billToDelete}
        onClose={() => setBillToDelete(null)}
        onConfirm={(deleteAll) => billToDelete && onDelete(billToDelete.id, deleteAll)}
        title="Excluir Conta?"
        message={billToDelete?.installments && billToDelete.installments.total > 1 ? "Esta conta faz parte de um parcelamento. Deseja excluir apenas esta parcela ou todas as parcelas futuras?" : "Tem certeza que deseja excluir esta conta? Essa ação não pode ser desfeita."}
        showCheckbox={!!billToDelete?.installments && billToDelete.installments.total > 1}
        checkboxLabel="Excluir todas as parcelas"
      />
    </div>
  );
};

export default DebitsView;