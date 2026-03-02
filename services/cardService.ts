import { api } from './api';
import { CreditCard } from '../types';

export interface CardDTO {
  id: number;
  name: string;
  style: string | null;
}

const STYLE_MAPPING: Record<string, string> = {
  'SLATE_DARK': 'from-slate-800 to-slate-900',
  'INDIGO_BLUE': 'from-indigo-600 to-blue-700',
  'ROSE_PINK': 'from-rose-600 to-pink-700',
  'EMERALD_TEAL': 'from-emerald-600 to-teal-700',
  'AMBER_ORANGE': 'from-amber-500 to-orange-600',
  'VIOLET_PURPLE': 'from-violet-600 to-purple-700',
  'CYAN_BLUE': 'from-cyan-500 to-blue-500',
};

const REVERSE_STYLE_MAPPING: Record<string, string> = Object.entries(STYLE_MAPPING).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

const mapDTOToCard = (dto: CardDTO): CreditCard => ({
  id: dto.id.toString(),
  name: dto.name,
  color: (dto.style && STYLE_MAPPING[dto.style]) || STYLE_MAPPING['SLATE_DARK'],
  limit: 0, // Backend missing this field
  dueDateStr: '10', // Backend missing this field
  last4Digits: '****'
});

export const cardService = {
  getCards: async (): Promise<CreditCard[]> => {
    try {
      const dtos = await api.get<CardDTO[]>('/card/list');
      return dtos.map(mapDTOToCard);
    } catch (error) {
      console.error('Error loading cards:', error);
      return [];
    }
  },

  createCard: async (card: Omit<CreditCard, 'id'>): Promise<CreditCard> => {
    const dto = {
      name: card.name,
      style: REVERSE_STYLE_MAPPING[card.color] || 'SLATE_DARK'
    };
    const response = await api.post<CardDTO>('/card/register', dto);
    return mapDTOToCard(response);
  },

  updateCard: async (card: CreditCard): Promise<CreditCard> => {
    const dto = {
      id: parseInt(card.id),
      name: card.name,
      style: REVERSE_STYLE_MAPPING[card.color] || 'SLATE_DARK'
    };
    const response = await api.put<CardDTO>('/card/update', dto);
    return mapDTOToCard(response);
  },

  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/card/delete/${id}`);
  }
};
