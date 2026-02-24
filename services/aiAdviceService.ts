import { api } from './api';
import { AiAdviceDTO, AiAdviceResponseDTO, AiAnalysis } from '../types';

export interface QuickInsightResponse {
  insight: string;
}

export const aiAdviceService = {
  getQuickInsight: async (date: string): Promise<string> => {
    try {
      // date format: YYYY-MM
      const response = await api.get<QuickInsightResponse>(`/ai-advice/quick-insight?date=${date}`);
      return response.insight;
    } catch (error) {
      console.error('Error fetching quick insight:', error);
      return 'Mantenha o foco nos seus objetivos financeiros!';
    }
  },

  generateFullReport: async (data: AiAdviceDTO): Promise<AiAdviceResponseDTO> => {
    return api.post<AiAdviceResponseDTO>('/ai-advice/generate-ai-advice-and-insights', data);
  },

  getAnalyses: async (): Promise<AiAnalysis[]> => {
    try {
      return await api.get<AiAnalysis[]>('/ai-advice/get-ai-advice-and-insights');
    } catch (error) {
      console.error('Error fetching analyses:', error);
      return [];
    }
  },

  getAdviceById: async (adviceId: number | string): Promise<AiAnalysis> => {
    return api.get<AiAnalysis>(`/ai-advice/get-ai-advice/${adviceId}`);
  },

  deleteAnalysis: async (analysisId: number | string): Promise<void> => {
    return api.delete(`/ai-advice/delete-analysis/${analysisId}`);
  },

  validateHasCoverage: async (analysisId: number): Promise<boolean> => {
    return api.get<boolean>(`/ai-advice/validate-has-coverage/${analysisId}`);
  }
};
