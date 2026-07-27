package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// SnapshotStore handles snapshot persistence for fast replay.
type SnapshotStore interface {
	Save(ctx context.Context, aggregateID string, version int, state interface{}) error
	Load(ctx context.Context, aggregateID string) (interface{}, int, error)
}

type sqliteSnapshotStore struct {
	db *sql.DB
}

func NewSnapshotStore(db *sql.DB) SnapshotStore {
	return &sqliteSnapshotStore{db: db}
}

func (s *sqliteSnapshotStore) Save(ctx context.Context, aggregateID string, version int, state interface{}) error {
	stateJSON, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("marshal snapshot: %w", err)
	}

	_, err = s.db.ExecContext(ctx, `
		INSERT OR REPLACE INTO snapshots (aggregate_id, aggregate_type, version, state, created_at)
		VALUES (?, 'campaign', ?, ?, ?)
	`, aggregateID, version, stateJSON, time.Now().Format(time.RFC3339))
	return err
}

func (s *sqliteSnapshotStore) Load(ctx context.Context, aggregateID string) (interface{}, int, error) {
	var stateJSON []byte
	var version int
	err := s.db.QueryRowContext(ctx, `
		SELECT state, version FROM snapshots WHERE aggregate_id = ?
	`, aggregateID).Scan(&stateJSON, &version)
	if err == sql.ErrNoRows {
		return nil, 0, nil
	}
	if err != nil {
		return nil, 0, err
	}

	var state map[string]interface{}
	if err := json.Unmarshal(stateJSON, &state); err != nil {
		return nil, 0, fmt.Errorf("unmarshal snapshot: %w", err)
	}

	return state, version, nil
}