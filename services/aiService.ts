import { api } from './api';
import { AiBillExtractionDTO, DocumentType } from '../types';

export const aiService = {
  uploadDocument: async (
    file: File, 
    docType: DocumentType, 
    isUsingCoins: boolean = false, 
    password?: string
  ): Promise<AiBillExtractionDTO[]> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('isUsingCoins', isUsingCoins.toString());
    
    if (password) {
      formData.append('password', password);
    }

    return await api.post<AiBillExtractionDTO[]>('/ai/document/upload', formData);
  }
};
