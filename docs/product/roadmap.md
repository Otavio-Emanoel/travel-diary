# Roadmap de Implementação — Diário de Viagens

Este roadmap estabelece o cronograma ordenado de desenvolvimento em fases incrementais. Cada fase constrói uma camada sólida e testada antes do avanço para a seguinte.

---

## Visão Geral das Fases

```text
Phase 0: Infrastructure & Monorepo Foundation
   ↓
Phase 1: Database Schema & Contracts (Zod)
   ↓
Phase 2: Authentication & Users Module
   ↓
Phase 3: Trips & Destinations Module
   ↓
Phase 4: Entries & Locations Module
   ↓
Phase 5: Media & Direct S3/MinIO Storage
   ↓
Phase 6: Frontend Web (Next.js Dashboard, Timeline & Map)
   ↓
Phase 7: Mobile App (React Native Core & Navigation)
   ↓
Phase 8: Mobile Offline-First Engine (SQLite & Sync Queue)
   ↓
Phase 9: Sharing & Public Trips
   ↓
Phase 10: Production Hardening, Backups & Observability
```

---

## Detalhamento das Fases

### Phase 0: Infraestrutura e Base do Monorepo
* **Objetivo**: Configurar o ambiente de desenvolvimento, orquestração Docker, Caddy e workspaces pnpm.
* **Entregas**:
  - `docker-compose.yml` funcional com PostgreSQL 16 e MinIO.
  - Proxy Caddy configurado para rotear tráfego local.
  - Configuração do `pnpm-workspace.yaml` e pacotes compartilhados (`@travel-diary/contracts`, `@travel-diary/types`, `@travel-diary/config`).
  - Scripts de verificação de ambiente e linting.

### Phase 1: Schemas do Banco e Contratos Centrais
* **Objetivo**: Implementar os schemas relacionais no Drizzle ORM e os schemas de validação Zod no pacote de contratos.
* **Entregas**:
  - Tabelas `users`, `sessions`, `trips`, `destinations`, `trip_days`, `entries`, `locations`, `media`, `trip_shares`.
  - Migrações automáticas configuradas via Drizzle Kit.
  - DTOs tipados e schemas de validação de requests/responses exportados por `@travel-diary/contracts`.

### Phase 2: Módulo de Autenticação e Usuários (Backend)
* **Objetivo**: Desenvolver o fluxo completo de registro, login, emissão e rotação de tokens.
* **Entregas**:
  - Fastify plugin para autenticação JWT (`@fastify/jwt` ou assinatura nativa).
  - Rotas: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
  - Hashing de senhas com Argon2id.
  - Tabela de sessões/refresh tokens no PostgreSQL com expiração e revogação.
  - Testes unitários e de integração do fluxo de autenticação.

### Phase 3: Módulo de Viagens e Destinos (Backend)
* **Objetivo**: CRUD completo e regras de negócio para viagens e itinerários.
* **Entregas**:
  - Rotas: `POST /trips`, `GET /trips`, `GET /trips/:id`, `PATCH /trips/:id`, `DELETE /trips/:id`.
  - Gerenciamento de destinos associados: `POST /trips/:id/destinations`, `DELETE /trips/:id/destinations/:destinationId`.
  - Paginação por cursor e filtros por status (`PLANNED`, `ONGOING`, `COMPLETED`).
  - Testes de regras de negócio (autorização do dono da viagem).

### Phase 4: Módulo de Entradas e Localizações (Backend)
* **Objetivo**: Registro das notas de diário de viagem agrupadas por dias com georreferenciamento.
* **Entregas**:
  - Rotas: `POST /trips/:tripId/entries`, `GET /trips/:tripId/entries`, `GET /entries/:id`, `PATCH /entries/:id`, `DELETE /entries/:id`.
  - Criação automática ou seleção de `TripDay`.
  - Registro de coordenadas de latitude/longitude e metadados de local (`locations`).
  - Endpoint de consulta agregada da linha do tempo (`GET /trips/:tripId/timeline`).

### Phase 5: Módulo de Mídia e Armazenamento S3/MinIO
* **Objetivo**: Implementar upload direto via URLs pré-assinadas e catálogo de mídia.
* **Entregas**:
  - Interface `StorageProvider` e implementação `S3StorageProvider` via `@aws-sdk/client-s3`.
  - Rota de geração de presigned URL: `POST /media/upload-url`.
  - Rota de confirmação de upload: `POST /media/:id/confirm`.
  - Rota de remoção de mídia com limpeza no bucket S3.
  - Associação de fotos à capa da viagem e a entradas específicas.

### Phase 6: Frontend Web (Next.js Dashboard, Timeline e Mapa)
* **Objetivo**: Construir a interface web completa e responsiva em Next.js com Tailwind CSS.
* **Entregas**:
  - Telas de Autenticação (Login e Cadastro).
  - Dashboard de Viagens com cards, fotos de capa e status.
  - Detalhes da Viagem: Visualização em Linha do Tempo interativa.
  - Visualização em Mapa interativo com MapLibre GL / Leaflet e rotas traçadas.
  - Modal e formulário de criação/edição de entradas com upload direto de fotos via S3.
  - Responsividade total para desktops, tablets e navegadores móveis.

### Phase 7: Aplicativo Mobile (React Native Core)
* **Objetivo**: Criar a interface mobile básica com navegação, autenticação e visualização de viagens.
* **Entregas**:
  - Configuração do Expo / React Native com TypeScript.
  - Fluxo de autenticação e armazenamento de tokens no SecureStore.
  - Listagem de viagens, detalhes da viagem e visualização da timeline.
  - Integração com a câmera nativa e rolo de fotos para seleção de mídia.

### Phase 8: Mecanismo Offline-First no Mobile
* **Objetivo**: Permitir operação 100% desconectada no app mobile com sincronização transparente.
* **Entregas**:
  - Banco de dados local SQLite no dispositivo.
  - Fila de mutações locais (`SyncQueue`).
  - Listener de conectividade de rede para acionar o envio em segundo plano.
  - Gerenciador de upload de fotos pendentes.
  - Resolução de conflitos por timestamp (*Last Write Wins*).

### Phase 9: Compartilhamento e Viagens Públicas
* **Objetivo**: Expandir o sistema para permitir visualização pública e colaboração.
* **Entregas**:
  - Geração de links secretos de compartilhamento (`shareToken`).
  - Rota pública do Next.js sem autenticação para visualização da viagem.
  - Permissões de convite para colaboradores (Leitor e Editor).

### Phase 10: Hardening de Produção, Backups e Observabilidade
* **Objetivo**: Garantir segurança máxima, estabilidade e rotinas de desastre em VPS.
* **Entregas**:
  - Ativação de rate limiting no Fastify (`@fastify/rate-limit`).
  - Scripts de backup automáticos com cron para PostgreSQL e MinIO.
  - Health checks `/health` e `/ready` com monitoramento de memória.
  - Documentação completa de restauração de desastres (DRP).
