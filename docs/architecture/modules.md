# Módulos do Sistema — Diário de Viagens

Este documento detalha os limites de contexto (*Bounded Contexts*), as responsabilidades de cada módulo e as regras de comunicação entre eles na arquitetura de **Monólito Modular**.

---

## 1. Mapa de Módulos do Backend

```text
apps/api/src/modules/
├── auth/           # Autenticação, tokens JWT, sessões e criptografia de senhas
├── users/          # Perfil, preferências do usuário e avatar
├── trips/          # Ciclo de vida da viagem (criar, editar, status, datas)
├── destinations/   # Cidades, países e paradas do itinerário da viagem
├── entries/        # Relatos cronológicos, notas markdown e categorização
├── locations/      # Metadados geográficos (lat/lng, cidade, endereço)
├── media/          # Catálogo de fotos, geração de presigned URLs e storage
└── sharing/        # Controle de acesso compartilhado e links públicos
```

---

## 2. Responsabilidades por Módulo

### 2.1 Módulo `auth`
* **Responsabilidade**: Cadastro, autenticação com e-mail e senha, emissão e validação de tokens JWT de acesso, geração e rotação de refresh tokens.
* **Tabelas de Domínio**: `users`, `sessions`.
* **Interface Exposta**: `AuthService.verifyAccessToken(token)`, `AuthService.hashPassword(password)`.
* **Regra**: Não acessa dados de viagens nem de entradas.

### 2.2 Módulo `users`
* **Responsabilidade**: Consulta e atualização de dados cadastrais do viajante (nome, biografia, foto de perfil).
* **Interface Exposta**: `UserService.findById(userId)`, `UserService.updateProfile(userId, data)`.

### 2.3 Módulo `trips`
* **Responsabilidade**: Agregação principal do sistema. Gerencia título, descrição, datas de início/fim, foto de capa e status da viagem (`PLANNED`, `ONGOING`, `COMPLETED`).
* **Tabelas de Domínio**: `trips`, `trip_days`.
* **Interface Exposta**: `TripService.getTripById(tripId, userId)`, `TripService.assertUserIsOwner(tripId, userId)`.
* **Comunicação**: Quando uma viagem é excluída, emite evento interno ou invoca serviços para expurgar destinos, entradas e mídias associadas.

### 2.4 Módulo `destinations`
* **Responsabilidade**: Cadastro dos pontos macro de parada da viagem (ex.: "Paris, França", "Tóquio, Japão") com coordenadas de referência e ordem cronológica.
* **Tabelas de Domínio**: `destinations`.
* **Interface Exposta**: `DestinationService.listByTrip(tripId)`.

### 2.5 Módulo `entries`
* **Responsabilidade**: Registro das notas e memórias individuais associadas a um dia e a uma viagem.
* **Tabelas de Domínio**: `entries`.
* **Interface Exposta**: `EntryService.getTimelineByTrip(tripId)`, `EntryService.createEntry(...)`.
* **Comunicação**: Consulta `TripService.assertUserCanEdit(tripId, userId)` para autorização prévia.

### 2.6 Módulo `locations`
* **Responsabilidade**: Normalização e armazenamento de coordenadas geográficas (latitude, longitude, nome do local, país) associadas a entradas e destinos.
* **Tabelas de Domínio**: `locations`.
* **Interface Exposta**: `LocationService.saveEntryLocation(entryId, coords)`.

### 2.7 Módulo `media`
* **Responsabilidade**: Catálogo de arquivos de mídia, validação de tipos MIME permitidos, orquestração de URLs pré-assinadas para upload/download direto no MinIO/S3.
* **Tabelas de Domínio**: `media`.
* **Interface Exposta**: `MediaService.createUploadSession(...)`, `MediaService.confirmUpload(mediaId)`, `MediaService.deleteMedia(mediaId)`.
* **Regra**: Totalmente desacoplado do armazenamento físico via `StorageProvider`.

### 2.8 Módulo `sharing` (Fase Futura)
* **Responsabilidade**: Gestão de tokens públicos de compartilhamento (`share_token`), controle de permissões de leitura/escrita para viajantes convidados.
* **Tabelas de Domínio**: `trip_shares`.
* **Interface Exposta**: `SharingService.verifyShareAccess(shareToken, tripId)`.

---

## 3. Regras Estritas de Comunicação Entre Módulos

1. **Proibição de Acesso Direto a Repositórios Alheios**: O `EntryController` nunca pode importar o `TripRepository` ou fazer um `SELECT` direto na tabela `trips`. Ele deve obrigatoriamente chamar o método público `tripService.getTrip(id)`.
2. **Dependência Unidirecional**:
   - `entries` depende de `trips`.
   - `trips` NÃO depende de `entries`.
   - `media` não depende de `entries` (mídia recebe `entryId` apenas como metadado externo).
3. **Eventos de Domínio Internos**: Para efeitos colaterais assíncronos (ex.: recalcular estatísticas de uma viagem quando uma nova entrada é criada), utiliza-se o `EventEmitter` nativo do Node.js encapsulado em um `EventBus` tipado.
