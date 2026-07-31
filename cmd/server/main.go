package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/hadnu/arcanum/internal/auto"
	contentpack "github.com/hadnu/arcanum/internal/content"
	"github.com/hadnu/arcanum/internal/database"
	"github.com/hadnu/arcanum/internal/engine"
	"github.com/hadnu/arcanum/internal/engine/derive"
	"github.com/hadnu/arcanum/internal/config"
	"github.com/hadnu/arcanum/internal/query"
	"github.com/hadnu/arcanum/internal/rng"
	"github.com/hadnu/arcanum/internal/schemas/events"
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
	"gopkg.in/yaml.v3"
)

type Server struct {
	content       scontent.ResolvedContent
	engine        *engine.Engine
	campaign      engine.Campaign
	config        *config.Config
	db            *sql.DB
	eventStore    database.EventStore
	snapshotStore database.SnapshotStore
	validator     *engine.BuildValidator
	autoSelector  *auto.AutoSelector
	eventGen      *engine.EventGenerator
	querier       *query.Querier
}

// API-level build request matching the frontend's simple format.
// Converted to engine.BuildRequest internally.
type BuildRequest struct {
	Name           string              `json:"name"`
	Classes        []ClassBuildEntry   `json:"classes"`
	BackgroundID   types.BackgroundID  `json:"backgroundId"`
	SpeciesID      types.SpeciesID     `json:"speciesId"`
	SpeciesVariant string              `json:"speciesVariant,omitempty"`
	Level          int                 `json:"level"`
	AbilityScores  types.AbilityScores `json:"abilityScores"`
	AbilityMethod  string              `json:"abilityMethod,omitempty"`
	Skills         []types.Skill       `json:"skills"`
	Spells         []types.SpellID     `json:"spells,omitempty"`
	Feats          []types.FeatID      `json:"feats,omitempty"`
}

type ClassBuildEntry struct {
	ID         types.ClassID     `json:"id"`
	Level      int               `json:"level"`
	SubclassID *types.SubClassID `json:"subclassId,omitempty"`
}

type BuildResponse struct {
	ID       types.CharacterID      `json:"id"`
	Sheet    *derive.CharacterSheet `json:"sheet"`
	Classes  []string               `json:"classes"`
	Event    events.Event           `json:"event"`
	YAML     string                 `json:"yaml"`
	Features []featureView          `json:"features"`
}

type featureView struct {
	Class string `json:"class"`
	Level int    `json:"level"`
	Name  string `json:"name"`
	ID    string `json:"id"`
}

type ContentResponse struct {
	Classes             []contentEntry   `json:"classes"`
	Backgrounds         []contentEntry   `json:"backgrounds"`
	Species             []speciesEntry   `json:"species"`
	Abilities           []abilityEntry   `json:"abilities"`
	Skills              []skillEntry     `json:"skills"`
	Feats               map[string]featAPIEntry `json:"feats"`
	SpellCasterClasses  []string         `json:"spellCasterClasses"`
}

type featAPIEntry struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description,omitempty"`
	Prerequisites interface{} `json:"prerequisites,omitempty"`
}

type contentEntry struct {
	ID             string          `json:"id"`
	Name           string          `json:"name"`
	HitDie         string          `json:"hitDie,omitempty"`
	SavingThrows   []string        `json:"savingThrows,omitempty"`
	PrimaryAbility []string        `json:"primaryAbility,omitempty"`
	Skills         []string        `json:"skills,omitempty"`
	Feat           string          `json:"feat,omitempty"`
	SkillChoices   int             `json:"skillChoices,omitempty"`
	SkillPool      []string        `json:"skillPool,omitempty"`
	Spellcaster    bool            `json:"spellcaster,omitempty"`
	SubClasses     []subClassEntry `json:"subClasses,omitempty"`
	SubclassLevel  int             `json:"subclassLevel,omitempty"`
	Features       []featureDef    `json:"features,omitempty"`
	Spellcasting   *SpellcastingEntry `json:"spellcasting,omitempty"`
}

type SpellcastingEntry struct {
	Type            string               `json:"type,omitempty"`
	Ability         string               `json:"ability,omitempty"`
	CantripsKnown   []int                `json:"cantripsKnown,omitempty"`
	PreparedSpells  []int                `json:"preparedSpells,omitempty"`
	SpellsKnown     []int                `json:"spellsKnown,omitempty"`
	SpellSlots      map[string]int       `json:"spellSlots,omitempty"`
	RitualCasting   bool                 `json:"ritualCasting,omitempty"`
	SpellLists      map[int][]string     `json:"spellLists,omitempty"`
}

type subClassEntry struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type featureDef struct {
	Level int    `json:"level"`
	ID    string `json:"id"`
	Name  string `json:"name"`
}

type ClassFeatureEntry struct {
	ClassID    string          `json:"classId"`
	SubclassID string          `json:"subclassId,omitempty"`
	Name       string          `json:"name"`
	Level      int             `json:"level"`
	Source     string          `json:"source,omitempty"`
	Entries    json.RawMessage `json:"entries"`
}

type FeaturesResponse struct {
	ClassID          string              `json:"classId"`
	ClassName        string              `json:"className"`
	SubclassID       string              `json:"subclassId,omitempty"`
	SubclassName     string              `json:"subclassName,omitempty"`
	Features         []ClassFeatureEntry `json:"features"`
	SubclassFeatures []ClassFeatureEntry `json:"subclassFeatures,omitempty"`
}

type speciesEntry struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Size     string           `json:"size"`
	Speed    int              `json:"speed"`
	Variants []variantEntry   `json:"variants,omitempty"`
}

type variantEntry struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type abilityEntry struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type skillEntry struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Ability string `json:"ability"`
}

type SpellsResponse struct {
	Cantrips []spellEntry `json:"cantrips"`
	Leveled  [][]spellEntry `json:"leveled"`
}

