import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Zap, 
  BrainCircuit, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Mic
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlans: () => void;
  profile: UserProfile | null;
}

const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, onNavigateToPlans, profile }) => {
  const { t } = useTranslation();
  const isFree = !profile?.plan || profile.plan.planId === 'FREE' || profile.plan.planDs === 'FREE';

  if (!isOpen || !isFree) return null;

  const titleHighlight = t('upsell.titleHighlight');
  const titleParts = t('upsell.title').split(titleHighlight);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0b1121] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" />
        
        <div className="p-10 relative z-10 text-center">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent p-[2px] mx-auto mb-8 shadow-2xl shadow-primary/20">
            <div className="w-full h-full rounded-3xl bg-[#0b1121] flex items-center justify-center">
              <ShieldCheck size={40} className="text-primary" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles size={12} /> {t('upsell.badge')}
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight">
            {titleParts[0]}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{titleHighlight}</span>
            {titleParts[1]}
          </h2>
          
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            {t('upsell.description')}
          </p>

          <div className="grid grid-cols-1 gap-4 mb-10 text-left max-w-xs mx-auto">
            {[
              { text: t('upsell.feature1'), icon: BrainCircuit },
              { text: t('upsell.feature2'), icon: Mic },
              { text: t('upsell.feature3'), icon: CheckCircle2 },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-300">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <feature.icon size={14} />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => { onNavigateToPlans(); onClose(); }}
              className="w-full py-5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              {t('upsell.cta')}
              <ArrowRight size={20} />
            </button>
            
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors"
            >
              {t('upsell.maybeLater')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
