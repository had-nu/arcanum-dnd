package main

import (
	"embed"
	"encoding/json"
	"io/fs"
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

	contentpack "github.com/hadnu/arcanum/internal/content"
	"github.com/hadnu/arcanum/internal/engine"
	"github.com/hadnu/arcanum/internal/engine/derive"
	"github.com/hadnu/arcanum/internal/rng"
	"github.com/hadnu/arcanum/internal/schemas/events"
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
	"gopkg.in/yaml.v3"
)

//go:embed web/*
var webFiles embed.FS

type Server struct {
	content  scontent.ResolvedContent
	engine   *engine.Engine
	campaign engine.Campaign
}

type BuildRequest struct {
	Name           string              `json:"name"`
	Classes        []classReq          `json:"classes"`
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

type classReq struct {
	ID    types.ClassID `json:"id"`
	Level int           `json:"level"`
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
	Classes     []contentEntry   `json:"classes"`
	Backgrounds []contentEntry   `json:"backgrounds"`
	Species     []speciesEntry   `json:"species"`
	Abilities   []abilityEntry   `json:"abilities"`
	Skills      []skillEntry     `json:"skills"`
	Feats       map[string]featAPIEntry `json:"feats"`
	SpellCasterClasses []string  `json:"spellCasterClasses"`
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

func main() {
	log.Println("Arcanum Server starting...")

	content, err := contentpack.LoadAllFromDataDir("data")
	if err != nil {
		log.Fatalf("Failed to load content: %v", err)
	}
	log.Printf("Loaded %d classes, %d species, %d backgrounds, %d feats, %d spells, %d items",
		len(content.Classes), len(content.Species), len(content.Backgrounds),
		len(content.Feats), len(content.Spells), len(content.Items))

	randSource := rng.NewSeededRNG(42)
	e := engine.NewEngine(content, randSource)
	campaign := e.CreateCampaign("Arcanum Web")

	srv := &Server{content: content, engine: e, campaign: campaign}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/content", srv.handleContent)
	mux.HandleFunc("GET /api/spells", srv.handleSpells)
	mux.HandleFunc("POST /api/build", srv.handleBuild)
	mux.HandleFunc("GET /api/characters", srv.handleListCharacters)
	mux.HandleFunc("GET /api/characters/{name}", srv.handleGetCharacter)
	mux.HandleFunc("PUT /api/characters/{name}", srv.handleSaveCharacter)
	mux.HandleFunc("DELETE /api/characters/{name}", srv.handleDeleteCharacter)
	mux.HandleFunc("GET /", srv.handleWeb)

	webSub, err := fs.Sub(webFiles, "web")
	if err != nil {
		log.Fatalf("Failed to get web subfs: %v", err)
	}
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.FS(webSub))))

	server := &http.Server{
		Addr:         ":8080",
		Handler:      corsMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
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
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleWeb(w http.ResponseWriter, r *http.Request) {
	html, err := webFiles.ReadFile("web/index.html")
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(html)
}

func (s *Server) handleContent(w http.ResponseWriter, r *http.Request) {
	resp := ContentResponse{}

	for _, c := range s.content.Classes {
		saves := make([]string, len(c.SavingThrows))
		for i, s := range c.SavingThrows {
			saves[i] = string(s)
		}
		primary := make([]string, len(c.PrimaryAbility))
		for i, a := range c.PrimaryAbility {
			primary[i] = string(a)
		}

		var skillChoices int
		var skillPool []string
		for _, si := range c.Proficiencies.Skills {
			skillChoices = si.Choose
			for _, sk := range si.From {
				skillPool = append(skillPool, string(sk))
			}
			break
		}

		hasSpells := false
		subclassLevel := 0
		var features []featureDef
		for _, lvl := range c.Levels {
			if len(lvl.SpellSlots) > 0 {
				hasSpells = true
			}
			for _, fid := range lvl.Features {
				if subclassLevel == 0 && len(fid) > 9 && fid[len(fid)-9:] == ".subclass" {
					subclassLevel = lvl.Level
				}
				if f, ok := s.content.Feats[fid]; ok {
					features = append(features, featureDef{Level: lvl.Level, ID: string(fid), Name: f.Name})
				}
			}
			if lvl.Feat != nil {
				if f, ok := s.content.Feats[*lvl.Feat]; ok {
					features = append(features, featureDef{Level: lvl.Level, ID: string(*lvl.Feat), Name: f.Name})
				}
			}
		}

		var subClasses []subClassEntry
		for _, sc := range c.SubClasses {
			subClasses = append(subClasses, subClassEntry{
				ID:          string(sc.ID),
				Name:        sc.Name,
				Description: sc.Description,
			})
		}

		resp.Classes = append(resp.Classes, contentEntry{
			ID:             string(c.ID),
			Name:           c.Name,
			HitDie:         string(c.HitDie),
			SavingThrows:   saves,
			PrimaryAbility: primary,
			SkillChoices:   skillChoices,
			SkillPool:      skillPool,
			Spellcaster:    hasSpells,
			SubClasses:     subClasses,
			SubclassLevel:  subclassLevel,
			Features:       features,
			Spellcasting:   buildSpellcastingEntry(c),
		})
	}

	for _, bg := range s.content.Backgrounds {
		skills := make([]string, len(bg.Skills))
		for i, sk := range bg.Skills {
			skills[i] = string(sk)
		}
		feat := ""
		if bg.Feat != nil {
			if f, ok := s.content.Feats[*bg.Feat]; ok {
				feat = f.Name
			}
		}
		resp.Backgrounds = append(resp.Backgrounds, contentEntry{
			ID:     string(bg.ID),
			Name:   bg.Name,
			Skills: skills,
			Feat:   feat,
		})
	}

	for _, sp := range s.content.Species {
		var variants []variantEntry
		for _, v := range sp.Variants {
			variants = append(variants, variantEntry{ID: v.ID, Name: v.Name})
		}
		resp.Species = append(resp.Species, speciesEntry{
			ID:       string(sp.ID),
			Name:     sp.Name,
			Size:     string(sp.Size),
			Speed:    sp.Speed.Walk,
			Variants: variants,
		})
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
		resp.Skills = append(resp.Skills, skillEntry{
			ID:      string(sk),
			Name:    names[sk],
			Ability: string(types.SkillAbility[sk]),
		})
	}

	for _, c := range s.content.Classes {
		for _, lvl := range c.Levels {
			if len(lvl.SpellSlots) > 0 {
				resp.SpellCasterClasses = append(resp.SpellCasterClasses, string(c.ID))
				break
			}
		}
	}

	feats := make(map[string]featAPIEntry)
	for fid, f := range s.content.Feats {
		feats[string(fid)] = featAPIEntry{ID: string(fid), Name: f.Name}
	}
	resp.Feats = feats

	writeJSON(w, resp)
}

func (s *Server) handleSpells(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("class")
	maxLevel := r.URL.Query().Get("level")

	resp := SpellsResponse{
		Leveled: make([][]spellEntry, 9),
	}

	// check if any spells have class tagging
	anyTagged := false
	for _, sp := range s.content.Spells {
		if len(sp.Classes) > 0 {
			anyTagged = true
			break
		}
	}

	for _, sp := range s.content.Spells {
		if classID != "" && anyTagged {
			hasClass := false
			for _, c := range sp.Classes {
				if string(c) == classID {
					hasClass = true
					break
				}
			}
			if !hasClass {
				continue
			}
		}
		entry := spellEntry{
			ID:   string(sp.ID),
			Name: sp.Name,
			Level: sp.Level,
			School: string(sp.School),
			Time:  sp.CastingTime,
			Range: sp.Range,
			Duration: sp.Duration,
			Concentration: sp.Concentration,
			Ritual: sp.Ritual,
			Attack: sp.Attack,
		}
		if sp.Damage != nil {
			entry.Damage = sp.Damage.Dice
		}
		if sp.Save != nil {
			entry.Save = string(*sp.Save)
		}
		if sp.Level == 0 {
			resp.Cantrips = append(resp.Cantrips, entry)
		} else if sp.Level <= 9 && sp.Level >= 1 {
			if maxLevel == "" || sp.Level <= atoi(maxLevel) {
				resp.Leveled[sp.Level-1] = append(resp.Leveled[sp.Level-1], entry)
			}
		}
	}

	sort.Slice(resp.Cantrips, func(i, j int) bool { return resp.Cantrips[i].Name < resp.Cantrips[j].Name })
	for i := range resp.Leveled {
		sort.Slice(resp.Leveled[i], func(a, b int) bool { return resp.Leveled[i][a].Name < resp.Leveled[i][b].Name })
	}

	writeJSON(w, resp)
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
	if _, ok := s.content.Species[req.SpeciesID]; !ok {
		http.Error(w, "Invalid species", http.StatusBadRequest)
		return
	}
	if req.Level < 1 || req.Level > 20 {
		req.Level = 1
	}

	// validate classes and compute hp/saves
	totalHP := 0
	saveSet := map[types.AbilityScore]bool{}
	var classNames []string
	var allFeatures []featureView

	for _, cr := range req.Classes {
		cls, ok := s.content.Classes[cr.ID]
		if !ok {
			http.Error(w, "Invalid class: "+string(cr.ID), http.StatusBadRequest)
			return
		}
		totalHP += computeHP(cls.HitDie, req.AbilityScores.CON, cr.Level)
		for _, s := range cls.SavingThrows {
			saveSet[s] = true
		}
		classNames = append(classNames, cls.Name)

		// collect features for this class up to the chosen level
		for _, lvl := range cls.Levels {
			if lvl.Level > cr.Level {
				continue
			}
			for _, fid := range lvl.Features {
				allFeatures = append(allFeatures, featureView{
					Class: cls.Name, Level: lvl.Level,
					ID: string(fid), Name: featureName(s.content, fid),
				})
			}
			if lvl.Feat != nil {
				allFeatures = append(allFeatures, featureView{
					Class: cls.Name, Level: lvl.Level,
					ID: string(*lvl.Feat), Name: featureName(s.content, *lvl.Feat),
				})
			}
		}
	}

	if totalHP < 1 {
		totalHP = 1
	}

	saves := make([]types.AbilityScore, 0, len(saveSet))
	for s := range saveSet {
		saves = append(saves, s)
	}

	// skills: background + chosen
	skillLevels := map[types.Skill]types.ProficiencyLevel{}
	bg, hasBg := s.content.Backgrounds[req.BackgroundID]
	if hasBg {
		for _, sk := range bg.Skills {
			skillLevels[sk] = types.ProficiencyProficient
		}
	}
	for _, sk := range req.Skills {
		if _, ok := skillLevels[sk]; !ok {
			skillLevels[sk] = types.ProficiencyProficient
		}
	}

	// feats
	var featIDs []types.FeatID
	for _, f := range req.Feats {
		fid := types.FeatID(f)
		if _, ok := s.content.Feats[fid]; ok {
			featIDs = append(featIDs, fid)
		}
	}
	if hasBg && bg.Feat != nil {
		if _, ok := s.content.Feats[*bg.Feat]; ok {
			featIDs = append(featIDs, *bg.Feat)
		}
	}

	evtEvt := events.CharacterCreatedEvent{
		CharacterID:    types.NewCharacterID(),
		Name:           req.Name,
		SpeciesID:      req.SpeciesID,
		SpeciesVariant: req.SpeciesVariant,
		BackgroundID:   req.BackgroundID,
		Level:          req.Level,
		AbilityScores:  req.AbilityScores,
		MaxHP:          totalHP,
		SavingThrows:   saves,
		Skills:         skillLevels,
		Spells:         req.Spells,
		Feats:          featIDs,
		AbilityMethod:  req.AbilityMethod,
	}
	for _, cr := range req.Classes {
		evtEvt.Classes = append(evtEvt.Classes, events.ClassEntry{ClassID: cr.ID, Level: cr.Level})
	}

	evt := events.Event{
		Type:             events.EventCharacterCreated,
		CharacterCreated: &evtEvt,
	}

	s.campaign = s.engine.Commit(s.campaign, []events.Event{evt})
	char, ok := s.campaign.State.Characters[evtEvt.CharacterID]
	if !ok {
		http.Error(w, "Character not found in state", http.StatusInternalServerError)
		return
	}

	sheet := derive.BuildCharacterSheet(*char, s.content)
	for i, cv := range sheet.Classes {
		if c, ok := s.content.Classes[cv.ID]; ok {
			sheet.Classes[i].Name = c.Name
		}
	}

	yamlBytes, _ := yaml.Marshal(sheet)

	resp := BuildResponse{
		ID:       evtEvt.CharacterID,
		Sheet:    &sheet,
		Classes:  classNames,
		Event:    evt,
		YAML:     string(yamlBytes),
		Features: allFeatures,
	}

	writeJSON(w, resp)
}

func buildSpellcastingEntry(cls *scontent.Class) *SpellcastingEntry {
	if cls.Spellcasting == nil {
		return nil
	}
	entry := &SpellcastingEntry{
		Type:   string(cls.Spellcasting.Type),
		Ability: string(cls.Spellcasting.Ability),
		RitualCasting: cls.Spellcasting.RitualCasting,
	}

	for _, lvl := range cls.Levels {
		if lvl.CantripsKnown > 0 {
			entry.CantripsKnown = append(entry.CantripsKnown, lvl.CantripsKnown)
		}
		if lvl.PreparedSpells > 0 {
			entry.PreparedSpells = append(entry.PreparedSpells, lvl.PreparedSpells)
		}
		if lvl.SpellsKnown > 0 {
			entry.SpellsKnown = append(entry.SpellsKnown, lvl.SpellsKnown)
		}
		if lvl.SpellSlots != nil {
			if entry.SpellSlots == nil {
				entry.SpellSlots = make(map[string]int)
			}
			for k, v := range lvl.SpellSlots {
				entry.SpellSlots[strconv.Itoa(k)] = v
			}
		}
	}

	if cls.Spellcasting.RitualCasting {
		entry.RitualCasting = true
	}

	return entry
}

func featureName(content scontent.ResolvedContent, fid types.FeatID) string {
	if f, ok := content.Feats[fid]; ok {
		return f.Name
	}
	s := string(fid)
	// format "class.fighter.fighting-style" -> "Fighting Style"
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
	case types.HitDieD6:
		return 6
	case types.HitDieD8:
		return 8
	case types.HitDieD10:
		return 10
	case types.HitDieD12:
		return 12
	default:
		return 8
	}
}

