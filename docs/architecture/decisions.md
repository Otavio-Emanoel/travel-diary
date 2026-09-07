# Registro de Decisões Arquiteturais (ADRs) — Diário de Viagens

Este catálogo indexa todas as **Architectural Decision Records (ADRs)** do projeto. As ADRs documentam o contexto, as opções avaliadas, a decisão tomada e as consequências para garantir rastreabilidade histórica das escolhas de engenharia.

---

## Índice de Decisões

| ADR | Título | Status | Data |
| :--- | :--- | :--- | :--- |
| [**ADR 001**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/001-modular-monolith.md) | Adoção da Arquitetura de Monólito Modular (*Modular Monolith*) | **Aprovado** | 2026-09-06 |
| [**ADR 002**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/002-postgresql-and-orm.md) | PostgreSQL 16 com Drizzle ORM (Eliminação do Prisma Engine) | **Aprovado** | 2026-09-06 |
| [**ADR 003**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/003-storage-presigned-urls.md) | Armazenamento S3-Compatible com Upload Direto via Presigned URLs | **Aprovado** | 2026-09-06 |
| [**ADR 004**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/004-authentication-jwt-refresh.md) | Autenticação Stateless (JWT curto) com Refresh Tokens Rotativos | **Aprovado** | 2026-09-06 |
| [**ADR 005**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/005-mobile-offline-sync.md) | Estratégia Mobile Offline-First com SQLite Local e Sync Queue | **Aprovado** | 2026-09-06 |
| [**ADR 006**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/006-monorepo-pnpm.md) | Estrutura de Monorepo com pnpm Workspaces | **Aprovado** | 2026-09-06 |
| [**ADR 007**](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions/007-lightweight-observability.md) | Observabilidade Leve via Fastify Pino e Health Checks | **Aprovado** | 2026-09-06 |

---

## Formato Padrão de uma ADR

Cada documento segue a estrutura:
1. **Título e Identificador**
2. **Status** (`Proposto`, `Aprovado`, `Substituído`)
3. **Contexto**: O problema ou desafio arquitetural que motivou a decisão.
4. **Opções Consideradas**: Alternativas técnicas avaliadas.
5. **Decisão**: A alternativa escolhida e a justificativa técnica.
6. **Consequências**: Benefícios, compromissos (*trade-offs*) e mitigações.
