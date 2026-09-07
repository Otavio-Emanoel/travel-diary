# Diário de Viagens (Travel Diary)

Sistema completo, moderno e modular para registro de viagens, itinerários, diários de bordo, geolocalização e fotos, projetado para operar com altíssima eficiência de recursos em VPS de baixo custo.

---

## 🏗️ Arquitetura Geral

O projeto adota a arquitetura de **Monólito Modular (Modular Monolith)** no backend e aplicações clientes especializadas:

* **Backend**: Fastify + TypeScript (Modular Monolith por domínio de negócio)
* **Frontend Web**: Next.js (App Router) + TypeScript + Tailwind CSS
* **Mobile**: React Native + TypeScript (com arquitetura Offline-First)
* **Banco de Dados**: PostgreSQL 16 + Drizzle ORM
* **Armazenamento de Objetos (Fotos)**: S3-Compatible (MinIO para self-hosted) com uploads diretos via URLs pré-assinadas
* **Reverse Proxy & SSL**: Caddy (automático, leve e seguro)
* **Monorepo**: pnpm workspaces

---

## 📁 Estrutura do Repositório

```text
travel-diary/
├── apps/
│   ├── api/                    # Backend Fastify + TypeScript
│   ├── web/                    # Frontend Web Next.js
│   └── mobile/                 # Aplicativo Mobile React Native
│
├── packages/
│   ├── contracts/              # DTOs, validações Zod e schemas compartilhados
│   ├── types/                  # Tipos utilitários globais
│   └── config/                 # Configurações compartilhadas (ESLint, TS)
│
├── docs/                       # Documentação Arquitetural Viva (Documentation-First)
│   ├── product/                # Visão, requisitos e roadmap do produto
│   ├── architecture/           # Princípios, design de sistemas e ADRs
│   ├── backend/                # Detalhamento do monólito Fastify
│   ├── frontend/               # Arquitetura Next.js e UI
│   ├── mobile/                 # Arquitetura React Native e sync offline
│   ├── database/               # Modelo relacional, índices e DDL
│   ├── infrastructure/         # Docker, Caddy, backups e VPS deploy
│   └── api/                    # Convenções e catálogo de endpoints
│
├── infrastructure/
│   ├── docker/                 # Dockerfiles de produção e desenvolvimento
│   ├── caddy/                  # Configurações de proxy reverso e TLS
│   └── scripts/                # Scripts de backup e automação
│
├── docker-compose.yml          # Orquestração local dos serviços
├── pnpm-workspace.yaml         # Configuração de workspaces
└── package.json                # Root package.json
```

---

## 📚 Documentação Primeiro (*Documentation-First*)

Antes de qualquer implementação funcional, a arquitetura do sistema foi completamente analisada e documentada. Acesse o diretório [`docs/`](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/README.md) para explorar a especificação técnica completa:

* **[Visão do Produto](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/vision.md)**
* **[Requisitos do Sistema](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/requirements.md)**
* **[Visão Geral da Arquitetura](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/overview.md)**
* **[Decisões de Arquitetura (ADRs)](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/architecture/decisions.md)**
* **[Modelagem do Banco de Dados](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/database/schema.md)**
* **[Estratégia de Upload de Mídia](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/backend/storage.md)**
* **[Estratégia Offline Mobile](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/mobile/offline.md)**
* **[Roadmap de Implementação](file:///home/otavioemanoel/Documentos/Projetos/travel-diary/docs/product/roadmap.md)**
