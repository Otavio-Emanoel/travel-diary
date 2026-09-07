export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName?: string;
}

export class LocationService {
  /**
   * Obtém a localização atual do smartphone com degradação graciosa.
   * Não lança erro se o usuário negar a permissão; retorna null permitindo fallback manual.
   */
  static async getCurrentLocation(): Promise<LocationResult | null> {
    try {
      const Location = await import('expo-location');
      if (!Location || !Location.requestForegroundPermissionsAsync) {
        return null;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let locationName: string | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (reverseGeocode.length > 0) {
          const item = reverseGeocode[0];
          locationName = [item.city || item.subregion, item.country]
            .filter(Boolean)
            .join(', ');
        }
      } catch (_e) {
        // Geocodificação reversa falhou silenciosamente
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationName,
      };
    } catch (_err) {
      return null;
    }
  }
}
