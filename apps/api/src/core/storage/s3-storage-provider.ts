import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage-provider';

export interface S3Config {
  endpoint: string;
  publicUrl: string;
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  useSsl: boolean;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // Necessário para MinIO e compatibilidade S3 self-hosted
    });
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (err: any) {
        // Ignora se o bucket já existir ou estiver sendo criado concorrentemente
        if (err.name !== 'BucketAlreadyOwnedByYou' && err.name !== 'BucketAlreadyExists') {
          console.warn(`Aviso ao criar bucket ${this.bucket}:`, err.message);
        }
      }
    }
  }

  async createPresignedUploadUrl(params: {
    key: string;
    mimeType: string;
    sizeBytes: number;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds,
    });

    return { uploadUrl, key: params.key };
  }

  async createPresignedDownloadUrl(params: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds,
    });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
