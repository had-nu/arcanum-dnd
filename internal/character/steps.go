package character

import (
	"fmt"
	"sort"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

func sortedClasses(classes map[types.ClassID]*scontent.Class) []scontent.Class {
	out := make([]scontent.Class, 0, len(classes))
	for _, c := range classes {
		out = append(out, *c)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func sortedBackgrounds(bgs map[types.BackgroundID]*scontent.Background) []scontent.Background {
	out := make([]scontent.Background, 0, len(bgs))
	for _, b := range bgs {
		out = append(out, *b)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func sortedSpecies(species map[types.SpeciesID]*scontent.Species) []scontent.Species {
	out := make([]scontent.Species, 0, len(species))
	for _, s := range species {
		out = append(out, *s)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func listClassSkills(class scontent.Class) []types.Skill {
	for _, si := range class.Proficiencies.Skills {
		if len(si.From) > 0 {
			return si.From
		}
	}
	return nil
}

func (v CharacterSheetView) Print() {
	fmtStr := "  %-16s %+d\n"
	fmt.Println("\n═══════════════════════════════════════")
	fmt.Println("         ARCANUM — Character Sheet")
	fmt.Println("═══════════════════════════════════════")
	fmt.Printf("  %s — L%d %s\n", v.Name, v.Level, v.Class)
	fmt.Printf("  %s %s\n", v.Species, v.Background)
	fmt.Println("───────────────────────────────────────")
	fmt.Printf("  HP: %s  |  AC: %d  |  Init: +%d  |  Prof: +%d\n", v.HP, v.AC, v.InitBonus, v.ProfBonus)
	fmt.Println("───────────────────────────────────────")
	fmt.Printf("  STR:%3d(%+d) DEX:%3d(%+d) CON:%3d(%+d) INT:%3d(%+d) WIS:%3d(%+d) CHA:%3d(%+d)\n",
		v.Scores.STR, abilityMod(v.Scores.STR),
		v.Scores.DEX, abilityMod(v.Scores.DEX),
		v.Scores.CON, abilityMod(v.Scores.CON),
		v.Scores.INT, abilityMod(v.Scores.INT),
		v.Scores.WIS, abilityMod(v.Scores.WIS),
		v.Scores.CHA, abilityMod(v.Scores.CHA))
	fmt.Println("───────────────────────────────────────")
	fmt.Println("  SAVES:")
	for _, ab := range types.AllAbilityScores {
		fmt.Printf(fmtStr, string(ab), v.Saves[ab])
	}
	fmt.Println("───────────────────────────────────────")
	fmt.Println("  SKILLS:")
	for _, skill := range types.AllSkills {
		if sv, ok := v.Skills[skill]; ok {
			fmt.Printf(fmtStr, string(skill), sv.Total)
		}
	}
	if len(v.Feats) > 0 {
		fmt.Println("───────────────────────────────────────")
		fmt.Println("  FEATS:")
		for _, f := range v.Feats {
			fmt.Printf("    • %s\n", f)
		}
	}
	fmt.Println("═══════════════════════════════════════")
}
