.PHONY: build build-frontend build-backend test lint security quality run-server run-player run-spells dev run clean ci

BUILD_DIR := $(CURDIR)/build
FRONTEND_DIR := frontend
GO_BIN := $(shell which go 2>/dev/null || echo go)
NPM_BIN := $(shell which npm 2>/dev/null || echo npm)

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
	$(GO_BIN) run github.com/securego/gosec/v2/cmd/gosec@latest -fmt sarif -out security.sarif -exclude=G404,G301,G304,G306,G703,G104,G706 ./... || true
	cd $(FRONTEND_DIR) && $(NPM_BIN) audit --audit-level=critical

quality:
	$(GO_BIN) run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run ./... || true
	cd $(FRONTEND_DIR) && $(NPM_BIN) exec eslint "src/**/*.ts" "src/**/*.tsx" || true

lint: quality

run-server:
	@if [[ -x "$(BUILD_DIR)/server" ]]; then $(BUILD_DIR)/server; else $(GO_BIN) run ./cmd/server; fi

run-player: build-backend
	$(BUILD_DIR)/tui-player

run-spells: build-backend
	$(BUILD_DIR)/spells

dev:
	@echo "Starting Arcanum D&D Character Builder..."
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@if [[ ! -x "$(BUILD_DIR)/server" ]]; then echo "Building backend..."; $(MAKE) build-backend; fi
	@cd $(CURDIR) && $(BUILD_DIR)/server & echo $$! > /tmp/arcanum_backend.pid
	@echo "Waiting for backend to be ready..."
	@for i in {1..30}; do if curl -sf http://localhost:8080/health >/dev/null 2>&1; then echo "Backend ready"; break; fi; sleep 0.2; done
	@cd $(FRONTEND_DIR) && $(NPM_BIN) run dev & echo $$! > /tmp/arcanum_frontend.pid
	@trap "echo 'Shutting down...'; kill $$(cat /tmp/arcanum_backend.pid) $$(cat /tmp/arcanum_frontend.pid) 2>/dev/null; exit 0" INT TERM
	@wait $$(cat /tmp/arcanum_backend.pid) $$(cat /tmp/arcanum_frontend.pid)

run: dev

clean:
	rm -rf $(BUILD_DIR)/
	rm -rf $(FRONTEND_DIR)/dist

ci: build test security quality