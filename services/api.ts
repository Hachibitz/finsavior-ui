const BASE_URL = import.meta.env.PROD 
  ? 'https://www.finsavior.com.br/api' 
  : 'http://localhost:8085/api';

let accessTokenMemory: string | null = sessionStorage.getItem('accessToken');

export const getAccessToken = () => accessTokenMemory;
export const setAccessToken = (token: string) => {
  accessTokenMemory = token;
  // Keep access tokens out of localStorage. sessionStorage is only a reload bridge
  // and is cleared on logout; persisted auth is handled by the refresh token.
  sessionStorage.setItem('accessToken', token);
  localStorage.removeItem('accessToken');
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
  accessTokenMemory = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('auth_provider');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let refreshErrorSubscribers: ((error: any) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
  refreshErrorSubscribers = [];
}

function onRefreshFailed(error: any) {
  refreshErrorSubscribers.forEach(cb => cb(error));
  refreshSubscribers = [];
  refreshErrorSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void, errCb: (error: any) => void) {
  refreshSubscribers.push(cb);
  refreshErrorSubscribers.push(errCb);
}

export const logout = (emitEvent: boolean = true) => {
  clearTokens();
  if (emitEvent) {
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }
};

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Conditionally add headers to avoid CORS issues with tunnels
  if (!import.meta.env.PROD) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const isAuthRoute = endpoint.includes('/auth/');
    const isRefreshableStatus = response.status === 401;

    if (isRefreshableStatus && !isAuthRoute) {
      const clone = response.clone();
      try {
        const errorData = await clone.json();
        const msg = (errorData.msg || errorData.message || '').toLowerCase();
        
        // If it's a plan limit error, don't try to refresh
        const isPlanLimit = response.status === 403 && (
          msg.includes('limite') || 
          msg.includes('upgrade') || 
          msg.includes('fscoins') || 
          msg.includes('moedas') || 
          msg.includes('insuficiente') ||
          msg.includes('saldo')
        );

        if (isPlanLimit) {
          const error = new Error(errorData.msg || errorData.message || 'Limite atingido') as any;
          error.status = response.status;
          error.data = errorData;
          throw error;
        }
      } catch (e: any) {
        if (e.status === 403) throw e; // Re-throw plan limit error
        // Otherwise ignore parse error and proceed to refresh attempt
      }

  // Proceed with refresh logic
      if (!isRefreshing && !(options as any)._retry) {
        isRefreshing = true;
        try {
          const refreshToken = getRefreshToken();
          const refreshHeaders: Record<string, string> = {
            'ngrok-skip-browser-warning': 'true',
          };
          if (refreshToken) {
            refreshHeaders['Content-Type'] = 'application/json';
          }
          const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            credentials: 'include',
            headers: refreshHeaders,
            body: refreshToken || undefined,
          });

          if (refreshResponse.ok) {
            const text = await refreshResponse.text();
            let newToken: string;
            try {
              const json = JSON.parse(text);
              newToken = json.accessToken || json.token || text;
            } catch {
              newToken = text;
            }

            setAccessToken(newToken);
            isRefreshing = false;
            onRefreshed(newToken);
            return request<T>(endpoint, { ...options, _retry: true } as any);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          onRefreshFailed(error);
        } finally {
          isRefreshing = false;
        }

        logout();
        throw new Error('Unauthorized');
      } else if (isRefreshing && !(options as any)._retry) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(
            (newToken) => {
              const newOptions = { ...options, _retry: true } as any;
              const newHeaders = new Headers(newOptions.headers);
              newHeaders.set('Authorization', `Bearer ${newToken}`);
              newOptions.headers = newHeaders;
              resolve(request<T>(endpoint, newOptions));
            },
            (error) => {
              reject(error);
            }
          );
        });
      } else if ((options as any)._retry) {
        // If it's already a retry and still 401, refresh failed to provide a valid token
        logout();
        throw new Error('Unauthorized');
      }
    }

    // Standard error handling for non-refreshable errors
    const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
    const error = new Error(errorData.msg || errorData.message || 'Request failed') as any;
    error.status = response.status;
    error.data = errorData;
    // Machine-readable code (e.g. PLAY_MANAGED_IN_STORE) that the UI translates via i18n
    error.errorCode = errorData.errorCode;
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
