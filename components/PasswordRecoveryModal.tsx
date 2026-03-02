import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Key, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.passwordRecovery(email);
      showToast('E-mail de recuperação enviado!', 'success');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
      showToast('Erro ao enviar e-mail', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, newPassword);
      showToast('Senha redefinida com sucesso!', 'success');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha. Verifique o token.');
      showToast('Erro ao redefinir senha', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Key size={20} />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">Recuperar Senha</h3>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleSendEmail} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">
                  Insira seu e-mail cadastrado para receber um token de recuperação.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-primary transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-xs flex items-center gap-3">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Enviar Token</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">
                  Insira o token recebido por e-mail e sua nova senha.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Token de Recuperação</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-primary transition-all"
                      placeholder="Cole o token aqui"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-primary transition-all"
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-primary transition-all"
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-xs flex items-center gap-3">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Redefinir Senha</span>
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>

              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full py-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Voltar para e-mail
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-8 py-4">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white tracking-tight mb-2">Sucesso!</h4>
                <p className="text-slate-400 text-sm">
                  Sua senha foi redefinida com sucesso. Agora você já pode entrar na sua conta.
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Ir para Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;
