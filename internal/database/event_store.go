package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hadnu/arcanum/internal/schemas/events"
	"github.com/hadnu/arcanum/internal/types"
)

// EventStore is the primary persistence interface.
type EventStore interface {
	Append(ctx context.Context, aggregateID string, expectedVersion int, evts []events.EventEnvelope) error
	GetEvents(ctx context.Context, aggregateID string, fromVersion int) ([]events.EventEnvelope, error)
	GetAllEvents(ctx context.Context, from time.Time) ([]events.EventEnvelope, error)
}

// OptimisticConcurrencyError is returned when version check fails.
type OptimisticConcurrencyError struct {
	AggregateID     string
	ExpectedVersion int
	ActualVersion   int
}

func (e *OptimisticConcurrencyError) Error() string {
	return fmt.Sprintf("concurrency conflict on %s: expected v%d, got v%d",
		e.AggregateID, e.ExpectedVersion, e.ActualVersion)
}

// sqliteEventStore implements EventStore using SQLite.
type sqliteEventStore struct {
	db *sql.DB
}

func NewEventStore(db *sql.DB) EventStore {
	return &sqliteEventStore{db: db}
}

func (s *sqliteEventStore) Append(ctx context.Context, aggregateID string, expectedVersion int, evts []events.EventEnvelope) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check current version
	var currentVersion int
	err = tx.QueryRowContext(ctx,
		"SELECT COALESCE(MAX(version), 0) FROM events WHERE aggregate_id = ?",
		aggregateID).Scan(&currentVersion)
	if err != nil {
		return err
	}

	if currentVersion != expectedVersion {
		return &OptimisticConcurrencyError{
			AggregateID:     aggregateID,
			ExpectedVersion: expectedVersion,
			ActualVersion:   currentVersion,
		}
	}

	// Insert events
	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO events (id, aggregate_id, aggregate_type, type, schema_version, payload, metadata, occurred_at, version)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for i, env := range evts {
		metadata, _ := json.Marshal(env.Metadata)
		_, err := stmt.ExecContext(ctx,
			env.ID.String(),
			env.AggregateID,
			env.AggregateType,
			env.Type,
			env.SchemaVersion,
			env.Payload,
			metadata,
			env.OccurredAt.Format(time.RFC3339),
			expectedVersion+i+1,
		)
		if err != nil {
			return fmt.Errorf("insert event %s: %w", env.ID, err)
		}
	}

	return tx.Commit()
}

func (s *sqliteEventStore) GetEvents(ctx context.Context, aggregateID string, fromVersion int) ([]events.EventEnvelope, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, aggregate_id, aggregate_type, type, schema_version, payload, metadata, occurred_at, version
		FROM events
		WHERE aggregate_id = ? AND version >= ?
		ORDER BY version ASC
	`, aggregateID, fromVersion)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []events.EventEnvelope
	for rows.Next() {
		var env events.EventEnvelope
		var aggregateType, occurredAt string
		var metadata []byte
		var idStr string

		err := rows.Scan(
			&idStr, &env.AggregateID, &aggregateType, &env.Type,
			&env.SchemaVersion, &env.Payload, &metadata, &occurredAt, &env.Version,
		)
		if err != nil {
			return nil, err
		}

		env.ID, err = types.ParseEventID(idStr)
		if err != nil {
			return nil, err
		}
		env.AggregateType = events.AggregateType(aggregateType)
		env.OccurredAt, _ = time.Parse(time.RFC3339, occurredAt)
		if len(metadata) > 0 {
			json.Unmarshal(metadata, &env.Metadata)
		}
		result = append(result, env)
	}

	return result, rows.Err()
}

func (s *sqliteEventStore) GetAllEvents(ctx context.Context, from time.Time) ([]events.EventEnvelope, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, aggregate_id, aggregate_type, type, schema_version, payload, metadata, occurred_at, version
		FROM events
		WHERE occurred_at >= ?
		ORDER BY occurred_at ASC
	`, from.Format(time.RFC3339))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []events.EventEnvelope
	for rows.Next() {
		var env events.EventEnvelope
		var aggregateType, occurredAt string
		var metadata []byte
		var idStr string

		err := rows.Scan(
			&idStr, &env.AggregateID, &aggregateType, &env.Type,
			&env.SchemaVersion, &env.Payload, &metadata, &occurredAt, &env.Version,
		)
		if err != nil {
			return nil, err
		}

		env.ID, err = types.ParseEventID(idStr)
		if err != nil {
			return nil, err
		}
		env.AggregateType = events.AggregateType(aggregateType)
		env.OccurredAt, _ = time.Parse(time.RFC3339, occurredAt)
		if len(metadata) > 0 {
			json.Unmarshal(metadata, &env.Metadata)
		}
		result = append(result, env)
	}

	return result, rows.Err()
}