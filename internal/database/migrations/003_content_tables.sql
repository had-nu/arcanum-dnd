-- Migration 003: Content Tables (rules data from data/ YAML)
-- Order: independent tables first, then dependent tables with FKs.

-- ============================================================
-- SPELLS (referenced by class_level_spells, subclass_prepared_spells)
-- ============================================================
CREATE TABLE IF NOT EXISTS spells (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    level           INTEGER NOT NULL CHECK(level BETWEEN 0 AND 9),
    school          TEXT NOT NULL,
    casting_time    TEXT DEFAULT '',
    range           TEXT DEFAULT '',
    verbal          INTEGER DEFAULT 0,
    somatic         INTEGER DEFAULT 0,
    material        INTEGER DEFAULT 0,
    material_desc   TEXT DEFAULT '',
    material_cost   INTEGER,
    duration        TEXT DEFAULT '',
    concentration   INTEGER DEFAULT 0,
    ritual          INTEGER DEFAULT 0,
    damage_type     TEXT DEFAULT '',
    damage_dice     TEXT DEFAULT '',
    damage_per_slot TEXT DEFAULT '',
    save_ability    TEXT DEFAULT '',
    attack          INTEGER DEFAULT 0,
    healing         TEXT DEFAULT '',
    description     TEXT DEFAULT '',
    source          TEXT DEFAULT 'SRD 5.2'
);

CREATE INDEX IF NOT EXISTS idx_spells_level ON spells(level);
CREATE INDEX IF NOT EXISTS idx_spells_school ON spells(school);

-- ============================================================
-- FEATS (referenced by backgrounds, class_levels)
-- ============================================================
CREATE TABLE IF NOT EXISTS feats (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    description       TEXT DEFAULT '',
    prereq_level      INTEGER,
    prereq_ability    TEXT,
    prereq_ability_min INTEGER,
    prereq_feat       TEXT,
    prereq_class      TEXT,
    prereq_spellcasting INTEGER DEFAULT 0,
    prereq_proficiency TEXT,
    replaces_id       TEXT,
    source            TEXT DEFAULT 'SRD 5.2'
);

CREATE TABLE IF NOT EXISTS feat_effects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    feat_id         TEXT NOT NULL REFERENCES feats(id) ON DELETE CASCADE,
    effect_kind     TEXT NOT NULL,
    details_json    TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_feat_effects_feat ON feat_effects(feat_id);

-- ============================================================
-- CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conditions (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    effects_json    TEXT DEFAULT '[]'
);

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    type              TEXT NOT NULL,
    subtype           TEXT DEFAULT '',
    rarity            TEXT DEFAULT '',
    value             INTEGER DEFAULT 0,
    weight            REAL DEFAULT 0,
    attunement        TEXT DEFAULT '',
    description       TEXT DEFAULT '',
    weapon_damage     TEXT DEFAULT '',
    weapon_damage_type TEXT DEFAULT '',
    weapon_mastery    TEXT DEFAULT '',
    weapon_range      INTEGER,
    weapon_long_range INTEGER,
    armor_base_ac     INTEGER DEFAULT 0,
    armor_dex_bonus   INTEGER DEFAULT 0,
    armor_dex_max     INTEGER,
    armor_strength_min INTEGER,
    armor_stealth_disadv INTEGER DEFAULT 0,
    source            TEXT DEFAULT 'SRD 5.2'
);

