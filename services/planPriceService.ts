import { api } from './api';

export interface PlanDisplayPrice {
  id?: number;
  planTier: 'FREE' | 'BASIC' | 'PLUS' | 'PREMIUM' | string;
  billingCycle: 'MONTHLY' | 'ANNUAL' | string;
  currency: string;
  amount: number;
  provider?: string;
  source?: string;
  externalPriceId?: string | null;
  lastSyncedAt?: string | null;
}

export interface PlanPricesResponse {
  currency: string;
  prices: PlanDisplayPrice[];
  provider?: string;
  source?: 'PROVIDER_LIVE' | 'PROVIDER_CACHE' | 'MANUAL' | 'UNAVAILABLE' | string;
  lastSyncedAt?: string | null;
}

export const planPriceService = {
  async getDisplayPrices(currency?: string, provider?: 'STRIPE' | 'GOOGLE_PLAY'): Promise<PlanPricesResponse> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (provider) params.set('provider', provider);
    const qs = params.toString();
    return api.get<PlanPricesResponse>(`/plans/display-prices${qs ? `?${qs}` : ''}`);
  },

  async syncProviders(): Promise<Record<string, number>> {
    return api.post<Record<string, number>>('/admin/plan-prices/sync', {});
  },

  async listAllAdmin(): Promise<PlanDisplayPrice[]> {
    return api.get<PlanDisplayPrice[]>('/admin/plan-prices');
  },

  async upsert(price: Omit<PlanDisplayPrice, 'id'> & { id?: number }): Promise<PlanDisplayPrice> {
    return api.post<PlanDisplayPrice>('/admin/plan-prices', price);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/plan-prices/${id}`);
  },
};

/** Maps app locale → preferred ISO currency for display-price lookup. */
export function preferredCurrencyFromLocale(locale: string): string {
  const normalized = (locale || 'pt-BR').replace('_', '-').toLowerCase();
  const region = normalized.includes('-') ? normalized.split('-')[1] : '';
  switch (region) {
    case 'br': return 'BRL';
    case 'us': return 'USD';
    case 'gb': return 'GBP';
    case 'mx': return 'MXN';
    case 'jp': return 'JPY';
    case 'kr': return 'KRW';
    case 'cn': return 'CNY';
    case 'in': return 'INR';
    case 'id': return 'IDR';
  }
  if (normalized.startsWith('pt')) return 'BRL';
  if (normalized.startsWith('en')) return 'USD';
  if (normalized.startsWith('ja')) return 'JPY';
  if (normalized.startsWith('ko')) return 'KRW';
  if (normalized.startsWith('zh')) return 'CNY';
  if (normalized.startsWith('hi')) return 'INR';
  if (normalized.startsWith('id')) return 'IDR';
  if (
    normalized.startsWith('es') ||
    normalized.startsWith('fr') ||
    normalized.startsWith('de') ||
    normalized.startsWith('it')
  ) {
    return 'EUR';
  }
  return 'USD';
}
