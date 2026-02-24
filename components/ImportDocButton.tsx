import React, { useRef, useState } from 'react';
import { FileText, Loader2, AlertCircle, Coins, CreditCard, Wallet } from 'lucide-react';
import { aiService } from '../services/aiService';
import { coinService } from '../services/coinService';
import { DocumentType, TableType, AiBillExtractionDTO } from '../types';
import DocReviewModal from './DocReviewModal';

interface ImportDocButtonProps {
  docType: DocumentType;
  tableType: TableType;
  onSaved: () => void;
  onRefreshCoins: () => void;
  onNavigateToPlans?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const ImportDocButton: React.FC<ImportDocButtonProps> = ({ 
  docType, 
  tableType, 
  onSaved, 
  onRefreshCoins,
  onNavigateToPlans,
  children,
  className
}) => {
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
      alert('Apenas arquivos PDF são aceitos no momento.');
      return;
    }

    processUpload(file);
    // Reset input
    e.target.value = '';
  };

  const processUpload = async (file: File, filePassword?: string, isUsingCoins: boolean = false) => {
    setLoading(true);
    setLoadingMessage(filePassword ? 'Desbloqueando e lendo documento...' : 'Lendo documento com IA...');
    
    try {
      const bills = await aiService.uploadDocument(file, docType, isUsingCoins, filePassword);
      setExtractedBills(bills);
      setShowReview(true);
      setShowPasswordPrompt(false);
      setPassword('');
      onRefreshCoins();
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || '';

      if (errorMessage.includes('PASSWORD_REQUIRED')) {
        setPendingFile(file);
        setShowPasswordPrompt(true);
      } else if (err.status === 412 || errorMessage.includes('Limite de importações')) {
        setPendingFile(file);
        setLimitError(errorMessage || 'Limite de importações do plano atingido.');
        setShowLimitAlert(true);
      } else if ((err.status === 400 || err.status === 412) && (errorMessage.includes('Saldo insuficiente') || errorMessage.includes('Insufficient FSCoins'))) {
        setShowCoinAlert(true);
      } else {
        alert('Falha ao processar o documento. Verifique se é um PDF válido.');
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
    setLoadingMessage('Carregando anúncio...');
    try {
      // Mocking ad reward since AdMob isn't available in web preview
      await coinService.earnCoins();
      onRefreshCoins();
      const balance = await coinService.getBalance();
      setUserCoins(balance);
      setShowCoinAlert(false);
      alert('Você ganhou 10 moedas!');
    } catch (e) {
      console.error('Error earning coins:', e);
      alert('Falha ao carregar anúncio.');
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
        title="Importar Fatura PDF"
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
            <h3 className="text-xl font-bold text-white mb-2">Processando</h3>
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
            <h3 className="text-2xl font-black text-white mb-2">PDF Protegido</h3>
            <p className="text-slate-400 mb-6">Este arquivo exige uma senha para ser lido (ex: os primeiros dígitos do seu CPF).</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha do PDF"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Continuar
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
            <h3 className="text-2xl font-black text-white mb-2">Limite Atingido</h3>
            <p className="text-slate-400 mb-8">{limitError} Você pode usar moedas para importar agora ou assinar o Premium.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleUseCoins}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Coins size={20} />
                Usar {importCost} FSCoins
              </button>
              <button 
                onClick={() => {
                  onNavigateToPlans?.();
                  setShowLimitAlert(false);
                }}
                className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Ver Planos Premium
              </button>
              <button 
                onClick={() => setShowLimitAlert(false)}
                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-all"
              >
                Agora não
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
            <h3 className="text-2xl font-black text-white mb-2">Saldo Insuficiente</h3>
            <p className="text-slate-400 mb-8">Você precisa de {importCost} moedas. Seu saldo atual é {userCoins}.</p>
            
            <div className="space-y-3">
              <button 
                onClick={handleWatchAd}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Assistir Vídeo (+10 Moedas)
              </button>
              <button 
                onClick={() => setShowCoinAlert(false)}
                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-all"
              >
                Fechar
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
