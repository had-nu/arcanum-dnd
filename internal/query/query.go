package query

import (
	"database/sql"
	"fmt"

	"github.com/hadnu/arcanum/internal/types"
)

// Querier provides typed read access to the content database.
type Querier struct {
	db *sql.DB
}

func New(db *sql.DB) *Querier {
	return &Querier{db: db}
}

// ---------------------------------------------------------------------------
// SPECIES
// ---------------------------------------------------------------------------

type SpeciesRow struct {
	ID           types.SpeciesID `json:"id"`
	Name         string          `json:"name"`
	Size         string          `json:"size"`
	SpeedWalk    int             `json:"speedWalk"`
	SpeedFly     int             `json:"speedFly"`
	SpeedSwim    int             `json:"speedSwim"`
	SpeedClimb   int             `json:"speedClimb"`
	CreatureType string          `json:"creatureType"`
}

func (q *Querier) GetSpecies(id types.SpeciesID) (*SpeciesRow, error) {
	row := q.db.QueryRow(`
		SELECT id, name, size, speed_walk, speed_fly, speed_swim, speed_climb, creature_type
		FROM species WHERE id = ?
	`, string(id))
	var s SpeciesRow
	var sid string
	err := row.Scan(&sid, &s.Name, &s.Size, &s.SpeedWalk, &s.SpeedFly, &s.SpeedSwim, &s.SpeedClimb, &s.CreatureType)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get species %s: %w", id, err)
	}
	s.ID = types.SpeciesID(sid)
	return &s, nil
}

func (q *Querier) ListSpecies() ([]SpeciesRow, error) {
	rows, err := q.db.Query(`
		SELECT id, name, size, speed_walk, speed_fly, speed_swim, speed_climb, creature_type
		FROM species ORDER BY name
	`)
	if err != nil {
		return nil, fmt.Errorf("list species: %w", err)
	}
	defer rows.Close()
	var result []SpeciesRow
	for rows.Next() {
		var s SpeciesRow
		var sid string
		if err := rows.Scan(&sid, &s.Name, &s.Size, &s.SpeedWalk, &s.SpeedFly, &s.SpeedSwim, &s.SpeedClimb, &s.CreatureType); err != nil {
			return nil, fmt.Errorf("scan species: %w", err)
		}
		s.ID = types.SpeciesID(sid)
		result = append(result, s)
	}
	return result, rows.Err()
}

func (q *Querier) SpeciesExists(id types.SpeciesID) (bool, error) {
	var count int
	err := q.db.QueryRow(`SELECT COUNT(*) FROM species WHERE id = ?`, string(id)).Scan(&count)
	return count > 0, err
}

// ---------------------------------------------------------------------------
// BACKGROUNDS
// ---------------------------------------------------------------------------

type BackgroundRow struct {
	ID     types.BackgroundID `json:"id"`
	Name   string             `json:"name"`
	FeatID *string            `json:"featId,omitempty"`
}

func (q *Querier) GetBackground(id types.BackgroundID) (*BackgroundRow, error) {
	var b BackgroundRow
	var bid string
	var featID sql.NullString
	err := q.db.QueryRow(`SELECT id, name, feat_id FROM backgrounds WHERE id = ?`, string(id)).
		Scan(&bid, &b.Name, &featID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get background %s: %w", id, err)
	}
	b.ID = types.BackgroundID(bid)
	if featID.Valid {
		b.FeatID = &featID.String
	}
	return &b, nil
}

func (q *Querier) GetBackgroundSkills(id types.BackgroundID) ([]types.Skill, error) {
	rows, err := q.db.Query(`SELECT skill FROM background_skills WHERE background_id = ?`, string(id))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var skills []types.Skill
	for rows.Next() {
		var sk string
		if err := rows.Scan(&sk); err != nil {
			return nil, err
		}
		skills = append(skills, types.Skill(sk))
	}
	return skills, rows.Err()
}

// ---------------------------------------------------------------------------
// CLASSES
// ---------------------------------------------------------------------------

type ClassRow struct {
	ID                types.ClassID `json:"id"`
	Name              string        `json:"name"`
	HitDie            string        `json:"hitDie"`
	SubclassLevel     int           `json:"subclassLevel"`
	SpellcastingType  string        `json:"spellcastingType"`
	SpellcastingAbility string      `json:"spellcastingAbility"`
	PreparedFormula   string        `json:"preparedFormula"`
	RitualCasting     bool          `json:"ritualCasting"`
}

