import { api } from './api';

export const coinService = {
  getBalance: async (): Promise<number> => {
    try {
      // Correct endpoint based on backend controller: /fscoin/balance
      const response = await api.get<number>('/fscoin/balance');
      return response || 0;
    } catch (error) {
      console.error('Failed to fetch coins from /fscoin/balance', error);
      return 0;
    }
  },
  
  earnCoins: async (): Promise<number> => {
    try {
      // Correct endpoint based on backend controller: /fscoin/earn
      return await api.post<number>('/fscoin/earn', {});
    } catch (error) {
      console.error('Failed to earn coins', error);
      return 0;
    }
  },

  getShoppingPrices: async (): Promise<{ beginner: number; popular: number; economic: number }> => {
    try {
      return await api.get<{ beginner: number; popular: number; economic: number }>('/fscoin/shopping-prices');
    } catch (error) {
      console.error('Failed to fetch shopping prices', error);
      return { beginner: 2.45, popular: 9.95, economic: 24.95 };
    }
  }
};
