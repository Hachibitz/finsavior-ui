import { api, getAccessToken, setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from './api';

export const authService = {
  login: async (username: string, password: string): Promise<void> => {
    // Based on user's Angular code, it expects accessToken and refreshToken
    const response = await api.post<any>('/auth/login-auth', {
      username,
      password,
      rememberMe: true
    });
    
    // The user's Angular code expects { accessToken: string; refreshToken: string }
    // But my previous check of Swagger showed a generic map.
    // Let's handle both cases.
    const accessToken = response.accessToken || response.token || Object.values(response)[0];
    const refreshToken = response.refreshToken || response.token; // Fallback if only one token is returned

    if (accessToken) {
      setAccessToken(accessToken);
      if (refreshToken) setRefreshToken(refreshToken);
      return;
    }
    throw new Error('Tokens not found in response');
  },
  
  setTokens: (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  },
  
  logout: () => {
    clearTokens();
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
    const response = await api.post<string>('/auth/refresh-token', refreshToken);
    setAccessToken(response);
    return response;
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
        return false;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  }
};
