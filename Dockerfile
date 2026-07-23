FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server ./cmd/server/

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /server .
COPY data/ ./data/
COPY cmd/server/web/ ./web/
RUN mkdir -p ./data/characters
EXPOSE 8080
VOLUME /app/data/characters
CMD ["./server"]
