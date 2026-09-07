// Wrapper para expo-secure-store com fallback gracioso em ambientes de teste
let inMemorySecureStore: Record<string, string> = {};

export class SecureStoreService {
  private static REFRESH_TOKEN_KEY = 'travel_diary_refresh_token';

  static async saveRefreshToken(token: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      if (SecureStore && SecureStore.setItemAsync) {
        await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        return;
      }
    } catch (_e) {
      // Ignora erro em ambiente sem hardware nativo
    }
    inMemorySecureStore[this.REFRESH_TOKEN_KEY] = token;
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      const SecureStore = await import('expo-secure-store');
      if (SecureStore && SecureStore.getItemAsync) {
        const token = await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
        if (token) return token;
      }
    } catch (_e) {
      // Ignora erro
    }
    return inMemorySecureStore[this.REFRESH_TOKEN_KEY] || null;
  }

  static async clearRefreshToken(): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      if (SecureStore && SecureStore.deleteItemAsync) {
        await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
      }
    } catch (_e) {
      // Ignora erro
    }
    delete inMemorySecureStore[this.REFRESH_TOKEN_KEY];
  }
}
