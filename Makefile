.PHONY: build build-frontend build-backend test lint security quality run-player run-master run-spells run-server dev clean ci run

BUILD_DIR := dist
FRONTEND_DIR := frontend
IMAGE_NAME := arcanum-dnd-app-prod:latest

build: build-frontend build-backend

build-frontend:
	docker compose -f docker-compose.yml --profile prod build app-prod
	mkdir -p $(BUILD_DIR)
	docker create --name arcanum-frontend-extract $(IMAGE_NAME)
	docker cp arcanum-frontend-extract:/app/frontend/dist $(BUILD_DIR)/frontend
	docker rm arcanum-frontend-extract

build-backend:
	docker compose -f docker-compose.yml --profile prod build app-prod
	mkdir -p $(BUILD_DIR)
	docker create --name arcanum-backend-extract $(IMAGE_NAME)
	docker cp arcanum-backend-extract:/app/server $(BUILD_DIR)/server
	docker rm arcanum-backend-extract

test:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm $(IMAGE_NAME) go test -race -coverprofile=coverage.out ./...

test-ci:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm $(IMAGE_NAME) go test -race -coverprofile=coverage.out -covermode=atomic ./...

security:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm $(IMAGE_NAME) gosec -fmt sarif -out security.sarif -exclude=G404,G301,G304,G306,G703,G104,G706 ./... || true
	docker run --rm -v $(PWD)/$(FRONTEND_DIR):/app -w /app node:22-alpine npm audit --audit-level=critical

quality:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm $(IMAGE_NAME) golangci-lint run ./... || true
	docker run --rm -v $(PWD)/$(FRONTEND_DIR):/app -w /app node:22-alpine npx eslint src --ext .ts,.tsx || true

lint: quality

run-server:
	docker compose up backend-dev

run-player:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm -it -v $(PWD)/data:/app/data -v $(PWD)/var:/app/var $(IMAGE_NAME) ./server

run-master:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm -it -v $(PWD)/data:/app/data -v $(PWD)/var:/app/var $(IMAGE_NAME) ./server --master

run-spells:
	docker compose -f docker-compose.yml --profile prod build app-prod
	docker run --rm -it -v $(PWD)/data:/app/data -v $(PWD)/var:/app/var $(IMAGE_NAME) ./server --spells

dev:
	docker compose --profile dev up

run:
	docker compose --profile dev up --build

clean:
	docker compose down -v
	rm -rf $(BUILD_DIR)/
	rm -rf $(FRONTEND_DIR)/dist

ci: build test security quality