type spellEntry struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Level     int    `json:"level"`
	School    string `json:"school"`
	Time      string `json:"time"`
	Range     string `json:"range"`
	Duration  string `json:"duration"`
	Concentration bool `json:"concentration"`
	Damage    string `json:"damage,omitempty"`
	Save      string `json:"save,omitempty"`
	Attack    bool   `json:"attack,omitempty"`
	Ritual    bool   `json:"ritual,omitempty"`
}

type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp"`
}

func main() {
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Println("Arcanum Server starting...")
	log.Printf("Server address: %s", cfg.Server.Addr)

	content, err := contentpack.LoadAllFromDataDir(cfg.Data.ContentDir)
	if err != nil {
		log.Fatalf("Failed to load content: %v", err)
	}
	log.Printf("Loaded %d classes, %d species, %d backgrounds, %d feats, %d spells, %d items",
		len(content.Classes), len(content.Species), len(content.Backgrounds),
		len(content.Feats), len(content.Spells), len(content.Items))

	dbPath := cfg.Data.SQLitePath
	absPath, _ := filepath.Abs(dbPath)
	log.Printf("Database path: %s (abs: %s)", dbPath, absPath)

	dbDir := filepath.Dir(absPath)
	log.Printf("Creating database directory: %s", dbDir)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("Failed to create database directory %s: %v", dbDir, err)
	}

	// Verify directory is writable
	testFile := filepath.Join(dbDir, ".write_test")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		log.Fatalf("Database directory %s is not writable: %v", dbDir, err)
	}
	os.Remove(testFile)

	db, err := database.Open(absPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if err := database.SeedFromYAML(db, &content); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}
	log.Println("Database seeded from YAML content")

	if err := database.ImportSpellsCSV(db, filepath.Join(cfg.Data.ContentDir, "src", "all-Spells.csv")); err != nil {
		log.Printf("Warning: CSV spell import failed: %v", err)
	} else {
		log.Println("CSV spell import complete")
	}

	withToolsDir := filepath.Join("..", "5etools-src", "data")
	if _, err := os.Stat(withToolsDir); err == nil {
		if err := database.Import5eFeatures(db, withToolsDir); err != nil {
			log.Printf("Warning: 5etools import failed: %v", err)
		} else {
			log.Println("5etools feature descriptions imported")
		}
	} else {
		log.Println("5etools-src not found, skipping feature description import")
	}

	if err := database.ProcessInbox(db, filepath.Join(cfg.Data.ContentDir, "inbox")); err != nil {
		log.Printf("Warning: inbox processing failed: %v", err)
	}

	randSource := rng.NewSeededRNG(42)
	eventStore := database.NewEventStore(db)
	snapshotStore := database.NewSnapshotStore(db)
	e := engine.NewEngine(content, randSource, eventStore, snapshotStore)

	ctx := context.Background()
	campaign, err := e.CreateCampaign(ctx, "Arcanum Web")
	if err != nil {
		log.Fatalf("Failed to create campaign: %v", err)
	}

	srv := &Server{
		content:       content,
		engine:        e,
		campaign:      campaign,
		config:        cfg,
		db:            db,
		eventStore:    eventStore,
		snapshotStore: snapshotStore,
		validator:     engine.NewBuildValidator(content),
		autoSelector:  auto.NewAutoSelector(content),
		eventGen:      engine.NewEventGenerator(content),
		querier:       query.New(db),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", srv.handleHealth)
	mux.HandleFunc("GET /api/health", srv.handleHealth)
	mux.HandleFunc("GET /api/content", srv.handleContent)
	mux.HandleFunc("GET /api/spells", srv.handleSpells)
	mux.HandleFunc("GET /api/features/{classId}", srv.handleFeatures)
	mux.HandleFunc("GET /api/metamagic-options", srv.handleMetamagicOptions)
	mux.HandleFunc("GET /api/feats", srv.handleFeats)
	mux.HandleFunc("POST /api/build", srv.handleBuild)
	mux.HandleFunc("GET /api/characters", srv.handleListCharacters)
	mux.HandleFunc("POST /api/characters", srv.handleSaveCharacter)
	mux.HandleFunc("GET /api/characters/{name}", srv.handleGetCharacter)
	mux.HandleFunc("PUT /api/characters/{name}", srv.handleSaveCharacter)
	mux.HandleFunc("DELETE /api/characters/{name}", srv.handleDeleteCharacter)

	// React SPA frontend (frontend/dist)
	frontendDir := "./frontend/dist"
	fs := http.FileServer(http.Dir(frontendDir))
	mux.Handle("GET /assets/", fs)
	mux.Handle("GET /img/", fs)
	mux.Handle("GET /fonts/", fs)
	mux.Handle("GET /favicon.svg", fs)

	// SPA fallback for React app
	mux.HandleFunc("GET /", srv.handleReactSPA(frontendDir))

	handler := corsMiddleware(cfg)(mux)

	server := &http.Server{
		Addr:         cfg.Server.Addr,
		Handler:      handler,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	go func() {
		log.Printf("Server listening on http://localhost%s", server.Addr)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownGrace)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
}

func corsMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			allowed := false
			for _, o := range cfg.CORS.AllowedOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}
			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else if len(cfg.CORS.AllowedOrigins) > 0 {
				w.Header().Set("Access-Control-Allow-Origin", cfg.CORS.AllowedOrigins[0])
			}
			w.Header().Set("Access-Control-Allow-Methods", strings.Join(cfg.CORS.AllowedMethods, ", "))
			w.Header().Set("Access-Control-Allow-Headers", strings.Join(cfg.CORS.AllowedHeaders, ", "))
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	resp := HealthResponse{
		Status:    "ok",
		Version:   "0.2.0",
		Timestamp: time.Now().Format(time.RFC3339),
	}
	writeJSON(w, resp)
}

