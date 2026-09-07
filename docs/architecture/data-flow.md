# Fluxos de Dados — Diário de Viagens

Este documento detalha os fluxos de dados ponta a ponta para as operações centrais do sistema, ilustrados com diagramas de sequência.

---

## 1. Fluxo de Autenticação e Rotação de Tokens

```mermaid
sequenceDiagram
    autonumber
    actor Client as Cliente (Web ou Mobile)
    participant API as Fastify API (Auth Module)
    participant DB as PostgreSQL (users, sessions)

    Note over Client,DB: 1. Login Inicial
    Client->>API: POST /api/v1/auth/login { email, password }
    API->>DB: Busca usuário por email
    DB-->>API: Retorna hash da senha
    API->>API: Valida hash Argon2id
    API->>DB: Cria registro de sessão com Refresh Token hash
    API-->>Client: 200 OK (AccessToken via JSON/Header, RefreshToken via Cookie HttpOnly ou SecureStore)

    Note over Client,DB: 2. Renovação de Token (Rotação)
    Client->>API: POST /api/v1/auth/refresh (envia RefreshToken)
    API->>DB: Busca sessão ativa pelo hash do token
    alt Sessão válida e não expirada
        API->>DB: Invalida token antigo e gera novo Refresh Token (Rotação)
        API-->>Client: 200 OK (Novo AccessToken + Novo RefreshToken)
    else Token reutilizado ou inválido
        API->>DB: Revoga toda a família de sessões do usuário (Detecção de Roubo)
        API-->>Client: 401 Unauthorized
    end
```

---

## 2. Fluxo de Upload Direto de Fotos (Presigned URLs)

Este fluxo garante que a API Fastify nunca processe buffers binários pesados de imagens, preservando CPU e memória da VPS.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Cliente (Web ou Mobile)
    participant API as Fastify API (Media Module)
    participant Storage as MinIO / S3 Storage
    participant DB as PostgreSQL (media)

    Client->>API: POST /api/v1/media/upload-url { tripId, entryId, filename, mimeType, size }
    API->>API: Valida tamanho (<= 15MB) e formato (JPEG, PNG, WebP)
    API->>Storage: Gera URL pré-assinada para PUT (expira em 10min)
    Storage-->>API: Retorna URL pré-assinada
    API->>DB: Insere registro em 'media' com status = 'PENDING_UPLOAD'
    API-->>Client: 201 Created { mediaId, uploadUrl, storageKey }

    Note over Client,Storage: Upload direto do binário sem passar pela API Fastify
    Client->>Storage: HTTP PUT [uploadUrl] (envia arquivo binário de imagem)
    Storage-->>Client: 200 OK (Upload concluído no bucket)

    Client->>API: POST /api/v1/media/{mediaId}/confirm
    API->>Storage: Verifica se o objeto existe no bucket
    Storage-->>API: Objeto confirmado (size, etag)
    API->>DB: Atualiza status da mídia para 'READY'
    API-->>Client: 200 OK { media: { id, status: 'READY', url } }
```

---

## 3. Fluxo de Criação e Visualização de Linha do Tempo

```mermaid
sequenceDiagram
    autonumber
    actor User as Viajante
    participant Client as Frontend Web / Mobile
    participant API as Fastify API (Entries & Trips)
    participant DB as PostgreSQL

    User->>Client: Acessa a viagem selecionada
    Client->>API: GET /api/v1/trips/{tripId}/timeline
    API->>DB: Consulta viagem + dias + entradas ordenadas por data + fotos associadas
    DB-->>API: Retorna estrutura agregada
    API-->>Client: 200 OK { trip, days: [...], entries: [...] }
    Client->>Client: Renderiza Linha do Tempo cronológica e traça marcadores no Mapa
```

---

## 4. Fluxo de Sincronização Mobile Offline-First

```mermaid
sequenceDiagram
    autonumber
    actor Traveler as Viajante (Sem Internet)
    participant MobileApp as App React Native
    participant LocalDB as SQLite Local
    participant NetWatcher as Monitor de Rede
    participant API as Fastify API
    participant Storage as MinIO / S3

    Traveler->>MobileApp: Escreve relato de viagem e anexa foto da câmera
    MobileApp->>LocalDB: Salva entrada com UUID temporário e sync_status = 'PENDING_CREATE'
    MobileApp->>LocalDB: Salva foto na galeria local e enfileira na SyncQueue
    MobileApp-->>Traveler: Feedback instantâneo (Entrada visível localmente com ícone de pendente)

    Note over Traveler,NetWatcher: Viajante chega ao hotel e conecta ao Wi-Fi
    NetWatcher->>MobileApp: Evento de conexão detectado ('CONNECTED')
    
    MobileApp->>LocalDB: Lê itens pendentes na SyncQueue (FIFO)
    
    loop Para cada foto pendente
        MobileApp->>API: Requisita URL pré-assinada
        API-->>MobileApp: Retorna presigned URL
        MobileApp->>Storage: Upload direto do arquivo
        MobileApp->>API: Confirma upload
    end

    loop Para cada entrada pendente
        MobileApp->>API: POST /api/v1/trips/{tripId}/entries (com dados e IDs de mídia)
        API-->>MobileApp: 201 Created (ID definitivo do servidor)
        MobileApp->>LocalDB: Atualiza registro com ID do servidor e sync_status = 'SYNCED'
    end

    MobileApp-->>Traveler: Ícone de sincronização atualizado para 'Concluído'
```
