export interface PhotoAsset {
  uri: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  filename: string;
}

export class CameraService {
  /**
   * Captura foto pela câmera nativa com fallback para galeria de imagens
   */
  static async capturePhoto(): Promise<PhotoAsset | null> {
    try {
      const ImagePicker = await import('expo-image-picker');
      if (!ImagePicker || !ImagePicker.requestCameraPermissionsAsync) {
        return null;
      }

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.granted) {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          return {
            uri: asset.uri,
            mimeType: asset.mimeType || 'image/jpeg',
            sizeBytes: asset.fileSize || 0,
            width: asset.width,
            height: asset.height,
            filename: asset.fileName || `photo_${Date.now()}.jpg`,
          };
        }
      }

      // Se permissão da câmera foi negada ou cancelado, tenta oferecer a galeria
      return await this.pickFromGallery();
    } catch (_err) {
      return null;
    }
  }

  /**
   * Seleciona foto já existente da galeria de fotos do smartphone
   */
  static async pickFromGallery(): Promise<PhotoAsset | null> {
    try {
      const ImagePicker = await import('expo-image-picker');
      if (!ImagePicker || !ImagePicker.requestMediaLibraryPermissionsAsync) {
        return null;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          sizeBytes: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
          filename: asset.fileName || `photo_${Date.now()}.jpg`,
        };
      }
      return null;
    } catch (_err) {
      return null;
    }
  }
}
