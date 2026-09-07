export interface StorageProvider {
  createPresignedUploadUrl(params: {
    key: string;
    mimeType: string;
    sizeBytes: number;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; key: string }>;

  createPresignedDownloadUrl(params: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string>;

  deleteObject(key: string): Promise<void>;

  objectExists(key: string): Promise<boolean>;

  ensureBucketExists(): Promise<void>;
}
