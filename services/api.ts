const BASE_URL = 'https://6128-179-190-143-111.ngrok-free.app/api';

export const getAccessToken = () => localStorage.getItem('accessToken');
export const setAccessToken = (token: string) => localStorage.setItem('accessToken', token);
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token: string) => localStorage.setItem('refreshToken', token);

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

let isRefreshing = false;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Bypass ngrok browser warning with the specific value requested
  headers.set('ngrok-skip-browser-warning', '69420');
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401/403 with refresh logic
  if ((response.status === 401 || response.status === 403) && !isRefreshing && !endpoint.includes('/auth/')) {
    isRefreshing = true;
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        // Call refresh token endpoint directly to avoid recursion
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': '69420'
          },
          body: JSON.stringify(refreshToken)
        });

        if (refreshResponse.ok) {
          const newToken = await refreshResponse.text();
          setAccessToken(newToken);
          isRefreshing = false;
          
          // Retry the original request with the new token
          return request<T>(endpoint, options);
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    } finally {
      isRefreshing = false;
    }

    // If refresh failed or no refresh token, logout
    clearTokens();
    window.location.href = '/login'; // Or handle via state in App.tsx
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    const error = new Error(errorData.message || 'Request failed') as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { 
    method: 'POST', 
    body: (body instanceof FormData || typeof body === 'string') ? body : JSON.stringify(body) 
  }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { 
    method: 'PUT', 
    body: (body instanceof FormData || typeof body === 'string') ? body : JSON.stringify(body) 
  }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
