import { 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider,
  UserCredential, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import { api } from './api';
import { authService } from './authService';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// Initialize Google Auth for native platforms
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize();
}

export const googleAuthService = {
  signIn: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    try {
      let result: UserCredential;

      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        result = await signInWithCredential(auth, credential);
      } else {
        result = await signInWithPopup(auth, googleProvider);
      }

      if (result && result.user) {
        const idToken = await result.user.getIdToken();
        // Call backend to exchange Firebase token for backend tokens
        try {
          const response = await api.post<any>(
            '/auth/login-google', 
            idToken
          );
          
          const accessToken = response.accessToken || response.token || Object.values(response)[0];
          const refreshToken = response.refreshToken || response.token;

          if (accessToken) {
            authService.setTokens(accessToken, refreshToken || accessToken);
            if (result.user.email) {
              localStorage.setItem('user_email', result.user.email);
            }
          }
          
          return { accessToken, refreshToken };
        } catch (error: any) {
          // If user not found, we return the firebase user info so the UI can prompt for registration
          if (error.status === 404 || error.response?.status === 404 || error.message?.includes('não encontrado')) {
            return { 
              userNotFound: true, 
              firebaseUser: {
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                idToken
              }
            } as any;
          }
          throw error;
        }
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
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
      await signOut(auth);
      authService.logout();
    } catch (error) {
      console.error('Erro ao deslogar do Firebase/Google:', error);
    }
  },

  getCurrentIdToken: async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
};
