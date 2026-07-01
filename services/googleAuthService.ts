import { 
  signInWithRedirect,
  getRedirectResult,
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

const GOOGLE_PENDING_REGISTER_KEY = 'google_pending_register';
const GOOGLE_SIGNIN_PENDING_KEY = 'google_signin_pending';

// Initialize Google Auth for native platforms
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize();
}

type GoogleSignInResult =
  | { accessToken: string; refreshToken: string }
  | { userNotFound: true; firebaseUser: { email: string | null; displayName: string | null; photoURL: string | null; idToken: string } }
  | { redirecting: true };

type GoogleRedirectResult =
  | { loggedIn: true }
  | { userNotFound: true; firebaseUser: { email: string | null; displayName: string | null; photoURL: string | null } }
  | null;

async function exchangeGoogleCredential(result: UserCredential): Promise<GoogleSignInResult> {
  const idToken = await result.user.getIdToken();

  try {
    const response = await api.post<any>('/auth/login-google', idToken);

    const accessToken = response.accessToken || response.token || Object.values(response)[0];
    const refreshToken = response.refreshToken || response.token;

    if (accessToken) {
      authService.setTokens(accessToken, refreshToken || accessToken);
      localStorage.setItem('auth_provider', 'google');
      if (result.user.email) {
        localStorage.setItem('user_email', result.user.email);
      }
    }

    return { accessToken, refreshToken };
  } catch (error: any) {
    if (error.status === 404 || error.response?.status === 404 || error.message?.includes('não encontrado')) {
      return {
        userNotFound: true,
        firebaseUser: {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          idToken
        }
      };
    }
    throw error;
  }
}

export const googleAuthService = {
  signIn: async (): Promise<GoogleSignInResult> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        if (!result?.user) {
          throw new Error('Falha ao obter as credenciais do usuário.');
        }
        return exchangeGoogleCredential(result);
      }

      sessionStorage.setItem(GOOGLE_SIGNIN_PENDING_KEY, 'true');
      await signInWithRedirect(auth, googleProvider);
      return { redirecting: true };
    } catch (error) {
      sessionStorage.removeItem(GOOGLE_SIGNIN_PENDING_KEY);
      console.error('Google Sign In Error:', error);
      throw error;
    }
  },

  handleRedirectResult: async (): Promise<GoogleRedirectResult> => {
    if (Capacitor.isNativePlatform()) return null;

    try {
      const result = await getRedirectResult(auth);
      sessionStorage.removeItem(GOOGLE_SIGNIN_PENDING_KEY);

      if (!result?.user) return null;

      const exchange = await exchangeGoogleCredential(result);

      if ('userNotFound' in exchange && exchange.userNotFound) {
        sessionStorage.setItem(
          GOOGLE_PENDING_REGISTER_KEY,
          JSON.stringify(exchange.firebaseUser)
        );
        return {
          userNotFound: true,
          firebaseUser: {
            email: exchange.firebaseUser.email,
            displayName: exchange.firebaseUser.displayName,
            photoURL: exchange.firebaseUser.photoURL
          }
        };
      }

      return { loggedIn: true };
    } catch (error) {
      sessionStorage.removeItem(GOOGLE_SIGNIN_PENDING_KEY);
      console.error('Google redirect result error:', error);
      throw error;
    }
  },

  consumePendingRegister: (): { email: string | null; displayName: string | null; photoURL: string | null } | null => {
    const raw = sessionStorage.getItem(GOOGLE_PENDING_REGISTER_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(GOOGLE_PENDING_REGISTER_KEY);
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isRedirectPending: (): boolean =>
    sessionStorage.getItem(GOOGLE_SIGNIN_PENDING_KEY) === 'true',

  observeAuthState: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  logout: async (emitEvent: boolean = true): Promise<void> => {
    try {
      sessionStorage.removeItem(GOOGLE_PENDING_REGISTER_KEY);
      sessionStorage.removeItem(GOOGLE_SIGNIN_PENDING_KEY);
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
      await signOut(auth);
      authService.logout(emitEvent);
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
  },

  waitForCurrentIdToken: async (timeoutMs: number = 2500): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }

    return await new Promise((resolve) => {
      let unsubscribe: () => void = () => {};
      const timeout = window.setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, timeoutMs);

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(user ? await user.getIdToken(true) : null);
      });
    });
  }
};
