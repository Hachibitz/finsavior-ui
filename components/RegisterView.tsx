import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ShieldCheck,
  Chrome
} from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import TermsModal from './TermsModal';

interface RegisterViewProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsType, setTermsType] = useState<'terms' | 'privacy'>('terms');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: '',
    emailConfirmation: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirmation: ''
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  const checkPassword = (password: string) => {
    setPasswordCriteria({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password)
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'password') {
      checkPassword(value);
    }
  };

  const parseBackendErrors = (msg: string) => {
    const errors: Record<string, string> = {};
    if (!msg) return errors;
    
    const lines = msg.split(/[\n,]/).map(l => l.trim()).filter(l => l);
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('email já cadastrado') || lowerLine.includes('email inválido')) {
        errors.email = line;
      } else if (lowerLine.includes('usuário já cadastrado') || lowerLine.includes('usuário precisa ter') || lowerLine.includes('usuário não pode conter')) {
        errors.username = line;
      } else if (lowerLine.includes('nome precisa ter') || lowerLine.includes('nome não pode conter')) {
        errors.firstName = line;
      } else if (lowerLine.includes('sobrenome precisa ter') || lowerLine.includes('sobrenome não pode conter')) {
        errors.lastName = line;
      } else if (lowerLine.includes('emails não conferem')) {
        errors.emailConfirmation = line;
      } else if (lowerLine.includes('as senhas não coincidem')) {
        errors.passwordConfirmation = line;
      } else if (lowerLine.includes('critérios da senha não atendidos')) {
        errors.password = line;
      }
    });
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    if (formData.email !== formData.emailConfirmation) {
      showToast('Os e-mails não coincidem.', 'error');
      setFieldErrors(prev => ({ ...prev, emailConfirmation: 'Os e-mails não coincidem.' }));
      return;
    }
    
    if (formData.password !== formData.passwordConfirmation) {
      showToast('As senhas não coincidem.', 'error');
      setFieldErrors(prev => ({ ...prev, passwordConfirmation: 'As senhas não coincidem.' }));
      return;
    }

    if (!acceptedTerms) {
      showToast('Você deve aceitar os termos e condições.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUp({
        ...formData,
        agreement: true
      });
      
      // Store email for later use (e.g. checkout)
      localStorage.setItem('user_email', formData.email);
      
      showToast('Cadastro realizado com sucesso!', 'success');
      onRegisterSuccess();
    } catch (error: any) {
      const errorMsg = error.data?.message || error.data?.msg || error.message || '';
      
      if (errorMsg) {
        const parsedErrors = parseBackendErrors(errorMsg);
        if (Object.keys(parsedErrors).length > 0) {
          setFieldErrors(parsedErrors);
          showToast('Verifique os campos com erro.', 'error');
        } else {
          showToast(errorMsg, 'error');
        }
      } else {
        showToast('Erro ao realizar cadastro. Verifique os dados e tente novamente.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const isFormValid = 
    formData.email && 
    formData.emailConfirmation === formData.email &&
    formData.username.length >= 4 &&
    formData.firstName.length >= 2 &&
    formData.lastName.length >= 2 &&
    isPasswordValid &&
    formData.passwordConfirmation === formData.password &&
    acceptedTerms;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <button 
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Voltar para Login</span>
        </button>

        <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/5 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-xl shadow-primary/20">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Crie sua conta</h1>
            <p className="text-slate-400">Junte-se a milhares de pessoas que já controlam suas finanças com inteligência.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Informações Pessoais</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Seu nome"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        fieldErrors.firstName ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.firstName && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.firstName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sobrenome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Seu sobrenome"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        fieldErrors.lastName ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.lastName && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="nome_usuario"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        fieldErrors.username ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.username && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.username}</p>}
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Dados de Acesso</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="exemplo@email.com"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        fieldErrors.email ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.email && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar E-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="email"
                      name="emailConfirmation"
                      value={formData.emailConfirmation}
                      onChange={handleInputChange}
                      placeholder="Repita seu e-mail"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        (formData.emailConfirmation && formData.email !== formData.emailConfirmation) || fieldErrors.emailConfirmation ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.emailConfirmation && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.emailConfirmation}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Sua senha forte"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        fieldErrors.password ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.password && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.password}</p>}
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="passwordConfirmation"
                      value={formData.passwordConfirmation}
                      onChange={handleInputChange}
                      placeholder="Repita sua senha"
                      className={`w-full bg-slate-900/50 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                        (formData.passwordConfirmation && formData.password !== formData.passwordConfirmation) || fieldErrors.passwordConfirmation ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-white/5'
                      }`}
                      required
                    />
                    {fieldErrors.passwordConfirmation && <p className="text-rose-500 text-[10px] mt-1 ml-1 font-bold animate-shake">{fieldErrors.passwordConfirmation}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Requisitos da Senha</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Requirement met={passwordCriteria.length} text="Pelo menos 8 caracteres" />
                <Requirement met={passwordCriteria.upper} text="Letra maiúscula" />
                <Requirement met={passwordCriteria.lower} text="Letra minúscula" />
                <Requirement met={passwordCriteria.number} text="Um número" />
                <Requirement met={passwordCriteria.special} text="Caractere especial (@$!%*?&)" />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-2">
              <input 
                type="checkbox"
                id="agreement"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/10 bg-slate-900 text-primary focus:ring-primary focus:ring-offset-slate-950"
              />
              <label htmlFor="agreement" className="text-sm text-slate-400 leading-relaxed">
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
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
                isLoading || !isFormValid 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-primary/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar Minha Conta</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">Já possui uma conta?</p>
            <button 
              onClick={onBackToLogin}
              className="mt-2 text-white font-black hover:text-primary transition-colors uppercase tracking-widest text-xs"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>

      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        type={termsType} 
      />
    </div>
  );
};

const Requirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <div className="flex items-center gap-2">
    {met ? (
      <CheckCircle2 size={14} className="text-emerald-500" />
    ) : (
      <AlertCircle size={14} className="text-slate-600" />
    )}
    <span className={`text-[11px] font-bold ${met ? 'text-emerald-500/80' : 'text-slate-500'}`}>
      {text}
    </span>
  </div>
);

export default RegisterView;
