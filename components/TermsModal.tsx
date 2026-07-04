import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { termsService } from '../services/termsService';
import Markdown from 'react-markdown';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchContent = async () => {
        setLoading(true);
        try {
          const data = type === 'terms' 
            ? await termsService.getTerms() 
            : await termsService.getPrivacyPolicy();
          setContent(data);
        } catch (error) {
          console.error('Error fetching terms/privacy:', error);
          setContent(t('termsModal.loadError'));
        } finally {
          setLoading(false);
        }
      };
      fetchContent();
    }
  }, [isOpen, type, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-surface w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              {type === 'terms' ? <FileText size={24} /> : <Shield size={24} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {type === 'terms' ? t('termsModal.termsTitle') : t('termsModal.privacyTitle')}
              </h3>
              <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mt-1">{t('termsModal.lastUpdated')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('termsModal.loading')}</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-slate max-w-none">
              <div className="markdown-body">
                <Markdown>{content}</Markdown>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-white/5 flex justify-center">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            {t('termsModal.understood')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
