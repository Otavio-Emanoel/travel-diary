# Catálogo de Endpoints da API — Diário de Viagens

Este documento descreve detalhadamente todos os endpoints HTTP expostos pela API Fastify, seus métodos, requisitos de autenticação e contratos de payload.

---

## 1. Módulo de Autenticação (`/api/v1/auth`)

### 1.1 `POST /api/v1/auth/register`
* **Autenticação**: Não requer
* **Request Body**:
```json
{
  "email": "viajante@exemplo.com",
  "password": "SenhaForte@2026",
  "name": "Lucas Silva"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "018e3a2b-7c4d-7a1b-9f0e-3c5b8e2a1b9f",
      "email": "viajante@exemplo.com",
      "name": "Lucas Silva"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### 1.2 `POST /api/v1/auth/login`
* **Autenticação**: Não requer
* **Request Body**:
```json
{
  "email": "viajante@exemplo.com",
  "password": "SenhaForte@2026"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "018e3a2b...", "email": "viajante@exemplo.com", "name": "Lucas Silva" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```
*(Nota: O Refresh Token é retornado via Cookie HttpOnly no navegador ou no corpo JSON para o app mobile).*

### 1.3 `POST /api/v1/auth/refresh`
* **Autenticação**: Refresh Token (via Cookie ou Body `{ "refreshToken": "..." }`)
* **Response (200 OK)**: Novo par de tokens.

### 1.4 `POST /api/v1/auth/logout`
* **Autenticação**: Requer
* **Response (200 OK)**: `{ "success": true, "message": "Sessão encerrada com sucesso." }`

### 1.5 `GET /api/v1/auth/me`
* **Autenticação**: Bearer Token
* **Response (200 OK)**: Perfil do usuário logado.

---

## 2. Módulo de Viagens (`/api/v1/trips`)

### 2.1 `GET /api/v1/trips`
* **Autenticação**: Bearer Token
* **Query Params**: `status`, `limit`, `cursor`, `order`
* **Response (200 OK)**: Lista paginada de viagens do usuário logado.

### 2.2 `POST /api/v1/trips`
* **Autenticação**: Bearer Token
* **Request Body**:
```json
{
  "title": "Mochilão pela Patagônia",
  "description": "Explorando montanhas e glaciares no sul da Argentina e Chile",
  "startDate": "2026-11-01",
  "endDate": "2026-11-20",
  "status": "PLANNED",
  "visibility": "PRIVATE"
}
```
* **Response (201 Created)**: Dados da viagem criada com ID.

### 2.3 `GET /api/v1/trips/:id`
* **Autenticação**: Bearer Token (ou público se viagem pública)
* **Response (200 OK)**: Detalhes da viagem com lista de destinos.

### 2.4 `PATCH /api/v1/trips/:id`
* **Autenticação**: Bearer Token (Owner)
* **Request Body**: Campos parciais a atualizar (`title`, `description`, `coverMediaId`, etc.).
* **Response (200 OK)**: Viagem atualizada.

### 2.5 `DELETE /api/v1/trips/:id`
* **Autenticação**: Bearer Token (Owner)
* **Response (204 No Content)**

### 2.6 `GET /api/v1/trips/:id/timeline`
* **Autenticação**: Bearer Token
* **Response (200 OK)**: Estrutura agregada da viagem com dias (`trip_days`), entradas (`entries`) ordenadas e suas mídias.

### 2.7 `GET /api/v1/trips/:id/map-points`
* **Autenticação**: Bearer Token
* **Response (200 OK)**: Lista de coordenadas geográficas para renderização do mapa e rotas.

---

## 3. Módulo de Destinos (`/api/v1/trips/:tripId/destinations`)

### 3.1 `POST /api/v1/trips/:tripId/destinations`
* **Autenticação**: Bearer Token (Owner/Editor)
* **Request Body**:
```json
{
  "name": "Bariloche",
  "country": "Argentina",
  "countryCode": "AR",
  "latitude": -41.1335,
  "longitude": -71.3103,
  "arrivalDate": "2026-11-02",
  "departureDate": "2026-11-07",
  "orderIndex": 0
}
```
* **Response (201 Created)**

### 3.2 `DELETE /api/v1/destinations/:id`
* **Autenticação**: Bearer Token (Owner/Editor)
* **Response (204 No Content)**

---

## 4. Módulo de Entradas de Diário (`/api/v1/entries` & `/api/v1/trips/:tripId/entries`)

### 4.1 `POST /api/v1/trips/:tripId/entries`
* **Autenticação**: Bearer Token (Owner/Editor)
* **Request Body**:
```json
{
  "title": "Subida ao Cerro Campanario",
  "content": "A vista lá de cima é surreal! Subimos de teleférico e tomamos um chocolate quente.",
  "entryTime": "2026-11-03T15:30:00.000Z",
  "category": "ACTIVITY",
  "tripDayId": "018e3a2b-...",
  "location": {
    "name": "Cerro Campanario",
    "latitude": -41.0742,
    "longitude": -71.4589,
    "city": "Bariloche",
    "country": "Argentina"
  },
  "mediaIds": ["018e3a2b-media-1", "018e3a2b-media-2"]
}
```
* **Response (201 Created)**: Entrada criada e associada aos pontos e fotos.

### 4.2 `GET /api/v1/entries/:id`
* **Autenticação**: Bearer Token
* **Response (200 OK)**: Detalhes da entrada com fotos e geolocalização.

### 4.3 `PATCH /api/v1/entries/:id`
* **Autenticação**: Bearer Token (Owner/Editor)
* **Response (200 OK)**: Entrada atualizada.

### 4.4 `DELETE /api/v1/entries/:id`
* **Autenticação**: Bearer Token (Owner/Editor)
* **Response (204 No Content)**

---

## 5. Módulo de Mídia (`/api/v1/media`)

### 5.1 `POST /api/v1/media/upload-url`
* **Autenticação**: Bearer Token
* **Request Body**:
```json
{
  "tripId": "018e3a2b-...",
  "entryId": "018e3a2b-...",
  "filename": "cerro_topo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 3450120
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "mediaId": "018e3a2b-media-99",
    "uploadUrl": "http://localhost:9000/travel-diary-media/users/u-1/trips/t-1/photos/018e3a2b-media-99.jpg?X-Amz-Algorithm=...",
    "storageKey": "users/u-1/trips/t-1/photos/018e3a2b-media-99.jpg",
    "expiresInSeconds": 600
  }
}
```

### 5.2 `POST /api/v1/media/:id/confirm`
* **Autenticação**: Bearer Token
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "018e3a2b-media-99",
    "status": "READY",
    "publicUrl": "http://localhost:9000/travel-diary-media/users/u-1/trips/t-1/photos/018e3a2b-media-99.jpg"
  }
}
```

### 5.3 `DELETE /api/v1/media/:id`
* **Autenticação**: Bearer Token (Owner)
* **Response (204 No Content)**

---

## 6. Endpoints de Infraestrutura

* `GET /health`: Liveness probe (retorna `200 OK`).
* `GET /ready`: Readiness probe (retorna `200 OK` se PostgreSQL e MinIO estiverem saudáveis).
