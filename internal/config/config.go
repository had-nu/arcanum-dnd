package config

import (
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server ServerConfig `yaml:"server"`
	CORS   CORSConfig   `yaml:"cors"`
	Data   DataConfig   `yaml:"data"`
	Log    LogConfig    `yaml:"log"`
}

type ServerConfig struct {
	Addr           string        `yaml:"addr"`
	ReadTimeout    time.Duration `yaml:"read_timeout"`
	WriteTimeout   time.Duration `yaml:"write_timeout"`
	ShutdownGrace  time.Duration `yaml:"shutdown_grace"`
}

type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed_origins"`
	AllowedMethods []string `yaml:"allowed_methods"`
	AllowedHeaders []string `yaml:"allowed_headers"`
}

type DataConfig struct {
	ContentDir     string `yaml:"content_dir"`
	CharactersDir  string `yaml:"characters_dir"`
	SQLitePath     string `yaml:"sqlite_path"`
}

type LogConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

func Load() (*Config, error) {
	cfgPath := getEnv("CONFIG_PATH", "backend/config.yaml")
	data, err := os.ReadFile(cfgPath)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	overrideFromEnv(&cfg)
	normalizePaths(&cfg)
	return &cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func overrideFromEnv(cfg *Config) {
	if v := os.Getenv("SERVER_ADDR"); v != "" {
		cfg.Server.Addr = v
	}
	if v := os.Getenv("CORS_ALLOWED_ORIGINS"); v != "" {
		cfg.CORS.AllowedOrigins = splitCSV(v)
	}
	if v := os.Getenv("DATA_CONTENT_DIR"); v != "" {
		cfg.Data.ContentDir = v
	}
	if v := os.Getenv("DATA_CHARACTERS_DIR"); v != "" {
		cfg.Data.CharactersDir = v
	}
	if v := os.Getenv("DATA_SQLITE_PATH"); v != "" {
		cfg.Data.SQLitePath = v
	}
	if v := os.Getenv("LOG_LEVEL"); v != "" {
		cfg.Log.Level = v
	}
	if v := os.Getenv("LOG_FORMAT"); v != "" {
		cfg.Log.Format = v
	}
}

func splitCSV(s string) []string {
	var result []string
	for _, part := range split(s, ',') {
		if trimmed := trim(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func split(s string, sep byte) []string {
	var parts []string
	var current []byte
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			parts = append(parts, string(current))
			current = nil
		} else {
			current = append(current, s[i])
		}
	}
	parts = append(parts, string(current))
	return parts
}

func trim(s string) string {
	start := 0
	for start < len(s) && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	end := len(s)
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}

func normalizePaths(cfg *Config) {
	cfg.Data.ContentDir = resolvePath(cfg.Data.ContentDir)
	cfg.Data.CharactersDir = resolvePath(cfg.Data.CharactersDir)
	cfg.Data.SQLitePath = resolvePath(cfg.Data.SQLitePath)
}

func resolvePath(p string) string {
	if filepath.IsAbs(p) {
		return p
	}
	return p
}