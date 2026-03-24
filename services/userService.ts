import { api } from './api';
import { UserProfile, EnableWhatsappRequest } from '../types';

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  username: string;
  password: string;
  confirmation: boolean;
}

export const userService = {
  getProfileData: async (): Promise<UserProfile> => {
    const response = await api.get<any>('/user/get-profile-data');
    
    // Format profile picture if it exists
    if (response.profilePicture && !response.profilePicture.startsWith('data:')) {
      response.profilePicture = `data:image/png;base64,${response.profilePicture}`;
    }
    
    return response;
  },

  updateProfile: async (formData: FormData): Promise<void> => {
    await api.patch('/user/profile-data/update-profile', formData);
  },

  uploadProfilePicture: async (formData: FormData): Promise<{ status: string; message: string }> => {
    return await api.post('/user/profile-data/upload-picture', formData);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/user/change-password', data);
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<void> => {
    await api.post('/user/delete-account', data);
  },

  enableWhatsapp: async (data: EnableWhatsappRequest): Promise<void> => {
    await api.patch('/user/enable-whatsapp', data);
  },

  disableWhatsapp: async (): Promise<void> => {
    await api.patch('/user/disable-whatsapp', {});
  }
};