func abilityMod(score int) int {
	return (score - 10) / 2
}

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
	ProgressionType string              `json:"progressionType" yaml:"progressionType"` // "milestone" or "xp"
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
	if s == "" {
		s = "unnamed"
	}
	return s
}

func charactersDir() string {
	return "data/characters"
}

func (s *Server) handleListCharacters(w http.ResponseWriter, r *http.Request) {
	dir := charactersDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		writeJSON(w, []CharacterSummary{})
		return
	}

	var chars []CharacterSummary
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			continue
		}
		var ch SavedCharacter
		if err := yaml.Unmarshal(data, &ch); err != nil {
			continue
		}
	 classNames := make([]string, len(ch.Classes))
		for i, c := range ch.Classes {
			classNames[i] = c.Name
		}
		chars = append(chars, CharacterSummary{
			Name:      ch.Name,
			Level:     ch.Level,
			Classes:   strings.Join(classNames, " / "),
			Species:   ch.SpeciesID,
			UpdatedAt: ch.UpdatedAt,
		})
	}
	writeJSON(w, chars)
}

func (s *Server) handleGetCharacter(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		http.Error(w, "Name required", http.StatusBadRequest)
		return
	}
	safe := sanitizeName(name)
	data, err := os.ReadFile(filepath.Join(charactersDir(), safe+".yaml"))
	if err != nil {
		http.Error(w, "Character not found", http.StatusNotFound)
		return
	}
	var ch SavedCharacter
	if err := yaml.Unmarshal(data, &ch); err != nil {
		http.Error(w, "Invalid character data", http.StatusInternalServerError)
		return
	}
	writeJSON(w, ch)
}

