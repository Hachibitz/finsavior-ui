import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ShieldCheck, Loader2, CheckCircle2, Edit2, Trash2, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { whatsappService } from '../services/whatsappService';
import { useToast } from '../contexts/ToastContext';
import { translateApiError } from '../utils/apiError';

interface WhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onRefreshProfile: () => void;
  onNavigateToPlans: () => void;
}

const WhatsappModal: React.FC<WhatsappModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  onRefreshProfile,
  onNavigateToPlans
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agentNumber, setAgentNumber] = useState<string | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);

  useEffect(() => {
    if (isOpen && profile?.isWhatsappEnabled) {
      fetchAgentNumber();
    }
  }, [isOpen, profile?.isWhatsappEnabled]);

  const fetchAgentNumber = async () => {
    setIsLoadingAgent(true);
    try {
      const { phoneNumber } = await whatsappService.getAgentNumber();
      setAgentNumber(phoneNumber);
    } catch (error) {
      console.error('Error fetching agent number:', error);
    } finally {
      setIsLoadingAgent(false);
    }
  };

  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneNumber(profile.phoneNumber.replace(/^\+/, ''));
    } else {
      setPhoneNumber('');
    }
    setIsEditing(!profile?.isWhatsappEnabled);
    setShowConfirmDisable(false);
  }, [profile, isOpen]);

  const validatePhoneNumber = (num: string) => {
    const digitsOnly = num.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const handleEnable = async () => {
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      showToast(t('whatsappModal.invalidPhone'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      await userService.enableWhatsapp({ isEnabled: true, phoneNumber: formattedNumber });
      showToast(t('whatsappModal.enabledSuccess'), 'success');
      onRefreshProfile();
      setIsEditing(false);
      if (!profile?.isWhatsappEnabled) onClose();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    try {
      await userService.disableWhatsapp();
      showToast(t('whatsappModal.disabledSuccess'), 'success');
      onRefreshProfile();
      setShowConfirmDisable(false);
      onClose();
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!agentNumber) return;
    navigator.clipboard.writeText(agentNumber);
    setCopied(true);
    showToast(t('whatsappModal.numberCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    if (!agentNumber) return;
    const cleanNumber = agentNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleError = (error: any) => {
    console.error('WhatsApp integration error:', error);
    const code = error?.errorCode || error?.data?.errorCode || error?.response?.data?.errorCode;
    const errorMessage = translateApiError(error, t('whatsappModal.integrationError'));

    if (code === 'WHATSAPP_PAID_ONLY') {
      showToast(errorMessage, 'info');
      onNavigateToPlans();
      onClose();
    } else {
      showToast(errorMessage, 'error');
    }
  };

  if (!isOpen) return null;

  const isFreePlan = profile?.plan?.planId === 'FREE' || profile?.plan?.planDs === 'FREE';
  const isEnabled = profile?.isWhatsappEnabled;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="bg-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-600/20 to-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t('whatsappModal.title')}</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  {isEnabled ? t('whatsappModal.manageIntegration') : t('whatsappModal.smartIntegration')}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {isEnabled && !isEditing ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{t('whatsappModal.activeTitle')}</h4>
                    <p className="text-sm text-slate-400">{t('whatsappModal.linkedTo')}</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{profile?.phoneNumber}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('whatsappModal.howToUse')}</h4>
                  <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{t('whatsappModal.agentNumber')}</p>
                        {isLoadingAgent ? (
                          <div className="h-6 w-32 bg-white/5 animate-pulse rounded-md" />
                        ) : (
                          <p className="text-lg font-mono font-bold text-white tracking-tight">{agentNumber || t('whatsappModal.loading')}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={copyToClipboard}
                          disabled={!agentNumber}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                          title={t('whatsappModal.copyNumber')}
                        >
                          {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                        <button 
                          onClick={openWhatsApp}
                          disabled={!agentNumber}
                          className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-all disabled:opacity-50"
                          title={t('whatsappModal.openWhatsApp')}
                        >
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-px bg-white/5" />
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{t('whatsappModal.step1')}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{t('whatsappModal.step2')}</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{t('whatsappModal.step3')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} /> {t('whatsappModal.changeNumber')}
                  </button>
                  <button 
                    onClick={() => setShowConfirmDisable(true)}
                    disabled={isLoading}
                    className="py-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger font-bold hover:bg-danger/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> {t('whatsappModal.disable')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {!isEnabled && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={12} />
                        </div>
                        <p className="text-sm text-slate-300">{t('whatsappModal.benefit1')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={12} />
                        </div>
                        <p className="text-sm text-slate-300">{t('whatsappModal.benefit2')}</p>
                      </div>
                    </div>
                  )}

                  {isFreePlan && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4">
                      <ShieldCheck className="text-amber-500 shrink-0" size={20} />
                      <div>
                        <h4 className="text-sm font-bold text-amber-500 mb-1">{t('whatsappModal.premiumFeature')}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{t('whatsappModal.premiumDesc')}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{t('whatsappModal.phoneLabel')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <span className="text-sm font-bold">+</span>
                      </div>
                      <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="5511999999999"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono"
                        autoFocus
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 ml-1 italic">{t('whatsappModal.phoneHint')}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleEnable}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>{isEnabled ? t('whatsappModal.saveChanges') : t('whatsappModal.enableIntegration')}</>
                    )}
                  </button>
                  
                  {isFreePlan && !isEnabled && (
                    <button 
                      onClick={onNavigateToPlans}
                      className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                      {t('whatsappModal.upgradeNow')}
                    </button>
                  )}

                  <button 
                    onClick={() => isEnabled ? setIsEditing(false) : onClose()}
                    className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors"
                  >
                    {isEnabled ? t('common.cancel') : t('whatsappModal.maybeLater')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfirmDisable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('whatsappModal.disableTitle')}</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {t('whatsappModal.disableDesc')}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmDisable(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleDisable}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-danger hover:bg-danger/90 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-danger/20"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('whatsappModal.confirmDisable')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsappModal;
