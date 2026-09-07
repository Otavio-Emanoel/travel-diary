# Relacionamentos e Cardinalidade — Diário de Viagens

Este documento descreve as relações entre as entidades do banco de dados, integridade referencial e diagramas ER.

---

## 1. Diagrama de Entidade-Relacionamento (ER)

```mermaid
erDiagram
    users ||--o{ sessions : "possui"
    users ||--o{ trips : "cria"
    users ||--o{ media : "faz upload"
    users ||--o{ trip_shares : "convidado em"

    trips ||--o{ destinations : "inclui paradas"
    trips ||--o{ trip_days : "organiza dias"
    trips ||--o{ entries : "contém notas"
    trips ||--o{ trip_shares : "compartilha com"
    trips ||--o{ media : "contém fotos"

    trip_days ||--o{ entries : "agrupa cronologicamente"

    entries ||--o| locations : "possui geolocalização"
    entries ||--o{ media : "anexa fotos"

    users {
        UUID id PK
        string email UK
        string password_hash
        string name
        string role
    }

    trips {
        UUID id PK
        UUID user_id FK
        string title
        date start_date
        date end_date
        string status
        string visibility
    }

    destinations {
        UUID id PK
        UUID trip_id FK
        string name
        string country
        float latitude
        float longitude
        int order_index
    }

    trip_days {
        UUID id PK
        UUID trip_id FK
        date day_date
        int day_number
    }

    entries {
        UUID id PK
        UUID trip_id FK
        UUID trip_day_id FK
        string title
        text content
        datetime entry_time
        string category
    }

    locations {
        UUID id PK
        UUID entry_id FK
        string name
        float latitude
        float longitude
    }

    media {
        UUID id PK
        UUID user_id FK
        UUID trip_id FK
        UUID entry_id FK
        string storage_key UK
        string mime_type
        bigint size_bytes
        string status
    }
```

---

## 2. Cardinalidades Detalhadas

| Relação | Cardinalidade | Comportamento `ON DELETE` | Justificativa de Negócio |
| :--- | :---: | :--- | :--- |
| `users` → `trips` | **1 : N** | `CASCADE` | Se um usuário for excluído, todas as suas viagens são apagadas |
| `users` → `sessions` | **1 : N** | `CASCADE` | Sessões são invalidadas imediatamente na exclusão do usuário |
| `trips` → `destinations` | **1 : N** | `CASCADE` | Destinos pertencem ao itinerário exclusivo daquela viagem |
| `trips` → `trip_days` | **1 : N** | `CASCADE` | Dias são subdivisões temporais da viagem |
| `trips` → `entries` | **1 : N** | `CASCADE` | As notas de diário pertencem ao contexto da viagem |
| `trip_days` → `entries` | **1 : N** | `SET NULL` | Se um dia for removido, as entradas não são perdidas; voltam a ficar desassociadas |
| `entries` → `locations` | **1 : 1** | `CASCADE` | A coordenada geográfica é atributo direto daquela entrada |
| `entries` → `media` | **1 : N** | `SET NULL` | A foto permanece salva na galeria da viagem mesmo se o relato for excluído |
| `trips` → `trip_shares` | **1 : N** | `CASCADE` | Convites e compartilhamentos deixam de existir se a viagem for removida |

---

## 3. Política de Exclusão: Hard Delete vs Soft Delete

* **Hard Delete (`DELETE CASCADE`)**:
  - `sessions`: Excluídas fisicamente para não inflar a tabela de autenticação.
  - `locations`: Coordenadas de entradas apagadas são removidas fisicamente.
* **Soft Delete (`deleted_at`)**:
  - `users`: Preserva histórico para integridade de auditoria.
  - `trips` e `entries`: Recebem timestamp em `deleted_at`. Permite que o usuário desfaça exclusões acidentais na interface (*Undo / Lixeira*) por até 30 dias antes da limpeza definitiva.
