import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Edit3, Save, AlertCircle } from 'lucide-react';
import { AiBillExtractionDTO, TableType, DocumentType } from '../types';
import { billService } from '../services/billService';
import { yyyyMMToBillDate } from '../utils/billDate';

interface DocReviewModalProps {
  extractedBills: AiBillExtractionDTO[];
  defaultTableType: TableType;
  docType: DocumentType;
  cardId?: string;
  targetDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

const DocReviewModal: React.FC<DocReviewModalProps> = ({ 
  extractedBills: initialBills, 
  defaultTableType, 
  docType, 
  cardId,
  targetDate,
  onClose, 
  onSaved 
}) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBills(initialBills.map((b, index) => ({
      ...b,
      id: `temp-${index}`,
      selected: true,
      editing: false,
      billType: docType === 'CREDIT_CARD' ? 'EXPENSE' : (b.billValue && b.billValue < 0 ? 'EXPENSE' : 'INCOME'),
      billTable: defaultTableType === 'CARD' ? 'CREDIT_CARD' : 'MAIN',
      cardId: docType === 'CREDIT_CARD' ? cardId : undefined,
      billValue: Math.abs(b.billValue || 0),
      billName: b.billName || 'Sem nome',
      billCategory: b.billCategory || 'Others',
      possibleDate: b.possibleDate || (targetDate ? `${targetDate}-01` : new Date().toISOString().split('T')[0])
    })));
  }, [initialBills, docType, defaultTableType, cardId, targetDate]);

  const handleToggleSelect = (id: string) => {
    setBills(bills.map(b => b.id === id ? { ...b, selected: !b.selected } : b));
  };

  const handleDelete = (id: string) => {
    setBills(bills.filter(b => b.id !== id));
  };

  const handleUpdateField = (id: string, field: string, value: any) => {
    setBills(bills.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSave = async () => {
    const selected = bills.filter(b => b.selected);
    if (selected.length === 0) return;

    setLoading(true);
    try {
      const payload = selected.map(item => {
        const billingMonth = targetDate || new Date().toISOString().slice(0, 7);
        let purchaseDate: string | undefined;

        if (item.possibleDate && item.possibleDate.includes('/')) {
          const parts = item.possibleDate.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            purchaseDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }

        return {
          billName: item.billName,
          billValue: item.billValue,
          billDescription: item.billDescription || 'Importado via PDF',
          billDate: yyyyMMToBillDate(billingMonth),
          purchaseDate,
          billType: item.billType,
          billTable: item.billTable,
          paymentType: item.paymentType,
          cardId: item.cardId,
          isRecurrent: item.isRecurrent || false,
          billCategory: item.billCategory,
          isInstallment: item.isInstallment || false,
          installmentCount: item.installmentCount || 1,
          entryMethod: 'AI_DOCUMENT' as const
        };
      });

      await billService.batchRegister(payload as any);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving bills:', error);
      alert('Falha ao salvar contas.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = bills.filter(b => b.selected).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Revisar Importação</h3>
            <p className="text-slate-400 text-sm mt-1">
              {bills.length} itens encontrados • {selectedCount} selecionados
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p>Nenhum item para revisar.</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div 
                key={bill.id} 
                className={`glass-card p-4 rounded-2xl border transition-all ${
                  bill.selected ? 'border-primary/30 bg-primary/5' : 'border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleToggleSelect(bill.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      bill.selected ? 'bg-primary border-primary text-white' : 'border-slate-600'
                    }`}
                  >
                    {bill.selected && <Check size={14} strokeWidth={3} />}
                  </button>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <input 
                        type="text" 
                        value={bill.billName}
                        onChange={(e) => handleUpdateField(bill.id, 'billName', e.target.value)}
                        className="w-full bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-lg"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">{bill.possibleDate || 'Sem data'}</span>
                        <span className="text-xs text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-full">{bill.billCategory}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                        <input 
                          type="number" 
                          value={bill.billValue}
                          onChange={(e) => handleUpdateField(bill.id, 'billValue', parseFloat(e.target.value))}
                          className="w-full bg-transparent border-none text-white font-black focus:ring-0 pl-7 p-0 text-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(bill.id)}
                        className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || selectedCount === 0}
            className="flex-[2] py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                Importar {selectedCount} Itens
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocReviewModal;
