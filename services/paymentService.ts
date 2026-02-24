import { api } from './api';
import { CheckoutSessionDTO } from '../types';

export const paymentService = {
  createCheckoutSession: async (planType: string, email: string): Promise<CheckoutSessionDTO> => {
    return await api.post<CheckoutSessionDTO>('/payment/subscription/create-checkout', {
      planType,
      email
    });
  },

  updateSubscription: async (planType: string, email: string): Promise<void> => {
    await api.post<void>('/payment/subscription/update', {
      planType,
      email
    });
  }
};
