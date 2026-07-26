package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"gopkg.in/yaml.v3"
)

func ProcessInbox(db *sql.DB, inboxDir string) error {
	processedDir := filepath.Join(inboxDir, "processed")
	failedDir := filepath.Join(inboxDir, "failed")

	for _, d := range []string{inboxDir, processedDir, failedDir} {
		if err := os.MkdirAll(d, 0755); err != nil {
			return fmt.Errorf("ensure directory %s: %w", d, err)
		}
	}

	entries, err := os.ReadDir(inboxDir)
	if err != nil {
		return fmt.Errorf("read inbox dir: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".yaml" {
			continue
		}
		srcPath := filepath.Join(inboxDir, entry.Name())
		if err := processInboxFile(db, srcPath, processedDir, failedDir); err != nil {
			log.Printf("inbox: failed to process %s: %v", entry.Name(), err)
		}
	}
	return nil
}

func processInboxFile(db *sql.DB, srcPath, processedDir, failedDir string) error {
	data, err := os.ReadFile(srcPath)
	if err != nil {
		moveFile(srcPath, filepath.Join(failedDir, filepath.Base(srcPath)))
		return fmt.Errorf("read file: %w", err)
	}

	var pack scontent.ContentPack
	if err := yaml.Unmarshal(data, &pack); err != nil {
		moveFile(srcPath, filepath.Join(failedDir, filepath.Base(srcPath)))
		return fmt.Errorf("parse yaml: %w", err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	for _, c := range pack.Classes {
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
			INSERT INTO classes (id, name, hit_die, spellcaster, subclass_level)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name=excluded.name, hit_die=excluded.hit_die,
				spellcaster=excluded.spellcaster, subclass_level=excluded.subclass_level
		`, string(c.ID), c.Name, string(c.HitDie), spellcaster, subclassLevel)
		if err != nil {
			return fmt.Errorf("inbox insert class %s: %w", c.ID, err)
		}
	}

	for _, f := range pack.Feats {
		_, err := tx.Exec(`
			INSERT INTO feats (id, name)
			VALUES (?, ?)
			ON CONFLICT(id) DO UPDATE SET name=excluded.name
		`, string(f.ID), f.Name)
		if err != nil {
			return fmt.Errorf("inbox insert feat %s: %w", f.ID, err)
		}
	}

	_, err = tx.Exec(`
		INSERT INTO content_packs (id, name, version, license, attribution)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			version=excluded.version, license=excluded.license
	`, pack.ID, pack.Name, pack.Version, pack.License, pack.Attribution)
	if err != nil {
		return fmt.Errorf("inbox insert pack: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	timestamp := time.Now().Format("20060102-150405")
	destName := fmt.Sprintf("%s-%s", timestamp, filepath.Base(srcPath))
	return moveFile(srcPath, filepath.Join(processedDir, destName))
}

func moveFile(src, dst string) error {
	if err := os.Rename(src, dst); err != nil {
		return fmt.Errorf("move %s -> %s: %w", src, dst, err)
	}
	return nil
}
