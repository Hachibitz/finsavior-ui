import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import DebitsView from './components/DebitsView';
import CardsView from './components/CardsView';
import AssetsView from './components/AssetsView';
import SummaryView from './components/SummaryView';
import GoalsView from './components/GoalsView';
import AiAdvisorView from './components/AiAdvisorView';
import PlansView from './components/PlansView';
import CategoriesView from './components/CategoriesView';
import AccountView from './components/AccountView';
import SupportView from './components/SupportView';
import CoinStoreModal from './components/CoinStoreModal';
import UpsellModal from './components/UpsellModal';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import RegisterView from './components/RegisterView';
import TransactionForm from './components/TransactionForm';
import ConfirmationModal from './components/ConfirmationModal';
import VoiceFab from './components/VoiceFab';
import { MOCK_BILLS, MOCK_CARD_TRANSACTIONS, MOCK_ASSETS, DEFAULT_CATEGORIES, MOCK_CARDS } from './constants';
import { Bill, CardTransaction, Asset, SummaryData, Category, CreditCard, UserProfile, Transaction } from './types';
import { authService } from './services/authService';
import { googleAuthService } from './services/googleAuthService';
import { billService } from './services/billService';
import { cardService } from './services/cardService';
import { aiAdviceService } from './services/aiAdviceService';
import { coinService } from './services/coinService';
import { categoryService } from './services/categoryService';
import { api } from './services/api';
import MonthContext from './contexts/MonthContext';
import { useToast } from './contexts/ToastContext';
import { Notification } from './types/notifications';
import { admobService } from './services/admobService';

