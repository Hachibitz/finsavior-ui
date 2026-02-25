import { api } from './api';
import { UserProfile } from '../types';

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
    await api.patch('/user/update-profile', formData);
  },

  uploadProfilePicture: async (formData: FormData): Promise<{ status: string; message: string }> => {
    return await api.post('/user/upload-picture', formData);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/user/change-account-password', data);
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<void> => {
    await api.post('/user/delete-account-and-data', data);
  }
};
