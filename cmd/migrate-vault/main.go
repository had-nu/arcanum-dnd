package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/hadnu/arcanum/internal/vault"
)

func main() {
	sourceDir := flag.String("source", "data/characters", "Source directory with old YAML files")
	vaultDir := flag.String("vault", "char", "Destination vault directory")
	dryRun := flag.Bool("dry-run", false, "Show what would be migrated without writing")
	flag.Parse()

	fmt.Printf("Migrating from %s to %s\n", *sourceDir, *vaultDir)

	if *dryRun {
		fmt.Println("DRY RUN MODE - no files will be written")
		// TODO: implement dry run
		return
	}

	migrator, err := vault.NewMigrator(*sourceDir, *vaultDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create migrator: %v\n", err)
		os.Exit(1)
	}

	count, err := migrator.Migrate()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Migration failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully migrated %d character(s)\n", count)
}