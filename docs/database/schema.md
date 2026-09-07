# Schema do Banco de Dados Relacional — Diário de Viagens

Este documento apresenta a especificação completa do schema relacional no **PostgreSQL 16**, incluindo tipos de dados, chaves primárias, constraints, relacionamentos e colunas de auditoria.

---

## 1. Identificadores Primários (UUIDv7)

Todas as tabelas utilizam identificadores do tipo **UUIDv7**.
* O UUIDv7 combina um timestamp Unix de 48 bits com bits pseudoaleatórios.
* **Vantagens**: Ao contrário do UUIDv4 tradicional (que é puramente aleatório e fragmenta os índices B-Tree do PostgreSQL com alto custo de I/O), o UUIDv7 é naturalmente ordenável no tempo. Isso mantém as páginas do B-Tree compactadas e sequenciais, aumentando drasticamente a eficiência do cache `shared_buffers` da VPS.

---

## 2. Definição Completa das Tabelas (DDL)

```sql
-- Extensão para UUID se necessário (ou gerado nativamente no Node.js/Drizzle)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABELA: users
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'USER', -- 'USER', 'ADMIN'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- 2. TABELA: sessions (Refresh Tokens com Rotação)
-- =============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    device_name VARCHAR(120),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. TABELA: trips
-- =============================================================================
CREATE TABLE trips (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'ONGOING', 'COMPLETED'
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE', -- 'PRIVATE', 'UNLISTED', 'PUBLIC'
    cover_media_id UUID, -- Referência suave ou FK para tabela media
    share_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_trip_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- =============================================================================
-- 4. TABELA: destinations
-- =============================================================================
CREATE TABLE destinations (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    country VARCHAR(80) NOT NULL,
    country_code CHAR(2), -- Código ISO-3166-1 alpha-2 (ex.: 'FR', 'BR')
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    arrival_date DATE,
    departure_date DATE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. TABELA: trip_days
-- =============================================================================
CREATE TABLE trip_days (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    day_number INTEGER NOT NULL, -- Dia 1, Dia 2, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trip_day_date UNIQUE (trip_id, day_date)
);

-- =============================================================================
-- 6. TABELA: entries
-- =============================================================================
CREATE TABLE entries (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    trip_day_id UUID REFERENCES trip_days(id) ON DELETE SET NULL,
    title VARCHAR(150),
    content TEXT NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    category VARCHAR(20) NOT NULL DEFAULT 'JOURNAL', -- 'TRAVEL', 'FOOD', 'ACTIVITY', 'LODGING', 'JOURNAL'
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- 7. TABELA: locations
-- =============================================================================
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(80),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. TABELA: media
-- =============================================================================
CREATE TABLE media (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(60) NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    taken_at TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_UPLOAD', -- 'PENDING_UPLOAD', 'READY', 'FAILED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 9. TABELA: trip_shares (Colaboração e Acesso)
-- =============================================================================
CREATE TABLE trip_shares (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER', -- 'VIEWER', 'EDITOR'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_trip_share_user UNIQUE (trip_id, shared_with_user_id)
);
```