func (s *Server) handleSPA(staticDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	}
}

func (s *Server) handleReactSPA(staticDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") ||
			strings.HasPrefix(r.URL.Path, "/assets/") ||
			strings.HasPrefix(r.URL.Path, "/img/") ||
			strings.HasPrefix(r.URL.Path, "/fonts/") ||
			strings.HasPrefix(r.URL.Path, "/favicon.svg") {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	}
}

func (s *Server) handleContent(w http.ResponseWriter, r *http.Request) {
	resp := ContentResponse{}

	classes, err := s.querier.ListClasses()
	if err == nil {
		for _, cr := range classes {
			saves, _ := s.querier.GetClassSavingThrows(cr.ID)
			saveStrs := make([]string, len(saves))
			for i, sv := range saves {
				saveStrs[i] = string(sv)
			}

			primary := []string{}
			if cr.SpellcastingAbility != "" {
				primary = []string{cr.SpellcastingAbility}
			}

			profs, _ := s.querier.GetClassProficiencies(cr.ID)
			var skillPool []string
			skillChoices := 0
			seen := map[string]bool{}
			for _, p := range profs {
				if p.Category == "skill" {
					if p.SkillChoose > 0 {
						skillChoices = p.SkillChoose
					}
					if p.SkillFrom != "" && !seen[string(p.SkillFrom)] {
						seen[string(p.SkillFrom)] = true
						skillPool = append(skillPool, string(p.SkillFrom))
					}
				}
			}

			subs, _ := s.querier.ListSubclasses(cr.ID)
			subClasses := make([]subClassEntry, len(subs))
			for i, sc := range subs {
				subClasses[i] = subClassEntry{ID: string(sc.ID), Name: sc.Name, Description: sc.Description}
			}

			hasSpells := cr.SpellcastingType != ""

			features := func() []featureDef {
				frows, err := s.db.Query(`
					SELECT level, id, name FROM class_features WHERE class_id = ? ORDER BY level, id
				`, string(cr.ID))
				if err != nil {
					return nil
				}
				defer frows.Close()
				var result []featureDef
				for frows.Next() {
					var fd featureDef
					frows.Scan(&fd.Level, &fd.ID, &fd.Name)
					result = append(result, fd)
				}
				return result
			}()

			var spellcasting *SpellcastingEntry
			if hasSpells {
				scEntry := &SpellcastingEntry{
					Type:    cr.SpellcastingType,
					Ability: cr.SpellcastingAbility,
				}
				for lvl := 1; lvl <= 20; lvl++ {
					cl, _ := s.querier.GetClassLevel(cr.ID, lvl)
					if cl == nil {
						continue
					}
					if cl.CantripsKnown > 0 {
						scEntry.CantripsKnown = append(scEntry.CantripsKnown, cl.CantripsKnown)
					}
					if cl.PreparedSpells > 0 {
						scEntry.PreparedSpells = append(scEntry.PreparedSpells, cl.PreparedSpells)
					}
					if cl.SpellsKnown > 0 {
						scEntry.SpellsKnown = append(scEntry.SpellsKnown, cl.SpellsKnown)
					}
				}
				slots := make(map[string]int)
				for lvl := 1; lvl <= 20; lvl++ {
					sl, _ := s.querier.GetClassSpellSlots(cr.ID, lvl)
					for k, v := range sl {
						slots[strconv.Itoa(k)] = v
					}
				}
				if len(slots) > 0 {
					scEntry.SpellSlots = slots
				}
				scEntry.RitualCasting = cr.RitualCasting
				spellcasting = scEntry
			}

			resp.Classes = append(resp.Classes, contentEntry{
				ID: string(cr.ID), Name: cr.Name, HitDie: cr.HitDie,
				SavingThrows: saveStrs, PrimaryAbility: primary,
				SkillChoices: skillChoices, SkillPool: skillPool,
				Spellcaster: hasSpells, SubClasses: subClasses, SubclassLevel: cr.SubclassLevel,
				Features: features, Spellcasting: spellcasting,
			})
		}
	}

	func() {
		bgRows, err := s.db.Query(`SELECT id, name, feat_id FROM backgrounds ORDER BY name`)
		if err != nil {
			return
		}
		defer bgRows.Close()
		for bgRows.Next() {
			var id, name string
			var featID sql.NullString
			bgRows.Scan(&id, &name, &featID)
			skills, _ := s.querier.GetBackgroundSkills(types.BackgroundID(id))
			skillStrs := make([]string, len(skills))
			for i, sk := range skills {
				skillStrs[i] = string(sk)
			}
			feat := ""
			if featID.Valid {
				if f, ok := s.content.Feats[types.FeatID(featID.String)]; ok {
					feat = f.Name
				}
			}
			resp.Backgrounds = append(resp.Backgrounds, contentEntry{
				ID: id, Name: name, Skills: skillStrs, Feat: feat,
			})
		}
	}()

	spRows, err := s.querier.ListSpecies()
	if err == nil {
		for _, sp := range spRows {
			resp.Species = append(resp.Species, speciesEntry{
				ID: string(sp.ID), Name: sp.Name, Size: sp.Size, Speed: sp.SpeedWalk,
			})
		}
	}

	for _, ab := range types.AllAbilityScores {
		names := map[types.AbilityScore]string{
			types.STR: "Strength", types.DEX: "Dexterity", types.CON: "Constitution",
			types.INT: "Intelligence", types.WIS: "Wisdom", types.CHA: "Charisma",
		}
		resp.Abilities = append(resp.Abilities, abilityEntry{ID: string(ab), Name: names[ab]})
	}

	for _, sk := range types.AllSkills {
		names := map[types.Skill]string{
			types.SkillAcrobatics: "Acrobatics", types.SkillAnimalHandling: "Animal Handling",
			types.SkillArcana: "Arcana", types.SkillAthletics: "Athletics",
			types.SkillDeception: "Deception", types.SkillHistory: "History",
			types.SkillInsight: "Insight", types.SkillIntimidation: "Intimidation",
			types.SkillInvestigation: "Investigation", types.SkillMedicine: "Medicine",
			types.SkillNature: "Nature", types.SkillPerception: "Perception",
			types.SkillPerformance: "Performance", types.SkillPersuasion: "Persuasion",
			types.SkillReligion: "Religion", types.SkillSleightOfHand: "Sleight of Hand",
			types.SkillStealth: "Stealth", types.SkillSurvival: "Survival",
		}
		resp.Skills = append(resp.Skills, skillEntry{ID: string(sk), Name: names[sk], Ability: string(types.SkillAbility[sk])})
	}

	featRows, err := s.querier.ListFeats()
	if err == nil {
		feats := make(map[string]featAPIEntry)
		for _, f := range featRows {
			feats[string(f.ID)] = featAPIEntry{ID: string(f.ID), Name: f.Name}
		}
		resp.Feats = feats
	}

	func() {
		scRows, err := s.db.Query(`SELECT id FROM classes WHERE spellcasting_type != '' ORDER BY name`)
		if err != nil {
			return
		}
		defer scRows.Close()
		for scRows.Next() {
			var id string
			scRows.Scan(&id)
			resp.SpellCasterClasses = append(resp.SpellCasterClasses, id)
		}
	}()

	writeJSON(w, resp)
}

