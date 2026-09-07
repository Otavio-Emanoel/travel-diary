import { SecureStoreService } from './secure-store-service';

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class MobileApiClient {
  private baseUrl: string = 'http://10.0.2.2:3000';
  private accessToken: string | null = null;

  constructor(baseUrl?: string) {
    if (baseUrl) this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Se o access token expirou (401), tenta refresh com o token no SecureStore
      if (response.status === 401 && !path.includes('/auth/')) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return await retryResponse.json();
        }
      }

      if (response.status === 204) {
        return { data: undefined as any };
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      // Falha de rede / offline
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: err?.message || 'Sem conexão com o servidor',
        },
      };
    }
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = await SecureStoreService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await SecureStoreService.clearRefreshToken();
        this.accessToken = null;
        return false;
      }

      const data = await res.json();
      if (data?.data?.accessToken) {
        this.accessToken = data.data.accessToken;
        if (data.data.refreshToken) {
          await SecureStoreService.saveRefreshToken(data.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // --- Helpers de Domínio ---
  async login(email: string, password: string) {
    const res = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.accessToken) {
      this.accessToken = res.data.accessToken;
      if (res.data.refreshToken) {
        await SecureStoreService.saveRefreshToken(res.data.refreshToken);
      }
    }
    return res;
  }

  async register(email: string, password: string, name: string) {
    const res = await this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.data?.accessToken) {
      this.accessToken = res.data.accessToken;
      if (res.data.refreshToken) {
        await SecureStoreService.saveRefreshToken(res.data.refreshToken);
      }
    }
    return res;
  }

  async logout() {
    const refreshToken = await SecureStoreService.getRefreshToken();
    if (refreshToken) {
      await this.request('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    await SecureStoreService.clearRefreshToken();
    this.accessToken = null;
  }

  // Trips
  async getTrips() {
    return this.request('/api/v1/trips');
  }

  async createTrip(payload: any) {
    return this.request('/api/v1/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTrip(id: string, payload: any) {
    return this.request(`/api/v1/trips/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteTrip(id: string) {
    return this.request(`/api/v1/trips/${id}`, {
      method: 'DELETE',
    });
  }

  // Entries & Timeline
  async getTimeline(tripId: string) {
    return this.request(`/api/v1/trips/${tripId}/timeline`);
  }

  async createEntry(tripId: string, payload: any) {
    return this.request(`/api/v1/trips/${tripId}/entries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEntry(tripId: string, entryId: string, payload: any) {
    return this.request(`/api/v1/trips/${tripId}/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteEntry(tripId: string, entryId: string) {
    return this.request(`/api/v1/trips/${tripId}/entries/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Media
  async getPresignedUploadUrl(filename: string, mimeType: string, sizeBytes: number) {
    return this.request('/api/v1/media/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ filename, mimeType, sizeBytes }),
    });
  }

  async confirmMedia(payload: {
    entryId: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
  }) {
    return this.request('/api/v1/media/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const mobileApiClient = new MobileApiClient();
