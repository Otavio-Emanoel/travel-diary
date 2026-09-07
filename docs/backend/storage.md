# Armazenamento de Mídia (Storage) — Diário de Viagens

Este documento descreve a infraestrutura de armazenamento de objetos compatível com S3 (MinIO em self-hosted), o ciclo de vida dos arquivos e as políticas de retenção.

---

## 1. Princípio de Separação: Metadados vs Binários

* **PostgreSQL**: Armazena apenas o registro estruturado da mídia (`media.id`, `storage_key`, `size`, `mime_type`, `width`, `height`, status).
* **Object Storage (MinIO / S3)**: Armazena exclusivamente os arquivos binários brutos (JPEG, PNG, WebP).

```text
[ PostgreSQL: Tabela 'media' ]
 id: "018e3a2b..."
 storage_key: "users/u-123/trips/t-456/photos/018e3a2b.webp"
 size: 2451000
 status: "READY"
         │
         │ (storage_key referencia o arquivo)
         ▼
[ MinIO / S3 Bucket: 'travel-diary-media' ]
 users/u-123/trips/t-456/photos/018e3a2b.webp (binário de 2.4MB)
```

---

## 2. Estrutura e Padrão de Chaves (`storage_key`)

Para evitar colisões e permitir auditoria limpa no bucket, as chaves seguem uma hierarquia lógica com UUIDv7:

```text
users/{userId}/trips/{tripId}/photos/{mediaId}.{ext}
users/{userId}/avatars/{mediaId}.{ext}
users/{userId}/trips/{tripId}/covers/{mediaId}.{ext}
```

Exemplo real:
`users/018e3a2b-1111/trips/018e3a2b-2222/photos/018e3a2b-3333.jpg`

---

## 3. Interface `StorageProvider`

Todo o código da aplicação depende exclusivamente da interface abstrata:

```typescript
export interface StorageProvider {
  /**
   * Gera uma URL pré-assinada para o cliente realizar HTTP PUT diretamente.
   */
  createPresignedUploadUrl(params: {
    key: string;
    mimeType: string;
    sizeBytes: number;
    expiresInSeconds: number;
  }): Promise<{ uploadUrl: string; key: string }>;

  /**
   * Gera uma URL pré-assinada para download/visualização temporária do arquivo.
   */
  createPresignedDownloadUrl(params: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string>;

  /**
   * Remove permanentemente um objeto do bucket.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Verifica se o objeto existe e é acessível no bucket.
   */
  objectExists(key: string): Promise<boolean>;
}
```

---

## 4. Implementação `S3StorageProvider`

A implementação utiliza o SDK oficial da AWS `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // Obrigatório para MinIO e self-hosted
    });
  }
  // Implementação dos métodos da interface...
}
```

---

## 5. Ciclo de Vida da Mídia e Limpeza de Lixo (*Garbage Collection*)

1. **Criação de Upload**: Quando o usuário inicia um upload, o registro no banco nasce com `status = 'PENDING_UPLOAD'` e `created_at = NOW()`.
2. **Confirmação**: Se o upload for bem-sucedido, o cliente chama a rota de confirmação e o status vira `'READY'`.
3. **Mídias Abandonadas (Orphan Cleanup)**: Se o usuário fechar o app no meio do upload, o registro continuará como `PENDING_UPLOAD`. Uma rotina agendada (cron) ou script de manutenção roda periodicamente para expurgar registros `PENDING_UPLOAD` com mais de 24 horas e deletar arquivos incompletos.
4. **Exclusão de Viagem**: Quando uma viagem ou entrada é excluída, um evento é disparado para o `MediaService` remover os respectivos objetos do MinIO/S3 via `deleteObject(key)`.
