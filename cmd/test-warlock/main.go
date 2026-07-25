package main

import (
	"fmt"
	"path/filepath"
	contentpack "github.com/hadnu/arcanum/internal/content"
)

func main() {
	full, _ := contentpack.LoadAllFromDataDir(filepath.Join("data"))
	if w, ok := full.Classes["warlock"]; ok {
		fmt.Printf("WARLOCK: hitDie=%q levels=%d spellcasting=%v\n", w.HitDie, len(w.Levels), w.Spellcasting != nil)
	} else {
		fmt.Println("WARLOCK NOT FOUND!")
	}
	for id, c := range full.Classes {
		fmt.Printf("  %s: hitDie=%q levels=%d spellcasting=%v\n", id, c.HitDie, len(c.Levels), c.Spellcasting != nil)
	}
}
