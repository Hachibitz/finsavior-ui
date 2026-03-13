import { request } from './api';
import { Goal } from '../types';

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    return request<Goal[]>('/goals');
  },

  addGoal: async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    return request<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },

  updateGoal: async (goal: Goal): Promise<Goal> => {
    return request<Goal>(`/goals/${goal.id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
  },

  deleteGoal: async (id: string): Promise<void> => {
    return request<void>(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  getGoalAdvice: async (goalId: string, useCoins: boolean = false): Promise<{ advice: string }> => {
    return request<{ advice: string }>(`/ai/goals/${goalId}/advice?useCoins=${useCoins}`);
  },

  getGoalAdviceHistory: async (goalId: string): Promise<{ advice: string }[]> => {
    return request<{ advice: string }[]>(`/ai/goals/${goalId}/history`);
  }
};
