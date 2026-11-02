import { API_BASE_URL } from '../constants/ApiConfig';
import { Storage } from './Storage';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiClient {
  private static isRefreshing = false;
  private static refreshSubscribers: ((token: string) => void)[] = [];

  private static onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  static async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!options.skipAuth) {
      const token = await Storage.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      throw new Error('Network connection error. Please check your internet or server status.');
    }

    // Handle token expiration (401)
    if (response.status === 401 && !options.skipAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
      const refreshedToken = await this.handleTokenRefresh();
      if (refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        return this.request<T>(endpoint, { ...options, headers });
      }
    }

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('application/pdf')) {
      data = await response.blob();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    return data;
  }

  private static async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const oldRefreshToken = await Storage.getRefreshToken();
      if (!oldRefreshToken) {
        await Storage.clearTokens();
        return null;
      }

      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: oldRefreshToken }),
      });

      if (!res.ok) {
        await Storage.clearTokens();
        return null;
      }

      const json = await res.json();
      const { accessToken, refreshToken } = json.data;

      await Storage.saveTokens(accessToken, refreshToken);
      this.onRefreshed(accessToken);
      return accessToken;
    } catch {
      await Storage.clearTokens();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Helper methods
  static get<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  static patch<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  static delete<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
