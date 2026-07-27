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
	Name               string          `json:"name"`
	ClassName          string          `json:"className"`
	ClassSrc           string          `json:"classSource"`
	Level              int             `json:"level"`
	Source             string          `json:"source"`
	Entries            json.RawMessage `json:"entries"`
	SubclassShortName  string          `json:"subclassShortName"`
}

type fiveEClassFile struct {
	Class           []map[string]any   `json:"class"`
	ClassFeature    []fiveEFeature     `json:"classFeature"`
	Subclass        []map[string]any   `json:"subclass"`
	SubclassFeature json.RawMessage    `json:"subclassFeature"`
}

type fiveESubclassFeature struct {
	Name               string          `json:"name"`
	SubclassShortName  string          `json:"subclassShortName"`
	Level              int             `json:"level"`
	Source             string          `json:"source"`
	Entries            json.RawMessage `json:"entries"`
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
		base := entry.Name()
		if strings.HasPrefix(base, "fluff-") || base == "index.json" || base == "foundry.json" {
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

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return fmt.Errorf("parse top-level %s: %w", path, err)
	}

	var classes []map[string]any
	if err := json.Unmarshal(raw["class"], &classes); err != nil {
		return fmt.Errorf("parse class array: %w", err)
	}
	if len(classes) == 0 {
		return nil
	}

	className := classes[0]["name"].(string)
	classID := strings.ToLower(className)

	var classFeatures []fiveEFeature
	if cf, ok := raw["classFeature"]; ok {
		if err := json.Unmarshal(cf, &classFeatures); err != nil {
			return fmt.Errorf("parse classFeature: %w", err)
		}
	}

	var classExists bool
	if err := db.QueryRow("SELECT 1 FROM classes WHERE id = ?", classID).Scan(&classExists); err != nil {
		classExists = false
	}

	if !classExists {
		return nil
	}

	for _, feat := range classFeatures {
		featureID := fmt.Sprintf("class.%s.%s", classID, kebabCase(feat.Name))
		entriesJSON, _ := json.Marshal(feat.Entries)
		_, err := db.Exec(`
			INSERT INTO class_features (id, class_id, name, level, source, entries_json)
			VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				entries_json = COALESCE(NULLIF(entries_json, ''), excluded.entries_json),
				source = excluded.source
		`, featureID, classID, feat.Name, feat.Level, feat.Source, string(entriesJSON))
		if err != nil {
			return fmt.Errorf("upsert feature %s: %w", featureID, err)
		}
	}

	var subclasses []map[string]any
	if err := json.Unmarshal(raw["subclass"], &subclasses); err != nil {
		return fmt.Errorf("parse subclass array: %w", err)
	}

	var subclassFeatures []fiveESubclassFeature
	if srf, ok := raw["subclassFeature"]; ok {
		if err := json.Unmarshal(srf, &subclassFeatures); err != nil {
			return fmt.Errorf("parse subclassFeature: %w", err)
		}
	}

	scFeaturesByShortName := map[string][]fiveESubclassFeature{}
	for _, sf := range subclassFeatures {
		key := sf.SubclassShortName
		scFeaturesByShortName[key] = append(scFeaturesByShortName[key], sf)
	}

	for _, sc := range subclasses {
		scName := sc["name"].(string)
		scID := strings.ToLower(strings.ReplaceAll(scName, " ", "-"))

		shortName := scName
		if sn, ok := sc["shortName"].(string); ok {
			shortName = sn
		}

		var subclassExists bool
		_ = db.QueryRow("SELECT 1 FROM subclasses WHERE id = ?", scID).Scan(&subclassExists)
		if !subclassExists {
			continue
		}

		features := scFeaturesByShortName[shortName]
		if features == nil {
			for _, key := range []string{scName, strings.ToLower(scName)} {
				if f := scFeaturesByShortName[key]; f != nil {
					features = f
					break
				}
			}
		}

		for _, feat := range features {
			featureID := fmt.Sprintf("subclass.%s.%s.%s", classID, scID, kebabCase(feat.Name))
			entriesJSON, _ := json.Marshal(feat.Entries)
			_, err := db.Exec(`
				INSERT INTO subclass_features (id, subclass_id, name, level, source, entries_json)
				VALUES (?, ?, ?, ?, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					name = excluded.name,
					entries_json = COALESCE(NULLIF(entries_json, ''), excluded.entries_json)
			`, featureID, scID, feat.Name, feat.Level, feat.Source, string(entriesJSON))
			if err != nil {
				return fmt.Errorf("upsert subclass feature %s: %w", featureID, err)
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
