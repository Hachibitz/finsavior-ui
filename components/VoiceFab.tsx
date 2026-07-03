import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Mic, Square, X, Loader2, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { aiTranscriptionService, AiBillExtractionDTO } from '../services/aiTranscriptionService';
import { coinService } from '../services/coinService';
import { useToast } from '../contexts/ToastContext';
import { translateApiError } from '../utils/apiError';

interface VoiceFabProps {
  mode: 'BILL' | 'CHAT';
  tableType?: string;
  onBillDetected?: (data: AiBillExtractionDTO) => void;
  onTextTranscribed?: (text: string) => void;
  onNavigateToPlans?: () => void;
  onRefreshCoins?: () => void;
}

const VoiceFab: React.FC<VoiceFabProps> = ({ 
  mode, 
  tableType, 
  onBillDetected, 
  onTextTranscribed, 
  onNavigateToPlans,
  onRefreshCoins
}) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userFsCoins, setUserFsCoins] = useState(0);
  const [lastRecordedBlob, setLastRecordedBlob] = useState<Blob | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState('');
  const { showToast } = useToast();
  
  const isWeb = Capacitor.getPlatform() === 'web';
  const audioCost = 10;

  useEffect(() => {
    refreshCoins();
  }, []);

  const refreshCoins = async () => {
    try {
      const balance = await coinService.getBalance();
      setUserFsCoins(balance);
      onRefreshCoins?.();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      console.log('Iniciando processo de gravação...');
      
      // On Web, ensure we trigger the browser prompt if Capacitor doesn't
      if (Capacitor.getPlatform() === 'web') {
        try {
          console.log('Solicitando permissão via MediaDevices (Web)...');
          if (navigator.permissions) {
            const status = await navigator.permissions.query({ name: 'microphone' as any });
            console.log('Microphone permission status:', status.state);
            if (status.state === 'denied') {
              showToast(t('voice.micDenied'), 'error');
              return;
            }
          }
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Just to trigger prompt
        } catch (e) {
          console.error('Web permission request failed', e);
          showToast(t('voice.micRequiredBrowser'), 'error');
          return;
        }
      }

      console.log('Verificando permissão via Capacitor...');
      let hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      
      if (!hasPermission.value) {
        console.log('Permissão não encontrada, solicitando...');
        const permission = await VoiceRecorder.requestAudioRecordingPermission();
        if (!permission.value) {
          console.warn('Permissão negada pelo usuário ou sistema.');
          showToast(t('voice.micRequired'), 'error');
          return;
        }
        // Re-check after request
        hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      }
      
      if (hasPermission.value) {
        console.log('Permissão concedida. Iniciando gravação...');
        // Small delay to ensure OS is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const result = await VoiceRecorder.startRecording();
        if (result.value) {
          setIsRecording(true);
          console.log('Gravação iniciada com sucesso.');
        } else {
          throw new Error('Falha ao iniciar gravação (retorno falso)');
        }
      } else {
        showToast(t('voice.audioPermissionFailed'), 'error');
      }
    } catch (error) {
      console.error('Erro detalhado ao iniciar gravação:', error);
      showToast(t('voice.startRecordingError'), 'error');
    }
  };

  const cancelRecording = async () => {
    try {
      setIsRecording(false);
      await VoiceRecorder.stopRecording();
      showToast(t('voice.recordingCancelled'), 'info');
    } catch (error) {
      console.error('Erro ao cancelar gravação', error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setLoading(true);
      
      console.log('Finalizando gravação...');
      const result = await VoiceRecorder.stopRecording();
      
      if (result.value && result.value.recordDataBase64) {
        const base64Data = result.value.recordDataBase64;
        console.log(`Áudio capturado. Tamanho base64: ${base64Data.length} caracteres.`);
        
        if (base64Data.length < 100) {
          console.warn('Áudio capturado parece estar vazio ou muito curto.');
        }

        // Force audio/aac to match legacy behavior and backend expectations
        const blob = base64ToBlob(base64Data, 'audio/aac');
        console.log(`Blob criado. Tamanho: ${blob.size} bytes, Tipo: ${blob.type}`);
        
        setLastRecordedBlob(blob);
        await processAudioRequest(blob, false);
      } else {
        console.warn('Nenhum dado de áudio retornado pelo gravador.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao finalizar gravação:', error);
      setIsRecording(false);
      setLoading(false);
      showToast(t('voice.finishRecordingError'), 'error');
    }
  };

  const base64ToBlob = (base64: string, type: string) => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      return new Blob([byteNumbers], { type: type });
    } catch (e) {
      console.error('Erro ao converter base64 para Blob:', e);
      throw e;
    }
  };

  const processAudioRequest = async (blob: Blob, useCoins: boolean) => {
    try {
      if (mode === 'CHAT') {
        const res = await aiTranscriptionService.transcribeOnly(blob, useCoins);
        if (res?.text) {
          onTextTranscribed?.(res.text);
        }
      } else {
        const res = await aiTranscriptionService.processAudioToBill(blob, useCoins, tableType);
        if (res.redirectAction === 'CHAT_SAVI') {
           window.dispatchEvent(new CustomEvent('navigate-to-chat'));
           return;
        }
        onBillDetected?.({ ...res, billTable: tableType });
      }
      
      if (useCoins) {
        refreshCoins();
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      
      if (err.status === 403 || err.status === 400) {
        const msg = err.response?.data?.message || t('voice.audioLimit');
        setLimitErrorMessage(msg);
        setShowLimitAlert(true);
      } else if (err.status === 412) {
        showToast(t('voice.insufficientCoins'), 'error');
      } else {
        showToast(translateApiError(err, t('voice.processAudioError')), 'error');
      }
    }
  };

  const retryWithCoins = async () => {
    if (lastRecordedBlob) {
      setShowLimitAlert(false);
      setLoading(true);
      await processAudioRequest(lastRecordedBlob, true);
    }
  };

  if (mode === 'CHAT') {
    return (
      <div className="flex items-center gap-2">
        {isRecording && (
          <button 
            onClick={cancelRecording}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all animate-scale-in"
          >
            <X size={20} />
          </button>
        )}
        <button 
          onClick={toggleRecording}
          disabled={loading}
          className={`p-3 rounded-full transition-all shadow-lg ${
            isRecording 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-primary text-white hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : (isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />)}
        </button>

        {showLimitAlert && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-8 animate-scale-in">
              <h3 className="text-xl font-bold text-white mb-2">{t('voice.limitTitle')}</h3>
              <p className="text-slate-400 text-sm mb-6">{t('voice.useCoinsPrompt', { msg: limitErrorMessage, cost: audioCost, balance: userFsCoins })}</p>
              
              <div className="space-y-3">
                <button 
                  onClick={retryWithCoins}
                  disabled={userFsCoins < audioCost}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {t('voice.useCoins', { count: audioCost })}
                </button>
                <button 
                  onClick={() => {
                    setShowLimitAlert(false);
                    onNavigateToPlans?.();
                  }}
                  className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  {t('nav.plans')}
                </button>
                <button 
                  onClick={() => setShowLimitAlert(false)}
                  className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed right-4 z-[999] flex flex-col items-center gap-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8rem)' }}
      >
        {isRecording && (
          <button 
            onClick={cancelRecording}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shadow-lg animate-scale-in"
          >
            <X size={18} />
          </button>
        )}
        <button 
          onClick={toggleRecording}
          disabled={loading}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
            isRecording 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-primary text-white hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : (isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={24} />)}
        </button>
      </div>

      {showLimitAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-white/10 p-8 animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2">{t('voice.limitTitle')}</h3>
            <p className="text-slate-400 text-sm mb-6">{t('voice.useCoinsPrompt', { msg: limitErrorMessage, cost: audioCost, balance: userFsCoins })}</p>
            
            <div className="space-y-3">
              <button 
                onClick={retryWithCoins}
                disabled={userFsCoins < audioCost}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {t('voice.useCoins', { count: audioCost })}
              </button>
              <button 
                onClick={() => {
                  setShowLimitAlert(false);
                  onNavigateToPlans?.();
                }}
                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                {t('nav.plans')}
              </button>
              <button 
                onClick={() => setShowLimitAlert(false)}
                className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceFab;
