# Arquitetura do Aplicativo Mobile — Diário de Viagens

Este documento detalha o design de software e a organização interna do aplicativo móvel construído em **React Native** e **TypeScript**.

---

## 1. Visão Geral da Arquitetura em Camadas

O aplicativo mobile é projetado em torno de um modelo **Offline-First**, onde a interface interage prioritariamente com o banco de dados local (SQLite). A comunicação de rede é tratada como um processo de sincronização contínuo e em segundo plano.

```text
[ Telas e Componentes React Native ]
                 │
                 ▼
     [ Hooks de Domínio (Zustand / Hooks) ]
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
[ SQLite Local DB ]  [ Sync Engine (Fila de Ações) ]
                           │
                           ▼
                  [ API Client HTTP ]
                           │
                           ▼
                 [ Fastify API & MinIO ]
```

---

## 2. Estrutura de Diretórios

```text
apps/mobile/src/
├── app/                        # Ponto de entrada e providers nativos
├── navigation/                 # Configuração do React Navigation (Stacks, Tabs)
│
├── features/                   # Módulos de domínio
│   ├── auth/                   # Telas de login/registro e gestão de SecureStore
│   ├── trips/                  # Listagem de viagens e detalhes
│   ├── entries/                # Criação rápida de notas de diário
│   ├── media/                  # Seletor de fotos da galeria e captura de câmera
│   └── sync/                   # Motor de sincronização e processador de fila
│
├── database/                   # Camada de persistência local (SQLite)
│   ├── schema.ts               # DDL do banco local no celular
│   ├── migrations.ts           # Migrações locais
│   └── repositories/           # Repositórios locais de acesso rápido
│
├── services/                   # Clientes de rede e hardware
│   ├── api-client.ts           # Cliente HTTP configurado
│   ├── location-service.ts     # Wrapper para GPS nativo
│   └── camera-service.ts       # Wrapper para captura de imagem
│
└── components/                 # Componentes visuais reutilizáveis
    └── ui/                     # Botões, inputs, cards, ícones
```

---

## 3. Armazenamento Seguro de Credenciais

* **Chaves e Tokens**: O Access Token fica em memória volátil durante a execução. O Refresh Token é persistido no enclave de segurança nativo do sistema operacional (`Keychain` no iOS e `Keystore` no Android) através da biblioteca `expo-secure-store`.
* **Zero Dados Sensíveis em Plaintext**: Nenhuma senha ou segredo é gravado no SQLite comum ou em `AsyncStorage`.
