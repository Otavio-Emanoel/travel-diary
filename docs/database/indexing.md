# Estratégia de Indexação e Performance — Diário de Viagens

Este documento detalha os índices criados no **PostgreSQL 16**, a justificativa para cada índice e as rotinas de manutenção para evitar inchaço (*bloat*) na VPS.

---

## 1. Princípios de Indexação em VPS de Baixo Custo

Índices consomem memória em disco e em cache (`shared_buffers`). Índices redundantes ou mal planejados degradam a velocidade de escrita (`INSERT`/`UPDATE`) e desperdiçam RAM escassa.

* **Regra de Ouro**: Todo índice criado deve corresponder a uma query real do produto (listagens, filtros por usuário, renderização de linha do tempo e buscas por data).

---

## 2. Índices Criados

```sql
-- =============================================================================
-- 1. AUTENTICAÇÃO E USUÁRIOS
-- =============================================================================
-- Busca rápida no login
CREATE INDEX idx_users_email ON users(email);

-- Validação de refresh token no middleware e rotação
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- =============================================================================
-- 2. VIAGENS (TRIPS)
-- =============================================================================
-- Listagem de viagens do usuário ordenadas pela data mais recente
CREATE INDEX idx_trips_user_dates ON trips(user_id, start_date DESC) WHERE deleted_at IS NULL;

-- Busca por viagens públicas / links compartilhados
CREATE INDEX idx_trips_share_token ON trips(share_token) WHERE share_token IS NOT NULL;

-- =============================================================================
-- 3. DESTINOS (DESTINATIONS)
-- =============================================================================
-- Recuperação ordenada do itinerário de uma viagem
CREATE INDEX idx_destinations_trip_order ON destinations(trip_id, order_index ASC);

-- =============================================================================
-- 4. DIAS E ENTRADAS (TIMELINE QUERIES)
-- =============================================================================
-- Agrupamento de dias por viagem
CREATE INDEX idx_trip_days_trip_date ON trip_days(trip_id, day_date ASC);

-- Query principal da Linha do Tempo (todas as entradas de uma viagem ordenadas por tempo)
CREATE INDEX idx_entries_timeline ON entries(trip_id, entry_time ASC) WHERE deleted_at IS NULL;

-- Entradas por dia específico
CREATE INDEX idx_entries_day ON entries(trip_day_id) WHERE trip_day_id IS NOT NULL;

-- =============================================================================
-- 5. LOCALIZAÇÃO E MAPAS (BOUNDING BOX SEM POSTGIS)
-- =============================================================================
-- Como não instalamos a extensão pesada do PostGIS, usamos índice composto em latitude/longitude
-- Isso permite buscas retangulares rápidas (WHERE lat BETWEEN x AND y AND lng BETWEEN a AND b)
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_locations_entry_id ON locations(entry_id);

-- =============================================================================
-- 6. MÍDIA E STORAGE
-- =============================================================================
-- Fotos de uma viagem ou entrada específica
CREATE INDEX idx_media_trip_id ON media(trip_id) WHERE status = 'READY';
CREATE INDEX idx_media_entry_id ON media(entry_id) WHERE status = 'READY';
-- Limpeza de uploads pendentes expirados
CREATE INDEX idx_media_pending_cleanup ON media(created_at) WHERE status = 'PENDING_UPLOAD';
```

---

## 3. Explicação dos Índices Parciais (`WHERE clause`)

Observe que utilizamos **Índices Parciais** com frequência (ex.: `WHERE deleted_at IS NULL` ou `WHERE status = 'READY'`).

* **Benefício**: Um índice parcial armazena apenas as linhas que atendem à condição. Como 99% das consultas buscam dados ativos, o tamanho do índice no disco e na memória cai pela metade, tornando as leituras extremamente velozes sem ocupar a memória RAM da VPS.

---

## 4. Rotinas de Autovacuum e Manutenção

Para evitar inchaço da tabela de sessões e entradas:
* O PostgreSQL está configurado com `autovacuum_vacuum_scale_factor = 0.05` (executa vacuum quando 5% das linhas mudam).
* Um script semanal executa `REINDEX DATABASE travel_diary` em horário de baixo tráfego para manter as árvores B-Tree compactadas.
