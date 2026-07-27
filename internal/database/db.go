package database

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

func Open(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("database open: %w", err)
	}

	db.SetMaxOpenConns(1)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database ping: %w", err)
	}

	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		return nil, fmt.Errorf("enable wal: %w", err)
	}
	if _, err := db.Exec("PRAGMA foreign_keys=ON"); err != nil {
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	return db, nil
}

func Migrate(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS content_packs (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		version TEXT NOT NULL,
		license TEXT DEFAULT '',
		attribution TEXT DEFAULT '',
		installed_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS classes (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		hit_die TEXT NOT NULL,
		spellcaster INTEGER NOT NULL DEFAULT 0,
		subclass_level INTEGER NOT NULL DEFAULT 3,
		skill_choices INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS class_primary_abilities (
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		ability TEXT NOT NULL,
		PRIMARY KEY (class_id, ability)
	);

	CREATE TABLE IF NOT EXISTS class_saving_throws (
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		ability TEXT NOT NULL,
		PRIMARY KEY (class_id, ability)
	);

	CREATE TABLE IF NOT EXISTS class_skill_pool (
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		skill_id TEXT NOT NULL,
		choose_count INTEGER NOT NULL DEFAULT 1,
		PRIMARY KEY (class_id, skill_id)
	);

	CREATE TABLE IF NOT EXISTS class_levels (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		level INTEGER NOT NULL,
		prof_bonus INTEGER NOT NULL,
		feat TEXT DEFAULT '',
		UNIQUE(class_id, level)
	);

	CREATE TABLE IF NOT EXISTS class_features (
		id TEXT PRIMARY KEY,
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		level INTEGER NOT NULL,
		source TEXT DEFAULT '',
		entries_json TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS subclasses (
		id TEXT PRIMARY KEY,
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		description TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS subclass_features (
		id TEXT PRIMARY KEY,
		subclass_id TEXT NOT NULL REFERENCES subclasses(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		level INTEGER NOT NULL,
		source TEXT DEFAULT '',
		entries_json TEXT DEFAULT '',
		spell_list_json TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS feats (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		source TEXT DEFAULT '',
		prerequisites_json TEXT DEFAULT '',
		entries_json TEXT DEFAULT ''
	);

	CREATE TABLE IF NOT EXISTS metamagic_options (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		source TEXT DEFAULT '',
		description TEXT DEFAULT '',
		level INTEGER NOT NULL
	);

	CREATE TABLE IF NOT EXISTS class_asi_feats (
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		level INTEGER NOT NULL,
		choice_type TEXT NOT NULL DEFAULT 'asi', -- 'asi' | 'feat'
		ability_scores TEXT DEFAULT '[]', -- JSON array of ability score IDs
		feat_id TEXT DEFAULT '',
		PRIMARY KEY (class_id, level)
	);

	CREATE TABLE IF NOT EXISTS class_skill_proficiencies (
		class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
		skill_id TEXT NOT NULL,
		choose_count INTEGER NOT NULL DEFAULT 1,
		PRIMARY KEY (class_id, skill_id)
	);

	CREATE INDEX IF NOT EXISTS idx_class_features_class ON class_features(class_id, level);
	CREATE INDEX IF NOT EXISTS idx_class_levels_class ON class_levels(class_id, level);
	CREATE INDEX IF NOT EXISTS idx_subclasses_class ON subclasses(class_id);
	CREATE INDEX IF NOT EXISTS idx_subclass_features_subclass ON subclass_features(subclass_id, level);
	`
	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("schema migration: %w", err)
	}
	return nil
}
