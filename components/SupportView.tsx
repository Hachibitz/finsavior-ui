import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  User, 
  Mail, 
  HelpCircle, 
  CheckCircle2, 
  Loader2,
  ArrowLeft,
  Info
} from 'lucide-react';
import { UserProfile } from '../types';
import { supportService } from '../services/supportService';
import { useToast } from '../contexts/ToastContext';

interface SupportViewProps {
  profile: UserProfile | null;
  onBack: () => void;
}

const SupportView: React.FC<SupportViewProps> = ({ profile, onBack }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const [form, setForm] = useState({
    name: profile?.name || profile?.firstName || '',
    email: profile?.email || '',
    emailConfirmation: profile?.email || '',
    type: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.type || !form.message) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!profile && form.email !== form.emailConfirmation) {
      showToast('Os e-mails não coincidem.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (profile) {
        await supportService.sendTicket({
          ...form,
          isAuthenticated: true
        });
      } else {
        await supportService.sendPublicTicket({
          ...form,
          isAuthenticated: false
        });
      }
      setIsSent(true);
      showToast('Mensagem enviada com sucesso!', 'success');
    } catch (error: any) {
      if (error?.status === 429) {
        showToast('Muitas solicitações. Tente novamente em uma hora.', 'error');
      } else {
        showToast(error?.message || 'Erro ao enviar mensagem. Tente novamente.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-4">Mensagem Enviada!</h2>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Obrigado por entrar em contato. Nossa equipe analisará sua solicitação e responderá o mais breve possível no seu e-mail de cadastro.
        </p>
        <button 
          onClick={onBack}
          className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-slide-up">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fale Conosco</h1>
          <p className="text-slate-500 text-sm font-medium">Como podemos ajudar você hoje?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="glass-card rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={12} /> Nome
                </label>
                <input 
                  type="text" 
                  value={form.name}
                  maxLength={100}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail size={12} /> E-mail
                </label>
                <input 
                  type="email" 
                  value={form.email}
                  disabled={!!profile}
                  onChange={e => setForm({...form, email: e.target.value, emailConfirmation: profile ? e.target.value : form.emailConfirmation})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!profile && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail size={12} /> Confirmar E-mail
                </label>
                <input 
                  type="email" 
                  value={form.emailConfirmation}
                  onChange={e => setForm({...form, emailConfirmation: e.target.value})}
                  className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-white focus:outline-none transition-all ${
                    form.emailConfirmation && form.email !== form.emailConfirmation 
                      ? 'border-danger focus:border-danger' 
                      : 'border-white/10 focus:border-primary'
                  }`}
                  placeholder="Confirme seu e-mail"
                  required
                />
                {form.emailConfirmation && form.email !== form.emailConfirmation && (
                  <p className="text-[10px] text-danger font-bold ml-1 uppercase tracking-tighter">Os e-mails não coincidem</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <HelpCircle size={12} /> Tipo de Contato
              </label>
              <select 
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all appearance-none"
                required
              >
                <option value="" disabled className="bg-slate-900">Selecione uma opção</option>
                <option value="DUVIDA" className="bg-slate-900">Dúvida</option>
                <option value="SUGESTAO" className="bg-slate-900">Sugestão</option>
                <option value="RECLAMACAO" className="bg-slate-900">Reclamação</option>
                <option value="OUTROS" className="bg-slate-900">Outros</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MessageSquare size={12} /> Mensagem
              </label>
              <textarea 
                value={form.message}
                maxLength={4000}
                onChange={e => setForm({...form, message: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all min-h-[150px] resize-none"
                placeholder="Como podemos ajudar?"
                required
              />
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <Info size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Seu e-mail de cadastro será utilizado para eventuais respostas e acompanhamento. Certifique-se de que está correto.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Send size={18} />
                  Enviar Mensagem
                </>
              )}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60 pointer-events-none relative">
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="bg-primary/90 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
              Disponível em breve
            </div>
          </div>
          {[
            { label: 'Dúvidas Frequentes', icon: HelpCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Central de Ajuda', icon: Info, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Comunidade', icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer group">
              <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon size={20} />
              </div>
              <span className="text-xs font-bold text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportView;
