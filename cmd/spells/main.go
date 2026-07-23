package main

import (
	"bufio"
	"log"
	"os"

	"github.com/hadnu/arcanum/internal/character"
	contentpack "github.com/hadnu/arcanum/internal/content"
)

func main() {
	log.Println("Arcanum — Spell Browser (SRD 5.2)")

	content, err := contentpack.LoadAllFromDataDir("data")
	if err != nil {
		log.Fatalf("Failed to load content packs: %v", err)
	}

	log.Printf("Loaded: %d spells", len(content.Spells))

	browser := character.NewSpellBrowser(content)
	scanner := bufio.NewScanner(os.Stdin)
	browser.RunInteractive(scanner)
}