func (q *Querier) GetClass(id types.ClassID) (*ClassRow, error) {
	var c ClassRow
	var cid string
	var scType, scAbility, formula string
	var ritual int
	err := q.db.QueryRow(`
		SELECT id, name, hit_die, subclass_level,
		       spellcasting_type, spellcasting_ability, prepared_formula, ritual_casting
		FROM classes WHERE id = ?
	`, string(id)).Scan(&cid, &c.Name, &c.HitDie, &c.SubclassLevel,
		&scType, &scAbility, &formula, &ritual)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get class %s: %w", id, err)
	}
	c.ID = types.ClassID(cid)
	c.SpellcastingType = scType
	c.SpellcastingAbility = scAbility
	c.PreparedFormula = formula
	c.RitualCasting = ritual == 1
	return &c, nil
}

func (q *Querier) ListClasses() ([]ClassRow, error) {
	rows, err := q.db.Query(`
		SELECT id, name, hit_die, subclass_level,
		       spellcasting_type, spellcasting_ability, prepared_formula, ritual_casting
		FROM classes ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []ClassRow
	for rows.Next() {
		var c ClassRow
		var cid string
		var scType, scAbility, formula string
		var ritual int
		if err := rows.Scan(&cid, &c.Name, &c.HitDie, &c.SubclassLevel,
			&scType, &scAbility, &formula, &ritual); err != nil {
			return nil, err
		}
		c.ID = types.ClassID(cid)
		c.SpellcastingType = scType
		c.SpellcastingAbility = scAbility
		c.PreparedFormula = formula
		c.RitualCasting = ritual == 1
		result = append(result, c)
	}
	return result, rows.Err()
}

func (q *Querier) GetClassSavingThrows(id types.ClassID) ([]types.AbilityScore, error) {
	rows, err := q.db.Query(`SELECT ability FROM class_saving_throws WHERE class_id = ?`, string(id))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []types.AbilityScore
	for rows.Next() {
		var ab string
		if err := rows.Scan(&ab); err != nil {
			return nil, err
		}
		result = append(result, types.AbilityScore(ab))
	}
	return result, rows.Err()
}

type ClassLevelRow struct {
	ClassID       types.ClassID `json:"classId"`
	Level         int           `json:"level"`
	ProfBonus     int           `json:"profBonus"`
	CantripsKnown int           `json:"cantripsKnown"`
	SpellsKnown   int           `json:"spellsKnown"`
	PreparedSpells int          `json:"preparedSpells"`
	FeatID        *string       `json:"featId,omitempty"`
}

func (q *Querier) GetClassLevel(classID types.ClassID, level int) (*ClassLevelRow, error) {
	var r ClassLevelRow
	var cid string
	var featID sql.NullString
	err := q.db.QueryRow(`
		SELECT class_id, level, prof_bonus, cantrips_known, spells_known, prepared_spells, feat_id
		FROM class_levels WHERE class_id = ? AND level = ?
	`, string(classID), level).Scan(&cid, &r.Level, &r.ProfBonus,
		&r.CantripsKnown, &r.SpellsKnown, &r.PreparedSpells, &featID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get class_level %s/%d: %w", classID, level, err)
	}
	r.ClassID = types.ClassID(cid)
	if featID.Valid {
		r.FeatID = &featID.String
	}
	return &r, nil
}

// SpellListQuery returns the set of spell IDs a class can learn at a given class level.
// For prepared casters this is the full spell list; for known casters it's the available pool.
func (q *Querier) GetClassSpellList(classID types.ClassID, classLevel int) ([]types.SpellID, error) {
	rows, err := q.db.Query(`
		SELECT DISTINCT spell_id FROM class_level_spells
		WHERE class_id = ? AND level <= ?
		ORDER BY spell_id
	`, string(classID), classLevel)
	if err != nil {
		return nil, fmt.Errorf("get class spell list %s/%d: %w", classID, classLevel, err)
	}
	defer rows.Close()
	var result []types.SpellID
	seen := make(map[types.SpellID]bool)
	for rows.Next() {
		var sid string
		if err := rows.Scan(&sid); err != nil {
			return nil, err
		}
		id := types.SpellID(sid)
		if !seen[id] {
			seen[id] = true
			result = append(result, id)
		}
	}
	return result, rows.Err()
}

// GetClassSpellSlots returns spell slots for a class level.
func (q *Querier) GetClassSpellSlots(classID types.ClassID, classLevel int) (map[int]int, error) {
	rows, err := q.db.Query(`
		SELECT slot_level, slot_count FROM class_level_slots
		WHERE class_id = ? AND level = ?
	`, string(classID), classLevel)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	slots := make(map[int]int)
	for rows.Next() {
		var sl, count int
		if err := rows.Scan(&sl, &count); err != nil {
			return nil, err
		}
		slots[sl] = count
	}
	return slots, rows.Err()
}

// GetClassProficiencies returns skill choose entries for a class.
type ClassProficiencyEntry struct {
	Category    string      `json:"category"`
	Item        string      `json:"item,omitempty"`
	SkillChoose int         `json:"skillChoose,omitempty"`
	SkillFrom   types.Skill `json:"skillFrom,omitempty"`
}

func (q *Querier) GetClassProficiencies(classID types.ClassID) ([]ClassProficiencyEntry, error) {
	rows, err := q.db.Query(`
		SELECT category, item, skill_choose, skill_from
		FROM class_proficiencies WHERE class_id = ?
		ORDER BY category, id
	`, string(classID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []ClassProficiencyEntry
	for rows.Next() {
		var e ClassProficiencyEntry
		var item, skillFrom string
		if err := rows.Scan(&e.Category, &item, &e.SkillChoose, &skillFrom); err != nil {
			return nil, err
		}
		e.Item = item
		e.SkillFrom = types.Skill(skillFrom)
		result = append(result, e)
	}
	return result, rows.Err()
}

// ---------------------------------------------------------------------------
// SUBCLASSES
// ---------------------------------------------------------------------------

type SubclassRow struct {
	ID          types.SubClassID `json:"id"`
	ClassID     types.ClassID    `json:"classId"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
}

func (q *Querier) GetSubclass(id types.SubClassID) (*SubclassRow, error) {
	var s SubclassRow
	var sid, cid string
	err := q.db.QueryRow(`
		SELECT id, class_id, name, description FROM subclasses WHERE id = ?
	`, string(id)).Scan(&sid, &cid, &s.Name, &s.Description)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get subclass %s: %w", id, err)
	}
	s.ID = types.SubClassID(sid)
	s.ClassID = types.ClassID(cid)
	return &s, nil
}