func (s *Server) handleSpells(w http.ResponseWriter, r *http.Request) {
	classStr := r.URL.Query().Get("class")
	maxLevelStr := r.URL.Query().Get("level")
	levelStr := r.URL.Query().Get("lvl")

	resp := SpellsResponse{
		Cantrips: []spellEntry{},
		Leveled:  make([][]spellEntry, 9),
	}
	for i := range resp.Leveled {
		resp.Leveled[i] = []spellEntry{}
	}

	if classStr != "" {
		classID := types.ClassID(classStr)
		classLevel := 1
		if levelStr != "" {
			classLevel = atoi(levelStr)
			if classLevel < 1 {
				classLevel = 1
			}
			if classLevel > 20 {
				classLevel = 20
			}
		}
		spells, err := s.querier.GetClassSpellList(classID, classLevel)
		if err == nil {
			for _, sid := range spells {
				sp, err := s.querier.GetSpell(sid)
				if err != nil || sp == nil {
					continue
				}
				entry := spellEntry{
					ID: string(sp.ID), Name: sp.Name, Level: sp.Level, School: sp.School,
					Time: sp.CastingTime, Range: sp.Range, Duration: sp.Duration,
					Concentration: sp.Concentration, Ritual: sp.Ritual, Attack: sp.Attack,
				}
				if sp.DamageDice != "" {
					entry.Damage = sp.DamageDice
				}
				if sp.SaveAbility != "" {
					entry.Save = sp.SaveAbility
				}
				if sp.Level == 0 {
					resp.Cantrips = append(resp.Cantrips, entry)
				} else if sp.Level >= 1 && sp.Level <= 9 {
					if maxLevelStr == "" || sp.Level <= atoi(maxLevelStr) {
						resp.Leveled[sp.Level-1] = append(resp.Leveled[sp.Level-1], entry)
					}
				}
			}
		}
	} else {
		spells, err := s.querier.ListSpells(nil)
		if err == nil {
			for _, sp := range spells {
				entry := spellEntry{
					ID: string(sp.ID), Name: sp.Name, Level: sp.Level, School: sp.School,
					Time: sp.CastingTime, Range: sp.Range, Duration: sp.Duration,
					Concentration: sp.Concentration, Ritual: sp.Ritual, Attack: sp.Attack,
				}
				if sp.DamageDice != "" {
					entry.Damage = sp.DamageDice
				}
				if sp.SaveAbility != "" {
					entry.Save = sp.SaveAbility
				}
				if sp.Level == 0 {
					resp.Cantrips = append(resp.Cantrips, entry)
				} else if sp.Level >= 1 && sp.Level <= 9 {
					if maxLevelStr == "" || sp.Level <= atoi(maxLevelStr) {
						resp.Leveled[sp.Level-1] = append(resp.Leveled[sp.Level-1], entry)
					}
				}
			}
		}
	}

	sort.Slice(resp.Cantrips, func(i, j int) bool { return resp.Cantrips[i].Name < resp.Cantrips[j].Name })
	for i := range resp.Leveled {
		sort.Slice(resp.Leveled[i], func(a, b int) bool { return resp.Leveled[i][a].Name < resp.Leveled[i][b].Name })
	}

	writeJSON(w, resp)
}

