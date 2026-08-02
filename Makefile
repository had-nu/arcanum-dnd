.PHONY: build build-frontend build-backend test lint security quality run-server run-player run-spells dev run clean ci

BUILD_DIR := $(CURDIR)/build
FRONTEND_DIR := frontend
GO_BIN := $(shell which go || echo /usr/local/go/bin/go)
NPM_BIN := $(shell which npm || echo /usr/bin/npm)

build: build-frontend build-backend

build-frontend:
	cd $(FRONTEND_DIR) && $(NPM_BIN) run build
	mkdir -p $(BUILD_DIR)
	cp -r $(FRONTEND_DIR)/dist $(BUILD_DIR)/frontend

build-backend:
	$(GO_BIN) build -o $(BUILD_DIR)/server ./cmd/server
	$(GO_BIN) build -o $(BUILD_DIR)/tui-player ./cmd/tui-player
	$(GO_BIN) build -o $(BUILD_DIR)/spells ./cmd/spells

test:
	CGO_ENABLED=1 $(GO_BIN) test -race -coverprofile=coverage.out ./...

test-ci:
	CGO_ENABLED=1 $(GO_BIN) test -race -coverprofile=coverage.out -covermode=atomic ./...

security:
	$(GO_BIN) install github.com/securego/gosec/v2/cmd/gosec@latest
	$(HOME)/go/bin/gosec -fmt sarif -out security.sarif -exclude=G404,G301,G304,G306,G703,G104,G706 ./... || true
	cd $(FRONTEND_DIR) && $(NPM_BIN) audit --audit-level=critical

quality:
	$(GO_BIN) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	$(HOME)/go/bin/golangci-lint run ./... || true
	cd $(FRONTEND_DIR) && $(NPM_BIN) exec eslint "src/**/*.ts" "src/**/*.tsx" || true

lint: quality

run-server:
	$(BUILD_DIR)/server

run-player: build-backend
	$(BUILD_DIR)/tui-player

run-spells: build-backend
	$(BUILD_DIR)/spells

dev:
	./run.sh

run:
	./run.sh

clean:
	rm -rf $(BUILD_DIR)/
	rm -rf $(FRONTEND_DIR)/dist

ci: build test security quality