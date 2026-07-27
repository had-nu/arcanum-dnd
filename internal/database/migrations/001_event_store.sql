-- Migration 001: Event Store & Snapshots
-- Created: 2026-07-27

-- ============================================================
-- EVENT STORE (append-only log)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id              TEXT PRIMARY KEY,           -- ULID
    aggregate_id    TEXT NOT NULL,
    aggregate_type  TEXT NOT NULL,
    type            TEXT NOT NULL,
    schema_version  INTEGER NOT NULL,
    payload         JSON NOT NULL,
    metadata        JSON DEFAULT '{}',
    occurred_at     TEXT NOT NULL,              -- RFC3339
    version         INTEGER NOT NULL,

    UNIQUE(aggregate_id, version)
);

CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_id, version);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON events(occurred_at);

-- ============================================================
-- SNAPSHOTS (cached aggregate state for fast replay)
-- ============================================================
CREATE TABLE IF NOT EXISTS snapshots (
    aggregate_id    TEXT PRIMARY KEY,
    aggregate_type  TEXT NOT NULL,
    version         INTEGER NOT NULL,
    state           JSON NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_type ON snapshots(aggregate_type);

-- ============================================================
-- CONTENT PACKS (metadata only - content lives in memory/YAML)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_packs (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    version         TEXT NOT NULL,
    hash            TEXT NOT NULL,      -- SHA-256 of pack
    license         TEXT DEFAULT '',
    attribution     TEXT DEFAULT '',
    installed_at    TEXT NOT NULL,
    is_active       INTEGER DEFAULT 1   -- boolean
);