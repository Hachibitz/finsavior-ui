import { api } from './api';
import { AiBillExtractionDTO, DocumentType } from '../types';

export const aiService = {
  uploadDocument: async (
    file: File, 
    docType: DocumentType, 
    isUsingCoins: boolean = false, 
    password?: string,
    cardId?: string,
    targetDate?: string
  ): Promise<AiBillExtractionDTO[]> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('isUsingCoins', isUsingCoins.toString());
    
    if (password) {
      formData.append('password', password);
    }
    if (cardId) {
      formData.append('cardId', cardId);
    }
    if (targetDate) {
      formData.append('targetDate', targetDate);
    }

    return await api.post<AiBillExtractionDTO[]>('/ai/document/upload', formData);
  }
};
