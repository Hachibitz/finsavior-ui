import React, { useState } from 'react';
import { authService } from '../services/authService';
import { googleAuthService } from '../services/googleAuthService';
import { LogIn, Lock, User, Loader2, HelpCircle, ShieldCheck, ArrowRight, X } from 'lucide-react';
import TermsModal from './TermsModal';
import PasswordRecoveryModal from './PasswordRecoveryModal';
import { FinSaviorLogo } from './Logo';

interface LoginProps {
  onLoginSuccess: () => void;
  onOpenSupport: () => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onOpenSupport, onNavigateToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleRegisterModal, setShowGoogleRegisterModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login(username, password, rememberMe);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await googleAuthService.signIn();
      if (result && (result as any).userNotFound) {
        setGoogleUserData((result as any).firebaseUser);
        setShowGoogleRegisterModal(true);
      } else {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Falha no login com Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!acceptedTerms || !googleUserData) return;
    
    setGoogleLoading(true);
    try {
      // Get the ID token from Firebase again or use the one from the previous step
      // The googleAuthService.signIn() already returned the result which includes the token
      // but we need to pass it to register-google.
      
      // Re-run sign-in to get a fresh token if needed, or we could have stored it.
      // Let's assume we can just call registerWithGoogle with the token.
      // We need to modify googleAuthService to return the token or use it directly.
      
      const idToken = await googleAuthService.getCurrentIdToken();
      if (!idToken) throw new Error('Token do Google não encontrado.');

      await authService.registerWithGoogle(idToken);
      
      // Store email if available
      if (googleUserData?.email) {
        localStorage.setItem('user_email', googleUserData.email);
      }
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro via Google.');
      setShowGoogleRegisterModal(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">FinSavior</h1>
          <p className="text-slate-400 mt-2">Sua liberdade financeira começa aqui</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Usuário ou E-mail</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Seu usuário ou e-mail"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between ml-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-primary focus:ring-primary/50"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-400 font-medium cursor-pointer select-none">
                  Permanecer logado
                </label>
              </div>
              <button 
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
              >
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-sm font-medium animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0b1121] px-4 text-slate-500 font-bold tracking-widest">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {googleLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-sm">
          Não tem uma conta? <span 
            onClick={onNavigateToRegister}
            className="text-primary font-bold cursor-pointer hover:underline"
          >
            Cadastre-se
          </span>
        </p>

        <div className="mt-6 flex justify-center">
          <button 
            onClick={onOpenSupport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
          >
            <HelpCircle size={14} />
            Precisa de Ajuda?
          </button>
        </div>
      </div>

      {/* Google Auto-Register Modal */}
      {showGoogleRegisterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-xl shadow-primary/20">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Quase lá!</h3>
              <p className="text-slate-400 text-sm">
                Identificamos que você ainda não possui uma conta. Deseja criar uma agora usando seus dados do Google?
              </p>
              
              <div className="mt-6 p-4 bg-white/5 rounded-2xl flex items-center gap-4 text-left border border-white/5">
                {googleUserData?.photoURL ? (
                  <img src={googleUserData.photoURL} alt="Google Profile" className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {googleUserData?.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <p className="text-white font-bold">{googleUserData?.displayName}</p>
                  <p className="text-slate-500 text-xs">{googleUserData?.email}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 text-left">
                  <input 
                    type="checkbox"
                    id="google-agreement"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/10 bg-slate-900 text-primary focus:ring-primary focus:ring-offset-slate-950"
                  />
                  <label htmlFor="google-agreement" className="text-xs text-slate-400 leading-relaxed">
                    Declaro que li e aceito os{' '}
                    <button 
                      type="button" 
                      onClick={() => { setTermsType('terms'); setShowTermsModal(true); }}
                      className="text-primary hover:underline font-bold"
                    >
                      Termos e Condições
                    </button>
                    {' '}e{' '}
                    <button 
                      type="button" 
                      onClick={() => { setTermsType('privacy'); setShowTermsModal(true); }}
                      className="text-primary hover:underline font-bold"
                    >
                      Política de Privacidade
                    </button>.
                  </label>
                </div>

                <button 
                  onClick={handleGoogleRegister}
                  disabled={!acceptedTerms || googleLoading}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
                    !acceptedTerms || googleLoading 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                  }`}
                >
                  {googleLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Criar Minha Conta</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setShowGoogleRegisterModal(false)}
                  className="w-full py-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        type={termsType} 
      />

      <PasswordRecoveryModal 
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
      />
    </div>
  );
};

export default Login;
