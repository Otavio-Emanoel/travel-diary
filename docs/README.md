# Índice da Documentação Técnica — Diário de Viagens

Bem-vindo à documentação técnica do **Diário de Viagens**. Este repositório segue rigorosamente a abordagem de **Documentação Primeiro (*Documentation-First*)**, estabelecendo todas as decisões arquiteturais, modelos de domínio, contratos e requisitos antes da codificação de funcionalidades.

---

## 🗺️ Mapa de Navegação da Documentação

### 1. Produto ([`docs/product/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/))
* [**Visão do Produto** (`vision.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/vision.md): Propósito, proposta de valor, personas e metas de longo prazo.
* [**Requisitos** (`requirements.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/requirements.md): Requisitos funcionais (RF), não funcionais (RNF) e restrições de infraestrutura.
* [**Funcionalidades** (`features.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/features.md): Especificação detalhada de cada feature atual e futura.
* [**Roadmap** (`roadmap.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/roadmap.md): Cronograma estruturado em fases de implementação (Phase 0 a Phase 10).

### 2. Arquitetura ([`docs/architecture/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/))
* [**Visão Geral da Arquitetura** (`overview.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/overview.md): Diagramas C4 (Contexto e Contêineres) e visão sistêmica.
* [**Princípios Arquiteturais** (`principles.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/principles.md): Modular Monolith, baixo acoplamento, KISS, pragmatismo em VPS.
* [**System Design** (`system-design.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/system-design.md): Topologia de rede, gestão de memória e stack leve.
* [**Módulos do Sistema** (`modules.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/modules.md): Fronteiras dos módulos (`auth`, `trips`, `entries`, `media`, etc.).
* [**Fluxo de Dados** (`data-flow.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/data-flow.md): Sequências de autenticação, upload direto de fotos e visualização de timeline.
* [**Registro de Decisões (ADRs)** (`decisions.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions.md): Catálogo de todas as Architectural Decision Records.

### 3. Backend ([`docs/backend/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/))
* [**Arquitetura do Backend** (`architecture.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/architecture.md): Organização interna do Fastify, injeção de dependência e ciclo de vida.
* [**Módulos e Serviços** (`modules.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/modules.md): Responsabilidades, interfaces de serviço e eventos internos.
* [**Padrões da API** (`api.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/api.md): Formato REST, envelope de resposta, headers e boas práticas.
* [**Autenticação** (`authentication.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/authentication.md): Estratégia de Access Token (JWT curto) + Refresh Token no banco com rotação.
* [**Autorização** (`authorization.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/authorization.md): Controle de acesso baseado em dono (Owner) e papéis de compartilhamento.
* [**Tratamento de Erros** (`errors.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/errors.md): Hierarquia de erros RFC 7807 e respostas consistentes.
* [**Armazenamento de Mídia** (`storage.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/storage.md): Contrato `StorageProvider`, URLs pré-assinadas para MinIO/S3.

### 4. Frontend Web ([`docs/frontend/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/frontend/))
* [**Arquitetura Frontend** (`architecture.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/frontend/architecture.md): Next.js App Router estruturado por features (`src/features/*`).
* [**Roteamento** (`routing.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/frontend/routing.md): Rotas públicas, autenticadas e páginas dinâmicas.
* [**Gerenciamento de Estado** (`state-management.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/frontend/state-management.md): TanStack Query (server state), Zustand (client UI state).
* [**Princípios de UI & Design** (`ui-principles.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/frontend/ui-principles.md): Tailwind CSS, tipografia, mapa gratuito (MapLibre), micro-interações.

### 5. Mobile ([`docs/mobile/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/mobile/))
* [**Arquitetura Mobile** (`architecture.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/mobile/architecture.md): React Native e organização em camadas.
* [**Navegação** (`navigation.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/mobile/navigation.md): Fluxo de navegação (Auth Stack, Main Tabs, Modals de criação).
* [**Estratégia Offline-First** (`offline.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/mobile/offline.md): Armazenamento local SQLite, fila de sincronização e reconciliação.
* [**Permissões e Sensores** (`permissions.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/mobile/permissions.md): Câmera, galeria de fotos e geolocalização com fallback gracioso.

### 6. Banco de Dados ([`docs/database/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/database/))
* [**Schema Relacional** (`schema.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/database/schema.md): DDL completo, tabelas, campos, constraints e tipos de dados.
* [**Relacionamentos e Cardinalidade** (`relationships.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/database/relationships.md): Diagramas ER e regras de integridade referencial (`ON DELETE CASCADE`).
* [**Indexação e Performance** (`indexing.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/database/indexing.md): Índices B-tree compostos para timeline e consultas geográficas sem overhead.

### 7. Infraestrutura & DevOps ([`docs/infrastructure/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/))
* [**Guia de Deploy em VPS** (`deployment.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/deployment.md): Passo a passo para provisionamento em VPS de $5-$10 com Docker Compose.
* [**Containers Docker** (`docker.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/docker.md): Configurações de containers e limites rigorosos de memória (<= 500MB total).
* [**Variáveis de Ambiente** (`environment.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/environment.md): Dicionário detalhado de todas as variáveis do sistema.
* [**Rotinas de Backup** (`backups.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/backups.md): Estratégia 3-2-1 para PostgreSQL (`pg_dump`) e MinIO (mirror).
* [**Monitoramento e Observabilidade** (`monitoring.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/infrastructure/monitoring.md): Health check, Readiness check e logs estruturados em JSON via Pino.

### 8. API & Contratos ([`docs/api/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/api/))
* [**Convenções da API** (`conventions.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/api/conventions.md): Paginação, ordenação, filtros, códigos de status e versionamento.
* [**Endpoints da API** (`endpoints.md`)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/api/endpoints.md): Especificação completa dos contratos HTTP (Request/Response) de cada recurso.

---

## 📌 Regras para Alterações

Qualquer mudança que altere contratos, schemas de banco ou comportamento entre módulos deve:
1. Ser documentada primeiro na seção correspondente de `docs/`.
2. Registrar um ADR em `docs/architecture/decisions/` caso envolva decisão técnica relevante.
3. Ser revisada e aprovada pelo **Arquiteto Principal** antes da execução no código.
