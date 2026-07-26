package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

func SeedFromYAML(db *sql.DB, content *scontent.ResolvedContent) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if err := seedClasses(tx, content); err != nil {
		return fmt.Errorf("seed classes: %w", err)
	}
	if err := seedFeats(tx, content); err != nil {
		return fmt.Errorf("seed feats: %w", err)
	}
	if err := seedContentPacks(tx); err != nil {
		return fmt.Errorf("seed content packs: %w", err)
	}

	return tx.Commit()
}

func seedClasses(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, c := range content.Classes {
		spellcaster := 0
		if c.Spellcasting != nil {
			spellcaster = 1
		}

		subclassLevel := 0
		for _, lvl := range c.Levels {
			for _, fid := range lvl.Features {
				fidStr := string(fid)
				if subclassLevel == 0 && len(fidStr) > 9 && fidStr[len(fidStr)-9:] == ".subclass" {
					subclassLevel = lvl.Level
				}
			}
		}

		_, err := tx.Exec(`
			INSERT INTO classes (id, name, hit_die, spellcaster, subclass_level, skill_choices)
			VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name=excluded.name, hit_die=excluded.hit_die,
				spellcaster=excluded.spellcaster, subclass_level=excluded.subclass_level,
				skill_choices=excluded.skill_choices
		`, string(c.ID), c.Name, string(c.HitDie), spellcaster, subclassLevel, 0)
		if err != nil {
			return fmt.Errorf("insert class %s: %w", c.ID, err)
		}

		for _, ab := range c.PrimaryAbility {
			_, _ = tx.Exec(`INSERT OR IGNORE INTO class_primary_abilities (class_id, ability) VALUES (?, ?)`, string(c.ID), string(ab))
		}
		for _, st := range c.SavingThrows {
			_, _ = tx.Exec(`INSERT OR IGNORE INTO class_saving_throws (class_id, ability) VALUES (?, ?)`, string(c.ID), string(st))
		}

		for lvl := 1; lvl <= 20; lvl++ {
			profBonus := ((lvl - 1) / 4) + 2
			feat := ""
			if lvl == 4 || lvl == 8 || lvl == 12 || lvl == 16 || lvl == 19 {
				feat = "ability-score-improvement"
			}

			_, _ = tx.Exec(`
				INSERT INTO class_levels (class_id, level, prof_bonus, feat)
				VALUES (?, ?, ?, ?)
				ON CONFLICT(class_id, level) DO UPDATE SET
					prof_bonus=excluded.prof_bonus, feat=excluded.feat
			`, string(c.ID), lvl, profBonus, feat)

			var featureIDs []types.FeatID
			for _, level := range c.Levels {
				if level.Level == lvl {
					featureIDs = append(featureIDs, level.Features...)
				}
			}

			for _, featID := range featureIDs {
				fidStr := string(featID)
				displayName := deriveFeatureName(fidStr)
				_, _ = tx.Exec(`
					INSERT INTO class_features (id, class_id, name, level)
					VALUES (?, ?, ?, ?)
					ON CONFLICT(id) DO NOTHING
				`, fidStr, string(c.ID), displayName, lvl)
			}
		}

		for _, sc := range c.SubClasses {
			_, err := tx.Exec(`
				INSERT INTO subclasses (id, class_id, name, description)
				VALUES (?, ?, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					name=excluded.name, description=excluded.description
			`, string(sc.ID), string(c.ID), sc.Name, sc.Description)
			if err != nil {
				return fmt.Errorf("insert subclass %s: %w", sc.ID, err)
			}
		}
	}
	return nil
}

func seedFeats(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, f := range content.Feats {
		prereqJSON := "[]"
		if f.Prerequisites != nil {
			p, _ := json.Marshal(f.Prerequisites)
			prereqJSON = string(p)
		}
		_, err := tx.Exec(`
			INSERT INTO feats (id, name, prerequisites_json)
			VALUES (?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET name=excluded.name, prerequisites_json=excluded.prerequisites_json
		`, string(f.ID), f.Name, prereqJSON)
		if err != nil {
			return fmt.Errorf("insert feat %s: %w", f.ID, err)
		}
	}
	return nil
}

func seedContentPacks(tx *sql.Tx) error {
	_, err := tx.Exec(`
		INSERT INTO content_packs (id, name, version, license, attribution)
		VALUES ('srd5.2-core', 'SRD 5.2 Core', '1.0.0', 'OGL', 'Wizards of the Coast')
		ON CONFLICT(id) DO NOTHING
	`)
	return err
}

func deriveFeatureName(featureID string) string {
	parts := strings.Split(featureID, ".")
	if len(parts) < 3 {
		return featureID
	}
	return strings.ReplaceAll(parts[len(parts)-1], "-", " ")
}
