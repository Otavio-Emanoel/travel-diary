/**
 * Schema DDL do Banco SQLite Local no Smartphone (Offline-First)
 */

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS local_trips (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL,
    sync_status TEXT NOT NULL, -- 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE'
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS local_entries (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    entry_date TEXT NOT NULL,
    category TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    location_name TEXT,
    sync_status TEXT NOT NULL, -- 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE'
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'TRIP' | 'ENTRY' | 'MEDIA'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,      -- 'CREATE' | 'UPDATE' | 'DELETE'
    payload TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_media (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    local_file_uri TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    status TEXT NOT NULL,      -- 'PENDING_UPLOAD' | 'UPLOADING' | 'FAILED' | 'COMPLETED'
    created_at INTEGER NOT NULL
);
`;
