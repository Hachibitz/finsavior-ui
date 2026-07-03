import { Category, Bill, CardTransaction, Asset, AiAnalysis, CreditCard } from './types';
import { 
  ShoppingBag, Coffee, Home, Car, Utensils, Briefcase, Zap, HeartPulse, Gamepad2, Plane, Smartphone, GraduationCap, ShieldCheck
} from 'lucide-react';
import React from 'react';
import { SYSTEM_CATEGORY_IDS } from './utils/categoryLabel';

export { SYSTEM_CATEGORY_IDS };

const DEFAULT_CATEGORY_DEFS: Omit<Category, 'name'>[] = [
  { id: 'housing', icon: 'home', color: '#3b82f6' },
  { id: 'food', icon: 'utensils', color: '#f59e0b' },
  { id: 'energy', icon: 'zap', color: '#eab308' },
  { id: 'water', icon: 'coffee', color: '#06b6d4' },
  { id: 'internet', icon: 'smartphone', color: '#6366f1' },
  { id: 'transport', icon: 'car', color: '#ef4444' },
  { id: 'health', icon: 'heart-pulse', color: '#10b981' },
  { id: 'education', icon: 'graduation-cap', color: '#8b5cf6' },
  { id: 'personal_care', icon: 'heart-pulse', color: '#ec4899' },
  { id: 'entertainment', icon: 'gamepad-2', color: '#f97316' },
  { id: 'insurance', icon: 'shield-check', color: '#64748b' },
  { id: 'pets', icon: 'heart-pulse', color: '#f43f5e' },
  { id: 'subscriptions', icon: 'smartphone', color: '#4f46e5' },
  { id: 'shopping', icon: 'shopping-bag', color: '#db2777' },
  { id: 'services', icon: 'smartphone', color: '#6366f1' },
  { id: 'utilities', icon: 'zap', color: '#eab308' },
  { id: 'salary', icon: 'briefcase', color: '#16a34a' },
  { id: 'freelance', icon: 'briefcase', color: '#0d9488' },
  { id: 'projects', icon: 'briefcase', color: '#0891b2' },
  { id: 'investments', icon: 'zap', color: '#ca8a04' },
  { id: 'savings', icon: 'home', color: '#2563eb' },
  { id: 'others', icon: 'coffee', color: '#475569' },
];

/** Placeholder seed until `/categories` loads; display via getCategoryLabel(). */
export const DEFAULT_CATEGORIES: Category[] = DEFAULT_CATEGORY_DEFS.map((c) => ({
  ...c,
  name: c.id,
}));

export const AVAILABLE_ICONS = [
  'home', 'utensils', 'car', 'shopping-bag', 'gamepad-2', 'heart-pulse', 
  'graduation-cap', 'zap', 'briefcase', 'smartphone', 'coffee', 'plane'
];

export const AVAILABLE_COLORS = [
  '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#10b981', 
  '#6366f1', '#eab308', '#22c55e', '#64748b', '#06b6d4', '#f43f5e',
  '#f97316', '#0d9488', '#8b5cf6', '#db2777', '#0891b2', '#ca8a04'
];

export const getCategoryIcon = (iconName: string, size: number = 20) => {
  const props = { size, className: "text-white" };
  switch (iconName) {
    case 'home': return <Home {...props} />;
    case 'utensils': return <Utensils {...props} />;
    case 'car': return <Car {...props} />;
    case 'shopping-bag': return <ShoppingBag {...props} />;
    case 'gamepad-2': return <Gamepad2 {...props} />;
    case 'heart-pulse': return <HeartPulse {...props} />;
    case 'graduation-cap': return <GraduationCap {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'briefcase': return <Briefcase {...props} />;
    case 'smartphone': return <Smartphone {...props} />;
    case 'plane': return <Plane {...props} />;
    default: return <Coffee {...props} />;
  }
};

export const MOCK_BILLS: Bill[] = [
  { id: '1', amount: 1500.00, description: 'Feira Mensal', category: 'food', date: new Date().toISOString(), isPaid: true },
  { id: '2', amount: 496.02, description: 'Energia (Cosern)', category: 'utilities', date: new Date().toISOString(), isPaid: true },
  { id: '3', amount: 60.00, description: 'Água (Caern)', category: 'utilities', date: new Date().toISOString(), isPaid: true },
  { id: '4', amount: 100.00, description: 'Transporte Univ.', category: 'transport', date: new Date().toISOString(), isPaid: false },
  { id: '5', amount: 1850.00, description: 'Aluguel', category: 'housing', date: new Date().toISOString(), isPaid: true },
];

export const MOCK_CARDS: CreditCard[] = [
  { id: 'c1', name: 'Nubank Violeta', last4Digits: '8842', color: 'from-purple-700 via-purple-600 to-indigo-600', limit: 12500, dueDateStr: '10' },
  { id: 'c2', name: 'XP Visa Infinite', last4Digits: '1094', color: 'from-slate-900 via-slate-800 to-black', limit: 30000, dueDateStr: '25' }
];

export const MOCK_CARD_TRANSACTIONS: CardTransaction[] = [
  { id: '1', amount: 27.99, description: 'Globoplay', category: 'services', date: new Date().toISOString(), cardId: 'c1' },
  { id: '2', amount: 39.90, description: 'GymPass', category: 'health', date: new Date().toISOString(), cardId: 'c1' },
  { id: '3', amount: 24.43, description: 'HBO Max', category: 'services', date: new Date().toISOString(), cardId: 'c2' },
  { id: '4', amount: 55.90, description: 'Netflix', category: 'services', date: new Date().toISOString(), cardId: 'c1' },
  { id: '5', amount: 2285.00, description: 'Financiamento Creta', category: 'transport', date: new Date().toISOString(), installments: { current: 2, total: 31 }, cardId: 'c2' },
];

export const MOCK_ASSETS: Asset[] = [
  { id: '1', amount: 18500.00, description: 'Salário Mensal', date: new Date().toISOString(), type: 'salary' },
  { id: '2', amount: 20000.00, description: 'Reserva de Emergência', date: new Date().toISOString(), type: 'savings' },
];

export const MOCK_AI_ANALYSES: AiAnalysis[] = [
  { 
    id: '1', 
    userId: 1,
    analysisType: 1,
    resultAnalysis: `### Análise Mensal
1. **Renda Fixa Sólida**: Você possui uma renda mensal estável, o que é ótimo para planejamento.
2. **Custos Fixos Altos**: Seus gastos com moradia e financiamento representam mais de 40% da renda. Atenção!
3. **Pequenos Gastos**: Assinaturas de streaming somadas dão quase R$ 150,00. Vale a pena revisar?`,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    finishDate: new Date().toISOString(),
    temperature: 0.7
  },
  { 
    id: '2', 
    userId: 1,
    analysisType: 1,
    resultAnalysis: 'Análise anterior focada em redução de custos de energia.',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    startDate: new Date(Date.now() - 86400000 * 40).toISOString(),
    finishDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    temperature: 0.7
  }
];