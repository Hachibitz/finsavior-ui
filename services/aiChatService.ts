import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  question: string;
  chatHistory?: string[];
  date?: string;
  isUsingCoins?: boolean;
}

export interface ChatResponse {
  answer: string;
}

export interface ChatHistoryDTO {
  userMessage: string;
  assistantResponse: string;
  createdAt: string;
}

export const aiChatService = {
  chatWithSavi: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/ai/chat', data);
    return response;
  },

  getChatHistory: async (offset: number, limit: number): Promise<ChatMessage[]> => {
    const response = await api.get<ChatHistoryDTO[]>(`/ai/history?offset=${offset}&limit=${limit}`);
    // Convert DTO to ChatMessage format
    const messages: ChatMessage[] = [];
    response.forEach(dto => {
      messages.push({ role: 'user', content: dto.userMessage });
      messages.push({ role: 'assistant', content: dto.assistantResponse });
    });
    return messages;
  },

  clearChatHistory: async (): Promise<void> => {
    await api.delete('/ai/delete-chat-history');
  }
};
