import { getDatabase, ISqliteDatabase } from '../sqlite-client';

export type MediaUploadStatus = 'PENDING_UPLOAD' | 'UPLOADING' | 'FAILED' | 'COMPLETED';

export interface PendingMediaItem {
  id: string;
  entry_id: string;
  local_file_uri: string;
  mime_type: string;
  size_bytes: number;
  status: MediaUploadStatus;
  created_at: number;
}

export class MediaQueueRepository {
  constructor(private db: ISqliteDatabase = getDatabase()) {}

  async enqueue(item: {
    id: string;
    entryId: string;
    localFileUri: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<void> {
    const sql = `
      INSERT INTO pending_media (id, entry_id, local_file_uri, mime_type, size_bytes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.runAsync(sql, [
      item.id,
      item.entryId,
      item.localFileUri,
      item.mimeType,
      item.sizeBytes,
      'PENDING_UPLOAD',
      Date.now(),
    ]);
  }

  async listPending(): Promise<PendingMediaItem[]> {
    const sql = `SELECT * FROM pending_media WHERE status = 'PENDING_UPLOAD' OR status = 'FAILED'`;
    return this.db.getAllAsync<PendingMediaItem>(sql);
  }

  async updateStatus(id: string, status: MediaUploadStatus): Promise<void> {
    const sql = `UPDATE pending_media SET status = ? WHERE id = ?`;
    await this.db.runAsync(sql, [status, id]);
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM pending_media WHERE id = ?`;
    await this.db.runAsync(sql, [id]);
  }
}
