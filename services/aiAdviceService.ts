import { api } from './api';

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
  }
};
