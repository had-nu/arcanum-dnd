package database

type ClassRow struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	HitDie        string `json:"hitDie"`
	Spellcaster   bool   `json:"spellcaster"`
	SubclassLevel int    `json:"subclassLevel"`
	SkillChoices  int    `json:"skillChoices"`
}

type ClassLevelRow struct {
	ID        int    `json:"-"`
	ClassID   string `json:"classId"`
	Level     int    `json:"level"`
	ProfBonus int    `json:"profBonus"`
	Feat      string `json:"feat,omitempty"`
}

type ClassFeatureRow struct {
	ID          string `json:"id"`
	ClassID     string `json:"classId"`
	Name        string `json:"name"`
	Level       int    `json:"level"`
	Source      string `json:"source,omitempty"`
	EntriesJSON string `json:"entriesJson,omitempty"`
}

type SubclassRow struct {
	ID          string `json:"id"`
	ClassID     string `json:"classId"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type SubclassFeatureRow struct {
	ID          string `json:"id"`
	SubclassID  string `json:"subclassId"`
	Name        string `json:"name"`
	Level       int    `json:"level"`
	Source      string `json:"source,omitempty"`
	EntriesJSON string `json:"entriesJson,omitempty"`
}

type FeatRow struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Source            string `json:"source,omitempty"`
	PrerequisitesJSON string `json:"prerequisitesJson,omitempty"`
	EntriesJSON       string `json:"entriesJson,omitempty"`
}
