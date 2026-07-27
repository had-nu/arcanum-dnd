-- Migration 002: Projections (Read Models)
-- Creates optimized read models for character sheets and campaign summaries

-- ============================================================
-- CHARACTER SHEETS (projeção otimizada para leitura)
-- ============================================================
CREATE TABLE IF NOT EXISTS character_sheets (
    character_id        TEXT PRIMARY KEY,
    campaign_id         TEXT,
    name                TEXT NOT NULL,
    level               INTEGER NOT NULL,
    classes_json        JSON NOT NULL,
    species_id          TEXT NOT NULL,
    background_id       TEXT NOT NULL,
    ability_scores      JSON NOT NULL,
    hp_current          INTEGER NOT NULL,
    hp_max              INTEGER NOT NULL,
    hp_temp             INTEGER DEFAULT 0,
    ac                  INTEGER NOT NULL,
    speed               INTEGER NOT NULL,
    initiative          INTEGER NOT NULL,
    proficiency_bonus   INTEGER NOT NULL,
    skills_json         JSON NOT NULL,
    saves_json          JSON NOT NULL,
    spells_json         JSON,
    conditions_json     JSON DEFAULT '[]',
    resources_json      JSON DEFAULT '{}',
    equipment_json      JSON DEFAULT '[]',
    event_version       INTEGER NOT NULL,  -- até qual versão do aggregate foi projetado
    updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sheets_campaign ON character_sheets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sheets_name ON character_sheets(name);
CREATE INDEX IF NOT EXISTS idx_sheets_event_version ON character_sheets(event_version);

-- ============================================================
-- CAMPAIGN SUMMARIES (projeção de campanha)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_summaries (
    campaign_id       TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    character_count   INTEGER DEFAULT 0,
    encounter_count   INTEGER DEFAULT 0,
    last_event_at     TEXT,
    event_version     INTEGER NOT NULL,
    updated_at        TEXT NOT NULL
);

-- ============================================================
-- ENCOUNTER SUMMARIES (projeção de encontro)
-- ============================================================
CREATE TABLE IF NOT EXISTS encounter_summaries (
    encounter_id      TEXT PRIMARY KEY,
    campaign_id       TEXT NOT NULL,
    name              TEXT NOT NULL,
    status            TEXT NOT NULL,  -- pending, active, ended
    round             INTEGER DEFAULT 1,
    current_turn      TEXT,
    event_version     INTEGER NOT NULL,
    updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_encounters_campaign ON encounter_summaries(campaign_id);