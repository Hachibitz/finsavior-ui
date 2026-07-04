import React from 'react';
import { useTranslation } from 'react-i18next';
import { Asset } from '../types';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '../i18n/localeFormat';

interface AssetsViewProps {
  assets: Asset[];
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onRefreshCoins: () => void;
  onNavigateToPlans: () => void;
}

const AssetsView: React.FC<AssetsViewProps> = ({ assets, onAdd, onEdit, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">{t('assets.myIncome')}</h1>
      </div>

      <button 
        onClick={onAdd}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        {t('assets.addIncome')}
      </button>

      <div className="space-y-3 mt-4">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-surface border border-slate-700/50 p-4 rounded-xl relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            
            <div className="flex justify-between items-start pl-3">
              <div>
                <h3 className="font-bold text-white">{asset.description}</h3>
                <p className="text-emerald-400 font-bold text-lg mt-1">{formatCurrency(asset.amount)}</p>
                <p className="text-xs text-slate-400 mt-1 capitalize">{t('assets.type')}: {asset.type}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t('assets.netValue')}</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(asset)}
                  className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => onDelete(asset.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsView;
