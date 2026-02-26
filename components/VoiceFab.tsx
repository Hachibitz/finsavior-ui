import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Mic, Square, X, Loader2, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { aiTranscriptionService, AiBillExtractionDTO } from '../services/aiTranscriptionService';
import { coinService } from '../services/coinService';
import { useToast } from '../contexts/ToastContext';

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
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission.value) {
        const permission = await VoiceRecorder.requestAudioRecordingPermission();
        if (!permission.value) {
          showToast('Precisamos de permissão para ouvir suas contas!', 'error');
          return;
        }
      }
      
      const result = await VoiceRecorder.startRecording();
      if (result.value) {
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erro ao iniciar gravação', error);
      showToast('Erro ao iniciar gravação', 'error');
    }
  };

  const cancelRecording = async () => {
    try {
      setIsRecording(false);
      await VoiceRecorder.stopRecording();
      showToast('Gravação cancelada', 'info');
    } catch (error) {
      console.error('Erro ao cancelar gravação', error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setLoading(true);
      
      const result = await VoiceRecorder.stopRecording();
      if (result.value && result.value.recordDataBase64) {
        const blob = base64ToBlob(result.value.recordDataBase64, result.value.mimeType);
        setLastRecordedBlob(blob);
        await processAudioRequest(blob, false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsRecording(false);
      setLoading(false);
      showToast('Erro ao finalizar gravação', 'error');
    }
  };

  const base64ToBlob = (base64: string, type: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: type });
  };

  const processAudioRequest = async (blob: Blob, useCoins: boolean) => {
    try {
      if (mode === 'CHAT') {
        const res = await aiTranscriptionService.transcribeOnly(blob, useCoins);
        if (res?.text) {
          onTextTranscribed?.(res.text);
        }
      } else {
        const res = await aiTranscriptionService.processAudioToBill(blob, useCoins);
        if (res.redirectAction === 'CHAT_SAVI') {
           window.dispatchEvent(new CustomEvent('navigate-to-chat'));
           return;
        }
        onBillDetected?.(res);
      }
      
      if (useCoins) {
        refreshCoins();
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      
      if (err.status === 403 || err.status === 400) {
        const msg = err.response?.data?.message || 'Limite de áudio atingido no plano Free.';
        setLimitErrorMessage(msg);
        setShowLimitAlert(true);
      } else if (err.status === 412) {
        showToast('Saldo insuficiente de moedas.', 'error');
      } else {
        showToast('Não consegui processar o áudio. Tente novamente.', 'error');
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
              <h3 className="text-xl font-bold text-white mb-2">Limite Atingido ⭐</h3>
              <p className="text-slate-400 text-sm mb-6">{limitErrorMessage} Deseja usar {audioCost} FSCoins para transcrever este áudio? (Saldo: {userFsCoins})</p>
              
              <div className="space-y-3">
                <button 
                  onClick={retryWithCoins}
                  disabled={userFsCoins < audioCost}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  Usar {audioCost} Moedas
                </button>
                <button 
                  onClick={() => {
                    setShowLimitAlert(false);
                    onNavigateToPlans?.();
                  }}
                  className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Ver Planos
                </button>
                <button 
                  onClick={() => setShowLimitAlert(false)}
                  className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors"
                >
                  Cancelar
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
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-center gap-3">
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
            <h3 className="text-xl font-bold text-white mb-2">Limite Atingido ⭐</h3>
            <p className="text-slate-400 text-sm mb-6">{limitErrorMessage} Deseja usar {audioCost} FSCoins para transcrever este áudio? (Saldo: {userFsCoins})</p>
            
            <div className="space-y-3">
              <button 
                onClick={retryWithCoins}
                disabled={userFsCoins < audioCost}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                Usar {audioCost} Moedas
              </button>
              <button 
                onClick={() => {
                  setShowLimitAlert(false);
                  onNavigateToPlans?.();
                }}
                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                Ver Planos
              </button>
              <button 
                onClick={() => setShowLimitAlert(false)}
                className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceFab;
