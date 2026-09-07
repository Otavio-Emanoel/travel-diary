# ADR 003: Armazenamento S3-Compatible com Upload Direto via Presigned URLs

* **Status**: Aprovado
* **Data**: 2026-09-06
* **Decisores**: Líder Técnico e Arquiteto de Software

---

## 1. Contexto

Um diário de viagens depende fortemente de fotos. Câmeras de celulares modernos tiram fotos entre 5MB e 15MB. Se o fluxo de upload tradicional (`Cliente → API Node.js → Storage`) fosse utilizado, o processo do Fastify precisaria:
1. Alocar buffers em memória para receber multipart/form-data.
2. Manter conexões HTTP de upload lentas abertas por vários segundos.
3. Consumir banda dobrada na VPS (download do cliente + upload para o storage).
Em uma VPS com 1GB-2GB de RAM e 1 vCPU, 5 uploads concorrentes de fotos poderiam travar o event loop da API e derrubar a aplicação por esgotamento de memória.

---

## 2. Opções Consideradas

1. **Armazenamento no PostgreSQL em colunas `BYTEA`**: Inviável para escalabilidade, satura o banco de dados e degrada backups.
2. **Upload através da API (Multipart Proxy)**: Fastify recebe o arquivo em stream e repassa ao storage. Consome CPU, buffers e banda da API.
3. **Upload Direto ao Storage via URLs Pré-Assinadas (Presigned URLs)**: A API apenas autoriza e emite uma URL temporária com assinatura criptográfica. O cliente faz upload do arquivo diretamente ao MinIO/S3 via HTTP PUT.

---

## 3. Decisão

Adotar **Upload Direto ao Storage via Presigned URLs** com o padrão S3-Compatible e abstração via interface `StorageProvider`.

* **Provedor Inicial**: MinIO self-hosted no Docker Compose.
* **Provedor de Produção Futuro**: Cloudflare R2 ou AWS S3 (sem alteração de código, apenas variáveis de ambiente).
* **Fluxo**:
  1. Cliente solicita URL de upload: `POST /api/v1/media/upload-url` informando nome, mime type e tamanho.
  2. Fastify valida regras de negócio, cria registro com status `PENDING_UPLOAD` e retorna uma URL pré-assinada válida por 10 minutos.
  3. Cliente envia o binário via `PUT` diretamente ao MinIO/S3.
  4. Cliente notifica a API: `POST /api/v1/media/:id/confirm`. A API valida a presença do arquivo no bucket e marca status `READY`.

---

## 4. Consequências

### Pontos Positivos:
* **Zero Carga de Memória e Banda na API**: A VPS só gasta milissegundos para assinar a URL criptográfica.
* **Resiliência a Conexões Lentas**: Se o celular do viajante tiver conexão 3G instável durante o upload, a API Fastify sequer sabe da lentidão da transferência.
* **Portabilidade Total**: A interface `StorageProvider` permite migrar para Cloudflare R2, AWS S3 ou Backblaze B2 com alteração exclusiva de credenciais no `.env`.

### Pontos Negativos / Mitigações:
* O cliente precisa fazer duas chamadas à API (uma para obter a URL e outra para confirmar).
* *Mitigação*: Encapsular essa lógica em um hook / SDK utilitário compartilhado nos clientes Web e Mobile (`uploadMediaWithProgress`).