const App: React.FC = () => {
  const INSUFFICIENT_DATA_MESSAGE = 'Adicione pelo menos uma receita e uma despesa para que a Savi possa analisar seu perfil financeiro e dar dicas personalizadas!';

  // Onboarding logic: show only once per session
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !sessionStorage.getItem('onboarding_shown');
  });

  const handleOnboardingComplete = () => {
    sessionStorage.setItem('onboarding_shown', 'true');
    setShowOnboarding(false);
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPublicSupport, setShowPublicSupport] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCoinStoreOpen, setIsCoinStoreOpen] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [formForcedType, setFormForcedType] = useState<'income' | 'expense' | undefined>(undefined);
  const [isAssetEditModalOpen, setIsAssetEditModalOpen] = useState(false);
  const [isAssetDeleteConfirmOpen, setIsAssetDeleteConfirmOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditBillModalOpen, setIsEditBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [voiceBillData, setVoiceBillData] = useState<Partial<Transaction> | null>(null);
  
  // Data State
  const [bills, setBills] = useState<Bill[]>([]);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [lastAnalyzedBalance, setLastAnalyzedBalance] = useState<Record<string, number>>({});
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [lastInterstitialTime, setLastInterstitialTime] = useState<number>(Date.now());

  // Interstitial logic: show every 5 minutes on tab change for FREE users
  useEffect(() => {
    if (!isLoggedIn || !profile || profile.plan?.planId !== 'FREE') return;

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - lastInterstitialTime >= fiveMinutes) {
      admobService.showSimpleInterstitial().then(() => {
        setLastInterstitialTime(Date.now());
      }).catch(err => {
        console.error('Failed to show interstitial:', err);
      });
    }
  }, [activeTab, isLoggedIn, profile]);
  // Month selection (YYYY-MM)
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);

  const changeMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const prevMonth = () => changeMonth(-1);
  const nextMonth = () => changeMonth(1);

  const displayLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  })();
  
  // Navigation & Modal State from Notifications
  const [insightModalOpen, setInsightModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const { showToast } = useToast();

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Show toast for the notification
    showToast(notif.message, notif.type === 'error' ? 'error' : 'success');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationAction = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if (notification.actionUrl === 'summary' && notification.actionData?.openInsight) {
      setActiveTab('summary');
      setInsightModalOpen(true);
    } else if (notification.actionUrl === 'ai' && notification.actionData?.reportId) {
      setActiveTab('ai');
      setSelectedReportId(notification.actionData.reportId);
    } else if (notification.actionUrl) {
      setActiveTab(notification.actionUrl);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await authService.isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileData, coinsBalance] = await Promise.all([
        api.get<any>('/user/get-profile-data'),
        coinService.getBalance()
      ]);
      
      // Format profile picture if it exists
      if (profileData.profilePicture && !profileData.profilePicture.startsWith('data:')) {
        profileData.profilePicture = `data:image/png;base64,${profileData.profilePicture}`;
      }
      
      setProfile({ ...profileData, coins: coinsBalance });
    } catch (error) {
      console.error('Error fetching profile or coins:', error);
    }
  };

  useEffect(() => {
    const handleNavigate = () => setActiveTab('plans');
    window.addEventListener('navigate-to-plans', handleNavigate);
    return () => window.removeEventListener('navigate-to-plans', handleNavigate);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchCards();
      // Show upsell modal after a short delay if logged in and not recently closed
      const timer = setTimeout(() => {
        const closedAt = sessionStorage.getItem('upsell_modal_closed_at');
        const tenMinutes = 10 * 60 * 1000;
        const shouldShow = !closedAt || (Date.now() - parseInt(closedAt, 10)) >= tenMinutes;
        
        if (shouldShow) {
          setIsUpsellOpen(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const fetchBills = async () => {
    try {
      const date = `${selectedMonth}-01`;
      const data = await billService.getBills(date);
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchCardTransactions = async () => {
    try {
      const date = `${selectedMonth}-01`;
      const data = await billService.getCardBills(date);
      setCardTransactions(data);
    } catch (error) {
      console.error('Error fetching card transactions:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const date = `${selectedMonth}-01`;
      const data = await billService.getAssetsBills(date);
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchCards = async () => {
    try {
      const data = await cardService.getCards();
      if (data.length === 0) {
        // Create default card if none exist
        const defaultCard = await cardService.createCard({
          name: 'Principal',
          color: 'from-slate-800 to-slate-900',
          limit: 0,
          dueDateStr: '10'
        });
        setCards([defaultCard]);
      } else {
        setCards(data);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  // Helper to derive YYYY-MM from various backend date formats
  const billDateToYYYYMM = (dateStr?: string) => {
    if (!dateStr) return null;
    // ISO-like yyyy-mm or yyyy-mm-dd
    const iso = dateStr.match(/^(\d{4})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}`;

    // Format like 'Feb 2026' or 'Feb2026'
    const mon = dateStr.match(/([A-Za-z]{3,})\s*(\d{4})/);
    if (mon) {
      const m = mon[1].slice(0,3).toLowerCase();
      const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      const mm = months[m] || '01';
      return `${mon[2]}-${mm}`;
    }

    // Fallback: try native Date parse
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return null;
  };

  // Filter data by selected month for views and analytics (robust across formats)
  const filteredBills = bills.filter(b => billDateToYYYYMM(b.date) === selectedMonth);
  const filteredCardTransactions = cardTransactions.filter(t => billDateToYYYYMM(t.date) === selectedMonth);
  const filteredAssets = assets.filter(a => billDateToYYYYMM(a.date) === selectedMonth);

  const summary: SummaryData = useMemo(() => {
    const totalIncome = filteredAssets.reduce((acc, a) => acc + a.amount, 0);
    const totalExpense = filteredBills.reduce((acc, b) => acc + b.amount, 0) + 
                         filteredCardTransactions.reduce((acc, t) => acc + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense,
      forecastBalance: totalIncome - totalExpense,
      status: 'yellow'
    };
  }, [filteredBills, filteredCardTransactions, filteredAssets]);

  const fetchInsight = async (month: string, force: boolean = false) => {
    if (!isLoggedIn) return;
    
    // Calculate current forecast balance (foreseenBalance)
    const currentIncome = filteredAssets.reduce((acc, a) => acc + a.amount, 0);
    const currentExpense = filteredBills.reduce((acc, b) => acc + b.amount, 0) + 
                           filteredCardTransactions.reduce((acc, t) => acc + t.amount, 0);
    const currentForecast = currentIncome - currentExpense;

    if (!force && aiInsights[month]) {
      // Check for 10% change in forecast balance
      const lastBalance = lastAnalyzedBalance[month];
      if (lastBalance !== undefined) {
        const change = Math.abs(currentForecast - lastBalance) / (Math.abs(lastBalance) || 1);
        
        if (change < 0.1) {
          return; // Change is too small, skip
        }
      } else {
        return; // We have insight but no last balance, skip
      }
    }
    
    setLoadingInsight(true);
    try {
      // Check if user has sufficient data before calling AI
      const hasIncome = filteredAssets.length > 0;
      const hasExpense = filteredBills.length > 0 || filteredCardTransactions.length > 0;

      if (!hasIncome || !hasExpense) {
        setAiInsights(prev => ({ ...prev, [month]: INSUFFICIENT_DATA_MESSAGE }));
        setLoadingInsight(false);
        return;
      }

      const insight = await aiAdviceService.getQuickInsight(month);
      setAiInsights(prev => ({ ...prev, [month]: insight }));
      setLastAnalyzedBalance(prev => ({ ...prev, [month]: currentForecast }));
      
      // Notify about new insight
      addNotification({
        title: 'Novo Savi Insight!',
        message: `Savi gerou uma nova análise para ${month}. Confira no seu dashboard.`,
        type: 'ai',
        actionUrl: 'summary',
        actionData: { openInsight: true }
      });
    } catch (error) {
      console.error('Error fetching insight:', error);
      if (!aiInsights[month]) {
        setAiInsights(prev => ({ ...prev, [month]: 'Mantenha o foco nos seus objetivos financeiros!' }));
      }
    } finally {
      setLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      setDataLoaded(false);
      try {
        const [billsResult, cardResult, assetsResult, categoriesResult] = await Promise.allSettled([
          billService.getBills(selectedMonth),
          billService.getCardBills(selectedMonth),
          billService.getAssetsBills(selectedMonth),
          categoryService.getCategories()
        ]);
        
        if (billsResult.status === 'fulfilled') setBills(billsResult.value);
        if (cardResult.status === 'fulfilled') setCardTransactions(cardResult.value);
        if (assetsResult.status === 'fulfilled') setAssets(assetsResult.value);
        if (categoriesResult.status === 'fulfilled' && categoriesResult.value.length > 0) {
          setCategories(categoriesResult.value);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setDataLoaded(true);
      }
    };
    loadData();
  }, [isLoggedIn, selectedMonth]);

  // Handle automatic insight fetching/updating
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'summary' || !dataLoaded) return;

    const currentIncome = filteredAssets.reduce((acc, a) => acc + a.amount, 0);
    const currentExpense = filteredBills.reduce((acc, b) => acc + b.amount, 0) + 
                           filteredCardTransactions.reduce((acc, t) => acc + t.amount, 0);
    const currentForecast = currentIncome - currentExpense;

    const lastBalance = lastAnalyzedBalance[selectedMonth];
    const currentInsight = aiInsights[selectedMonth];
    const isInsufficient = currentInsight === INSUFFICIENT_DATA_MESSAGE;
    
    const hasIncome = currentIncome > 0;
    const hasExpense = currentExpense > 0;
    const hasSufficientData = hasIncome && hasExpense;

    if (!currentInsight || isInsufficient) {
      if (hasSufficientData) {
        fetchInsight(selectedMonth);
      } else if (!isInsufficient) {
        setAiInsights(prev => ({ ...prev, [selectedMonth]: INSUFFICIENT_DATA_MESSAGE }));
      }
    } else if (lastBalance !== undefined && hasSufficientData) {
      const change = Math.abs(currentForecast - lastBalance) / (Math.abs(lastBalance) || 1);
      
      if (change >= 0.1) {
        fetchInsight(selectedMonth, true);
      }
    }
  }, [activeTab, isLoggedIn, selectedMonth, dataLoaded, filteredBills.length, filteredAssets.length, filteredCardTransactions.length, 
      summary.totalIncome, summary.totalExpense, summary.forecastBalance]);

  // Category Logic
  const handleAddCategory = async (newCategory: Omit<Category, 'id'>) => {
    try {
      const saved = await categoryService.createCategory(newCategory);
      setCategories(prev => [...prev, saved]);
      showToast('Categoria adicionada!', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      showToast('Erro ao adicionar categoria', 'error');
    }
  };

  const handleEditCategory = async (updatedCategory: Category) => {
    try {
      const saved = await categoryService.updateCategory(updatedCategory);
      setCategories(prev => prev.map(c => c.id === saved.id ? saved : c));
      showToast('Categoria atualizada!', 'success');
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('Erro ao atualizar categoria', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Categoria excluída!', 'success');
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Erro ao excluir categoria', 'error');
    }
  };

  // Debits Logic
  const handleEditBillClick = (bill: Bill) => {
    setSelectedBill(bill);
    setIsEditBillModalOpen(true);
  };

  const handleEditBill = async (updatedBill: Bill): Promise<Bill> => {
    try {
      const saved = await billService.updateBill(updatedBill);
      setBills(prev => prev.map(b => b.id === saved.id ? saved : b));
      showToast('Conta atualizada!', 'success');
      return saved;
    } catch (error: any) {
      console.error('Error updating bill:', error);
      showToast(error?.message || 'Erro ao atualizar conta', 'error');
      throw error;
    }
  };

  const handleDeleteBill = async (id: string, deleteAll: boolean = false) => {
    try {
      await billService.deleteBill(id, deleteAll);
      if (deleteAll) {
        fetchBills();
      } else {
        setBills(bills.filter(b => b.id !== id));
      }
      showToast(deleteAll ? 'Todas as parcelas foram excluídas!' : 'Conta excluída!', 'success');
    } catch (error) {
      console.error('Error deleting bill:', error);
      showToast('Erro ao excluir conta', 'error');
    }
  };

  // Cards Logic
  const handleAddCard = async (newCard: Omit<CreditCard, 'id'>) => {
    try {
      const saved = await cardService.createCard(newCard);
      setCards(prev => [...prev, saved]);
      showToast('Cartão adicionado!', 'success');
    } catch (error) {
      console.error('Error adding card:', error);
      showToast('Erro ao adicionar cartão', 'error');
    }
  };

  const handleEditCard = async (updatedCard: CreditCard) => {
    try {
      const saved = await cardService.updateCard(updatedCard);
      setCards(prev => prev.map(c => c.id === saved.id ? saved : c));
      showToast('Cartão atualizado!', 'success');
    } catch (error) {
      console.error('Error updating card:', error);
      showToast('Erro ao atualizar cartão', 'error');
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await cardService.deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
      showToast('Cartão excluído!', 'success');
    } catch (error) {
      console.error('Error deleting card:', error);
      showToast('Erro ao excluir cartão', 'error');
    }
  };

  const handleAddCardTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    try {
      const saved = await billService.createBill(newTransaction, (newTransaction.billTable as any) || 'CREDIT_CARD', (newTransaction.billType as any) || 'EXPENSE');
      if (newTransaction.billTable === 'PAYMENT_CARD') {
        fetchBills(); // Refresh bills if it's a payment
        showToast('Pagamento registrado!', 'success');
      } else {
        setCardTransactions([saved as any, ...cardTransactions]);
        showToast('Transação adicionada!', 'success');
      }
    } catch (error: any) {
      console.error('Error adding card transaction:', error);
      showToast(error?.message || 'Erro ao adicionar transação', 'error');
    }
  };

  const handleEditCardTransaction = async (updatedTransaction: Transaction) => {
    try {
      const saved = await billService.updateBill({
        ...updatedTransaction,
        billTable: 'CREDIT_CARD',
        billType: 'EXPENSE'
      } as any);
      setCardTransactions(prev => prev.map(t => t.id === saved.id ? saved as any : t));
      showToast('Transação atualizada!', 'success');
    } catch (error: any) {
      console.error('Error updating card transaction:', error);
      showToast(error?.message || 'Erro ao atualizar transação', 'error');
    }
  };

  const handleDeleteCardTransaction = async (id: string, deleteAll: boolean = false) => {
    try {
      await billService.deleteBill(id, deleteAll);
      if (deleteAll) {
        fetchCardTransactions();
      } else {
        setCardTransactions(prev => prev.filter(t => t.id !== id));
      }
      showToast(deleteAll ? 'Todas as parcelas foram excluídas!' : 'Transação excluída!', 'success');
    } catch (error) {
      console.error('Error deleting card transaction:', error);
      showToast('Erro ao excluir transação', 'error');
    }
  };

  // Assets Logic
  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetEditModalOpen(true);
  };

  const handleUpdateAsset = async (data: Omit<Transaction, 'id'>) => {
    try {
      if (!selectedAsset) return;
      const saved = await billService.updateBill({
        ...data,
        id: selectedAsset.id,
        billTable: 'ASSETS',
        billType: 'INCOME'
      } as any);
      
      const updatedAsset: Asset = {
        id: saved.id,
        amount: saved.amount,
        description: saved.description,
        date: saved.date,
        type: (saved.category === 'others' ? 'other' : saved.category) as any
      };
      
      setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
      showToast('Renda atualizada!', 'success');
      setIsAssetEditModalOpen(false);
      setSelectedAsset(null);
    } catch (error: any) {
      console.error('Error updating asset:', error);
      showToast(error?.message || 'Erro ao atualizar renda', 'error');
    }
  };

  const handleDeleteAsset = (id: string) => {
    const asset = assets.find(a => a.id === id);
    if (asset) {
      setSelectedAsset(asset);
      setIsAssetDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteAsset = async () => {
    try {
      if (!selectedAsset) return;
      await billService.deleteBill(selectedAsset.id);
      setAssets(prev => prev.filter(a => a.id !== selectedAsset.id));
      showToast('Renda excluída!', 'success');
      setIsAssetDeleteConfirmOpen(false);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Error deleting asset:', error);
      showToast('Erro ao excluir renda', 'error');
    }
  };

  const handleImportInvoice = (file: File) => {
    // Mock import logic
    showToast(`Importando arquivo: ${file.name}. Processamento de IA iniciado...`, 'success');
    // In a real app, this would send file to backend
  };

  const handleLogout = () => {
    googleAuthService.logout();
    setIsLoggedIn(false);
    setProfile(null);
    setBills([]);
    sessionStorage.removeItem('summary_banner_closed');
    sessionStorage.removeItem('cards_banner_closed');
    sessionStorage.removeItem('onboarding_shown');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'debits':
        return (
            <DebitsView 
                bills={filteredBills} 
                onAdd={() => { setFormForcedType('expense'); setIsFormOpen(true); }} 
                onDelete={handleDeleteBill}
                onEdit={handleEditBill}
                onEditClick={handleEditBillClick}
                categories={categories} 
                onRefresh={fetchBills}
                onRefreshCoins={fetchProfile}
                onNavigateToPlans={() => setActiveTab('plans')}
            />
        );
      case 'cards':
        return (
            <CardsView 
                transactions={filteredCardTransactions} 
                bills={filteredBills}
                cards={cards}
                categories={categories} 
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onAddTransaction={handleAddCardTransaction}
                onEditTransaction={handleEditCardTransaction}
                onDeleteTransaction={handleDeleteCardTransaction}
                onImportInvoice={handleImportInvoice}
                onRefresh={() => { fetchBills(); fetchCardTransactions(); }}
                onRefreshCoins={fetchProfile}
                onNavigateToPlans={() => setActiveTab('plans')}
                profile={profile}
                selectedMonth={selectedMonth}
            />
        );
      case 'assets':
        return (
          <AssetsView 
            assets={assets} 
            onAdd={() => { setFormForcedType('income'); setIsFormOpen(true); }} 
            onEdit={handleEditAsset}
            onDelete={handleDeleteAsset}
            onRefresh={fetchAssets}
            onRefreshCoins={fetchProfile}
            onNavigateToPlans={() => setActiveTab('plans')}
          />
        );
      case 'summary':
        return (
          <SummaryView 
            summary={summary} 
            bills={filteredBills} 
            assets={filteredAssets} 
            cardTransactions={filteredCardTransactions}
            categories={categories}
            selectedMonth={selectedMonth}
            aiTip={aiInsights[selectedMonth]}
            loadingTip={loadingInsight}
            onRefreshInsight={() => fetchInsight(selectedMonth, true)}
            onAddNotification={addNotification}
            initialInsightOpen={insightModalOpen}
            onCloseInsight={() => setInsightModalOpen(false)}
            profile={profile}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'ai':
        return (
          <AiAdvisorView 
            bills={filteredBills} 
            transactions={filteredCardTransactions} 
            assets={filteredAssets}
            initialReportId={selectedReportId}
            onCloseReport={() => setSelectedReportId(null)}
            profile={profile}
            selectedMonth={selectedMonth}
            onRefreshCoins={fetchProfile}
          />
        );
      case 'goals':
        return (
          <GoalsView 
            profile={profile} 
            onRefreshCoins={fetchProfile}
            onNavigateToPlans={() => setActiveTab('plans')}
          />
        );
      case 'plans':
        return <PlansView profile={profile} />;
      case 'categories':
        return (
          <CategoriesView 
            categories={categories}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        );
      case 'account':
        return (
          <AccountView 
            profile={profile}
            onRefreshProfile={fetchProfile}
            onNavigateToPlans={() => setActiveTab('plans')}
          />
        );
      case 'support':
        return (
          <SupportView 
            profile={profile}
            onBack={() => setActiveTab('summary')}
          />
        );
      default:
        return (
          <SummaryView 
            summary={summary} 
            bills={filteredBills} 
            assets={filteredAssets} 
            cardTransactions={filteredCardTransactions}
            categories={categories}
            selectedMonth={selectedMonth}
            aiTip={aiInsights[selectedMonth]}
            loadingTip={loadingInsight}
            onRefreshInsight={() => fetchInsight(selectedMonth, true)}
            profile={profile}
          />
        );
    }
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <RegisterView 
          onBackToLogin={() => setShowRegister(false)} 
          onRegisterSuccess={() => setShowRegister(false)} 
        />
      );
    }
    if (showPublicSupport) {
      return (
        <div className="min-h-screen bg-background p-4 pt-12">
          <SupportView 
            profile={null} 
            onBack={() => setShowPublicSupport(false)} 
          />
        </div>
      );
    }
    return (
      <Login 
        onLoginSuccess={() => setIsLoggedIn(true)} 
        onOpenSupport={() => setShowPublicSupport(true)} 
        onNavigateToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <>
      <MonthContext.Provider value={{ selectedMonth, setSelectedMonth, prevMonth, nextMonth, displayLabel }}>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          profile={profile} 
          onLogout={handleLogout}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markNotificationAsRead}
          onClearAll={clearNotifications}
          onNotificationAction={handleNotificationAction}
          onOpenCoinStore={() => setIsCoinStoreOpen(true)}
        >
          {renderContent()}
        </Layout>
      </MonthContext.Provider>

      <CoinStoreModal 
        isOpen={isCoinStoreOpen}
        onClose={() => setIsCoinStoreOpen(false)}
        currentCoins={profile?.coins || 0}
        onRefreshCoins={fetchProfile}
      />

      <UpsellModal 
        isOpen={isUpsellOpen}
        onClose={() => {
          setIsUpsellOpen(false);
          sessionStorage.setItem('upsell_modal_closed_at', Date.now().toString());
        }}
        onNavigateToPlans={() => setActiveTab('plans')}
        profile={profile}
      />

      {/* Reusing the transaction form for now, customized for the active tab context in future iterations */}
      <TransactionForm 
        isOpen={isFormOpen}
        onClose={() => { 
          setIsFormOpen(false); 
          setFormForcedType(undefined); 
          setVoiceBillData(null);
        }}
        forcedType={formForcedType}
        initialData={voiceBillData || undefined}
        selectedMonth={selectedMonth}
        onSubmit={async (data) => {
          try {
            const isIncome = data.type === 'income';
            const table = (data.billTable as any) || (isIncome ? 'ASSETS' : 'MAIN');
            const type = isIncome ? 'INCOME' : (table === 'PAYMENT_CARD' ? 'PAYMENT' : 'EXPENSE');

            const newRecord = await billService.createBill({
              ...data,
              isPaid: isIncome // Income is usually "received"
            }, table, type);

            if (isIncome) {
              const newAsset = { 
                ...newRecord, 
                type: (newRecord.category === 'others' ? 'other' : newRecord.category) as any
              };
              setAssets([newAsset, ...assets]);
              if (showToast) showToast('Renda adicionada!', 'success');
            } else {
              setBills([newRecord, ...bills]);
              if (showToast) showToast('Registro adicionado!', 'success');
            }
            
            setIsFormOpen(false);
            setFormForcedType(undefined);
            setVoiceBillData(null);
          } catch (error: any) {
            (showToast || (() => {}))(error?.message || 'Erro ao criar registro', 'error');
          }
        }}
        categories={categories.filter(cat => {
          const incomeIds = ['salary', 'freelance', 'projects', 'investments', 'savings'];
          const isIncomeForm = formForcedType === 'income';
          if (isIncomeForm) return incomeIds.includes(cat.id) || cat.id === 'others';
          // Allow investments in expenses too
          return !incomeIds.includes(cat.id) || cat.id === 'others' || cat.id === 'investments';
        })}
        cards={cards}
      />

      <TransactionForm 
        isOpen={isAssetEditModalOpen}
        onClose={() => {
          setIsAssetEditModalOpen(false);
          setSelectedAsset(null);
        }}
        selectedMonth={selectedMonth}
        onSubmit={handleUpdateAsset}
        categories={categories.filter(cat => ['salary', 'freelance', 'projects', 'investments', 'savings', 'others'].includes(cat.id))}
        forcedType="income"
        initialData={selectedAsset ? {
          description: selectedAsset.description,
          amount: selectedAsset.amount,
          date: selectedAsset.date,
          type: 'income',
          category: selectedAsset.type === 'other' ? 'others' : selectedAsset.type
        } : undefined}
      />

      <TransactionForm 
        isOpen={isEditBillModalOpen}
        onClose={() => {
          setIsEditBillModalOpen(false);
          setSelectedBill(null);
        }}
        selectedMonth={selectedMonth}
        onSubmit={async (data) => {
          if (selectedBill) {
            await handleEditBill({ ...selectedBill, ...data } as Bill);
          }
          setIsEditBillModalOpen(false);
          setSelectedBill(null);
        }}
        categories={categories.filter(cat => !['salary', 'freelance', 'projects', 'investments', 'savings'].includes(cat.id) || cat.id === 'investments')}
        forcedType="expense"
        initialData={selectedBill ? {
          description: selectedBill.description,
          amount: selectedBill.amount,
          date: selectedBill.date,
          category: selectedBill.category,
          type: 'expense'
        } : undefined}
      />

      <ConfirmationModal 
        isOpen={isAssetDeleteConfirmOpen}
        onClose={() => {
          setIsAssetDeleteConfirmOpen(false);
          setSelectedAsset(null);
        }}
        onConfirm={confirmDeleteAsset}
        title="Excluir Renda"
        message={`Tem certeza que deseja excluir a renda "${selectedAsset?.description}"? Esta ação não pode ser desfeita.`}
      />

      {['debits', 'cards', 'assets', 'summary'].includes(activeTab) && (
        <VoiceFab 
          mode="BILL" 
          tableType={
            activeTab === 'cards' ? 'CARD' : 
            activeTab === 'assets' ? 'ASSETS' : 
            'MAIN'
          }
          onBillDetected={(data) => {
            console.log('Voice bill detected:', data);
            
            // Map backend DTO to Transaction type
            const mappedData: Partial<Transaction> = {
              description: data.billName || '',
              amount: data.billValue || 0,
              category: data.billCategory?.toLowerCase() || '',
              date: data.possibleDate 
                ? data.possibleDate.split('/').reverse().join('-') 
                : (selectedMonth ? `${selectedMonth}-${new Date().getFullYear() === parseInt(selectedMonth.split('-')[0]) && (new Date().getMonth() + 1) === parseInt(selectedMonth.split('-')[1]) ? String(new Date().getDate()).padStart(2, '0') : '01'}` : new Date().toISOString().split('T')[0]),
              type: data.billTable === 'ASSETS' ? 'income' : 'expense',
              isInstallment: data.isInstallment || false,
              installmentCount: data.installmentCount || undefined,
              currentInstallment: data.currentInstallment || 1,
              isRecurrent: data.isRecurrent || false,
              billTable: data.billTable || 'MAIN'
            };

            setVoiceBillData(mappedData);
            // Don't force type if we want user to be able to change it, 
            // but set it as initial
            setFormForcedType(undefined); 
            setIsFormOpen(true);
            
            showToast(`Registro "${data.billName}" detectado! Verifique os dados.`, 'success');
            fetchBills();
            fetchAssets();
            fetchCardTransactions();
            fetchProfile();
          }}
          onNavigateToPlans={() => setActiveTab('plans')}
          onRefreshCoins={fetchProfile}
        />
      )}
    </>
  );
};

export default App;