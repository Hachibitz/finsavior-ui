const BASE_URL = import.meta.env.PROD 
  ? 'https://www.finsavior.com.br/api' 
  : 'http://localhost:8085/api';

export const getAccessToken = () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
export const setAccessToken = (token: string) => {
  if (localStorage.getItem('rememberMe') === 'true') {
    localStorage.setItem('accessToken', token);
  } else {
    sessionStorage.setItem('accessToken', token);
  }
};

export const getRefreshToken = () => localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
export const setRefreshToken = (token: string) => {
  if (localStorage.getItem('rememberMe') === 'true') {
    localStorage.setItem('refreshToken', token);
  } else {
    sessionStorage.setItem('refreshToken', token);
  }
};

export const setRememberMe = (remember: boolean) => {
  localStorage.setItem('rememberMe', remember.toString());
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('ngrok-skip-browser-warning', '69420');
  headers.set('bypass-tunnel-reminder', 'true');
  headers.set('X-Pinggy-No-Screen', 'true');
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if ((response.status === 401 || response.status === 403) && !endpoint.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': '69420',
              'bypass-tunnel-reminder': 'true',
              'X-Pinggy-No-Screen': 'true',
            },
            body: refreshToken // Send as raw string, not JSON.stringify
          });

          if (refreshResponse.ok) {
            const newToken = await refreshResponse.text();
            setAccessToken(newToken);
            isRefreshing = false;
            onRefreshed(newToken);
            return request<T>(endpoint, options);
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      } finally {
        isRefreshing = false;
      }

      clearTokens();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    } else {
      // Wait for refresh to complete
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          const newOptions = { ...options };
          const newHeaders = new Headers(newOptions.headers);
          newHeaders.set('Authorization', `Bearer ${newToken}`);
          newOptions.headers = newHeaders;
          resolve(request<T>(endpoint, newOptions));
        });
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    const error = new Error(errorData.message || 'Request failed') as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {} as T;
  } catch (e) {
    // If it's not JSON, return as is (useful for raw string responses like terms)
    return text as unknown as T;
  }
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
  patch: <T>(endpoint: string, body: any) => request<T>(endpoint, { 
    method: 'PATCH', 
    body: (body instanceof FormData || typeof body === 'string') ? body : JSON.stringify(body) 
  }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