func (s *Server) handleFeatures(w http.ResponseWriter, r *http.Request) {
	classID := r.PathValue("classId")
	if classID == "" {
		http.Error(w, "classId required", http.StatusBadRequest)
		return
	}

	className := classID
	if c, ok := s.content.Classes[types.ClassID(classID)]; ok {
		className = c.Name
	} else {
		for _, c := range s.content.Classes {
			if strings.EqualFold(string(c.ID), classID) {
				className = c.Name
				classID = string(c.ID)
				break
			}
		}
	}

	rows, err := s.db.Query(`
		SELECT class_id, name, level, '' as source, COALESCE(details_json, '')
		FROM class_features
		WHERE class_id = ?
		ORDER BY level, id
	`, classID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	features := []ClassFeatureEntry{}
	for rows.Next() {
		var fe ClassFeatureEntry
		var entriesStr string
		if err := rows.Scan(&fe.ClassID, &fe.Name, &fe.Level, &fe.Source, &entriesStr); err != nil {
			continue
		}
		if entriesStr == "" {
			fe.Entries = json.RawMessage("[]")
		} else {
			fe.Entries = json.RawMessage(entriesStr)
		}
		features = append(features, fe)
	}

	resp := FeaturesResponse{
		ClassID:   classID,
		ClassName: className,
		Features:  features,
	}

	if subclassID := r.URL.Query().Get("subclassId"); subclassID != "" {
		log.Printf("DEBUG: Fetching subclass features for classID=%s, subclassID=%s", classID, subclassID)
		subclassName := subclassID
		if sc, ok := s.content.Classes[types.ClassID(classID)]; ok {
			for _, s := range sc.SubClasses {
				if string(s.ID) == subclassID {
					subclassName = s.Name
					break
				}
			}
		}
		resp.SubclassID = subclassID
		resp.SubclassName = subclassName

		srows, err := s.db.Query(`
			SELECT subclass_id, name, level, '' as source, COALESCE(details_json, '')
			FROM subclass_features
			WHERE subclass_id = ?
			ORDER BY level, id
		`, subclassID)
		if err != nil {
			log.Printf("DEBUG: Query error: %v", err)
		} else {
			defer srows.Close()
			count := 0
			for srows.Next() {
				var fe ClassFeatureEntry
				var entriesStr string
				if err := srows.Scan(&fe.SubclassID, &fe.Name, &fe.Level, &fe.Source, &entriesStr); err != nil {
					log.Printf("DEBUG: Scan error: %v", err)
					continue
				}
				if entriesStr == "" {
					fe.Entries = json.RawMessage("[]")
				} else {
					fe.Entries = json.RawMessage(entriesStr)
				}
				resp.SubclassFeatures = append(resp.SubclassFeatures, fe)
				count++
			}
			log.Printf("DEBUG: Loaded %d subclass features for %s", count, subclassID)
			if err := srows.Err(); err != nil {
				log.Printf("DEBUG: Rows error: %v", err)
			}
		}
	}

	writeJSON(w, resp)
}

func (s *Server) handleMetamagicOptions(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`
		SELECT id, name, source, COALESCE(description, ''), level
		FROM metamagic_options
		ORDER BY name
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type MetamagicOption struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Source      string `json:"source"`
		Description string `json:"description"`
		Level       int    `json:"level"`
	}

	var options []MetamagicOption
	for rows.Next() {
		var m MetamagicOption
		if err := rows.Scan(&m.ID, &m.Name, &m.Source, &m.Description, &m.Level); err != nil {
			continue
		}
		options = append(options, m)
	}

	writeJSON(w, map[string][]MetamagicOption{"metamagicOptions": options})
}

func (s *Server) handleFeats(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`
		SELECT id, name,
			prereq_level, prereq_ability, prereq_ability_min, prereq_feat, prereq_class, prereq_spellcasting, prereq_proficiency, source
		FROM feats
		ORDER BY name
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type FeatEntry struct {
		ID               string `json:"id"`
		Name             string `json:"name"`
		PrereqLevel      *int   `json:"prereqLevel,omitempty"`
		PrereqAbility    string `json:"prereqAbility,omitempty"`
		PrereqAbilityMin *int   `json:"prereqAbilityMin,omitempty"`
		PrereqFeat       string `json:"prereqFeat,omitempty"`
		PrereqClass      string `json:"prereqClass,omitempty"`
		PrereqSpellcasting bool   `json:"prereqSpellcasting,omitempty"`
		PrereqProficiency string `json:"prereqProficiency,omitempty"`
		Source           string `json:"source,omitempty"`
	}

	var feats = []FeatEntry{}
	for rows.Next() {
		var f FeatEntry
		var pl, pam sql.NullInt64
		var pa, pf, pc, pp, src sql.NullString
		var psc int
		if err := rows.Scan(&f.ID, &f.Name,
			&pl, &pa, &pam,
			&pf, &pc, &psc,
			&pp, &src); err != nil {
			continue
		}
		if pl.Valid {
			v := int(pl.Int64)
			f.PrereqLevel = &v
		}
		if pa.Valid {
			f.PrereqAbility = pa.String
		}
		if pam.Valid {
			v := int(pam.Int64)
			f.PrereqAbilityMin = &v
		}
		if pf.Valid {
			f.PrereqFeat = pf.String
		}
		if pc.Valid {
			f.PrereqClass = pc.String
		}
		f.PrereqSpellcasting = psc == 1
		if pp.Valid {
			f.PrereqProficiency = pp.String
		}
		if src.Valid {
			f.Source = src.String
		}
		feats = append(feats, f)
	}

	writeJSON(w, map[string][]FeatEntry{"feats": feats})
}

func (s *Server) handleBuild(w http.ResponseWriter, r *http.Request) {
	var req BuildRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}
	if len(req.Classes) == 0 {
		http.Error(w, "At least one class required", http.StatusBadRequest)
		return
	}

	// Convert simple API format to engine.BuildRequest
	engineReq := apiToEngineReq(req, s.content)

	if engineReq.AbilityMethod == "" {
		engineReq.AbilityMethod = "standard_array"
	}

	// Phase 1: Validate
	if err := s.validator.Validate(engineReq); err != nil {
		http.Error(w, "Validation: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Phase 2: Fill defaults for anything not specified
	s.autoSelector.FillDefaults(&engineReq, req.Name)

	// Phase 3: Generate events
	evts, err := s.eventGen.BuildCharacterEvents(engineReq)
	if err != nil {
		http.Error(w, "Build error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Phase 4: Commit to engine
	ctx := r.Context()
	newCampaign, err := s.engine.Commit(ctx, s.campaign, evts)
	if err != nil {
		http.Error(w, "Commit error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	s.campaign = newCampaign

	// Find the character ID from the created event
	var charID types.CharacterID
	for _, e := range evts {
		if ce, ok := e.(*events.CharacterCreatedEvent); ok {
			charID = ce.CharacterID
			break
		}
	}
	if charID == (types.CharacterID{}) {
		http.Error(w, "Character not created", http.StatusInternalServerError)
		return
	}

	char, ok := s.campaign.State.Characters[charID]
	if !ok {
		http.Error(w, "Character not found in state", http.StatusInternalServerError)
		return
	}

	// Phase 5: Derive character sheet
	sheet := derive.BuildCharacterSheet(*char, s.content)

	// Build response features
	classNames := make([]string, len(req.Classes))
	for i, cr := range req.Classes {
		if cls, ok := s.content.Classes[cr.ID]; ok {
			classNames[i] = cls.Name
		} else {
			classNames[i] = string(cr.ID)
		}
	}

	var allFeatures []featureView
	for _, cr := range req.Classes {
		cls, ok := s.content.Classes[cr.ID]
		if !ok {
			continue
		}
		for _, lvl := range cls.Levels {
			if lvl.Level > cr.Level {
				continue
			}
			for _, fid := range lvl.Features {
				allFeatures = append(allFeatures, featureView{
					Class: cls.Name, Level: lvl.Level, ID: string(fid), Name: featureName(s.content, fid),
				})
			}
			if lvl.Feat != nil {
				allFeatures = append(allFeatures, featureView{
					Class: cls.Name, Level: lvl.Level, ID: string(*lvl.Feat), Name: featureName(s.content, *lvl.Feat),
				})
			}
		}
	}

	yamlBytes, _ := yaml.Marshal(sheet)

	resp := BuildResponse{
		ID: charID, Sheet: &sheet, Classes: classNames,
		Event: evts[0], YAML: string(yamlBytes), Features: allFeatures,
	}
	writeJSON(w, resp)
}

func apiToEngineReq(req BuildRequest, content scontent.ResolvedContent) engine.BuildRequest {
	classes := make([]engine.ClassBuildEntry, len(req.Classes))
	for i, c := range req.Classes {
		classes[i] = engine.ClassBuildEntry{
			ID:         c.ID,
			Level:      c.Level,
			SubclassID: c.SubclassID,
		}
	}

	skills := make([]engine.SkillChoice, len(req.Skills))
	for i, sk := range req.Skills {
		source := "class"
		if bg, ok := content.Backgrounds[req.BackgroundID]; ok {
			for _, bgSk := range bg.Skills {
				if bgSk == sk {
					source = "background"
					break
				}
			}
		}
		skills[i] = engine.SkillChoice{Skill: sk, Source: source}
	}

	spells := make([]engine.SpellChoice, len(req.Spells))
	for i, sp := range req.Spells {
		lvl := 0
		if spell, ok := content.Spells[sp]; ok {
			lvl = spell.Level
		}
		spells[i] = engine.SpellChoice{SpellID: sp, Source: "class", Level: lvl}
	}

	feats := make([]engine.FeatChoice, len(req.Feats))
	for i, f := range req.Feats {
		feats[i] = engine.FeatChoice{FeatID: f, Level: 1}
	}

	// Infer subclass choices from class entries
	subclassChoices := make([]engine.SubclassChoice, 0)
	for _, c := range req.Classes {
		if c.SubclassID != nil {
			subclassChoices = append(subclassChoices, engine.SubclassChoice{
				ClassID:    c.ID,
				SubclassID: *c.SubclassID,
				Level:      0,
			})
		}
	}

	return engine.BuildRequest{
		Name:            req.Name,
		SpeciesID:       req.SpeciesID,
		SpeciesVariant:  stringPtr(req.SpeciesVariant),
		BackgroundID:    req.BackgroundID,
		Classes:         classes,
		Level:           req.Level,
		AbilityScores:   req.AbilityScores,
		AbilityMethod:   req.AbilityMethod,
		Skills:          skills,
		Spells:          spells,
		Feats:           feats,
		Equipment:       []engine.EquipmentChoice{},
		SubclassChoices: subclassChoices,
	}
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func featureName(content scontent.ResolvedContent, fid types.FeatID) string {
	if f, ok := content.Feats[fid]; ok { return f.Name }
	s := string(fid)
	parts := strings.Split(s, ".")
	if len(parts) > 0 {
		last := parts[len(parts)-1]
		return strings.ReplaceAll(strings.ReplaceAll(last, "-", " "), "_", " ")
	}
	return s
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func computeHP(hitDie types.HitDie, con int, level int) int {
	hd := hitDieMax(hitDie)
	perLevel := (hd/2 + 1) + abilityMod(con)
	return hd + abilityMod(con) + (level-1)*perLevel
}

func hitDieMax(hd types.HitDie) int {
	switch hd {
	case types.HitDieD6: return 6
	case types.HitDieD8: return 8
	case types.HitDieD10: return 10
	case types.HitDieD12: return 12
	default: return 8
	}
}

func abilityMod(score int) int { return (score - 10) / 2 }

func atoi(s string) int {
	v := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			v = v*10 + int(c-'0')
		} else {
			break
		}
	}
	return v
}

// ─── Character Storage ───────────────────────────────────────

type SavedCharacter struct {
	Name            string              `json:"name" yaml:"name"`
	Classes         []SavedClass        `json:"classes" yaml:"classes"`
	BackgroundID    string              `json:"backgroundId" yaml:"backgroundId"`
	BackgroundName  string              `json:"backgroundName,omitempty" yaml:"backgroundName,omitempty"`
	SpeciesID       string              `json:"speciesId" yaml:"speciesId"`
	SpeciesVariant  string              `json:"speciesVariant,omitempty" yaml:"speciesVariant,omitempty"`
	SpeciesHybrid   string              `json:"speciesHybrid,omitempty" yaml:"speciesHybrid,omitempty"`
	Level           int                 `json:"level" yaml:"level"`
	AbilityMethod   string              `json:"abilityMethod" yaml:"abilityMethod"`
	Abilities       map[string]int      `json:"abilities" yaml:"abilities"`
	Skills          []string            `json:"skills" yaml:"skills"`
	Spells          []string            `json:"spells,omitempty" yaml:"spells,omitempty"`
	Feats           []string            `json:"feats,omitempty" yaml:"feats,omitempty"`
	Equipment       []string            `json:"equipment,omitempty" yaml:"equipment,omitempty"`
	SubclassID      string              `json:"subclassId,omitempty" yaml:"subclassId,omitempty"`
	BGAlignment     string              `json:"bgAlignment,omitempty" yaml:"bgAlignment,omitempty"`
	BGFaith         string              `json:"bgFaith,omitempty" yaml:"bgFaith,omitempty"`
	BGTrait         string              `json:"bgTrait,omitempty" yaml:"bgTrait,omitempty"`
	BGIdeal         string              `json:"bgIdeal,omitempty" yaml:"bgIdeal,omitempty"`
	BGBond          string              `json:"bgBond,omitempty" yaml:"bgBond,omitempty"`
	BGFlaw          string              `json:"bgFlaw,omitempty" yaml:"bgFlaw,omitempty"`
	BGAge           string              `json:"bgAge,omitempty" yaml:"bgAge,omitempty"`
	BGHeight        string              `json:"bgHeight,omitempty" yaml:"bgHeight,omitempty"`
	BGWeight        string              `json:"bgWeight,omitempty" yaml:"bgWeight,omitempty"`
	BGEyes          string              `json:"bgEyes,omitempty" yaml:"bgEyes,omitempty"`
	BGSkin          string              `json:"bgSkin,omitempty" yaml:"bgSkin,omitempty"`
	BGHair          string              `json:"bgHair,omitempty" yaml:"bgHair,omitempty"`
	BGNotes         string              `json:"bgNotes,omitempty" yaml:"bgNotes,omitempty"`
	XP              int                 `json:"xp" yaml:"xp"`
	ProgressionType string              `json:"progressionType" yaml:"progressionType"`
	CreatedAt       string              `json:"createdAt" yaml:"createdAt"`
	UpdatedAt       string              `json:"updatedAt" yaml:"updatedAt"`
}

type SavedClass struct {
	ID         string `json:"id" yaml:"id"`
	Name       string `json:"name" yaml:"name"`
	Level      int    `json:"level" yaml:"level"`
	SubclassID string `json:"subclassId,omitempty" yaml:"subclassId,omitempty"`
}

type CharacterSummary struct {
	Name      string `json:"name"`
	Level     int    `json:"level"`
	Classes   string `json:"classes"`
	Species   string `json:"species"`
	UpdatedAt string `json:"updatedAt"`
}

var safeNameRegex = regexp.MustCompile(`[^a-zA-Z0-9_-]`)

func sanitizeName(name string) string {
	s := strings.ToLower(name)
	s = safeNameRegex.ReplaceAllString(s, "-")
	s = strings.ReplaceAll(s, "--", "-")
	s = strings.Trim(s, "-")
	if s == "" { s = "unnamed" }
	return s
}

func (s *Server) charactersDir() string {
	dir := s.config.Data.CharactersDir
	if dir == "" {
		dir = "char"
	}
	return dir
}

func (s *Server) handleListCharacters(w http.ResponseWriter, r *http.Request) {
	dir := s.charactersDir()
	entries, err := os.ReadDir(dir)
	if err != nil { writeJSON(w, []CharacterSummary{}); return }

	var chars []CharacterSummary
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") { continue }
		data, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil { continue }
		var ch SavedCharacter
		if err := yaml.Unmarshal(data, &ch); err != nil { continue }
		classNames := make([]string, len(ch.Classes))
		for i, c := range ch.Classes { classNames[i] = c.Name }
		chars = append(chars, CharacterSummary{
			Name: ch.Name, Level: ch.Level, Classes: strings.Join(classNames, " / "),
			Species: ch.SpeciesID, UpdatedAt: ch.UpdatedAt,
		})
	}
	writeJSON(w, chars)
}

func (s *Server) handleGetCharacter(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" { http.Error(w, "Name required", http.StatusBadRequest); return }
	safe := sanitizeName(name)
	data, err := os.ReadFile(filepath.Join(s.charactersDir(), safe+".yaml"))
	if err != nil { http.Error(w, "Character not found", http.StatusNotFound); return }
	var ch SavedCharacter
	if err := yaml.Unmarshal(data, &ch); err != nil { http.Error(w, "Invalid character data", http.StatusInternalServerError); return }
	writeJSON(w, ch)
}

// SaveCharacterPayload is what the frontend sends to save a character.
type SaveCharacterPayload struct {
	Request BuildRequest          `json:"request"`
	Sheet   *derive.CharacterSheet `json:"sheet,omitempty"`
}

func (s *Server) handleSaveCharacter(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")

	var payload SaveCharacterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	req := payload.Request
	if name == "" { name = req.Name }
	if name == "" { http.Error(w, "Name required", http.StatusBadRequest); return }

	// If no sheet provided, run the build pipeline
	var sheet derive.CharacterSheet
	if payload.Sheet != nil {
		sheet = *payload.Sheet
	} else {
		engineReq := apiToEngineReq(req, s.content)
		if engineReq.AbilityMethod == "" {
			engineReq.AbilityMethod = "standard_array"
		}
		if err := s.validator.Validate(engineReq); err != nil {
			http.Error(w, "Validation: "+err.Error(), http.StatusBadRequest)
			return
		}
		s.autoSelector.FillDefaults(&engineReq, req.Name)
		evts, err := s.eventGen.BuildCharacterEvents(engineReq)
		if err != nil {
			http.Error(w, "Build error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		ctx := r.Context()
		newCampaign, err := s.engine.Commit(ctx, s.campaign, evts)
		if err != nil {
			http.Error(w, "Commit error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		s.campaign = newCampaign

		var charID types.CharacterID
		for _, e := range evts {
			if ce, ok := e.(*events.CharacterCreatedEvent); ok {
				charID = ce.CharacterID
				break
			}
		}
		if charID == (types.CharacterID{}) {
			http.Error(w, "Character not created", http.StatusInternalServerError)
			return
		}
		char, ok := s.campaign.State.Characters[charID]
		if !ok {
			http.Error(w, "Character not found in state", http.StatusInternalServerError)
			return
		}
		sheet = derive.BuildCharacterSheet(*char, s.content)
	}

	subclassID := ""
	if len(sheet.Classes) > 0 && sheet.Classes[0].SubClass != nil {
		subclassID = string(*sheet.Classes[0].SubClass)
	}
	ch := SavedCharacter{
		Name:           name,
		Level:          sheet.Level,
		BackgroundID:   sheet.Background,
		SpeciesID:      sheet.Species,
		SubclassID:     subclassID,
		AbilityMethod:  "standard",
		Abilities:      make(map[string]int),
		Skills:         make([]string, 0),
		ProgressionType: "milestone",
		CreatedAt:      time.Now().Format(time.RFC3339),
		UpdatedAt:      time.Now().Format(time.RFC3339),
	}
	for _, c := range sheet.Classes {
		scSub := ""
		if c.SubClass != nil {
			scSub = string(*c.SubClass)
		}
		sc := SavedClass{ID: string(c.ID), Name: c.Name, Level: c.Level, SubclassID: scSub}
		ch.Classes = append(ch.Classes, sc)
	}
	ch.Abilities["STR"] = sheet.AbilityScores.STR
	ch.Abilities["DEX"] = sheet.AbilityScores.DEX
	ch.Abilities["CON"] = sheet.AbilityScores.CON
	ch.Abilities["INT"] = sheet.AbilityScores.INT
	ch.Abilities["WIS"] = sheet.AbilityScores.WIS
	ch.Abilities["CHA"] = sheet.AbilityScores.CHA
	ch.Skills = make([]string, 0, len(sheet.Skills))
	for sk := range sheet.Skills {
		ch.Skills = append(ch.Skills, string(sk))
	}
	ch.Spells = sheet.Spells
	if len(sheet.Features) > 0 {
		ch.Feats = make([]string, 0)
		for _, f := range sheet.Features {
			ch.Feats = append(ch.Feats, f.ID)
		}
	}

	yamlBytes, err := yaml.Marshal(ch)
	if err != nil {
		http.Error(w, "Failed to marshal character", http.StatusInternalServerError)
		return
	}

	dir := s.charactersDir()
	os.MkdirAll(dir, 0755)
	safe := sanitizeName(name)
	path := filepath.Join(dir, safe+".yaml")
	if err := os.WriteFile(path, yamlBytes, 0644); err != nil {
		http.Error(w, "Failed to save character", http.StatusInternalServerError)
		return
	}

	// Upsert character_sheets table
	s.upsertCharacterSheet(sheet, safe)

	writeJSON(w, map[string]string{"status": "saved", "path": path})
}

func (s *Server) upsertCharacterSheet(sheet derive.CharacterSheet, safeName string) {
	classesJSON, _ := json.Marshal(sheet.Classes)
	abilitiesJSON, _ := json.Marshal(sheet.AbilityScores)
	// Build a flat skills map (skill name -> total bonus) for storage
	skillsFlat := make(map[string]int)
	for sk, sv := range sheet.Skills {
		skillsFlat[string(sk)] = sv.Total
	}
	skillsJSON, _ := json.Marshal(skillsFlat)
	// Build a flat saves map
	savesFlat := make(map[string]int)
	for ab, v := range sheet.SavingThrows {
		savesFlat[string(ab)] = v
	}
	savesJSON, _ := json.Marshal(savesFlat)
	spellsJSON, _ := json.Marshal(sheet.Spells)
	updatedAt := time.Now().Format(time.RFC3339)

	initBonus := (sheet.AbilityScores.DEX-10)/2 + sheet.ProficiencyBonus*sheet.InitBonus
	speed := 30
	if sheet.Speed > 0 {
		speed = sheet.Speed
	}

	s.db.Exec(`
		INSERT INTO character_sheets
			(character_id, name, level, classes_json, species_id, background_id,
			 ability_scores, hp_current, hp_max, hp_temp, ac, speed, initiative,
			 proficiency_bonus, skills_json, saves_json, spells_json, conditions_json,
			 resources_json, equipment_json, event_version, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
		ON CONFLICT(character_id) DO UPDATE SET
			name=excluded.name, level=excluded.level, classes_json=excluded.classes_json,
			species_id=excluded.species_id, background_id=excluded.background_id,
			ability_scores=excluded.ability_scores, hp_current=excluded.hp_current,
			hp_max=excluded.hp_max, ac=excluded.ac, speed=excluded.speed,
			initiative=excluded.initiative, proficiency_bonus=excluded.proficiency_bonus,
			skills_json=excluded.skills_json, saves_json=excluded.saves_json,
			spells_json=excluded.spells_json, equipment_json=excluded.equipment_json,
			updated_at=excluded.updated_at
	`, safeName, sheet.Name, sheet.Level, string(classesJSON),
		string(sheet.Species), string(sheet.Background),
		string(abilitiesJSON), sheet.HP.Max, sheet.HP.Max, 0, sheet.AC, speed, initBonus,
		sheet.ProficiencyBonus,
		string(skillsJSON), string(savesJSON), string(spellsJSON),
		"[]", "{}", "[]", updatedAt)
}

func (s *Server) handleDeleteCharacter(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" { http.Error(w, "Name required", http.StatusBadRequest); return }
	safe := sanitizeName(name)
	path := filepath.Join(s.charactersDir(), safe+".yaml")
	if err := os.Remove(path); err != nil { http.Error(w, "Character not found", http.StatusNotFound); return }
	writeJSON(w, map[string]string{"status": "deleted"})
}