import { api } from './api';

export const termsService = {
  getTerms: async (): Promise<string> => {
    return await api.get<string>('/terms-and-privacy/get-terms');
  },
  
  getPrivacyPolicy: async (): Promise<string> => {
    return await api.get<string>('/terms-and-privacy/get-privacy-policy');
  }
};
