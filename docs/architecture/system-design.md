# System Design — Diário de Viagens

Este documento detalha o desenho do sistema, a topologia de rede, a alocação de recursos em VPS de baixo custo e as estratégias de escalabilidade vertical e horizontal.

---

## 1. Topologia de Rede e Portas

Todos os serviços operam em uma rede de bridge interna do Docker (`travel_network`). Apenas as portas HTTP (80) e HTTPS (443) do **Caddy** são expostas para a internet pública.

```text
       [ Internet: Clientes Web e Mobile ]
                       │
             :80 / :443 (HTTPS)
                       ▼
       ┌───────────────────────────────┐
       │   Caddy Reverse Proxy         │
       │   (Portas 80 / 443 expostas)  │
       └───────┬───────────────┬───────┘
               │               │
        /api/* │               │ /*
               ▼               ▼
       ┌──────────────┐ ┌──────────────┐
       │ Fastify API  │ │ Next.js Web  │
       │ (Porta 3001) │ │ (Porta 3000) │
       └──────┬───────┘ └──────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │ MinIO Server │
│ (Porta 5432) │ │ (Porta 9000) │
└──────────────┘ └──────────────┘
```

* **Caddy**: Termina TLS com certificados automáticos Let's Encrypt / ZeroSSL, comprime respostas com zstd e gzip, e aplica cabeçalhos de segurança HTTP.
* **Fastify API**: Ouve na porta `3001` da rede interna.
* **Next.js Web**: Ouve na porta `3000` da rede interna.
* **PostgreSQL**: Ouve na porta `5432` na rede interna (somente acessível pelos containers).
* **MinIO**: Ouve na porta `9000` (API S3) e `9001` (Console de administração protegido por credenciais fortes).

---

## 2. Orçamento de Memória e Limites em VPS

Para garantir que o sistema não sofra com *Out Of Memory (OOM Killer)* em uma VPS de 1GB ou 2GB de RAM, definimos limites estritos de memória no Docker Compose:

| Serviço | Limite Docker | RAM Típica em Repouso | Comportamento sob Carga |
| :--- | :--- | :--- | :--- |
| **Caddy** | 64MB | ~15MB | Escala suavemente até 30MB |
| **PostgreSQL 16** | 256MB | ~80MB | Limitado por `shared_buffers=128MB` |
| **MinIO** | 192MB | ~90MB | I/O assíncrono para disco |
| **Fastify API** | 160MB | ~45MB | V8 GC mantém entre 50MB-90MB |
| **Next.js Web** | 192MB | ~85MB | SSR/Node process |
| **Total Reservado**| **864MB** | **~315MB** | **Totalmente viável em 1GB-2GB VPS** |

---

## 3. Gestão de Conexões com PostgreSQL

* Como o Node.js é assíncrono e monotread no event loop, um pool de conexões excessivo degrada o desempenho do PostgreSQL e esgota a memória do banco (`work_mem`).
* O pool da aplicação Fastify é configurado com:
  - `min_connections`: 2
  - `max_connections`: 10
  - `idle_timeout`: 30 segundos
* O PostgreSQL está parametrizado para `max_connections = 50`, permitindo sobras para migrations manuais, rotinas de backup e escalabilidade futura.

---

## 4. Camada de Abstração de Armazenamento (`StorageProvider`)

O sistema não acopla o código de domínio ao MinIO ou AWS S3 diretamente. Toda interação de armazenamento passa pela interface:

```typescript
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
}
```

* **Implementação Padrão**: `S3StorageProvider`, compatível nativamente com MinIO, AWS S3, Cloudflare R2 e Wasabi via protocolo padrão da AWS SDK v3.
* **Troca de Provedor**: Se no futuro migrarmos de MinIO self-hosted para Cloudflare R2 (para ter egress gratuito de imagens), basta alterar as variáveis de ambiente `STORAGE_ENDPOINT` e credenciais, sem tocar em uma única linha de código do backend.

---

## 5. Estratégia de Processamento Assíncrono

* No MVP, tarefas síncronas como validação, registro de metadados e consultas são resolvidas em menos de 100ms.
* Caso surja a necessidade de processamento pesado de imagens (geração de miniaturas em múltiplos tamanhos, blurhash, compressão WebP em lote), a arquitetura suporta duas vias:
  1. **On-the-fly / Client-Side**: O cliente (Web/Mobile) redimensiona a foto antes do upload, evitando qualquer custo de CPU no servidor.
  2. **Worker Opcional**: Uso do Redis (perfil `--profile with-redis`) com BullMQ em container separado para filas pesadas.
