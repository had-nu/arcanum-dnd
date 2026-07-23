.PHONY: build test lint run-player run-master run-spells clean

build:
	go build ./...

test:
	go test ./...

lint:
	golangci-lint run ./... || true
	gosec ./... || true

run-player:
	go run ./cmd/tui-player/

run-master:
	go run ./cmd/tui-master/

run-spells:
	go run ./cmd/spells/

clean:
	go clean
	rm -rf dist/