func (q *Querier) ListSubclasses(classID types.ClassID) ([]SubclassRow, error) {
	rows, err := q.db.Query(`
		SELECT id, class_id, name, description FROM subclasses WHERE class_id = ? ORDER BY name
	`, string(classID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []SubclassRow
	for rows.Next() {
		var s SubclassRow
		var sid, cid string
		if err := rows.Scan(&sid, &cid, &s.Name, &s.Description); err != nil {
			return nil, err
		}
		s.ID = types.SubClassID(sid)
		s.ClassID = types.ClassID(cid)
		result = append(result, s)
	}
	return result, rows.Err()
}

// GetSubclassPreparedSpells returns spells the subclass always has prepared, keyed by spell level.
func (q *Querier) GetSubclassPreparedSpells(subclassID types.SubClassID) (map[int][]types.SpellID, error) {
	rows, err := q.db.Query(`
		SELECT spell_level, spell_id FROM subclass_prepared_spells
		WHERE subclass_id = ? ORDER BY spell_level, spell_id
	`, string(subclassID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make(map[int][]types.SpellID)
	for rows.Next() {
		var sl int
		var sid string
		if err := rows.Scan(&sl, &sid); err != nil {
			return nil, err
		}
		result[sl] = append(result[sl], types.SpellID(sid))
	}
	return result, rows.Err()
}

// ---------------------------------------------------------------------------
// SPELLS
// ---------------------------------------------------------------------------

type SpellRow struct {
	ID            types.SpellID `json:"id"`
	Name          string        `json:"name"`
	Level         int           `json:"level"`
	School        string        `json:"school"`
	CastingTime   string        `json:"castingTime"`
	Range         string        `json:"range"`
	Verbal        bool          `json:"verbal"`
	Somatic       bool          `json:"somatic"`
	Material      bool          `json:"material"`
	MaterialDesc  string        `json:"materialDesc"`
	Duration      string        `json:"duration"`
	Concentration bool          `json:"concentration"`
	Ritual        bool          `json:"ritual"`
	DamageType    string        `json:"damageType,omitempty"`
	DamageDice    string        `json:"damageDice,omitempty"`
	SaveAbility   string        `json:"saveAbility,omitempty"`
	Attack        bool          `json:"attack"`
}

func (q *Querier) GetSpell(id types.SpellID) (*SpellRow, error) {
	var s SpellRow
	var sid string
	var verbal, somatic, material, concentration, ritual, attack int
	err := q.db.QueryRow(`
		SELECT id, name, level, school, casting_time, range,
		       verbal, somatic, material, material_desc, duration,
		       concentration, ritual, damage_type, damage_dice,
		       save_ability, attack
		FROM spells WHERE id = ?
	`, string(id)).Scan(&sid, &s.Name, &s.Level, &s.School, &s.CastingTime, &s.Range,
		&verbal, &somatic, &material, &s.MaterialDesc, &s.Duration,
		&concentration, &ritual, &s.DamageType, &s.DamageDice,
		&s.SaveAbility, &attack)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get spell %s: %w", id, err)
	}
	s.ID = types.SpellID(sid)
	s.Verbal = verbal == 1
	s.Somatic = somatic == 1
	s.Material = material == 1
	s.Concentration = concentration == 1
	s.Ritual = ritual == 1
	s.Attack = attack == 1
	return &s, nil
}

// SpellInClassList checks if a spell is in a class's spell list at any level ≤ classLevel.
func (q *Querier) SpellInClassList(spellID types.SpellID, classID types.ClassID, classLevel int) (bool, error) {
	var count int
	err := q.db.QueryRow(`
		SELECT COUNT(*) FROM class_level_spells
		WHERE spell_id = ? AND class_id = ? AND level <= ?
	`, string(spellID), string(classID), classLevel).Scan(&count)
	return count > 0, err
}

// SpellInSubclass checks if a spell is granted by a subclass (always prepared).
func (q *Querier) SpellInSubclass(spellID types.SpellID, subclassID types.SubClassID) (bool, error) {
	var count int
	err := q.db.QueryRow(`
		SELECT COUNT(*) FROM subclass_prepared_spells
		WHERE spell_id = ? AND subclass_id = ?
	`, string(spellID), string(subclassID)).Scan(&count)
	return count > 0, err
}

// ListSpells returns all spells optionally filtered by level.
func (q *Querier) ListSpells(level *int) ([]SpellRow, error) {
	var rows *sql.Rows
	var err error
	if level != nil {
		rows, err = q.db.Query(`
			SELECT id, name, level, school, casting_time, range,
			       verbal, somatic, material, material_desc, duration,
			       concentration, ritual, damage_type, damage_dice,
			       save_ability, attack
			FROM spells WHERE level = ? ORDER BY name
		`, *level)
	} else {
		rows, err = q.db.Query(`
			SELECT id, name, level, school, casting_time, range,
			       verbal, somatic, material, material_desc, duration,
			       concentration, ritual, damage_type, damage_dice,
			       save_ability, attack
			FROM spells ORDER BY level, name
		`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []SpellRow
	for rows.Next() {
		var s SpellRow
		var sid string
		var verbal, somatic, material, concentration, ritual, attack int
		if err := rows.Scan(&sid, &s.Name, &s.Level, &s.School, &s.CastingTime, &s.Range,
			&verbal, &somatic, &material, &s.MaterialDesc, &s.Duration,
			&concentration, &ritual, &s.DamageType, &s.DamageDice,
			&s.SaveAbility, &attack); err != nil {
			return nil, err
		}
		s.ID = types.SpellID(sid)
		s.Verbal = verbal == 1
		s.Somatic = somatic == 1
		s.Material = material == 1
		s.Concentration = concentration == 1
		s.Ritual = ritual == 1
		s.Attack = attack == 1
		result = append(result, s)
	}
	return result, rows.Err()
}

// ---------------------------------------------------------------------------
// FEATS
// ---------------------------------------------------------------------------

type FeatRow struct {
	ID           types.FeatID `json:"id"`
	Name         string       `json:"name"`
	PrereqLevel  *int         `json:"prereqLevel,omitempty"`
	ReplacesID   *string      `json:"replacesId,omitempty"`
}

func (q *Querier) GetFeat(id types.FeatID) (*FeatRow, error) {
	var f FeatRow
	var fid string
	var prereqLevel sql.NullInt64
	var replacesID sql.NullString
	err := q.db.QueryRow(`
		SELECT id, name, prereq_level, replaces_id FROM feats WHERE id = ?
	`, string(id)).Scan(&fid, &f.Name, &prereqLevel, &replacesID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get feat %s: %w", id, err)
	}
	f.ID = types.FeatID(fid)
	if prereqLevel.Valid {
		v := int(prereqLevel.Int64)
		f.PrereqLevel = &v
	}
	if replacesID.Valid {
		f.ReplacesID = &replacesID.String
	}
	return &f, nil
}

func (q *Querier) ListFeats() ([]FeatRow, error) {
	rows, err := q.db.Query(`SELECT id, name, prereq_level, replaces_id FROM feats ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []FeatRow
	for rows.Next() {
		var f FeatRow
		var fid string
		var prereqLevel sql.NullInt64
		var replacesID sql.NullString
		if err := rows.Scan(&fid, &f.Name, &prereqLevel, &replacesID); err != nil {
			return nil, err
		}
		f.ID = types.FeatID(fid)
		if prereqLevel.Valid {
			v := int(prereqLevel.Int64)
			f.PrereqLevel = &v
		}
		if replacesID.Valid {
			f.ReplacesID = &replacesID.String
		}
		result = append(result, f)
	}
	return result, rows.Err()
}

// ---------------------------------------------------------------------------
// ITEMS
// ---------------------------------------------------------------------------

type ItemRow struct {
	ID     types.ItemDefinitionID `json:"id"`
	Name   string                 `json:"name"`
	Type   string                 `json:"type"`
	Rarity string                 `json:"rarity"`
}

func (q *Querier) GetItem(id types.ItemDefinitionID) (*ItemRow, error) {
	var i ItemRow
	var iid string
	err := q.db.QueryRow(`SELECT id, name, type, rarity FROM items WHERE id = ?`, string(id)).
		Scan(&iid, &i.Name, &i.Type, &i.Rarity)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get item %s: %w", id, err)
	}
	i.ID = types.ItemDefinitionID(iid)
	return &i, nil
}

func (q *Querier) ListItemsByType(itemType string) ([]ItemRow, error) {
	rows, err := q.db.Query(`SELECT id, name, type, rarity FROM items WHERE type = ? ORDER BY name`, itemType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []ItemRow
	for rows.Next() {
		var i ItemRow
		var iid string
		if err := rows.Scan(&iid, &i.Name, &i.Type, &i.Rarity); err != nil {
			return nil, err
		}
		i.ID = types.ItemDefinitionID(iid)
		result = append(result, i)
	}
	return result, rows.Err()
}

// ---------------------------------------------------------------------------
// CONDITIONS
// ---------------------------------------------------------------------------

type ConditionRow struct {
	ID   types.ConditionID `json:"id"`
	Name string            `json:"name"`
}

func (q *Querier) GetCondition(id types.ConditionID) (*ConditionRow, error) {
	var c ConditionRow
	var cid string
	err := q.db.QueryRow(`SELECT id, name FROM conditions WHERE id = ?`, string(id)).
		Scan(&cid, &c.Name)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get condition %s: %w", id, err)
	}
	c.ID = types.ConditionID(cid)
	return &c, nil
}

// ---------------------------------------------------------------------------
// CONTENT SUMMARY (for LLM prompt)
// ---------------------------------------------------------------------------

func (q *Querier) ToLLMSummary() (string, error) {
	var b builder
	b.w("Available Species:")
	species, err := q.ListSpecies()
	if err != nil {
		return "", err
	}
	for _, s := range species {
		b.w(" - %s", s.ID)
		if s.Size != "" || s.CreatureType != "" {
			b.w(" (%s %s)", s.Size, s.CreatureType)
		}
	}

	b.w("\nAvailable Classes:")
	classes, err := q.ListClasses()
	if err != nil {
		return "", err
	}
	for _, c := range classes {
		b.w(" - %s (hit die %s)", c.ID, c.HitDie)
		subs, _ := q.ListSubclasses(c.ID)
		if len(subs) > 0 {
			b.w(" subclasses: ")
			for i, sc := range subs {
				if i > 0 {
					b.w(", ")
				}
				b.w("%s", sc.ID)
			}
		}
	}

	b.w("\nAvailable Backgrounds:")
	bgs, err := q.db.Query(`SELECT id FROM backgrounds ORDER BY id`)
	if err == nil {
		defer bgs.Close()
		for bgs.Next() {
			var id string
			bgs.Scan(&id)
			b.w(" - %s", id)
		}
	}

	return b.String(), nil
}

// builder is a simple string builder helper.
type builder struct {
	data []byte
}

func (b *builder) w(format string, args ...interface{}) {
	b.data = append(b.data, fmt.Sprintf(format, args...)...)
}

func (b *builder) String() string {
	return string(b.data)
}
