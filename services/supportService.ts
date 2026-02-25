import { api } from './api';

export interface SupportTicket {
  name: string;
  email: string;
  emailConfirmation?: string;
  type: string;
  message: string;
  isAuthenticated: boolean;
}

export const supportService = {
  sendTicket: async (ticket: SupportTicket): Promise<void> => {
    await api.post('/contact', ticket);
  },

  sendPublicTicket: async (ticket: SupportTicket): Promise<void> => {
    await api.post('/contact/public', ticket);
  }
};