CREATE TABLE IF NOT EXISTS item_properties (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id         TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    property        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_effects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id         TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    effect_kind     TEXT NOT NULL,
    details_json    TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_item_properties_item ON item_properties(item_id);
CREATE INDEX IF NOT EXISTS idx_item_effects_item ON item_effects(item_id);

-- ============================================================
-- SPECIES
-- ============================================================
CREATE TABLE IF NOT EXISTS species (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    size            TEXT NOT NULL DEFAULT 'Medium',
    speed_walk      INTEGER NOT NULL DEFAULT 30,
    speed_fly       INTEGER DEFAULT 0,
    speed_swim      INTEGER DEFAULT 0,
    speed_climb     INTEGER DEFAULT 0,
    creature_type   TEXT NOT NULL DEFAULT 'humanoid',
    ability_str     INTEGER DEFAULT 0,
    ability_dex     INTEGER DEFAULT 0,
    ability_con     INTEGER DEFAULT 0,
    ability_int     INTEGER DEFAULT 0,
    ability_wis     INTEGER DEFAULT 0,
    ability_cha     INTEGER DEFAULT 0,
    source          TEXT DEFAULT 'SRD 5.2'
);

CREATE TABLE IF NOT EXISTS species_languages (
    species_id      TEXT NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    language        TEXT NOT NULL,
    PRIMARY KEY (species_id, language)
);

CREATE TABLE IF NOT EXISTS species_traits (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id      TEXT NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    trait_kind      TEXT NOT NULL,
    handler_id      TEXT DEFAULT '',
    details_json    TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_species_traits_species ON species_traits(species_id);

CREATE TABLE IF NOT EXISTS species_variants (
    id              TEXT NOT NULL,
    species_id      TEXT NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    size            TEXT,
    speed_walk      INTEGER,
    speed_fly       INTEGER,
    speed_swim      INTEGER,
    speed_climb     INTEGER,
    ability_str     INTEGER,
    ability_dex     INTEGER,
    ability_con     INTEGER,
    ability_int     INTEGER,
    ability_wis     INTEGER,
    ability_cha     INTEGER,
    languages_json  TEXT DEFAULT '[]',
    traits_json     TEXT DEFAULT '[]',
    spellcasting    TEXT,
    PRIMARY KEY (id, species_id)
);

CREATE INDEX IF NOT EXISTS idx_species_variants_species ON species_variants(species_id);

-- ============================================================
-- BACKGROUNDS (references feats)
-- ============================================================
CREATE TABLE IF NOT EXISTS backgrounds (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    feat_id         TEXT REFERENCES feats(id),
    source          TEXT DEFAULT 'SRD 5.2'
);

CREATE TABLE IF NOT EXISTS background_skills (
    background_id   TEXT NOT NULL REFERENCES backgrounds(id) ON DELETE CASCADE,
    skill           TEXT NOT NULL,
    PRIMARY KEY (background_id, skill)
);

CREATE TABLE IF NOT EXISTS background_tools (
    background_id   TEXT NOT NULL REFERENCES backgrounds(id) ON DELETE CASCADE,
    tool            TEXT NOT NULL,
    PRIMARY KEY (background_id, tool)
);

CREATE TABLE IF NOT EXISTS background_languages (
    background_id   TEXT NOT NULL REFERENCES backgrounds(id) ON DELETE CASCADE,
    language        TEXT NOT NULL,
    PRIMARY KEY (background_id, language)
);

CREATE TABLE IF NOT EXISTS background_ability_options (
    background_id   TEXT NOT NULL REFERENCES backgrounds(id) ON DELETE CASCADE,
    ability         TEXT NOT NULL,
    PRIMARY KEY (background_id, ability)
);

CREATE TABLE IF NOT EXISTS background_traits (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    background_id   TEXT NOT NULL REFERENCES backgrounds(id) ON DELETE CASCADE,
    trait_kind      TEXT NOT NULL,
    handler_id      TEXT DEFAULT '',
    details_json    TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_background_skills_bg ON background_skills(background_id);

-- ============================================================
-- CLASSES (references no other tables itself)
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    hit_die           TEXT NOT NULL,
    subclass_level    INTEGER NOT NULL DEFAULT 3,
    spellcasting_type TEXT DEFAULT '',
    spellcasting_ability TEXT DEFAULT '',
    prepared_formula  TEXT DEFAULT '',
    ritual_casting    INTEGER DEFAULT 0,
    source            TEXT DEFAULT 'SRD 5.2'
);

CREATE TABLE IF NOT EXISTS class_primary_abilities (
    class_id        TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    ability         TEXT NOT NULL,
    PRIMARY KEY (class_id, ability)
);

CREATE TABLE IF NOT EXISTS class_saving_throws (
    class_id        TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    ability         TEXT NOT NULL,
    PRIMARY KEY (class_id, ability)
);

CREATE TABLE IF NOT EXISTS class_proficiencies (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id        TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    category        TEXT NOT NULL,
    item            TEXT DEFAULT '',
    skill_choose    INTEGER DEFAULT 0,
    skill_from      TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS class_levels (
    class_id        TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    level           INTEGER NOT NULL CHECK(level BETWEEN 1 AND 20),
    prof_bonus      INTEGER NOT NULL,
    cantrips_known  INTEGER DEFAULT 0,
    spells_known    INTEGER DEFAULT 0,
    prepared_spells INTEGER DEFAULT 0,
    feat_id         TEXT DEFAULT '',
    PRIMARY KEY (class_id, level)
);

CREATE TABLE IF NOT EXISTS class_level_slots (
    class_id        TEXT NOT NULL,
    level           INTEGER NOT NULL,
    slot_level      INTEGER NOT NULL CHECK(slot_level BETWEEN 1 AND 9),
    slot_count      INTEGER NOT NULL,
    PRIMARY KEY (class_id, level, slot_level),
    FOREIGN KEY (class_id, level) REFERENCES class_levels(class_id, level) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_level_spells (
    class_id        TEXT NOT NULL,
    level           INTEGER NOT NULL,
    spell_id        TEXT NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, level, spell_id),
    FOREIGN KEY (class_id, level) REFERENCES class_levels(class_id, level) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_features (
    id              TEXT PRIMARY KEY,
    class_id        TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    level           INTEGER NOT NULL,
    details_json    TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_class_levels_class ON class_levels(class_id, level);
CREATE INDEX IF NOT EXISTS idx_class_level_slots_class ON class_level_slots(class_id, level);
CREATE INDEX IF NOT EXISTS idx_class_level_spells_class ON class_level_spells(class_id, level);
CREATE INDEX IF NOT EXISTS idx_class_features_class ON class_features(class_id);

-- ============================================================
-- SUBCLASSES (references classes)
-- ============================================================
CREATE TABLE IF NOT EXISTS subclasses (
    id                TEXT PRIMARY KEY,
    class_id          TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT DEFAULT '',
    spellcasting_ability TEXT DEFAULT '',
    prepared_formula  TEXT DEFAULT '',
    source            TEXT DEFAULT 'SRD 5.2'
);

CREATE TABLE IF NOT EXISTS subclass_features (
    id              TEXT PRIMARY KEY,
    subclass_id     TEXT NOT NULL REFERENCES subclasses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    level           INTEGER NOT NULL,
    details_json    TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS subclass_prepared_spells (
    subclass_id     TEXT NOT NULL REFERENCES subclasses(id) ON DELETE CASCADE,
    spell_level     INTEGER NOT NULL,
    spell_id        TEXT NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    PRIMARY KEY (subclass_id, spell_level, spell_id)
);

CREATE INDEX IF NOT EXISTS idx_subclasses_class ON subclasses(class_id);
CREATE INDEX IF NOT EXISTS idx_subclass_features_subclass ON subclass_features(subclass_id);
CREATE INDEX IF NOT EXISTS idx_subclass_prepared_spells_subclass ON subclass_prepared_spells(subclass_id);
