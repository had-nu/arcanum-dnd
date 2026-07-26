package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type fiveEFeature struct {
	Name      string          `json:"name"`
	ClassName string          `json:"className"`
	ClassSrc  string          `json:"classSource"`
	Level     int             `json:"level"`
	Source    string          `json:"source"`
	Entries   json.RawMessage `json:"entries"`
}

type fiveEClassFile struct {
	Class           []map[string]any              `json:"class"`
	ClassFeature    []fiveEFeature                `json:"classFeature"`
	Subclass        []map[string]any              `json:"subclass"`
	SubclassFeature map[string][]fiveEFeature     `json:"subclassFeature"`
}

func Import5eFeatures(db *sql.DB, dataDir string) error {
	classDir := filepath.Join(dataDir, "class")
	entries, err := os.ReadDir(classDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read 5etools class dir: %w", err)
	}

	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		path := filepath.Join(classDir, entry.Name())
		if err := importClassFile(db, path); err != nil {
			return fmt.Errorf("import %s: %w", entry.Name(), err)
		}
	}
	return nil
}

func importClassFile(db *sql.DB, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var file fiveEClassFile
	if err := json.Unmarshal(data, &file); err != nil {
		return fmt.Errorf("parse %s: %w", path, err)
	}

	if len(file.Class) == 0 {
		return nil
	}

	className := file.Class[0]["name"].(string)
	classID := strings.ToLower(className)

	for _, feat := range file.ClassFeature {
		featureID := fmt.Sprintf("class.%s.%s", classID, kebabCase(feat.Name))

		entriesJSON, _ := json.Marshal(feat.Entries)

		_, err := db.Exec(`
			INSERT INTO class_features (id, class_id, name, level, source, entries_json)
			VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				entries_json = COALESCE(NULLIF(entries_json, ''), excluded.entries_json),
				source = excluded.source
		`, featureID, classID, feat.Name, feat.Level, feat.Source, string(entriesJSON))
		if err != nil {
			return fmt.Errorf("upsert feature %s: %w", featureID, err)
		}
	}

	for _, sc := range file.Subclass {
		scName := sc["name"].(string)
		scID := strings.ToLower(strings.ReplaceAll(scName, " ", "-"))

		shortName := scName
		if sn, ok := sc["shortName"].(string); ok {
			shortName = sn
		}

		subclassID := fmt.Sprintf("%s.%s", classID, scID)

		scFeatures, hasFeatures := file.SubclassFeature[shortName]
		if !hasFeatures {
			scFeatures, hasFeatures = file.SubclassFeature[scName]
		}
		if !hasFeatures {
			scFeatures, hasFeatures = file.SubclassFeature[strings.ToLower(scName)]
		}

		if hasFeatures {
			for _, feat := range scFeatures {
				featureID := fmt.Sprintf("subclass.%s.%s.%s", classID, scID, kebabCase(feat.Name))
				entriesJSON, _ := json.Marshal(feat.Entries)
				_, err := db.Exec(`
					INSERT INTO subclass_features (id, subclass_id, name, level, source, entries_json)
					VALUES (?, ?, ?, ?, ?, ?)
					ON CONFLICT(id) DO UPDATE SET
						entries_json = COALESCE(NULLIF(entries_json, ''), excluded.entries_json)
				`, featureID, subclassID, feat.Name, feat.Level, feat.Source, string(entriesJSON))
				if err != nil {
					return fmt.Errorf("upsert subclass feature %s: %w", featureID, err)
				}
			}
		}
	}
	return nil
}

func kebabCase(s string) string {
	lower := strings.ToLower(s)
	replacer := strings.NewReplacer(
		" ", "-", "'", "", "/", "-",
		",", "", "(", "", ")", "",
		":", "", ".", "",
	)
	return replacer.Replace(lower)
}
