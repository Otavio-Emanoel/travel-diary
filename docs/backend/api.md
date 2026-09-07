# Padrões da API REST — Diário de Viagens

Este documento estabelece as diretrizes de design, formatação de respostas, paginação e versionamento da API HTTP.

---

## 1. Convenções de URL e Versionamento

* **Prefixo Global**: Todas as rotas de negócio são versionadas sob `/api/v1/`.
* **Rotas de Infraestrutura**: `/health` e `/ready` residem na raiz para fácil consumo por load balancers e Docker health checks.
* **Pluralidade**: Nomes de recursos são substantivos no plural em minúsculas com hífens (`kebab-case`).
  - `/api/v1/trips`
  - `/api/v1/trips/:tripId/destinations`
  - `/api/v1/media/upload-url`

---

## 2. Métodos HTTP e Semântica

| Método | Uso | Resposta de Sucesso Típica |
| :--- | :--- | :--- |
| `GET` | Recuperar recursos ou coleções (idempotente) | `200 OK` |
| `POST` | Criar um novo recurso ou acionar uma ação complexa | `201 Created` ou `200 OK` |
| `PATCH` | Atualização parcial de campos de um recurso | `200 OK` |
| `PUT` | Substituição completa de um recurso | `200 OK` |
| `DELETE` | Remover um recurso | `204 No Content` |

---

## 3. Envelope Padronizado de Resposta

Para garantir previsibilidade para clientes Web e Mobile, todas as respostas seguem envelopes padronizados.

### 3.1 Resposta de Sucesso (Entidade Única)
```json
{
  "success": true,
  "data": {
    "id": "018e3a2b-7c4d-7a1b-9f0e-3c5b8e2a1b9f",
    "title": "Mochilão pela Patagônia",
    "startDate": "2026-11-01",
    "endDate": "2026-11-20",
    "status": "PLANNED",
    "createdAt": "2026-09-06T14:30:00.000Z"
  }
}
```

### 3.2 Resposta de Coleção Paginada (Cursor ou Offset)
```json
{
  "success": true,
  "data": [
    { "id": "018e3a2b...", "title": "Mochilão pela Patagônia" }
  ],
  "pagination": {
    "total": 12,
    "limit": 10,
    "offset": 0,
    "hasMore": true,
    "nextCursor": "018e3a2b-7c4d..."
  }
}
```

### 3.3 Resposta de Erro (RFC 7807 Inspirada)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Dados da requisição inválidos",
    "requestId": "req-9b8c7d6e",
    "details": [
      {
        "field": "startDate",
        "message": "A data de início não pode ser no passado"
      }
    ]
  }
}
```

---

## 4. Paginação, Filtros e Ordenação

* **Parâmetros Padrão**:
  - `limit`: Quantidade de itens retornados (padrão: `20`, máximo: `100`).
  - `cursor`: Identificador do último item para paginação baseada em cursor (alta performance em tabelas grandes).
  - `sortBy`: Campo de ordenação (ex.: `createdAt`, `startDate`).
  - `order`: Sentido (`asc` ou `desc`, padrão: `desc`).
* **Filtros**:
  - Parâmetros explícitos na query string: `/api/v1/trips?status=ONGOING&country=ARG`.
