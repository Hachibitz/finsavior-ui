import { api, getAccessToken, setAccessToken, setRefreshToken, getRefreshToken, clearTokens, setRememberMe, logout as apiLogout } from './api';

export const authService = {
  login: async (username: string, password: string, rememberMe: boolean = true): Promise<void> => {
    setRememberMe(rememberMe);
    const response = await api.post<any>('/auth/login-auth', {
      username,
      password,
      rememberMe
    });
    
    // The user's Angular code expects { accessToken: string; refreshToken: string }
    // But my previous check of Swagger showed a generic map.
    // Let's handle both cases.
    const accessToken = response.accessToken || response.token || Object.values(response)[0];
    const refreshToken = response.refreshToken || response.token; // Fallback if only one token is returned

    if (accessToken) {
      setAccessToken(accessToken);
      if (refreshToken) setRefreshToken(refreshToken);
      
      // Store email if the username looks like one
      if (username.includes('@')) {
        localStorage.setItem('user_email', username);
      }
      return;
    }
    throw new Error('Tokens not found in response');
  },
  
  setTokens: (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  },
  
  logout: () => {
    apiLogout();
  },
  
  validateToken: async (token: string): Promise<boolean> => {
    try {
      // Endpoint from user's code: VALIDATE_TOKEN_SERVICE?token=${token}
      return await api.get<boolean>(`/auth/validate-token?token=${token}`);
    } catch (error) {
      return false;
    }
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    // Swagger says it takes a string and returns a string
    // But let's handle JSON response just in case
    const response = await api.post<any>('/auth/refresh-token', refreshToken);
    const newToken = typeof response === 'string' ? response : (response.accessToken || response.token || response.text);
    
    if (!newToken) throw new Error('New token not found in refresh response');
    
    setAccessToken(newToken);
    return newToken;
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return false;

      const isValid = await authService.validateToken(accessToken);
      if (isValid) return true;

      // Try refresh if invalid
      try {
        await authService.refreshToken();
        return true;
      } catch (refreshError) {
        // If refresh fails, we must clear everything
        authService.logout();
        return false;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      authService.logout();
      return false;
    }
  },

  signUp: async (data: any): Promise<any> => {
    return await api.post('/auth/signup', data);
  },

  loginWithGoogle: async (idToken: string): Promise<any> => {
    setRememberMe(true);
    const response = await api.post<any>('/auth/login-google', idToken);
    const accessToken = response.accessToken || response.token || Object.values(response)[0];
    const refreshToken = response.refreshToken || response.token;

    if (accessToken) {
      setAccessToken(accessToken);
      if (refreshToken) setRefreshToken(refreshToken);
    }
    return response;
  },

  registerWithGoogle: async (idToken: string): Promise<any> => {
    setRememberMe(true);
    const response = await api.post<any>('/auth/register-google', idToken);
    const accessToken = response.accessToken || response.token || Object.values(response)[0];
    const refreshToken = response.refreshToken || response.token;

    if (accessToken) {
      setAccessToken(accessToken);
      if (refreshToken) setRefreshToken(refreshToken);
    }
    return response;
  },

  passwordRecovery: async (email: string): Promise<void> => {
    await api.post('/auth/password-recovery', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  }
};
