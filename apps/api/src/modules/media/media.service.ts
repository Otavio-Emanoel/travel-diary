import crypto from 'crypto';
import path from 'path';
import { MediaRepository } from './media.repository';
import { StorageProvider } from '../../core/storage/storage-provider';
import { storageProvider as defaultStorageProvider } from '../../core/storage';
import { RequestUploadUrlInput } from '@travel-diary/contracts';
import { NotFoundError, ForbiddenError, StorageError } from '../../core/errors/app-error';

export class MediaService {
  constructor(
    private readonly repository: MediaRepository = new MediaRepository(),
    private readonly storage: StorageProvider = defaultStorageProvider
  ) {}

  async requestUploadUrl(userId: string, input: RequestUploadUrlInput) {
    const mediaId = crypto.randomUUID();
    const extension = path.extname(input.filename) || '.jpg';
    const storageKey = `users/${userId}/photos/${mediaId}${extension}`;

    // Garante que o bucket exista antes de gerar presigned URL
    await this.storage.ensureBucketExists();

    const presigned = await this.storage.createPresignedUploadUrl({
      key: storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      expiresInSeconds: 600, // 10 minutos
    });

    const media = await this.repository.create({
      id: mediaId,
      userId,
      tripId: input.tripId,
      entryId: input.entryId,
      storageKey,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: 'PENDING_UPLOAD',
    });

    return {
      mediaId: media.id,
      uploadUrl: presigned.uploadUrl,
      storageKey,
      expiresInSeconds: 600,
    };
  }

  async confirmUpload(mediaId: string, userId: string) {
    const media = await this.repository.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Mídia não encontrada');
    }

    if (media.userId !== userId) {
      throw new ForbiddenError('Não autorizado');
    }

    // Verifica se o objeto realmente foi carregado no MinIO/S3
    const exists = await this.storage.objectExists(media.storageKey);
    if (!exists) {
      await this.repository.updateStatus(mediaId, 'FAILED');
      throw new StorageError('Arquivo não encontrado no armazenamento. O upload falhou.');
    }

    const updated = await this.repository.updateStatus(mediaId, 'READY');
    const publicUrl = await this.storage.createPresignedDownloadUrl({
      key: media.storageKey,
      expiresInSeconds: 7 * 24 * 3600, // 7 dias
    });

    return {
      ...updated,
      publicUrl,
    };
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.repository.findById(mediaId);
    if (!media) {
      throw new NotFoundError('Mídia não encontrada');
    }

    if (media.userId !== userId) {
      throw new ForbiddenError('Não autorizado a excluir esta mídia');
    }

    // Remove do storage e depois do banco
    try {
      await this.storage.deleteObject(media.storageKey);
    } catch (err: any) {
      console.warn(`Aviso ao remover objeto do storage:`, err.message);
    }

    await this.repository.delete(mediaId);
  }
}
