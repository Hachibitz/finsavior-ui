export enum BillType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  SAVINGS = 'SAVINGS',
  PAYMENT = 'PAYMENT'
}

export type TransactionType = 'income' | 'expense';
export type FixedBillGenerationStrategy = 'YEARLY_UPFRONT' | 'MONTHLY_FIRST_DAY';

export interface BaseRecord {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO string
  purchaseDate?: string; // Real purchase/bill date (yyyy-MM-dd), independent of the billing month
}

export interface Transaction extends BaseRecord {
  category: string;
  type: TransactionType;
  isPaid?: boolean;
  isRecurrent?: boolean;
  fixedBillGenerationStrategy?: FixedBillGenerationStrategy;
  isInstallment?: boolean;
  installmentCount?: number;
  currentInstallment?: number;
  frequencyType?: 'SINGLE' | 'RECURRENT' | 'INSTALLMENT';
  billTable?: string;
  billType?: string | BillType;
  paymentType?: 'Total' | 'Parcial' | 'Mínimo' | null;
  cardId?: string;
  entryMethod?: 'MANUAL' | 'AUDIO' | 'AI_DOCUMENT';
}

export interface CreditCard {
  id: string;
  name: string; // e.g., "Nubank", "XP Infinite"
  last4Digits?: string;
  color: string; // Gradient or solid color class
  limit: number;
  dueDateStr: string; // e.g. "10"
}

// Corresponds to "Débitos" (Fixed/Recurring Expenses)
export interface Bill extends BaseRecord {
  isPaid: boolean;
  category: string;
  paymentType?: 'Total' | 'Parcial' | 'Mínimo' | null;
  cardId?: string;
  billTable?: string;
  billType?: string | BillType;
  isRecurrent?: boolean;
  fixedBillId?: number;
  fixedBillGenerationStrategy?: FixedBillGenerationStrategy;
  installments?: {
    current: number;
    total: number;
  };
}

// Corresponds to "Cartão" (Credit Card)
export interface CardTransaction extends BaseRecord {
  category: string;
  cardId: string; // Link to specific card
  paymentType?: string;
  installments?: {
    current: number;
    total: number;
  };
  billTable?: string;
  billType?: string | BillType;
}

// Corresponds to "Ativos" (Ativos/Income)
export interface Asset extends BaseRecord {
  type: 'salary' | 'savings' | 'investment' | 'other';
}

// Corresponds to "IA" Analysis
export interface AiAnalysis {
  id: string;
  userId: number;
  analysisType: number;
  resultAnalysis: string;
  date: string;
  startDate: string;
  finishDate: string;
  temperature: number;
}

export interface AiAdviceDTO {
  userId?: number | null;
  prompt?: string | null;
  planId?: string | null;
  analysisTypeId: number;
  temperature: number;
  startDate: string;
  finishDate: string;
  isUsingCoins: boolean;
}

export interface AiAdviceResponseDTO {
  id: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface AiBillExtractionDTO {
  billName?: string;
  billValue?: number;
  billDescription?: string;
  billCategory?: string;
  isInstallment?: boolean;
  installmentCount?: number;
  currentInstallment?: number;
  isRecurrent?: boolean;
  possibleDate?: string;
  redirectAction?: string;
}

export type DocumentType = 'BANK_STATEMENT' | 'CREDIT_CARD';
export type TableType = 'MAIN' | 'CARD';

export interface SummaryData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  forecastBalance: number;
  status: 'green' | 'yellow' | 'red';
}

export enum SubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  CANCELED_AT_PERIOD_END = 'CANCELED_AT_PERIOD_END',
  INACTIVE = 'INACTIVE',
  PAST_DUE = 'PAST_DUE'
}

export interface Plan {
  planId: string;
  planDs: string;
  subscriptionStatus?: SubscriptionStatusEnum;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  profilePicture?: string;
  plan: Plan;
  coins: number;
  phoneNumber?: string;
  isWhatsappEnabled?: boolean;
}

export interface EnableWhatsappRequest {
  isEnabled: boolean;
  phoneNumber: string;
}

export interface CheckoutSessionDTO {
  planType: string;
  url: string;
  email: string;
  clientSecret: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date
  category?: string;
}
