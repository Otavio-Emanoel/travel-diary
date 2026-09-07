# Convenções e Diretrizes da API — Diário de Viagens

Este documento estabelece as convenções formais de nomenclatura, parâmetros de consulta, cabeçalhos HTTP e regras de paginação da API REST.

---

## 1. Nomenclatura e Formatação de URLs

* **URLs**: `kebab-case` no plural para recursos (ex.: `/api/v1/trip-days`, `/api/v1/media/upload-url`).
* **Propriedades JSON**: `camelCase` estrito em todas as requisições e respostas (ex.: `startDate`, `coverMediaId`, `orderIndex`).
* **Identificadores**: String no formato UUIDv7 canônico (`8-4-4-4-12`).

---

## 2. Cabeçalhos HTTP Padronizados

### 2.1 Cabeçalhos de Requisição
* `Authorization`: `Bearer <access_token>` para todas as rotas protegidas.
* `Content-Type`: `application/json` (obrigatório para requisições com corpo).
* `X-Request-Id`: Opcional no cliente. Se enviado, é repassado nos logs; se omitido, o Fastify gera um UUID único.

### 2.2 Cabeçalhos de Resposta
* `X-Request-Id`: O ID da requisição para facilitar auditoria e suporte.
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `RateLimit-Limit`: Quantidade máxima de requisições por janela.
* `RateLimit-Remaining`: Requisições restantes na janela atual.
* `RateLimit-Reset`: Segundos até o reset da janela.

---

## 3. Paginação, Filtros e Ordenação

### 3.1 Paginação por Offset / Cursor
* `limit`: Inteiro entre `1` e `100` (padrão: `20`).
* `offset`: Inteiro >= `0` (para paginação clássica em tabelas).
* `cursor`: String UUID do último registro para paginação contínua (estilo infinite scroll no mobile).

### 3.2 Filtros
Filtros são passados diretamente na query string:
* `/api/v1/trips?status=ONGOING`
* `/api/v1/entries?tripId=018e3a2b...&category=FOOD`

### 3.3 Ordenação
* `sortBy`: Nome do campo no schema (ex.: `startDate`, `createdAt`, `entryTime`).
* `order`: `asc` ou `desc` (padrão: `desc`).
