import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2, AlertCircle, Coins, CreditCard, Wallet } from 'lucide-react';
import { aiService } from '../services/aiService';
import { coinService } from '../services/coinService';
import { DocumentType, TableType, AiBillExtractionDTO } from '../types';
import DocReviewModal from './DocReviewModal';
import { useToast } from '../contexts/ToastContext';
import { translateApiError } from '../utils/apiError';
import { translateKnownBackendMessage } from '../utils/backendMessages';

interface ImportDocButtonProps {
  docType: DocumentType;
  tableType: TableType;
  onSaved: () => void;
  onRefreshCoins: () => void;
  onNavigateToPlans?: () => void;
  cardId?: string;
  targetDate?: string;
  children?: React.ReactNode;
  className?: string;
}

const ImportDocButton: React.FC<ImportDocButtonProps> = ({ 
  docType, 
  tableType, 
  onSaved, 
  onRefreshCoins,
  onNavigateToPlans,
  cardId,
  targetDate,
  children,
  className
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [extractedBills, setExtractedBills] = useState<AiBillExtractionDTO[]>([]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [limitError, setLimitError] = useState('');
  const [showCoinAlert, setShowCoinAlert] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  const importCost = 10;

  const handleButtonClick = async () => {
    try {
      const balance = await coinService.getBalance();
      setUserCoins(balance);
    } catch (e) {
      console.error('Error fetching coins:', e);
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast(t('import.pdfOnly'), 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(t('import.maxSize'), 'error');
      e.target.value = '';
      return;
    }

    processUpload(file);
    // Reset input
    e.target.value = '';
  };

  const processUpload = async (file: File, filePassword?: string, isUsingCoins: boolean = false) => {
    setLoading(true);
    setLoadingMessage(filePassword ? t('import.unlocking') : t('import.reading'));
    
    try {
      const bills = await aiService.uploadDocument(file, docType, isUsingCoins, filePassword, cardId, targetDate);
      setExtractedBills(bills);
      setShowReview(true);
      setShowPasswordPrompt(false);
      setPassword('');
      onRefreshCoins();
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || err.data?.msg || '';

      if (errorMessage.includes('PASSWORD_REQUIRED')) {
        setPendingFile(file);
        setShowPasswordPrompt(true);
      } else if (err.status === 412) {
        setPendingFile(file);
        setLimitError(translateApiError(err, t('import.limitReached')));
        setShowLimitAlert(true);
      } else if (
        (err.status === 400 || err.status === 412) &&
        (/insufficient fscoins/i.test(errorMessage) ||
          translateKnownBackendMessage(errorMessage) === t('import.insufficientBalance'))
      ) {
        setShowCoinAlert(true);
      } else {
        showToast(translateApiError(err, t('import.processFailed')), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFile && password) {
      processUpload(pendingFile, password);
    }
  };

  const handleUseCoins = () => {
    if (pendingFile) {
      if (userCoins >= importCost) {
        processUpload(pendingFile, undefined, true);
        setShowLimitAlert(false);
      } else {
        setShowCoinAlert(true);
      }
    }
  };

  const handleWatchAd = async () => {
    setLoading(true);
    setLoadingMessage(t('import.loadingAd'));
    try {
      // Mocking ad reward since AdMob isn't available in web preview
      await coinService.earnCoins();
      onRefreshCoins();
      const balance = await coinService.getBalance();
      setUserCoins(balance);
      setShowCoinAlert(false);
      showToast(t('import.adReward'), 'success');
    } catch (e) {
      console.error('Error earning coins:', e);
      showToast(t('import.adFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleButtonClick}
        disabled={loading}
        className={className || "w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all relative group"}
        title={t('import.importPdf')}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          children || (
            <>
              <FileText size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-surface animate-pulse"></span>
            </>
          )
        )}
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        className="hidden" 
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-xs text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">{t('import.processing')}</h3>
            <p className="text-slate-400 text-sm">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Password Prompt */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{t('import.protectedPdf')}</h3>
            <p className="text-slate-400 mb-6">{t('import.protectedPdfDesc')}</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('import.pdfPassword')}
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:text-white transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {t('common.continue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Limit Alert */}
      {showLimitAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 mx-auto">
              <CreditCard size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{t('import.limitTitle')}</h3>
            <p className="text-slate-400 mb-8">{t('import.limitDesc', { msg: limitError })}</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleUseCoins}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Coins size={20} />
                {t('import.useCoins', { count: importCost })}
              </button>
              <button 
                onClick={() => {
                  onNavigateToPlans?.();
                  setShowLimitAlert(false);
                }}
                className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                {t('layout.premiumPlans')}
              </button>
              <button 
                onClick={() => setShowLimitAlert(false)}
                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-all"
              >
                {t('import.notNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Coins Alert */}
      {showCoinAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 mx-auto">
              <Coins size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{t('import.insufficientBalance')}</h3>
            <p className="text-slate-400 mb-8">{t('import.insufficientDesc', { cost: importCost, balance: userCoins })}</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleWatchAd}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {t('import.watchAd')}
              </button>
              <button 
                onClick={() => setShowCoinAlert(false)}
                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-all"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <DocReviewModal 
          extractedBills={extractedBills}
          docType={docType}
          defaultTableType={tableType}
          cardId={cardId}
          targetDate={targetDate}
          onClose={() => setShowReview(false)}
          onSaved={() => {
            onSaved();
            setShowReview(false);
          }}
        />
      )}
    </>
  );
};

export default ImportDocButton;
