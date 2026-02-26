import { api } from './api';

export interface AiBillExtractionDTO {
  billName: string | null;
  billValue: number | null;
  billDescription: string | null;
  billCategory: string | null;
  isInstallment: boolean | null;
  installmentCount: number | null;
  currentInstallment: number | null;
  isRecurrent: boolean | null;
  possibleDate: string | null;
  redirectAction: string | null;
}

export const aiTranscriptionService = {
  processAudioToBill: async (file: File | Blob, isUsingCoins: boolean = false): Promise<AiBillExtractionDTO> => {
    const formData = new FormData();
    formData.append('file', file, 'audio.aac');
    formData.append('isUsingCoins', String(isUsingCoins));

    return await api.post<AiBillExtractionDTO>('/ai/transcription/process-audio', formData);
  },

  transcribeOnly: async (file: File | Blob, isUsingCoins: boolean = false): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('file', file, 'audio.aac');
    formData.append('isUsingCoins', String(isUsingCoins));

    return await api.post<{ text: string }>('/ai/transcription/transcribe', formData);
  },
};