func (s *Server) handleSaveCharacter(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		http.Error(w, "Name required", http.StatusBadRequest)
		return
	}

	var ch SavedCharacter
	if err := json.NewDecoder(r.Body).Decode(&ch); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	ch.Name = name

	if ch.Abilities == nil {
		ch.Abilities = make(map[string]int)
	}
	if ch.ProgressionType == "" {
		ch.ProgressionType = "milestone"
	}
	if ch.CreatedAt == "" {
		ch.CreatedAt = time.Now().Format(time.RFC3339)
	}
	ch.UpdatedAt = time.Now().Format(time.RFC3339)

	// compute level from classes
	totalLevel := 0
	for _, c := range ch.Classes {
		totalLevel += c.Level
	}
	ch.Level = totalLevel

	data, err := yaml.Marshal(ch)
	if err != nil {
		http.Error(w, "Failed to marshal character", http.StatusInternalServerError)
		return
	}

	safe := sanitizeName(name)
	os.MkdirAll(charactersDir(), 0755)
	path := filepath.Join(charactersDir(), safe+".yaml")
	if err := os.WriteFile(path, data, 0644); err != nil {
		http.Error(w, "Failed to save character", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"status": "saved", "path": path})
}

func (s *Server) handleDeleteCharacter(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		http.Error(w, "Name required", http.StatusBadRequest)
		return
	}
	safe := sanitizeName(name)
	path := filepath.Join(charactersDir(), safe+".yaml")
	if err := os.Remove(path); err != nil {
		http.Error(w, "Character not found", http.StatusNotFound)
		return
	}
	writeJSON(w, map[string]string{"status": "deleted"})
}
