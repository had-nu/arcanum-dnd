package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

func SeedFromYAML(db *sql.DB, content *scontent.ResolvedContent) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if err := seedSpells(tx, content); err != nil {
		return fmt.Errorf("seed spells: %w", err)
	}
	if err := seedFeats(tx, content); err != nil {
		return fmt.Errorf("seed feats: %w", err)
	}
	if err := seedConditions(tx, content); err != nil {
		return fmt.Errorf("seed conditions: %w", err)
	}
	if err := seedItems(tx, content); err != nil {
		return fmt.Errorf("seed items: %w", err)
	}
	if err := seedSpecies(tx, content); err != nil {
		return fmt.Errorf("seed species: %w", err)
	}
	if err := seedBackgrounds(tx, content); err != nil {
		return fmt.Errorf("seed backgrounds: %w", err)
	}
	if err := seedClasses(tx, content); err != nil {
		return fmt.Errorf("seed classes: %w", err)
	}
	if err := seedContentPacks(tx); err != nil {
		return fmt.Errorf("seed content packs: %w", err)
	}
	return tx.Commit()
}

// ---------------------------------------------------------------------------
// SPELLS
// ---------------------------------------------------------------------------
func seedSpells(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, s := range content.Spells {
		desc := ""
		if len(s.Effects) > 0 {
			b, _ := json.Marshal(s.Effects)
			desc = string(b)
		}
		_, err := tx.Exec(`
			INSERT OR IGNORE INTO spells
				(id, name, level, school, casting_time, range,
				 verbal, somatic, material, material_desc, material_cost,
				 duration, concentration, ritual,
				 damage_type, damage_dice, damage_per_slot,
				 save_ability, attack, healing, description)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, string(s.ID), s.Name, s.Level, string(s.School),
			s.CastingTime, s.Range,
			boolInt(s.Components.Verbal), boolInt(s.Components.Somatic),
			boolInt(s.Components.Material), s.Components.MaterialDesc, s.Components.Cost,
			s.Duration, boolInt(s.Concentration), boolInt(s.Ritual),
			func() string { if s.Damage != nil { return string(s.Damage.Type) }; return "" }(),
			func() string { if s.Damage != nil { return s.Damage.Dice }; return "" }(),
			func() string { if s.Damage != nil { return s.Damage.PerSlot }; return "" }(),
			func() string { if s.Save != nil { return string(*s.Save) }; return "" }(),
			boolInt(s.Attack),
			func() string { if s.Healing != nil { return *s.Healing }; return "" }(),
			desc,
		)
		if err != nil {
			return fmt.Errorf("insert spell %s: %w", s.ID, err)
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// FEATS
// ---------------------------------------------------------------------------
func seedFeats(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, f := range content.Feats {
		var prereqLevel *int
		var prereqAbility *types.AbilityScore
		var prereqAbilityMin *int
		var prereqFeat *types.FeatID
		var prereqClass *types.ClassID
		var prereqSpellcasting bool
		var prereqProficiency *types.Skill
		if f.Prerequisites != nil {
			prereqLevel = f.Prerequisites.Level
			prereqAbility = f.Prerequisites.Ability
			prereqAbilityMin = f.Prerequisites.AbilityMin
			prereqFeat = f.Prerequisites.Feat
			prereqClass = f.Prerequisites.Class
			if f.Prerequisites.Spellcasting != nil {
				prereqSpellcasting = *f.Prerequisites.Spellcasting
			}
			prereqProficiency = f.Prerequisites.Proficiency
		}
		replaces := ""
		if f.ReplacesID != nil {
			replaces = string(*f.ReplacesID)
		}
		_, err := tx.Exec(`
			INSERT OR IGNORE INTO feats
				(id, name, prereq_level, prereq_ability, prereq_ability_min,
				 prereq_feat, prereq_class, prereq_spellcasting, prereq_proficiency, replaces_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, string(f.ID), f.Name,
			prereqLevel, ptrString(prereqAbility), prereqAbilityMin,
			ptrString(prereqFeat), ptrString(prereqClass), boolInt(prereqSpellcasting),
			ptrString(prereqProficiency), replaces,
		)
		if err != nil {
			return fmt.Errorf("insert feat %s: %w", f.ID, err)
		}
		for _, eff := range f.Effects {
			details, _ := json.Marshal(eff)
			_, _ = tx.Exec(`
				INSERT INTO feat_effects (feat_id, effect_kind, details_json)
				VALUES (?, ?, ?)
			`, string(f.ID), string(eff.Kind), string(details))
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// CONDITIONS
// ---------------------------------------------------------------------------
func seedConditions(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, c := range content.Conditions {
		effects := "[]"
		if len(c.Effects) > 0 {
			b, _ := json.Marshal(c.Effects)
			effects = string(b)
		}
		_, err := tx.Exec(`
			INSERT OR IGNORE INTO conditions (id, name, effects_json)
			VALUES (?, ?, ?)
		`, string(c.ID), c.Name, effects)
		if err != nil {
			return fmt.Errorf("insert condition %s: %w", c.ID, err)
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// ITEMS
// ---------------------------------------------------------------------------
func seedItems(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, item := range content.Items {
		weaponDamage := ""
		weaponDamageType := ""
		weaponMastery := ""
		var weaponRange, weaponLongRange *int
		armorBaseAC := 0
		armorDexBonus := false
		var armorDexMax, armorStrMin *int
		armorStealthDisadv := false
		subtype := ""

		if item.Weapon != nil {
			weaponDamage = item.Weapon.Damage
			weaponDamageType = string(item.Weapon.DamageType)
			weaponMastery = item.Weapon.Mastery
			weaponRange = item.Weapon.Range
			weaponLongRange = item.Weapon.LongRange
		}
		if item.Armor != nil {
			armorBaseAC = item.Armor.BaseAC
			armorDexBonus = item.Armor.DexBonus
			armorDexMax = item.Armor.DexMax
			armorStrMin = item.Armor.StrengthMin
			armorStealthDisadv = item.Armor.StealthDisadv
		}
		if item.Type == "weapon" || item.Type == "simple-weapon" || item.Type == "martial-weapon" {
			subtype = "weapon"
		} else if item.Type == "light-armor" || item.Type == "medium-armor" || item.Type == "heavy-armor" || item.Type == "shield" {
			subtype = "armor"
		}

		_, err := tx.Exec(`
			INSERT OR IGNORE INTO items
				(id, name, type, subtype, rarity, value, weight, attunement, description,
				 weapon_damage, weapon_damage_type, weapon_mastery, weapon_range, weapon_long_range,
				 armor_base_ac, armor_dex_bonus, armor_dex_max, armor_strength_min, armor_stealth_disadv)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, string(item.ID), item.Name, item.Type, subtype,
			item.Rarity, item.Value, item.Weight, item.Attunement, item.Description,
			weaponDamage, weaponDamageType, weaponMastery, weaponRange, weaponLongRange,
			armorBaseAC, boolInt(armorDexBonus), armorDexMax, armorStrMin, boolInt(armorStealthDisadv),
		)
		if err != nil {
			return fmt.Errorf("insert item %s: %w", item.ID, err)
		}
		if item.Weapon != nil {
			for _, prop := range item.Weapon.Properties {
				_, _ = tx.Exec(`
					INSERT INTO item_properties (item_id, property) VALUES (?, ?)
				`, string(item.ID), prop)
			}
		}
		for _, eff := range item.Effects {
			details, _ := json.Marshal(eff)
			_, _ = tx.Exec(`
				INSERT INTO item_effects (item_id, effect_kind, details_json)
				VALUES (?, ?, ?)
			`, string(item.ID), string(eff.Kind), string(details))
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// SPECIES
// ---------------------------------------------------------------------------
func seedSpecies(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, sp := range content.Species {
		_, err := tx.Exec(`
			INSERT OR IGNORE INTO species
				(id, name, size, speed_walk, speed_fly, speed_swim, speed_climb,
				 creature_type, ability_str, ability_dex, ability_con,
				 ability_int, ability_wis, ability_cha)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, string(sp.ID), sp.Name, string(sp.Size),
			sp.Speed.Walk, sp.Speed.Fly, sp.Speed.Swim, sp.Speed.Climb,
			string(sp.CreatureType),
			sp.AbilityScore.STR, sp.AbilityScore.DEX, sp.AbilityScore.CON,
			sp.AbilityScore.INT, sp.AbilityScore.WIS, sp.AbilityScore.CHA,
		)
		if err != nil {
			return fmt.Errorf("insert species %s: %w", sp.ID, err)
		}
		for _, lang := range sp.Languages {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO species_languages (species_id, language)
				VALUES (?, ?)
			`, string(sp.ID), lang)
		}
		for _, t := range sp.Traits {
			traitKind := string(t.Kind)
			handlerID := ""
			if t.Kind == "Custom" {
				handlerID = t.HandlerID
			}
			details, _ := json.Marshal(t)
			_, _ = tx.Exec(`
				INSERT INTO species_traits (species_id, trait_kind, handler_id, details_json)
				VALUES (?, ?, ?, ?)
			`, string(sp.ID), traitKind, handlerID, string(details))
		}
		for _, v := range sp.Variants {
			languages := "[]"
			if len(v.Languages) > 0 {
				b, _ := json.Marshal(v.Languages)
				languages = string(b)
			}
			traits := "[]"
			if len(v.Traits) > 0 {
				b, _ := json.Marshal(v.Traits)
				traits = string(b)
			}
			var spellcasting *string
			if v.Spellcasting != nil {
				b, _ := json.Marshal(v.Spellcasting)
				s := string(b)
				spellcasting = &s
			}
			speedWalk := 30
			if v.Speed != nil {
				speedWalk = v.Speed.Walk
			}
			vSize := string(sp.Size)
			if v.Size != "" {
				vSize = string(v.Size)
			}
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO species_variants
					(id, species_id, name, size, speed_walk, speed_fly, speed_swim, speed_climb,
					 ability_str, ability_dex, ability_con, ability_int, ability_wis, ability_cha,
					 languages_json, traits_json, spellcasting)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`, v.ID, string(sp.ID), v.Name, vSize, speedWalk,
				func() int { if v.Speed != nil { return v.Speed.Fly }; return 0 }(),
				func() int { if v.Speed != nil { return v.Speed.Swim }; return 0 }(),
				func() int { if v.Speed != nil { return v.Speed.Climb }; return 0 }(),
				v.AbilityScore.STR, v.AbilityScore.DEX, v.AbilityScore.CON,
				v.AbilityScore.INT, v.AbilityScore.WIS, v.AbilityScore.CHA,
				languages, traits, spellcasting,
			)
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// BACKGROUNDS
// ---------------------------------------------------------------------------
func seedBackgrounds(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, bg := range content.Backgrounds {
		featID := (*string)(nil)
		if bg.Feat != nil {
			// Only set feat_id if the referenced feat exists in the DB
			var count int
			tx.QueryRow(`SELECT COUNT(*) FROM feats WHERE id = ?`, string(*bg.Feat)).Scan(&count)
			if count > 0 {
				s := string(*bg.Feat)
				featID = &s
			}
		}
		_, err := tx.Exec(`
			INSERT OR IGNORE INTO backgrounds (id, name, feat_id)
			VALUES (?, ?, ?)
		`, string(bg.ID), bg.Name, featID)
		if err != nil {
			return fmt.Errorf("insert background %s: %w", bg.ID, err)
		}
		for _, sk := range bg.Skills {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO background_skills (background_id, skill)
				VALUES (?, ?)
			`, string(bg.ID), string(sk))
		}
		for _, t := range bg.Tools {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO background_tools (background_id, tool)
				VALUES (?, ?)
			`, string(bg.ID), t)
		}
		for _, lang := range bg.Languages {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO background_languages (background_id, language)
				VALUES (?, ?)
			`, string(bg.ID), lang)
		}
		for _, ab := range bg.AbilityScoreOptions {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO background_ability_options (background_id, ability)
				VALUES (?, ?)
			`, string(bg.ID), string(ab))
		}
		for _, t := range bg.Traits {
			details, _ := json.Marshal(t)
			_, _ = tx.Exec(`
				INSERT INTO background_traits (background_id, trait_kind, handler_id, details_json)
				VALUES (?, ?, ?, ?)
			`, string(bg.ID), string(t.Kind), t.HandlerID, string(details))
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// CLASSES (includes subclasses)
// ---------------------------------------------------------------------------
func seedClasses(tx *sql.Tx, content *scontent.ResolvedContent) error {
	for _, c := range content.Classes {
		scType := ""
		scAbility := ""
		preparedFormula := ""
		ritualCasting := false
		if c.Spellcasting != nil {
			scType = string(c.Spellcasting.Type)
			scAbility = string(c.Spellcasting.Ability)
			preparedFormula = c.Spellcasting.PreparedFormula
			ritualCasting = c.Spellcasting.RitualCasting
		}
		subclassLevel := 3
		for _, lvl := range c.Levels {
			for _, fid := range lvl.Features {
				if strings.HasSuffix(string(fid), ".subclass") {
					subclassLevel = lvl.Level
				}
			}
		}
		_, err := tx.Exec(`
			INSERT OR IGNORE INTO classes
				(id, name, hit_die, subclass_level,
				 spellcasting_type, spellcasting_ability,
				 prepared_formula, ritual_casting)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, string(c.ID), c.Name, string(c.HitDie), subclassLevel,
			scType, scAbility, preparedFormula, boolInt(ritualCasting),
		)
		if err != nil {
			return fmt.Errorf("insert class %s: %w", c.ID, err)
		}
		for _, ab := range c.PrimaryAbility {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO class_primary_abilities (class_id, ability)
				VALUES (?, ?)
			`, string(c.ID), string(ab))
		}
		for _, st := range c.SavingThrows {
			_, _ = tx.Exec(`
				INSERT OR IGNORE INTO class_saving_throws (class_id, ability)
				VALUES (?, ?)
			`, string(c.ID), string(st))
		}
		for _, prof := range c.Proficiencies.Armor {
			_, _ = tx.Exec(`
				INSERT INTO class_proficiencies (class_id, category, item)
				VALUES (?, 'armor', ?)
			`, string(c.ID), prof)
		}
		for _, prof := range c.Proficiencies.Weapons {
			_, _ = tx.Exec(`
				INSERT INTO class_proficiencies (class_id, category, item)
				VALUES (?, 'weapons', ?)
			`, string(c.ID), prof)
		}
		for _, sk := range c.Proficiencies.Skills {
			if sk.Choose > 0 {
				for _, from := range sk.From {
					_, _ = tx.Exec(`
						INSERT INTO class_proficiencies (class_id, category, skill_choose, skill_from)
						VALUES (?, 'skill', ?, ?)
					`, string(c.ID), sk.Choose, string(from))
				}
			} else {
				_, _ = tx.Exec(`
					INSERT INTO class_proficiencies (class_id, category, item)
					VALUES (?, 'skill', ?)
				`, string(c.ID), string(sk.Skill))
			}
		}
		for _, lvl := range c.Levels {
			featID := ""
			if lvl.Feat != nil {
				featID = string(*lvl.Feat)
			}
			_, err := tx.Exec(`
				INSERT OR IGNORE INTO class_levels
					(class_id, level, prof_bonus, cantrips_known, spells_known,
					 prepared_spells, feat_id)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`, string(c.ID), lvl.Level, lvl.ProfBonus,
				lvl.CantripsKnown, lvl.SpellsKnown,
				lvl.PreparedSpells, nullStr(featID),
			)
			if err != nil {
				return fmt.Errorf("insert level %d for %s: %w", lvl.Level, c.ID, err)
			}
			for slotLevel, count := range lvl.SpellSlots {
				_, _ = tx.Exec(`
					INSERT OR IGNORE INTO class_level_slots (class_id, level, slot_level, slot_count)
					VALUES (?, ?, ?, ?)
				`, string(c.ID), lvl.Level, slotLevel, count)
			}
			for _, spellID := range lvl.Spells {
				_, _ = tx.Exec(`
					INSERT OR IGNORE INTO class_level_spells (class_id, level, spell_id)
					VALUES (?, ?, ?)
				`, string(c.ID), lvl.Level, string(spellID))
			}
			for _, fid := range lvl.Features {
				featName := deriveFeatureName(string(fid))
				_, _ = tx.Exec(`
					INSERT OR IGNORE INTO class_features (id, class_id, name, level)
					VALUES (?, ?, ?, ?)
				`, string(fid), string(c.ID), featName, lvl.Level)
			}
		}
		for _, sc := range c.SubClasses {
			scAb := ""
			scFormula := ""
			if sc.SpellcastingOverride != nil {
				scAb = string(sc.SpellcastingOverride.Ability)
				scFormula = sc.SpellcastingOverride.PreparedFormula
			}
			_, err := tx.Exec(`
				INSERT OR IGNORE INTO subclasses
					(id, class_id, name, description,
					 spellcasting_ability, prepared_formula)
				VALUES (?, ?, ?, ?, ?, ?)
			`, string(sc.ID), string(c.ID), sc.Name, sc.Description,
				scAb, scFormula,
			)
			if err != nil {
				return fmt.Errorf("insert subclass %s: %w", sc.ID, err)
			}
			for spLevel, spellIDs := range sc.AlwaysPreparedSpells {
				for _, sid := range spellIDs {
					_, _ = tx.Exec(`
						INSERT OR IGNORE INTO subclass_prepared_spells (subclass_id, spell_level, spell_id)
						VALUES (?, ?, ?)
					`, string(sc.ID), spLevel, string(sid))
				}
			}
			for _, fid := range sc.Features {
				featName := deriveFeatureName(string(fid))
				featLevel := 1
				for _, lvl := range c.Levels {
					for _, lf := range lvl.Features {
						if lf == fid {
							featLevel = lvl.Level
						}
					}
				}
				_, _ = tx.Exec(`
					INSERT OR IGNORE INTO subclass_features (id, subclass_id, name, level)
					VALUES (?, ?, ?, ?)
				`, string(fid), string(sc.ID), featName, featLevel)
			}
			for _, eff := range sc.Effects {
				details, _ := json.Marshal(eff)
				_, _ = tx.Exec(`
					INSERT INTO feat_effects (feat_id, effect_kind, details_json)
					VALUES (?, ?, ?)
				`, string(fidName("subclass.effect."+string(sc.ID))), string(eff.Kind), string(details))
			}
		}
	}
	return nil
}

// ---------------------------------------------------------------------------
// CONTENT PACKS (metadata)
// ---------------------------------------------------------------------------
func seedContentPacks(tx *sql.Tx) error {
	_, err := tx.Exec(`
		INSERT OR IGNORE INTO content_packs (id, name, version, hash, license, attribution, installed_at, is_active)
		VALUES ('srd5.2-core', 'SRD 5.2 Core', '1.0.0', '', 'OGL', 'Wizards of the Coast', datetime('now'), 1)
	`)
	return err
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
func boolInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func ptrString[T ~string](p *T) *string {
	if p == nil {
		return nil
	}
	s := string(*p)
	return &s
}

func deriveFeatureName(featureID string) string {
	parts := strings.Split(featureID, ".")
	if len(parts) < 3 {
		return featureID
	}
	return strings.ReplaceAll(parts[len(parts)-1], "-", " ")
}

func fidName(s string) types.FeatID {
	return types.FeatID(s)
}
