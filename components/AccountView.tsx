import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Trash2, 
  Camera, 
  ChevronRight, 
  ExternalLink, 
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { paymentService } from '../services/paymentService';
import { useToast } from '../contexts/ToastContext';

interface AccountViewProps {
  profile: UserProfile | null;
  onRefreshProfile: () => void;
  onNavigateToPlans: () => void;
}

const AccountView: React.FC<AccountViewProps> = ({ profile, onRefreshProfile, onNavigateToPlans }) => {
  const { showToast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    username: profile?.username || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmText: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName);
      formData.append('lastName', profileForm.lastName);
      formData.append('username', profileForm.username);
      
      await userService.updateProfile(formData);
      showToast('Perfil atualizado com sucesso!', 'success');
      onRefreshProfile();
      setIsEditingProfile(false);
    } catch (error: any) {
      showToast(error?.message || 'Erro ao atualizar perfil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('As senhas não coincidem', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await userService.changePassword({
        username: profile?.username || '',
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Senha alterada com sucesso!', 'success');
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showToast(error?.message || 'Erro ao alterar senha', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteForm.confirmText !== 'EXCLUIR') {
      showToast('Por favor, digite EXCLUIR para confirmar', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await userService.deleteAccount({
        username: profile?.username || '',
        password: deleteForm.password,
        confirmation: true,
      });
      showToast('Sua conta será excluída em breve', 'success');
      // In a real app, we would logout here
      window.location.reload();
    } catch (error: any) {
      showToast(error?.message || 'Erro ao excluir conta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('name', file.name);
      
      await userService.uploadProfilePicture(formData);
      showToast('Foto de perfil atualizada!', 'success');
      onRefreshProfile();
    } catch (error: any) {
      showToast(error?.message || 'Erro ao enviar foto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.createCustomerPortalSession(profile?.email || '');
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      showToast('Não foi possível abrir o portal de pagamentos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-slide-up">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 border border-white/5 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-accent p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden border-4 border-slate-900">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <User size={48} />
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-4 border-slate-900"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">
              {profile?.name || `${profile?.firstName} ${profile?.lastName}`}
            </h1>
            <p className="text-slate-400 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
              <Mail size={14} />
              {profile?.email}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} />
                Plano {profile?.plan.planDs}
              </div>
              <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white">$</div>
                {profile?.coins || 0} FSCoins
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsEditingProfile(true)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all border border-white/10"
          >
            Editar Perfil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Configurações de Conta</h3>
          
          <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
            <button 
              onClick={() => setIsChangingPassword(true)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Alterar Senha</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Mantenha sua conta segura</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-600" />
            </button>

            <div className="h-px bg-white/5 mx-5" />

            <button 
              onClick={onNavigateToPlans}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Ver Planos</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Explore recursos premium</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-600" />
            </button>

            <div className="h-px bg-white/5 mx-5" />

            <button 
              onClick={handleOpenPortal}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ExternalLink size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Portal de Pagamento</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Gerenciar assinaturas e faturas</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-rose-500/50 uppercase tracking-[0.2em] ml-4">Zona de Perigo</h3>
          
          <div className="glass-card rounded-3xl border border-rose-500/10 overflow-hidden bg-rose-500/5">
            <button 
              onClick={() => setIsDeletingAccount(true)}
              className="w-full p-5 flex items-center justify-between hover:bg-rose-500/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trash2 size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-rose-500">Excluir Conta</p>
                  <p className="text-[10px] text-rose-500/50 font-medium uppercase tracking-wider">Ação irreversível</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-rose-500/30" />
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-1">Privacidade de Dados</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Ao excluir sua conta, todos os seus dados financeiros, históricos de transações e análises de IA serão removidos permanentemente de nossos servidores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white tracking-tight">Editar Perfil</h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome</label>
                  <input 
                    type="text" 
                    value={profileForm.firstName}
                    onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sobrenome</label>
                  <input 
                    type="text" 
                    value={profileForm.lastName}
                    onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <input 
                  type="text" 
                  value={profileForm.username}
                  onChange={e => setProfileForm({...profileForm, username: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white tracking-tight">Alterar Senha</h3>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual</label>
                <input 
                  type="password" 
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Atualizar Senha'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeletingAccount && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-rose-500/20 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-rose-500/10 flex justify-between items-center bg-rose-500/5">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black tracking-tight">Excluir Conta</h3>
              </div>
              <button onClick={() => setIsDeletingAccount(false)} className="p-2 text-slate-400 hover:text-white rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleDeleteAccount} className="p-6 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Esta ação é <span className="text-rose-500 font-bold">permanente</span>. Para confirmar, digite sua senha e a palavra <span className="text-white font-bold">EXCLUIR</span> abaixo.
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sua Senha</label>
                <input 
                  type="password" 
                  value={deleteForm.password}
                  onChange={e => setDeleteForm({...deleteForm, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Digite EXCLUIR</label>
                <input 
                  type="text" 
                  value={deleteForm.confirmText}
                  onChange={e => setDeleteForm({...deleteForm, confirmText: e.target.value})}
                  placeholder="EXCLUIR"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Exclusão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountView;
