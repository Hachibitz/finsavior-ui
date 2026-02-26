import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Play, 
  ShoppingBag, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Smartphone
} from 'lucide-react';
import { coinService } from '../services/coinService';
import { useToast } from '../contexts/ToastContext';

interface CoinStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoins: number;
  onRefreshCoins: () => void;
}

const CoinStoreModal: React.FC<CoinStoreModalProps> = ({ isOpen, onClose, currentCoins, onRefreshCoins }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Simple check for Android/Capacitor
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    // In a real Capacitor app, we'd use Capacitor.getPlatform()
    // For this demo, we'll simulate the check
    setIsAndroid(userAgent.includes('android'));
  }, []);

  if (!isOpen) return null;

  const handleEarnCoins = async () => {
    if (!isAndroid) {
      showToast('Anúncios premiados estão disponíveis apenas no App Android.', 'error');
      return;
    }

    setLoading('ad');
    try {
      // Simulate ad watching delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newBalance = await coinService.earnCoins();
      onRefreshCoins();
      showToast('Parabéns! Você ganhou 10 FScoins.', 'success');
    } catch (error) {
      showToast('Erro ao processar anúncio.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCoins = async (packageId: string, amount: number) => {
    setLoading(packageId);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real app, this would call a backend endpoint that verifies a Stripe payment
      // For now, we'll just simulate success
      showToast(`Compra de ${amount} FScoins realizada com sucesso!`, 'success');
      onRefreshCoins();
      onClose();
    } catch (error) {
      showToast('Erro ao processar compra.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const packages = [
    { id: 'pack_10', amount: 10, price: 'R$ 2,45', label: 'Iniciante', icon: Coins, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'pack_50', amount: 50, price: 'R$ 9,95', label: 'Popular', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', popular: true },
    { id: 'pack_150', amount: 150, price: 'R$ 24,95', label: 'Econômico', icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0b1121] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="p-8 relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Coins size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">FSCoins Store</h2>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Saldo Atual: <span className="text-amber-500">{currentCoins}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Earn Section */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ganhar Moedas</h3>
              <button 
                onClick={handleEarnCoins}
                disabled={loading !== null}
                className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between group relative overflow-hidden ${
                  isAndroid 
                    ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40' 
                    : 'bg-slate-900/50 border-white/5 opacity-60 grayscale cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isAndroid ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {loading === 'ad' ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="currentColor" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">Assistir Anúncio</p>
                    <p className="text-xs text-slate-400">Ganhe 10 FScoins por vídeo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-amber-500">+10</span>
                  <Coins size={16} className="text-amber-500" />
                </div>

                {!isAndroid && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                      <Smartphone size={12} />
                      Apenas no Android
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Buy Section */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Comprar Pacotes</h3>
              <div className="grid grid-cols-1 gap-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleBuyCoins(pkg.id, pkg.amount)}
                    disabled={loading !== null}
                    className={`p-5 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-between group relative ${
                      pkg.popular ? 'ring-2 ring-primary/50 border-primary/30' : ''
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                        Mais Popular
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${pkg.bg} ${pkg.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <pkg.icon size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white">{pkg.amount} FSCoins</p>
                        <p className="text-xs text-slate-400">{pkg.label}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-white">{pkg.price}</span>
                      {loading === pkg.id ? (
                        <Loader2 className="animate-spin text-primary" size={16} />
                      ) : (
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Comprar</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
              <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                FSCoins são utilizadas para gerar análises de IA, transcrições e outras funcionalidades premium. 
                Assinantes dos planos Premium e Elite recebem moedas mensais automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinStoreModal;
