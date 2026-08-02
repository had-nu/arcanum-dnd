.PHONY: build build-frontend build-backend test lint security quality run-server run-player run-master run-spells dev run clean ci

BUILD_DIR := $(HOME)/build/arcanum
FRONTEND_DIR := frontend
GO_BIN := $(shell which go || echo ~/.local/go/bin/go)
NPM_BIN := $(shell which npm || echo ~/.local/bin/npm)
GO_PATH := $(HOME)/.local/go/bin:$(PATH)

build: build-frontend build-backend

build-frontend:
	cd $(FRONTEND_DIR) && $(NPM_BIN) run build
	mkdir -p $(BUILD_DIR)
	cp -r $(FRONTEND_DIR)/dist $(BUILD_DIR)/frontend

build-backend:
	PATH="$(GO_PATH)" $(GO_BIN) build -o $(BUILD_DIR)/server ./cmd/server

test:
	CGO_ENABLED=1 PATH="$(GO_PATH)" $(GO_BIN) test -race -coverprofile=coverage.out ./...

test-ci:
	CGO_ENABLED=1 PATH="$(GO_PATH)" $(GO_BIN) test -race -coverprofile=coverage.out -covermode=atomic ./...

security:
	PATH="$(GO_PATH)" $(GO_BIN) install github.com/securego/gosec/v2/cmd/gosec@latest
	PATH="$(GO_PATH)" $(HOME)/go/bin/gosec -fmt sarif -out security.sarif -exclude=G404,G301,G304,G306,G703,G104,G706 ./... || true
	cd $(FRONTEND_DIR) && $(NPM_BIN) audit --audit-level=critical

quality:
	PATH="$(GO_PATH)" $(GO_BIN) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	PATH="$(GO_PATH)" $(HOME)/go/bin/golangci-lint run ./... || true
	cd $(FRONTEND_DIR) && $(NPM_BIN) exec eslint "src/**/*.ts" "src/**/*.tsx" || true

lint: quality

run-server:
	PATH="$(GO_PATH)" $(BUILD_DIR)/server

run-player: build-backend
	PATH="$(GO_PATH)" $(BUILD_DIR)/server

run-master: build-backend
	PATH="$(GO_PATH)" $(BUILD_DIR)/server --master

run-spells: build-backend
	PATH="$(GO_PATH)" $(BUILD_DIR)/server --spells

dev:
	./run.sh

run:
	./run.sh

clean:
	rm -rf $(BUILD_DIR)/
	rm -rf $(FRONTEND_DIR)/dist

ci: build test security quality