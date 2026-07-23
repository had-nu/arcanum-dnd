package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println(`ARCANUM — D&D 5.5 Edition Manager
================================

Commands:
  go run ./cmd/tui-player/    — Player TUI (character sheet + dice)
  go run ./cmd/tui-master/    — Master Shield (DM view)
  make build                  — Build all
  make test                   — Run tests
  make lint                   — Lint + SAST

Spec: SPEC.md
`)
	os.Exit(1)
}
