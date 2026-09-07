# Papéis dos Subagentes Especializados — Diário de Viagens

Este arquivo define os papéis, limites de escopo e responsabilidades dos **três subagentes especializados** autorizados para a fase de implementação do Diário de Viagens.

---

## 1. Agente Backend

* **Escopo de Atuação**:
  - `apps/api/`
  - `packages/contracts/`
  - `docs/database/`, `docs/backend/`, `docs/api/`
  - `infrastructure/docker/Dockerfile.api`, scripts de banco de dados e Caddy API routes.
* **Responsabilidades**:
  - Implementação da API Fastify 5 + TypeScript.
  - Implementação dos módulos do Monólito Modular (`auth`, `trips`, `destinations`, `entries`, `locations`, `media`, `sharing`).
  - Schemas Drizzle ORM e migrações no PostgreSQL 16.
  - Criptografia de senhas com Argon2id e rotação de Refresh Tokens.
  - Implementação da interface `StorageProvider` com `S3StorageProvider` e geração de URLs pré-assinadas.
  - Testes unitários de domínio e integração da API.
  - Garantia de observabilidade leve (Pino, `/health`, `/ready`).

---

## 2. Agente Frontend

* **Escopo de Atuação**:
  - `apps/web/`
  - `packages/contracts/` (apenas consumo de DTOs e schemas Zod)
  - `docs/frontend/`
* **Responsabilidades**:
  - Implementação da aplicação Next.js (App Router) + TypeScript + Tailwind CSS.
  - Organização do código orientada a features (`src/features/*`).
  - Telas de autenticação, dashboard de viagens, timeline interativa e galeria de fotos.
  - Integração do mapa interativo via MapLibre GL / Leaflet (sem custos de Google Maps API).
  - Gerenciamento de estado com TanStack Query v5 e Zustand.
  - Formulários com React Hook Form + ZodResolver do pacote de contratos.
  - Acessibilidade (a11y), design responsivo e micro-animações elegantes.

---

## 3. Agente Mobile

* **Escopo de Atuação**:
  - `apps/mobile/`
  - `packages/contracts/` (apenas consumo de DTOs e schemas Zod)
  - `docs/mobile/`
* **Responsabilidades**:
  - Implementação do aplicativo React Native + TypeScript.
  - Estrutura de navegação (React Navigation: Stacks, Tabs e botão central Quick Entry).
  - Implementação do motor Offline-First com SQLite local.
  - Fila de ações e mutações (`SyncQueue`) com resolução de conflitos Last Write Wins.
  - Fila de upload de fotos pendentes com retry em background.
  - Integração com sensores nativos (Câmera, Galeria de Fotos e GPS) com degradação graciosa.
  - Armazenamento de credenciais no SecureStore (Keychain / Keystore).

---

## 4. Governança pelo Agente Principal (Arquiteto)

* Os subagentes **NÃO** devem alterar arbitrariamente decisões arquiteturais documentadas em `/docs` ou ADRs.
* Se um subagente encontrar um bloqueio ou oportunidade de melhoria arquitetural, ele deve propor a alteração ao Agente Principal, atualizar a documentação e só então implementar.
