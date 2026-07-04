import React, { useState, useEffect, useRef } from 'react';
import { useMonth } from '../contexts/MonthContext';
import { 
  LayoutDashboard, CreditCard, Wallet, Receipt, BrainCircuit, ShieldCheck, 
  Menu, X, User, LogOut, Bell, Search, Tags, ArrowLeft, HelpCircle, Target,
  MessageCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { Notification } from '../types/notifications';
import { format } from 'date-fns';
import { enUS, ptBR, es as esLocale, fr as frLocale, zhCN, ja as jaLocale, de as deLocale, it as itLocale, ko as koLocale, arSA, id as idLocale } from 'date-fns/locale';
import SearchModal from './SearchModal';
import { FinSaviorLogo } from './Logo';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile?: UserProfile | null;
  onLogout?: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNotificationAction: (notification: Notification) => void;
  onOpenCoinStore?: () => void;
  onOpenWhatsapp?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  profile, 
  onLogout,
  notifications,
  unreadCount,
  onMarkAsRead,
  onClearAll,
  onNotificationAction,
  onOpenCoinStore,
  onOpenWhatsapp
}) => {
  const { t, i18n } = useTranslation();

  const dateFnsLocale = (() => {
    const lang = i18n.language || 'pt-BR';
    if (lang === 'pt-BR') return ptBR;
    if (lang === 'es') return esLocale;
    if (lang === 'fr') return frLocale;
    if (lang === 'zh-CN') return zhCN;
    if (lang === 'ja') return jaLocale;
    if (lang === 'de') return deLocale;
    if (lang === 'it') return itLocale;
    if (lang === 'ko') return koLocale;
    if (lang === 'ar') return arSA;
    if (lang === 'id') return idLocale;
    return enUS;
  })();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isNotificationsOpen && 
          notificationsRef.current && 
          !notificationsRef.current.contains(event.target as Node) &&
          bellButtonRef.current &&
          !bellButtonRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // Modern Floating Dock Icons
  const navItems = [
    { id: 'summary', label: t('nav.summary'), icon: LayoutDashboard },
    { id: 'debits', label: t('nav.debits'), icon: Receipt },
    { id: 'cards', label: t('nav.cards'), icon: CreditCard },
    { id: 'assets', label: t('nav.assets'), icon: Wallet },
    { id: 'goals', label: t('nav.goals'), icon: Target },
    { id: 'ai', label: t('nav.ai'), icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-panel border-b-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] cursor-pointer" onClick={() => setIsMenuOpen(true)}>
               <div className="w-full h-full rounded-full bg-surface border-2 border-transparent overflow-hidden">
                 {profile?.profilePicture ? (
                   <img src={profile.profilePicture} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.firstName || 'User'}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 )}
               </div>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-slate-400 font-medium">{t('nav.welcome')}</span>
               <span className="text-sm font-bold text-white leading-tight">{profile?.name || profile?.firstName || t('layout.defaultUser')}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Month selector */}
            <MonthSelector />

            <div 
              onClick={onOpenCoinStore}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 cursor-pointer hover:bg-amber-500/20 transition-all active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                $
              </div>
              <span className="text-sm font-black tracking-tight">{profile?.coins || 0}</span>
            </div>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Search size={20} />
            </button>
            <button 
              ref={bellButtonRef}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all relative" 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div ref={notificationsRef} className="absolute top-16 right-4 w-80 max-h-[400px] bg-[#0b1121] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-up">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-white text-sm">{t('layout.notifications')}</h3>
                    {notifications.length > 0 && (
                      <button onClick={onClearAll} className="text-[10px] font-bold text-slate-500 hover:text-danger uppercase tracking-widest transition-colors">{t('layout.clearAll')}</button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative ${!n.read ? 'bg-primary/5' : ''}`}
                          onClick={() => {
                            onNotificationAction(n);
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              n.type === 'ai' ? 'bg-primary/20 text-primary' : 
                              n.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {n.type === 'ai' ? <BrainCircuit size={16} /> : <Bell size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold text-white mb-0.5 ${!n.read ? 'pr-2' : ''}`}>{n.title}</p>
                              <p className="text-[11px] text-slate-400 leading-tight mb-1">{n.message}</p>
                              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                                {format(new Date(n.timestamp), "HH:mm '•' dd MMM", { locale: dateFnsLocale })}
                              </p>
                            </div>
                            {!n.read && (
                              <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Bell size={32} className="mx-auto text-slate-800 mb-2" />
                        <p className="text-slate-500 text-xs">{t('layout.noNotifications')}</p>
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
      </header>

      {/* Side Menu (Drawer) */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
          <div 
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-[#0b1121] z-50 p-6 shadow-2xl animate-slide-up border-r border-white/10"
            style={{ 
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
              paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1.5rem)',
              paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1.5rem)'
            }}
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2">
                <FinSaviorLogo className="w-12 h-12" />
                <h2 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tighter">FinSavior</h2>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div 
              onClick={() => { onOpenCoinStore?.(); setIsMenuOpen(false); }}
              className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-white">
                  $
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t('layout.coinBalance')}</span>
                  <span className="text-lg font-black text-white leading-none">{profile?.coins || 0}</span>
                </div>
              </div>
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/20 px-2 py-1 rounded-md">
                {t('layout.coinStore')}
              </div>
            </div>
            
            <nav className="space-y-2">
              <button 
                onClick={() => { setActiveTab('plans'); setIsMenuOpen(false); }}
                className="flex items-center gap-4 text-slate-300 hover:text-white w-full p-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <ShieldCheck size={20} /> 
                </div>
                <span className="font-medium">{t('layout.premiumPlans')}</span>
              </button>

              <button 
                onClick={() => { onOpenWhatsapp?.(); setIsMenuOpen(false); }}
                className="flex items-center gap-4 text-slate-300 hover:text-white w-full p-4 rounded-2xl hover:bg-white/5 transition-all group relative"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <MessageCircle size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t('layout.whatsapp')}</span>
                  {!profile?.isWhatsappEnabled && (
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter animate-pulse">{t('layout.configureNow')}</span>
                  )}
                </div>
                {!profile?.isWhatsappEnabled && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
              
              <button 
                onClick={() => { setActiveTab('categories'); setIsMenuOpen(false); }}
                className="flex items-center gap-4 text-slate-300 hover:text-white w-full p-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Tags size={20} />
                </div>
                <span className="font-medium">{t('nav.categories')}</span>
              </button>

              <button 
                onClick={() => { setActiveTab('account'); setIsMenuOpen(false); }}
                className="flex items-center gap-4 text-slate-300 hover:text-white w-full p-4 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <User size={20} />
                </div>
                <span className="font-medium">{t('nav.account')}</span>
              </button>

              <div className="h-px bg-white/10 my-6" />

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setActiveTab('support'); setIsMenuOpen(false); }}
                  className="flex items-center justify-center gap-3 text-slate-300 hover:text-white p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <HelpCircle size={20} className="text-primary group-hover:scale-110 transition-transform" /> 
                  <span className="font-medium">{t('nav.help')}</span>
                </button>

                <button 
                  onClick={() => { onLogout?.(); setIsMenuOpen(false); }}
                  className="flex items-center justify-center gap-3 text-danger/80 hover:text-danger p-4 rounded-2xl bg-danger/5 hover:bg-danger/10 transition-all group"
                >
                  <LogOut size={20} className="group-hover:scale-110 transition-transform" /> 
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-32 px-4 max-w-5xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

      {/* Floating Dock Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="glass-panel rounded-full p-2 flex justify-between items-center shadow-2xl shadow-primary/10 border border-white/10 backdrop-blur-2xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/40 -translate-y-2 scale-110' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={22} strokeWidth={2.5} />
              {activeTab === item.id && (
                <span className="absolute -bottom-6 text-[10px] font-bold tracking-wide text-primary animate-fade-in whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default Layout;

const MonthSelector: React.FC = () => {
  const { selectedMonth, prevMonth, nextMonth, displayLabel } = useMonth();

  return (
    <div className="flex items-center gap-2">
      {/* Desktop / tablet */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/30 border border-slate-700/40 text-slate-200">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-300">
          <ArrowLeft size={16} />
        </button>
        <div className="px-3 text-sm font-medium select-none">{displayLabel}</div>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-300">
          <ArrowLeft style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      {/* Mobile compact */}
      <div className="sm:hidden flex items-center gap-1">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300">
          <ArrowLeft size={16} />
        </button>
        <button onClick={() => alert(displayLabel)} className="px-2 py-1 text-xs rounded-md bg-slate-900/20 border border-slate-700/40 text-slate-200">
          {displayLabel.split(' ')[0].slice(0,3)}
        </button>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300">
          <ArrowLeft style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  );
};