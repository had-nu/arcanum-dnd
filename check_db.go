package main

import (
	"database/sql"
	"fmt"
	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "./var/arcanum.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT COUNT(*) FROM feats")
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {
		var count int
		rows.Scan(&count)
		fmt.Printf("Total feats: %d\n", count)
	}

	rows2, err := db.Query("SELECT id, name, prereq_level FROM feats LIMIT 5")
	if err != nil {
		panic(err)
	}
	defer rows2.Close()
	for rows2.Next() {
		var id, name string
		var prereqLevel sql.NullInt64
		rows2.Scan(&id, &name, &prereqLevel)
		fmt.Printf("Feat: %s, %s, prereq_level: %v\n", id, name, prereqLevel)
	}
}