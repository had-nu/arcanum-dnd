.PHONY: build build-frontend build-backend test lint security quality run-player run-master run-spells run-server dev clean ci

BUILD_DIR := dist
FRONTEND_DIR := frontend

build: build-frontend build-backend

build-frontend:
	cd $(FRONTEND_DIR) && npm ci && npm run build

build-backend:
	CGO_ENABLED=0 go build -o $(BUILD_DIR)/server ./cmd/server
	CGO_ENABLED=0 go build -o $(BUILD_DIR)/tui-player ./cmd/tui-player
	CGO_ENABLED=0 go build -o $(BUILD_DIR)/spells ./cmd/spells

test:
	go test -race -coverprofile=coverage.out ./...

test-ci:
	go test -race -coverprofile=coverage.out -covermode=atomic ./...

security:
	gosec -fmt sarif -out security.sarif -exclude=G404,G301,G304,G306,G703,G104,G706 ./... || true
	cd $(FRONTEND_DIR) && npm audit --audit-level=critical

quality:
	golangci-lint run ./... || true
	cd $(FRONTEND_DIR) && npx eslint src --ext .ts,.tsx || true

lint: quality

run-server:
	go run ./cmd/server

run-player:
	go run ./cmd/tui-player/

run-master:
	go run ./cmd/tui-master/

run-spells:
	go run ./cmd/spells/

dev:
	air -c .air.toml & \
	cd $(FRONTEND_DIR) && npm run dev

clean:
	go clean
	rm -rf $(BUILD_DIR)/
	rm -rf $(FRONTEND_DIR)/dist

ci: build test security quality