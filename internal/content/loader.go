package contentpack

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"gopkg.in/yaml.v3"
)

func LoadAllFromDataDir(dataDir string) (scontent.ResolvedContent, error) {
	resolved := scontent.NewResolvedContent()
	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return resolved, fmt.Errorf("read data dir %s: %w", dataDir, err)
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		catDir := filepath.Join(dataDir, entry.Name())
		files, err := filepath.Glob(filepath.Join(catDir, "*.yaml"))
		if err != nil {
			return resolved, fmt.Errorf("glob %s: %w", catDir, err)
		}
		for _, f := range files {
			pack, err := LoadContentPack(f)
			if err != nil {
				log.Printf("WARN: skipping %s: %v", f, err)
				continue
			}
			merged, err := ResolveContent([]scontent.ContentPack{pack})
			if err != nil {
				log.Printf("WARN: merging %s: %v", f, err)
				continue
			}
			resolved = mergeResolved(resolved, merged)
		}
	}
	return resolved, nil
}

func LoadContentPack(path string) (scontent.ContentPack, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return scontent.ContentPack{}, fmt.Errorf("read content pack %s: %w", path, err)
	}

	var pack scontent.ContentPack
	if err := yaml.Unmarshal(data, &pack); err != nil {
		return scontent.ContentPack{}, fmt.Errorf("parse content pack %s: %w", path, err)
	}

	return pack, nil
}

func ResolveContent(packs []scontent.ContentPack) (scontent.ResolvedContent, error) {
	resolved := scontent.NewResolvedContent()

	for _, pack := range packs {
		for i := range pack.Species {
			s := pack.Species[i]
			if _, exists := resolved.Species[s.ID]; exists {
				return resolved, fmt.Errorf("duplicate species: %s", s.ID)
			}
			resolved.Species[s.ID] = &s
		}
		for i := range pack.Backgrounds {
			b := pack.Backgrounds[i]
			if _, exists := resolved.Backgrounds[b.ID]; exists {
				return resolved, fmt.Errorf("duplicate background: %s", b.ID)
			}
			resolved.Backgrounds[b.ID] = &b
		}
		for i := range pack.Classes {
			c := pack.Classes[i]
			if _, exists := resolved.Classes[c.ID]; exists {
				return resolved, fmt.Errorf("duplicate class: %s", c.ID)
			}
			resolved.Classes[c.ID] = &c
		}
		for i := range pack.Spells {
			s := pack.Spells[i]
			if _, exists := resolved.Spells[s.ID]; exists {
				return resolved, fmt.Errorf("duplicate spell: %s", s.ID)
			}
			resolved.Spells[s.ID] = &s
		}
		for i := range pack.Items {
			item := pack.Items[i]
			if _, exists := resolved.Items[item.ID]; exists {
				return resolved, fmt.Errorf("duplicate item: %s", item.ID)
			}
			resolved.Items[item.ID] = &item
		}
		for i := range pack.Feats {
			f := pack.Feats[i]
			if _, exists := resolved.Feats[f.ID]; exists {
				return resolved, fmt.Errorf("duplicate feat: %s", f.ID)
			}
			resolved.Feats[f.ID] = &f
		}
		for i := range pack.Monsters {
			m := pack.Monsters[i]
			if _, exists := resolved.Monsters[m.ID]; exists {
				return resolved, fmt.Errorf("duplicate monster: %s", m.ID)
			}
			resolved.Monsters[m.ID] = &m
		}
		for i := range pack.Conditions {
			c := pack.Conditions[i]
			if _, exists := resolved.Conditions[c.ID]; exists {
				return resolved, fmt.Errorf("duplicate condition: %s", c.ID)
			}
			resolved.Conditions[c.ID] = &c
		}
	}

	return resolved, nil
}

func mergeResolved(a, b scontent.ResolvedContent) scontent.ResolvedContent {
	for k, v := range b.Species {
		if _, ok := a.Species[k]; !ok {
			a.Species[k] = v
		}
	}
	for k, v := range b.Backgrounds {
		if _, ok := a.Backgrounds[k]; !ok {
			a.Backgrounds[k] = v
		}
	}
	for k, v := range b.Classes {
		if _, ok := a.Classes[k]; !ok {
			a.Classes[k] = v
		}
	}
	for k, v := range b.Feats {
		if _, ok := a.Feats[k]; !ok {
			a.Feats[k] = v
		}
	}
	for k, v := range b.Spells {
		if _, ok := a.Spells[k]; !ok {
			a.Spells[k] = v
		}
	}
	for k, v := range b.Items {
		if _, ok := a.Items[k]; !ok {
			a.Items[k] = v
		}
	}
	for k, v := range b.Monsters {
		if _, ok := a.Monsters[k]; !ok {
			a.Monsters[k] = v
		}
	}
	for k, v := range b.Conditions {
		if _, ok := a.Conditions[k]; !ok {
			a.Conditions[k] = v
		}
	}
	return a
}
