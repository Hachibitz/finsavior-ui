import { 
  signInWithPopup, 
  UserCredential, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import { api } from './api';
import { authService } from './authService';

export const googleAuthService = {
  signIn: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        const idToken = await result.user.getIdToken();
        // Call backend to exchange Firebase token for backend tokens
        const response = await api.post<{ accessToken: string; refreshToken: string }>(
          '/auth/google-login', 
          idToken
        );
        
        if (response.accessToken && response.refreshToken) {
          authService.setTokens(response.accessToken, response.refreshToken);
        }
        
        return response;
      } else {
        throw new Error('Falha ao obter as credenciais do usuário.');
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  },

  observeAuthState: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
      authService.logout();
    } catch (error) {
      console.error('Erro ao deslogar do Firebase/Google:', error);
    }
  }
};
