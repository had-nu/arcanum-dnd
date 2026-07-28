package main

import (
	"fmt"
	"path/filepath"

	contentpack "github.com/hadnu/arcanum/internal/content"
)

func main() {
	full, _ := contentpack.LoadAllFromDataDir(filepath.Join("data"))

	fmt.Println("=== SPECIES ===")
	for id, s := range full.Species {
		if id == "changeling" || id == "kalashtar" || id == "khoravar" || id == "shifter" || id == "warforged" {
			fmt.Printf("  %s: %s (variants: %d)\n", id, s.Name, len(s.Variants))
		}
	}
	fmt.Printf("Total species loaded: %d\n", len(full.Species))

	fmt.Println("\n=== BACKGROUNDS ===")
	for id, b := range full.Backgrounds {
		fmt.Printf("  %s: %s\n", id, b.Name)
	}
	fmt.Printf("Total backgrounds loaded: %d\n", len(full.Backgrounds))

	fmt.Println("\n=== CLASSES ===")
	for id, c := range full.Classes {
		fmt.Printf("  %s: %s (subclasses: %d)\n", id, c.Name, len(c.SubClasses))
	}
	fmt.Printf("Total classes loaded: %d\n", len(full.Classes))

	fmt.Println("\n=== FEATS ===")
	for id, f := range full.Feats {
		if id == "mark-of-making" || id == "mark-of-detection" || id == "aberrant-dragonmark" || id == "greater-mark-of-making" || id == "boon-of-siberys" || id == "mark-of-healing" || id == "mark-of-handling" || id == "mark-of-hospitality" || id == "mark-of-passage" || id == "mark-of-scribing" || id == "mark-of-sentinel" || id == "mark-of-shadow" || id == "mark-of-storm" || id == "mark-of-warding" || id == "mark-of-finding" || id == "greater-mark-of-detection" || id == "greater-mark-of-finding" || id == "greater-mark-of-handling" || id == "greater-mark-of-healing" || id == "greater-mark-of-hospitality" || id == "greater-mark-of-passage" || id == "greater-mark-of-scribing" || id == "greater-mark-of-sentinel" || id == "greater-mark-of-shadow" || id == "greater-mark-of-storm" || id == "greater-mark-of-warding" || id == "greater-aberrant-mark" || id == "potent-dragonmark" {
			fmt.Printf("  %s: %s\n", id, f.Name)
		}
	}
	fmt.Printf("Total feats loaded: %d\n", len(full.Feats))

	fmt.Println("\n=== SPELLS ===")
	for id, s := range full.Spells {
		if id == "homunculus-servant" {
			fmt.Printf("  %s: %s (level %d)\n", id, s.Name, s.Level)
		}
	}
	fmt.Printf("Total spells loaded: %d\n", len(full.Spells))

	fmt.Println("\n=== ITEMS ===")
	for id, i := range full.Items {
		if id == "boots-of-the-winding-path" || id == "dazzling-weapon" || id == "mind-sharpener" || id == "helm-of-awareness" || id == "manifold-tool" || id == "repeating-shot" || id == "repulsion-shield" || id == "returning-weapon" || id == "spell-refueling-ring" {
			fmt.Printf("  %s: %s (%s)\n", id, i.Name, i.Rarity)
		}
	}
	fmt.Printf("Total items loaded: %d\n", len(full.Items))
}