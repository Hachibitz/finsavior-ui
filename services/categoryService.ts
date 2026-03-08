import { api } from './api';
import { Category } from '../types';

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const categories = await api.get<Category[]>('/categories');
      return categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const id = category.name.toLowerCase().replace(/\s+/g, '_');
    const payload = { ...category, id };
    return await api.post<Category>('/categories', payload);
  },

  updateCategory: async (category: Category): Promise<Category> => {
    return await api.put<Category>(`/categories/${category.id}`, category);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  }
};
