import { api } from './api';

export const whatsappService = {
  getAgentNumber: async (): Promise<{ phoneNumber: string }> => {
    return api.get<{ phoneNumber: string }>('/whatsapp/agent-number');
  }
};
