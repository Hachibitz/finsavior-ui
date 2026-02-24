import { Category, Bill, CardTransaction, Asset, AiAnalysis, CreditCard } from './types';
import { 
  ShoppingBag, Coffee, Home, Car, Utensils, Briefcase, Zap, HeartPulse, Gamepad2, Plane, Smartphone, GraduationCap, ShieldCheck
} from 'lucide-react';
import React from 'react';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: 'housing', name: 'Moradia', icon: 'home', color: '#3b82f6' },
  { id: 'food', name: 'Alimentação', icon: 'utensils', color: '#f59e0b' },
  { id: 'energy', name: 'Energia', icon: 'zap', color: '#eab308' },
  { id: 'water', name: 'Água', icon: 'coffee', color: '#06b6d4' },
  { id: 'internet', name: 'Internet', icon: 'smartphone', color: '#6366f1' },
  { id: 'transport', name: 'Transporte', icon: 'car', color: '#ef4444' },
  { id: 'health', name: 'Saúde', icon: 'heart-pulse', color: '#10b981' },
  { id: 'education', name: 'Educação', icon: 'graduation-cap', color: '#8b5cf6' },
  { id: 'personal_care', name: 'Cuidados Pessoais', icon: 'heart-pulse', color: '#ec4899' },
  { id: 'entertainment', name: 'Lazer', icon: 'gamepad-2', color: '#8b5cf6' },
  { id: 'insurance', name: 'Seguro', icon: 'shield-check', color: '#64748b' },
  { id: 'pets', name: 'Pets', icon: 'heart-pulse', color: '#f43f5e' },
  { id: 'subscriptions', name: 'Assinaturas', icon: 'smartphone', color: '#6366f1' },
  { id: 'shopping', name: 'Compras', icon: 'shopping-bag', color: '#ec4899' },
  
  // Income
  { id: 'salary', name: 'Salário', icon: 'briefcase', color: '#22c55e' },
  { id: 'freelance', name: 'Freelance', icon: 'briefcase', color: '#10b981' },
  { id: 'projects', name: 'Projetos', icon: 'briefcase', color: '#06b6d4' },
  { id: 'investments', name: 'Investimentos', icon: 'zap', color: '#eab308' },
  { id: 'savings', name: 'Poupança', icon: 'home', color: '#3b82f6' },
  
  { id: 'others', name: 'Outras', icon: 'coffee', color: '#64748b' },
];

export const AVAILABLE_ICONS = [
  'home', 'utensils', 'car', 'shopping-bag', 'gamepad-2', 'heart-pulse', 
  'graduation-cap', 'zap', 'briefcase', 'smartphone', 'coffee', 'plane'
];

export const AVAILABLE_COLORS = [
  '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#10b981', 
  '#6366f1', '#eab308', '#22c55e', '#64748b', '#06b6d4', '#f43f5e'
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