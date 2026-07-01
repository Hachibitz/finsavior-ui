import { api } from './api';
import { CheckoutSessionDTO } from '../types';

export const paymentService = {
  createCheckoutSession: async (
    planType: string,
    email: string,
    hostedCheckout = false
  ): Promise<CheckoutSessionDTO> => {
    return await api.post<CheckoutSessionDTO>('/payment/subscription/create-checkout', {
      planType,
      email,
      hostedCheckout
    });
  },

  updateSubscription: async (planType: string, email: string): Promise<void> => {
    await api.post<void>('/payment/subscription/update', {
      planType,
      email
    });
  },

  createCustomerPortalSession: async (email: string): Promise<{ url: string }> => {
    return await api.post<{ url: string }>('/payment/subscription/customer-portal', { email });
  },

  cancelSubscription: async (immediate: boolean): Promise<void> => {
    await api.post('/payment/subscription/cancel', { immediate });
  },

  reactivateSubscription: async (): Promise<void> => {
    await api.post('/payment/subscription/reactivate', {});
  }
};
