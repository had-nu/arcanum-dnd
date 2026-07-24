# Graph Report - arcanum  (2026-07-24)

## Corpus Check
- 32 files · ~5,115,613 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2170 nodes · 3103 edges · 173 communities (167 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b88989a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Event
- ResolvedContent
- Client
- Class
- server/main.go
- Character
- app.js
- Engine
- id.go
- effects.go
- getMain
- ClassID
- esc
- getGrantedSpells
- renderAbilityEditor
- github.com/hadnu/arcanum
- Adventuring Gear
- Appendix A: Lore Glossary
- ARCANUM — D&D 5.5 Edition Manager
- Chapter 7: Treasure
- Event Descriptions
- Running Combat
- City Locations
- .Apply
- Tour of the Multiverse
- Combat
- Journey Stage Challenges
- Exploration
- Death Saving Throws
- Attack Rolls
- content.go
- Flavors of Fantasy
- Detailed NPCs
- Nine Hells
- Artisan's Tools
- Chapter 3: DM's Toolbox
- primitives.go
- Explosives
- Appendix B: Maps
- Resolving Outcomes
- CampaignState
- Chases
- Designing Dungeon Rooms
- What If Everyone Dies?
- Plan Encounters
- Large Vehicles
- Damage and Healing
- Minor Alterations
- Abyss
- Getting Players Invested
- Magic Item Categories
- Shadowfell
- Common Doors
- The Greyhawk Setting
- Greyhawk Gazetteer
- Combat and Damage Example
- Chapter 6: Equipment
- Adventure Examples
- Modifying a Magic Item
- Curses
- Chapter 5: Creating Campaigns
- Ensuring Fun for All
- Chapter 1: Playing the Game
- Properties
- Multiclassing
- Crafting Equipment
- Other Tools
- Things You Need
- Appendix C: Tracking Sheets
- Astral Plane
- Character Advancement
- Feywild
- Marks of Prestige
- Create Your Character
- Casting Spells
- Chapter 2: Running the Game
- Know Your Players
- Alignment
- Adventure Situations by Level
- The Planes
- Renown
- Chapter 1: The Basics
- Settlement Tables and Tracker
- Gods and Other Powers
- Monster Behavior
- Step 2: Determine Origin
- Attunement
- Chapter 2: Creating a Character
- Tiers of Play
- Mastery Properties
- What Are Dice For?
- Proficiency
- Services
- Background
- LoadAllFromDataDir
- Example of Play
- Ethereal Plane
- Character Objectives
- Elemental Plane of Water
- How to Run a Session
- Traveling the Outer Planes
- Step 3: Determine Ability Scores
- Lifestyle Expenses
- Chapter 4: Character Origins
- Chapter 5: Feats
- Dungeon Master's Guide (2024).md
- Attitude
- Mobs
- Lay Out the Premise
- Draw In the Players
- Adventure Rewards
- Respect for the DM
- Crafting Magic Items
- Every DM Is Unique
- Narration
- Northern Flanaess
- Campaign Start
- Sentient Magic Item Traits
- Magic Items
- Player's Handbook (2024).md
- Describe Appearance and Personality
- Campaign
- Creating a Background
- Elemental Plane of Air
- Artifact Properties
- Awarding Magic Items
- Central Flanaess
- Elemental Plane of Fire
- Multiple DMs
- Eastern Flanaess
- Fear and Mental Stress
- Material Plane
- Para-elemental Planes
- Social Interaction
- The Six Abilities
- Chapter 7: Spells
- Appendix A: The Multiverse
- Dropping to 0 Hit Points
- Step 5: Fill In Details
- Introduction: Welcome to Adventure
- DamageAppliedEvent
- Ability Checks
- Activating a Magic Item
- Chapter 4: Creating Adventures
- Using Your Journal
- Useful Additions
- Traps
- Elemental Plane of Earth
- Consequences
- Magic Item Special Features
- Actions
- Effects
- Temporary Hit Points
- Large Groups
- Casting Time
- Components
- ChoiceRequiredEvent
- Acheron
- Arborea
- Beastlands
- Bytopia
- Outlands
- Gehenna
- Pandemonium
- Ysgard
- Limbo
- Ammunition (Varies)
- Arcane Focus (Varies)
- Druidic Focus (Varies)
- Holy Symbol (Varies)

## God Nodes (most connected - your core abstractions)
1. `Adventuring Gear` - 83 edges
2. `Appendix A: Lore Glossary` - 75 edges
3. `Event` - 49 edges
4. `ResolvedContent` - 48 edges
5. `CharacterID` - 45 edges
6. `CampaignState` - 42 edges
7. `Tour of the Multiverse` - 33 edges
8. `Applier` - 28 edges
9. `Client` - 27 edges
10. `Character` - 27 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/server/main.go → internal/content/loader.go
- `main()` --calls--> `NewEngine()`  [INFERRED]
  cmd/server/main.go → internal/engine/engine.go
- `main()` --calls--> `NewSeededRNG()`  [INFERRED]
  cmd/server/main.go → internal/rng/rng.go
- `main()` --calls--> `NewSpellBrowser()`  [INFERRED]
  cmd/spells/main.go → internal/character/spells.go
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/tui-player/main.go → internal/content/loader.go

## Import Cycles
- None detected.

## Communities (173 total, 6 thin omitted)

### Community 0 - "Event"
Cohesion: 0.12
Nodes (25): AbilityCheckRolledEvent, AttackRolledEvent, CharacterCreatedEvent, ChoiceOption, ClassEntry, ConcentrationBrokenEvent, ConcentrationStartedEvent, ConditionAppliedEvent (+17 more)

### Community 1 - "ResolvedContent"
Cohesion: 0.17
Nodes (20): ResolvedContent, cacheFilePath(), convertItem(), convertMonster(), convertSpecies(), convertSpell(), LoadAllFromAPI(), loadBackgrounds() (+12 more)

### Community 2 - "Client"
Cohesion: 0.08
Nodes (30): AbilityScores, APIResponse, BackgroundData, BackgroundProperties, Challenge, ClassData, ClassProperties, Client (+22 more)

### Community 3 - "Class"
Cohesion: 0.14
Nodes (25): CreationResult, Creator, SkillView, CharacterSheetView, Class, abilityMod(), computeHP(), formatClassNames() (+17 more)

### Community 4 - "server/main.go"
Cohesion: 0.11
Nodes (33): abilityMod(), atoi(), buildSpellcastingEntry(), charactersDir(), computeHP(), corsMiddleware(), hitDieMax(), main() (+25 more)

### Community 5 - "Character"
Cohesion: 0.12
Nodes (37): AttackView, CharacterSheet, ClassView, HPView, SkillView, SpellcastingStatsView, SpellSlotView, abilityModifier() (+29 more)

### Community 6 - "app.js"
Cohesion: 0.09
Nodes (24): canNavigateTo(), closeBgPopup(), confirmAbilities(), confirmBg(), confirmBgPopup(), confirmClass(), confirmEquipment(), confirmSpecies() (+16 more)

### Community 7 - "Engine"
Cohesion: 0.12
Nodes (23): Applier, main(), Deriver, Engine, Planner, PlanResult, NewCreator(), Applier (+15 more)

### Community 8 - "id.go"
Cohesion: 0.10
Nodes (21): EventEnvelope, ItemUnequippedEvent, RoundEndedEvent, MustNewULID(), NewCharacterID(), NewCreatureID(), NewEffectInstanceID(), NewEncounterID() (+13 more)

### Community 9 - "effects.go"
Cohesion: 0.08
Nodes (21): convertClass(), parsePrimaryAbility(), parseSavingThrows(), Effect, EffectInstance, EffectKind, EffectStack, ModifierTarget (+13 more)

### Community 10 - "getMain"
Cohesion: 0.13
Nodes (23): calcHP(), closeClassPopup(), closeSpeciesPopup(), confirmClassPopup(), confirmSpeciesPopup(), getMain(), getSubclassLevel(), removeClass() (+15 more)

### Community 11 - "ClassID"
Cohesion: 0.29
Nodes (6): SpellBrowser, Spell, Scanner, NewSpellBrowser(), CharacterSheetView, ClassID

### Community 12 - "esc"
Cohesion: 0.17
Nodes (19): abMod(), buildCharacter(), buildPopupFeaturesList(), confirmName(), esc(), listCharacters(), loadSavedCharacters(), openBgPopup() (+11 more)

### Community 13 - "getGrantedSpells"
Cohesion: 0.17
Nodes (25): aggregateClassSpells(), closeSpellDetailModal(), confirmSpellSelection(), getCantripsKnown(), getCasterLevel(), getClassSpellList(), getClassSpellsForPicker(), getGrantedSpells() (+17 more)

### Community 14 - "renderAbilityEditor"
Cohesion: 0.23
Nodes (12): abName(), assignFromPool(), changePointBuy(), fmtMod(), renderAbilityEditor(), renderPointBuyEditor(), renderRollEditor(), renderStandardArrayEditor() (+4 more)

### Community 19 - "Adventuring Gear"
Cohesion: 0.03
Nodes (79): Acid (25 GP), Adventuring Gear, Adventuring Gear, Alchemist's Fire (50 GP), Antitoxin (50 GP), Backpack (2 GP), Ball Bearings (1 GP), Barrel (2 GP) (+71 more)

### Community 20 - "Appendix A: Lore Glossary"
Cohesion: 0.03
Nodes (75): Acererak, Adamantine, Alustriel Silverhand, Appendix A: Lore Glossary, Ashardalon, Baba Yaga, Bahamut, Baldur's Gate (+67 more)

### Community 21 - "ARCANUM — D&D 5.5 Edition Manager"
Cohesion: 0.04
Nodes (45): ARCANUM, Arquitetura, Comandos, Quick Start, Spec, Status, 0. Changelog, 10. Schemas de Dados (+37 more)

### Community 22 - "Chapter 7: Treasure"
Cohesion: 0.04
Nodes (47): 100 GP Gemstones, 10 GP Gemstones, 1,000 GP Gemstones, 250 GP Art Objects, 25 GP Art Objects, 2,500 GP Art Objects, 500 GP Gemstones, 50 GP Gemstones (+39 more)

### Community 23 - "Event Descriptions"
Cohesion: 0.05
Nodes (42): Adding Basic Facilities, All Is Well, Attack, Basic Facilities, Basic Facilities, Bastion Events, Bastion Events, Bastion Map (+34 more)

### Community 24 - "Running Combat"
Cohesion: 0.06
Nodes (33): Abilities, Strengths, and Weaknesses, Actions in Combat, Add a Combatant, Adjusting Difficulty, Areas of Effect, Avoiding or Ending a Fight, Change the Monster, Change the Terrain (+25 more)

### Community 25 - "City Locations"
Cohesion: 0.06
Nodes (32): Adventure Hooks, Background Connections, Bastion Friendly, Beyond the City Walls, Black Dragon Inn, City Activities, City Gates, City Government (+24 more)

### Community 26 - ".Apply"
Cohesion: 0.10
Nodes (14): ChoiceResolvedEvent, EncounterCreatedEvent, EncounterEndedEvent, EncounterStartedEvent, HealedEvent, LevelUpResolvedEvent, LongRestEndedEvent, NPCActionResolvedEvent (+6 more)

### Community 27 - "Tour of the Multiverse"
Cohesion: 0.07
Nodes (29): Arcadia, Arcadia Adventures, Carceri, Carceri Adventures, Demiplane Adventures, Demiplanes, Elysium, Elysium Adventures (+21 more)

### Community 28 - "Combat"
Cohesion: 0.07
Nodes (29): Breaking Up Your Move, Combat, Combat Step by Step, Controlling a Mount, Cover, Cover, Creature Size, Creature Size and Space (+21 more)

### Community 29 - "Journey Stage Challenges"
Cohesion: 0.08
Nodes (26): Ability Checks in Exploration, Actions in Exploration, Audible Distance, Encounters with Other Creatures, Foraging, Hidden Things in Adventures, Journey Stage Challenges, Journey Stages (+18 more)

### Community 30 - "Exploration"
Cohesion: 0.08
Nodes (24): (3)- **Jared:** Got it. OK, Phillip, please make an Intelligence (History) check as Gareth looks at the painting., (4)- **Amy:** I grab the poker and poke at logs in the fire., (5)- **Amy:** Anybody have a quick way to put out a fire?, (6)- **Jared:** Great! That puts out the fire. Without the light from the hearth, you're back to the magic glow of Shreeve's sword, which casts your shadows into the room beyond. But you can see, through clouds of lingering smoke, a closed chest on the floor, surrounded by piles of coins. There are two torch sconces on the far wall—one holding an unlit torch with an intricate metal base, the other empty. A skeleton in broken plate armor is lying against that wall, with one hand at its throat and the other holding the matching torch from the empty sconce., (7)- **Amy:** I try to open it. Is it locked?, Adventuring Equipment, Breaking Objects, Carrying Objects (+16 more)

### Community 31 - "Death Saving Throws"
Cohesion: 0.09
Nodes (21): Actions, Audible Distance, Conditions, Cover, Cover, Damage Severity and Level, Death Saving Throws, DM Screen (+13 more)

### Community 32 - "Attack Rolls"
Cohesion: 0.09
Nodes (22): Ability Check Examples, Ability Checks, Ability Modifier, Ability Modifier, Ability Modifier, Advantage/Disadvantage, Armor Class, Attack Roll Abilities (+14 more)

### Community 33 - "content.go"
Cohesion: 0.16
Nodes (18): featureName(), ArmorStats, CantripTier, Condition, ContentPack, Feat, ItemDef, LevelEntry (+10 more)

### Community 34 - "Flavors of Fantasy"
Cohesion: 0.10
Nodes (21): Campaign Characters, Campaign Conflicts, Campaign Premise, Campaign Setting, Character Arcs, Conflict Arcs, Creating Your Own Setting, Crossing the Streams (+13 more)

### Community 35 - "Detailed NPCs"
Cohesion: 0.11
Nodes (19): 1: Common Names, 2: Guttural Names, 3: Lyrical Names, 4: Monosyllabic Names, 5: Sinister Names, 6: Whimsical Names, Alignment, Appearance (+11 more)

### Community 36 - "Nine Hells"
Cohesion: 0.11
Nodes (18): Archdevils  - Duke/duchess, Avernus, Cania, Dis, Greater Devils  - **Horned devil**, Infernal Hierarchy, Layers of the Nine Hells, Least Devils  - **Lemure** (+10 more)

### Community 37 - "Artisan's Tools"
Cohesion: 0.11
Nodes (18): Alchemist's Supplies (50 GP), Artisan's Tools, Brewer's Supplies (20 GP), Calligrapher's Supplies (10 GP), Carpenter's Tools (8 GP), Cartographer's Tools (15 GP), Cobbler's Tools (5 GP), Cook's Utensils (1 GP) (+10 more)

### Community 38 - "Chapter 3: DM's Toolbox"
Cohesion: 0.12
Nodes (17): Blessings, Chapter 3: DM's Toolbox, Charms, Creating a Spell, Environmental Effects, Example Hazards, Harvesting Poison, Hazards (+9 more)

### Community 39 - "primitives.go"
Cohesion: 0.17
Nodes (14): Monster, Species, SpeciesVariant, VariantSpellcasting, AbilityScores, AbilityScores, Alignment, ChoiceOption (+6 more)

### Community 40 - "Explosives"
Cohesion: 0.12
Nodes (16): Alien Technology, Ammunition, Bomb, Burst Fire, Dynamite Stick, Explosives, Explosives, Firearms (+8 more)

### Community 41 - "Appendix B: Maps"
Cohesion: 0.12
Nodes (16): Appendix B: Maps, Barrow Crypt, Caravan Encampment, Crossroads Village, Dragon's Lair, Dungeon Hideout, Farmstead, Keep (+8 more)

### Community 42 - "Resolving Outcomes"
Cohesion: 0.13
Nodes (15): Abilities, Ability Checks, and Saving Throws, Advantage, Advantage and Disadvantage, Aids to Improvisation, Attack Rolls, Calculated DCs, Damage Severity and Level, Difficulty Class (+7 more)

### Community 43 - "CampaignState"
Cohesion: 0.23
Nodes (10): ItemAcquiredEvent, ItemEquippedEvent, NewCampaignState(), CampaignSettings, CampaignState, Currency, Party, Quest (+2 more)

### Community 44 - "Chases"
Cohesion: 0.14
Nodes (14): Beginning a Chase, Chase Complications, Chases, Dashing, Designing Your Own Chase Tables, Ending a Chase, Escape Factors, Mapping the Chase (+6 more)

### Community 45 - "Designing Dungeon Rooms"
Cohesion: 0.14
Nodes (14): Crypts, Designing Dungeon Rooms, Dungeon Decay, Dungeon Quirks, Dungeons, Guard Posts, Living Quarters, Mapping a Dungeon (+6 more)

### Community 46 - "What If Everyone Dies?"
Cohesion: 0.15
Nodes (13): A Fresh Start, Dealing with Death, Death, Death Must Be Fair, Death Scenes, Defeated, Not Dead, Divine Council, Escape from the Underworld (+5 more)

### Community 47 - "Plan Encounters"
Cohesion: 0.15
Nodes (13): Combat Encounter Difficulty, Combat Encounters, Encounter Pace and Tension, Exploration Encounters, Keeping the Adventure Moving, Multiple Ways to Progress, Plan Encounters, Random Encounters (+5 more)

### Community 48 - "Large Vehicles"
Cohesion: 0.15
Nodes (13): Airborne and Waterborne Vehicles, Barding, Crew, Damage Threshold, Large Vehicles, Mounts and Cargo, Mounts and Other Animals, Mounts and Vehicles (+5 more)

### Community 49 - "Damage and Healing"
Cohesion: 0.15
Nodes (13): Critical Hits, Damage against Multiple Targets, Damage and Healing, Damage Rolls, Damage Types, Half Damage, Healing, Hit Points (+5 more)

### Community 50 - "Minor Alterations"
Cohesion: 0.17
Nodes (12): Ability Scores, Attacks, Creating a Creature, Creature Traits, Languages, Minor Alterations, Proficiencies, Resistances and Immunities (+4 more)

### Community 51 - "Abyss"
Cohesion: 0.17
Nodes (12): Abyss, Abyss Adventures, Layer 113: Thanatos, Layer 1: The Plain of Infinite Portals, Layer 222: The Slime Pits, Layer 422: The Death Dells, Layer 600: The Endless Maze, Layer 66: The Demonweb (+4 more)

### Community 52 - "Getting Players Invested"
Cohesion: 0.17
Nodes (12): Acknowledge the Incredible, Adventure Connections, Break Episodes, Episodes, Episodes and Serials, Getting Players Invested, Plan Adventures, Player Favorites (+4 more)

### Community 53 - "Magic Item Categories"
Cohesion: 0.17
Nodes (12): Armor, Magic Item Categories, Magic Item Categories, Potion Miscibility, Potions, Rings, Rods, Scrolls (+4 more)

### Community 54 - "Shadowfell"
Cohesion: 0.17
Nodes (12): Barovia, Borca, Domains of Dread, Falkovnia, Kalakeri, Lamordia, Mordent, Shadow Crossings (+4 more)

### Community 55 - "Common Doors"
Cohesion: 0.17
Nodes (12): Barred Door, Common Doors, Doors, Doors, Lock Complexity, Lock Quality, Locked Door, Portcullises (+4 more)

### Community 56 - "The Greyhawk Setting"
Cohesion: 0.17
Nodes (12): Circle of Eight, Days of the Week, Factions and Organizations, Gods of Greyhawk, Gods of Greyhawk, Knights of the Watch, Magic in Greyhawk, Months and Festivals (+4 more)

### Community 57 - "Greyhawk Gazetteer"
Cohesion: 0.17
Nodes (12): Greyhawk Gazetteer, Old Keoland, Old Keoland Adventures, Old Keoland and Its Neighbors, Old Keoland Culture, Old Keoland Locations, The Big Picture, Western Flanaess (+4 more)

### Community 58 - "Combat and Damage Example"
Cohesion: 0.17
Nodes (12): (10)- **Jared:** The Rogue is quick to react—but not as quick as the skeletons! They got a 20. The first four attack the person in the lead: Shreeve., (11)- **Jared:** Their attack roll totals are 8, 16, 18, and 20., (12)- **Maeve:** Hits. No, wait! I cast Shield, so that misses., (13)- **Amy:** So with my Sneak Attack, that's 22 damage!, (13)- **Amy:** Then I use Cunning Action to Disengage as a Bonus Action and move 20 feet out of the melee., (14)- **Russell:** I drop my sword and pull out my warhammer. Time to break some bones! My first attack is a 21 to hit for 7 Bludgeoning damage., (15)- **Maeve:** How many can I get in a 15-foot Cube?, (16)- **Maeve:** That's probably best. I cast Thunderwave at those three, using a level 2 spell slot. So there's a loud boom, and a wave of thunderous force sweeps over the skeletons. They need to make DC 15 Constitution saves. (+4 more)

### Community 59 - "Chapter 6: Equipment"
Cohesion: 0.17
Nodes (12): Armor, Armor, Armor Training, Chapter 6: Equipment, Coin Values, Coins, Light, Medium, or Heavy Armor, One at a Time (+4 more)

### Community 60 - "Adventure Examples"
Cohesion: 0.18
Nodes (11): Adventure Examples, Boreal Ball, Encounters, Encounters, Encounters, Encounters, Encounters, Horns of the Beast (+3 more)

### Community 61 - "Modifying a Magic Item"
Cohesion: 0.18
Nodes (11): Altered Capabilities, Altered Damage Types, Altered Form, Attunement, Combining Items, Creating a Magic Item, Creating a New Item, Magic Item Power by Rarity (+3 more)

### Community 62 - "Curses"
Cohesion: 0.18
Nodes (11): Bestow Curse, Cursed Creatures, Cursed Magic Items, Curses, Curses and Magical Contagions, Demonic Possession, Environmental Curses, Example Contagions (+3 more)

### Community 63 - "Chapter 5: Creating Campaigns"
Cohesion: 0.18
Nodes (11): Chapter 5: Creating Campaigns, Chromatic Dragons, Elemental Evil, Ending a Campaign, Ending Sooner Than Expected, Greyhawk, Greyhawk Conflicts, Greyhawk's Premise (+3 more)

### Community 64 - "Ensuring Fun for All"
Cohesion: 0.18
Nodes (11): DM Die Rolling, Ensuring Fun for All, Hard and Soft Limits, Intra-party Conflict, Mutual Respect, Overly Cautious Players, Respect for the Players, Rules for the Virtual Table (+3 more)

### Community 65 - "Chapter 1: Playing the Game"
Cohesion: 0.18
Nodes (11): Adventures, An Ongoing Game, Being a Player, Being the Dungeon Master, Campaigns, Chapter 1: Playing the Game, Conditions, Conditions Don't Stack (+3 more)

### Community 66 - "Properties"
Cohesion: 0.18
Nodes (11): Ammunition, Finesse, Heavy, Light, Loading, Properties, Range, Reach (+3 more)

### Community 67 - "Multiclassing"
Cohesion: 0.18
Nodes (11): Armor Class, Class Features, Experience Points, Extra Attack, Hit Points and Hit Point Dice, Multiclass Spellcaster: Spell Slots per Spell Level, Multiclassing, Prerequisites (+3 more)

### Community 68 - "Crafting Equipment"
Cohesion: 0.18
Nodes (11): Brewing Potions of Healing, Cantrips, Crafting Equipment, Crafting Nonmagical Items, Prerequisites for the Scribe, Raw Materials, Scribing Spell Scrolls, Spell Scroll Costs (+3 more)

### Community 69 - "Other Tools"
Cohesion: 0.18
Nodes (11): Disguise Kit (25 GP), Forgery Kit (15 GP), Gaming Set (Varies), Herbalism Kit (5 GP), Musical Instrument (Varies), Navigator's Tools (25 GP), Other Tools, Poisoner's Kit (50 GP) (+3 more)

### Community 70 - "Things You Need"
Cohesion: 0.20
Nodes (10): A Dungeon Master, A Place to Play, Campaign Journal, Character Sheets, Dice, Finding Players, Note-Taking Materials, Players (+2 more)

### Community 71 - "Appendix C: Tracking Sheets"
Cohesion: 0.20
Nodes (10): Appendix C: Tracking Sheets, Bastion Tracker, Campaign Conflicts, Campaign Journal, DM's Character Tracker, Game Expectations, Magic Item Tracker, NPC Tracker (+2 more)

### Community 72 - "Astral Plane"
Cohesion: 0.20
Nodes (10): Astral Color Pools, Astral Plane, Astral Plane Adventures, Color Pools, Dead Gods, Navigating the Astral Plane, Psychic Wind, Psychic Wind Location Effects (+2 more)

### Community 73 - "Character Advancement"
Cohesion: 0.20
Nodes (10): Awarding XP, Character Advancement, Level Advancement without XP, Leveling Up, Milestones, Noncombat Challenges, Session-Based Advancement, Story-Based Advancement (+2 more)

### Community 74 - "Feywild"
Cohesion: 0.20
Nodes (10): Domains of Delight, Fablerise, Fey Crossings, Feywild, Feywild Adventures, Feywild Magic, Feywild Time Warp, Gloaming Court (+2 more)

### Community 75 - "Marks of Prestige"
Cohesion: 0.20
Nodes (10): Fortifications, Letters of Recommendation, Maintenance Costs, Marks of Prestige, Medals, Parcels of Land, Special Favors, Special Rights (+2 more)

### Community 76 - "Create Your Character"
Cohesion: 0.20
Nodes (10): Alignment and Personality, Class Overview, Create Your Character, Hold That Thought, Note Armor Training, Personality Traits by Alignment, Step 1: Choose a Class, Step 4: Choose an Alignment (+2 more)

### Community 77 - "Casting Spells"
Cohesion: 0.20
Nodes (10): Casting Spells, Casting without Slots, Class Spell Lists, Duration, Range, School of Magic, Schools of Magic, Spell Level (+2 more)

### Community 78 - "Chapter 2: Running the Game"
Cohesion: 0.22
Nodes (9): Absent Players, Chapter 2: Running the Game, DM-Controlled Adventurer, Group Size, Incorporating New Players, NPC Party Members, Players with Multiple Characters, Small Groups (+1 more)

### Community 79 - "Know Your Players"
Cohesion: 0.22
Nodes (9): Acting, Exploring, Fighting, Instigating, Know Your Players, Optimizing, Problem-Solving, Socializing (+1 more)

### Community 80 - "Alignment"
Cohesion: 0.22
Nodes (9): Actions Indicate Alignment, Alignment, Character Alignment, Good and Evil Can Cooperate, Monster Alignment, Organization Ethos, Personality, Planes and Alignment (+1 more)

### Community 81 - "Adventure Situations by Level"
Cohesion: 0.22
Nodes (9): Adventure Situations by Level, Levels 11–16 Adventure Situations, Levels 11–16: Masters of the Realm, Levels 17–20 Adventure Situations, Levels 17–20: Masters of the World, Levels 1–4 Adventure Situations, Levels 1–4: Local Heroes, Levels 5–10 Adventure Situations (+1 more)

### Community 82 - "The Planes"
Cohesion: 0.22
Nodes (9): Alignment and the Outer Planes, Inner Planes, Layers of the Outer Planes, Material Realms, Other Configurations, Outer Planes, Outer Planes, The Great Wheel (+1 more)

### Community 83 - "Renown"
Cohesion: 0.22
Nodes (9): Benefits of Renown, Gaining Renown, Level-Based Renown, Level-Based Renown, Losing Renown, Perks, Rank, Recognition (+1 more)

### Community 84 - "Chapter 1: The Basics"
Cohesion: 0.22
Nodes (9): Chapter 1: The Basics, DM Tips, One-Hour Preparation, Preparation Time, Preparing a Session, The One-Hour Guideline, Three-Hour Preparation, Two-Hour Preparation (+1 more)

### Community 85 - "Settlement Tables and Tracker"
Cohesion: 0.22
Nodes (9): Claims to Fame, Current Calamities, Defining Traits, Local Leaders, Random Shops, Settlement Tables and Tracker, Settlements, Settlements by Size (+1 more)

### Community 86 - "Gods and Other Powers"
Cohesion: 0.22
Nodes (9): Creating Religions, Divine Intervention, Divine Knowledge, Divine Rank, Gods and Divine Magic, Gods and Other Powers, Home Plane and Alignment, Myths (+1 more)

### Community 87 - "Monster Behavior"
Cohesion: 0.22
Nodes (9): Initial Attitude, Initial Attitudes, Monster Behavior, Monster Personality, Monster Personality, Monster Relationships, Monster Relationships, Prepared Defenders (+1 more)

### Community 88 - "Step 2: Determine Origin"
Cohesion: 0.22
Nodes (9): Ability Scores and Backgrounds, Choose a Background, Choose a Species, Choose Languages, Choose Starting Equipment, Imagine Your Past and Present, Rare Languages, Standard Languages (+1 more)

### Community 89 - "Attunement"
Cohesion: 0.22
Nodes (9): Attune during a Short Rest, Attunement, Ending Attunement, Identifying a Magic Item, Magic Items, Multiple Items of the Same Kind, No More Than Three Items, Paired Items (+1 more)

### Community 90 - "Chapter 2: Creating a Character"
Cohesion: 0.22
Nodes (9): Chapter 2: Creating a Character, Choose a Character Sheet, Creating Your Character, Get Ready, Starting at Higher Levels, Starting Equipment, Starting Equipment at Higher Levels, Talk with Your DM (+1 more)

### Community 91 - "Tiers of Play"
Cohesion: 0.22
Nodes (9): Character Advancement, Fixed Hit Points by Class, Gaining a Level, Level Advancement, Tier 1 (Levels 1–4), Tier 2 (Levels 5–10), Tier 3 (Levels 11–16), Tier 4 (Levels 17–20) (+1 more)

### Community 92 - "Mastery Properties"
Cohesion: 0.22
Nodes (9): Cleave, Graze, Mastery Properties, Nick, Push, Sap, Slow, Topple (+1 more)

### Community 93 - "What Are Dice For?"
Cohesion: 0.22
Nodes (9): D20 Test, D3, Damage, Dice, Dice Notation, Percentage Chances, Percentile Dice, Random Tables (+1 more)

### Community 94 - "Proficiency"
Cohesion: 0.22
Nodes (9): Determining Skills, Equipment Proficiencies, Proficiency, Proficiency Bonus, Saving Throw Proficiencies, Skill List, Skill Proficiencies, Skills (+1 more)

### Community 95 - "Services"
Cohesion: 0.22
Nodes (9): Food, Drink, and Lodging, Food, Drink, and Lodging, Hirelings, Hirelings, Services, Spellcasting, Spellcasting Services, Travel (+1 more)

### Community 96 - "Background"
Cohesion: 0.32
Nodes (7): AbilityScores, Background, convertBackground(), sortedBackgrounds(), BuildRequest, classReq, BackgroundID

### Community 97 - "LoadAllFromDataDir"
Cohesion: 0.39
Nodes (6): main(), LoadAllFromDataDir(), LoadContentPack(), mergeResolved(), ResolveContent(), NewResolvedContent()

### Community 98 - "Example of Play"
Cohesion: 0.25
Nodes (8): (1)- **Jared:** Who's leading the way?, (2)- **Jared:** The cave entrance is ten feet wide, with the stream running right down the middle. Do you want to go single file or two abreast?, (3)- **Jared:** In fact, the shrubs themselves are moving. They're not rooted at all—each one has two little legs and sharp claws! Everyone, roll Initiative., (4)- **Jared:** There are three on your side of the stream and three on the other side. You can get either group in your Cone., (5)- **Jared:** OK, what do I need to do?, (6)- **Jared:** And how much damage do they take?, (7)- **Russell:** Can I interject myself between it and Mirabella?, Example of Play

### Community 99 - "Ethereal Plane"
Cohesion: 0.25
Nodes (8): Border Ethereal, Deep Ethereal, Ether Cyclone, Ether Cyclones, Ethereal Curtains, Ethereal Plane, Ethereal Plane Adventures, Radiant Citadel

### Community 100 - "Character Objectives"
Cohesion: 0.25
Nodes (8): Character Objectives, Make Peace, Protect an NPC or Object, Retrieve an Object, Run a Gauntlet, Sneak In, Stop a Ritual, Take Out a Single Target

### Community 101 - "Elemental Plane of Water"
Cohesion: 0.25
Nodes (8): Citadel of Ten Thousand Pearls, Darkened Depths, Elemental Plane of Water, Elemental Water Adventures, Isle of Dread, Sea of Ice, Sea of Light, Silt Flats

### Community 102 - "How to Run a Session"
Cohesion: 0.25
Nodes (8): Encounters, Ending a Session, How to Run a Session, Passing Time, Recap, Step 1: Describe the Situation, Step 2: Let the Players Talk, Step 3: Describe What Happens

### Community 103 - "Traveling the Outer Planes"
Cohesion: 0.25
Nodes (8): Infinite Staircase, Planar Portals, Planar Travel, River Oceanus, River Styx, Spells, Traveling the Outer Planes, Yggdrasil, the World Tree

### Community 104 - "Step 3: Determine Ability Scores"
Cohesion: 0.25
Nodes (8): Ability Score Point Costs, Ability Scores and Modifiers, Adjust Ability Scores, Assign Ability Scores, Determine Ability Modifiers, Generate Your Scores, Standard Array by Class, Step 3: Determine Ability Scores

### Community 105 - "Lifestyle Expenses"
Cohesion: 0.25
Nodes (8): Aristocratic (10 GP per Day), Comfortable (2 GP per Day), Lifestyle Expenses, Modest (1 GP per Day), Poor (2 SP per Day), Squalid (1 SP per Day), Wealthy (4 GP per Day), Wretched (Free)

### Community 106 - "Chapter 4: Character Origins"
Cohesion: 0.25
Nodes (8): Background Descriptions, Chapter 4: Character Origins, Character Backgrounds, Character Species, Origin Components, Parts of a Background, Parts of a Species, Species Descriptions

### Community 107 - "Chapter 5: Feats"
Cohesion: 0.25
Nodes (8): Chapter 5: Feats, Epic Boon Feats, Feat Descriptions, Feat List, Fighting Style Feats, General Feats, Origin Feats, Parts of a Feat

### Community 108 - "Dungeon Master's Guide (2024).md"
Cohesion: 0.29
Nodes (6): Chapter 6: Cosmology, Credits, Planar Adventure Situations, Planar Adventure Situations, Planar Adventuring, The Blood War

### Community 109 - "Attitude"
Cohesion: 0.29
Nodes (7): Ability Checks in Social Interaction, Attitude, Engaging the Players, NPC Portrayals, Roleplaying, Running Social Interaction, Using the Help Action

### Community 110 - "Mobs"
Cohesion: 0.29
Nodes (7): Adjudicating Areas of Effect, Average Results, Examples, Mob Results, Mobs, Targets in Area of Effect, Tips

### Community 111 - "Lay Out the Premise"
Cohesion: 0.29
Nodes (7): Adventure Conflict, Adventure Inhabitants, Adventure Maps, Adventure Premise, Adventure Setting, Bringing a Location to Life, Lay Out the Premise

### Community 112 - "Draw In the Players"
Cohesion: 0.29
Nodes (7): Adventure Patrons, Draw In the Players, Happenstance Hooks, Happenstance Hooks, Patron Hooks, Supernatural Hooks, Supernatural Hooks

### Community 113 - "Adventure Rewards"
Cohesion: 0.29
Nodes (7): Adventure Rewards, Individual Treasure, Monster Treasure Preferences, Quest Rewards, Random Individual Treasure, Random Treasure Hoard, Treasure Hoards

### Community 114 - "Respect for the DM"
Cohesion: 0.29
Nodes (7): Antisocial Behavior, Character Knowledge, Player Die Rolling, Players Exploiting the Rules, Respect for the DM, Rules Discussions, The Social Contract of Adventures

### Community 115 - "Crafting Magic Items"
Cohesion: 0.29
Nodes (7): Arcana Proficiency, Crafting Magic Items, Magic Item Crafting Time and Cost, Magic Item Tools, Spells, Time and Cost, Tools

### Community 116 - "Every DM Is Unique"
Cohesion: 0.29
Nodes (7): Atmosphere, Delegation, Every DM Is Unique, House Rules, Learning by Observing, Play Style, Recording Rules Interpretations

### Community 117 - "Narration"
Cohesion: 0.29
Nodes (7): Atmosphere, Brevity, Draw Players' Attention, Giving Information to One Player, Lead by Example, Narration, Secrets and Discovery

### Community 118 - "Northern Flanaess"
Cohesion: 0.29
Nodes (7): Baklunish Nomads, Northern Flanaess, Northern Flanaess Adventures, Northern Flanaess and Its Neighbors, Northern Flanaess Locations, The Hunting Lands, The North Kingdoms

### Community 119 - "Campaign Start"
Cohesion: 0.29
Nodes (7): Bringing the Party Together, Campaign Start, Character Creation, First Adventure, Session Zero, Setting the Stage, Starting Location

### Community 120 - "Sentient Magic Item Traits"
Cohesion: 0.29
Nodes (7): Conflict, Sentient Item's Alignment, Sentient Item's Communication, Sentient Item's Senses, Sentient Item's Special Purpose, Sentient Magic Item Traits, Sentient Magic Items

### Community 121 - "Magic Items"
Cohesion: 0.29
Nodes (7): Cursed Items, Magic Item Rarities and Values, Magic Item Rarity, Magic Item Resilience, Magic Item Values by Rarity, Magic Items, "The Next Dawn"

### Community 122 - "Player's Handbook (2024).md"
Cohesion: 0.29
Nodes (6): Appendix B: Creature Stat Blocks, Chapter 3: Character Classes, Credits, Glossary Conventions, Rules Definitions, Rules Glossary

### Community 123 - "Describe Appearance and Personality"
Cohesion: 0.29
Nodes (7): Charisma, Constitution, Describe Appearance and Personality, Dexterity, Intelligence, Strength, Wisdom

### Community 124 - "Campaign"
Cohesion: 0.40
Nodes (3): Campaign, NewCampaignID(), CampaignID

### Community 125 - "Creating a Background"
Cohesion: 0.33
Nodes (6): 1: Choose Abilities, 2: Choose a Feat, 3: Choose Skill Proficiencies, 4: Choose a Tool Proficiency, 5: Choose Equipment, Creating a Background

### Community 126 - "Elemental Plane of Air"
Cohesion: 0.33
Nodes (6): Aaqa, Elemental Plane of Air, Labyrinth Winds, Mistral Reach, Plane of Air Adventures, Sirocco Straits

### Community 127 - "Artifact Properties"
Cohesion: 0.33
Nodes (6): Artifact Properties, Artifacts, Major Beneficial Properties, Major Detrimental Properties, Minor Beneficial Properties, Minor Detrimental Properties

### Community 128 - "Awarding Magic Items"
Cohesion: 0.33
Nodes (6): Awarding Magic Items, Magic Item Rarities, Magic Item Tracker, Magic Items Awarded by Level, Magic Items Awarded by Level, Random Magic Item Rarity

### Community 129 - "Central Flanaess"
Cohesion: 0.33
Nodes (6): Battle of Emridy Meadows, Central Flanaess, Central Flanaess Adventures, Central Flanaess Culture, Central Flanaess Locations, The Rise of Iuz

### Community 130 - "Elemental Plane of Fire"
Cohesion: 0.33
Nodes (6): Cinder Wastes, City of Brass, Elemental Fire Adventures, Elemental Plane of Fire, Sea of Fire, Torchy's

### Community 131 - "Multiple DMs"
Cohesion: 0.33
Nodes (6): Concurrent Campaigns, Joint DMs, Multiple DMs, Occasional Breaks, Shared World, Variety Series

### Community 132 - "Eastern Flanaess"
Cohesion: 0.33
Nodes (6): Eastern Flanaess, Eastern Flanaess Adventures, Eastern Flanaess and Its Neighbors, Eastern Flanaess Culture, Eastern Flanaess Locations, Shar

### Community 133 - "Fear and Mental Stress"
Cohesion: 0.33
Nodes (6): Fear and Mental Stress, Fear Effects, Mental Stress Effects, Prolonged Effects, Sample Fear DCs, Sample Mental Stress Effects

### Community 134 - "Material Plane"
Cohesion: 0.33
Nodes (6): Material Plane, The Dream of Other Worlds, The Great Journey, The Leap to Another Realm, The Roots of the Worlds, Traveling between Worlds

### Community 135 - "Para-elemental Planes"
Cohesion: 0.33
Nodes (6): Para-elemental Plane Adventures, Para-elemental Planes, Plane of Ash, Plane of Ice, Plane of Magma, Plane of Ooze

### Community 136 - "Social Interaction"
Cohesion: 0.33
Nodes (6): (1)- **Jared:** He reaches for the letter but pulls back before touching it. "That seal—it's not my father's." Gareth, make a Wisdom (Insight) check., (2)- **Phillip:** Gareth draws closer and compassionately asks Ismark whether his sister has been bitten by the vampire., Ability Checks, Roleplaying, Social Interaction, Social Interaction Example

### Community 137 - "The Six Abilities"
Cohesion: 0.33
Nodes (6): Ability Descriptions, Ability Modifiers, Ability Modifiers, Ability Scores, Ability Scores, The Six Abilities

### Community 138 - "Chapter 7: Spells"
Cohesion: 0.33
Nodes (6): Always-Prepared Spells, Chapter 7: Spells, Gaining Spells, Preparing Spells, Spell Descriptions, Spell Preparation by Class

### Community 139 - "Appendix A: The Multiverse"
Cohesion: 0.33
Nodes (6): Appendix A: The Multiverse, Outer Planes, The Inner Planes, The Material Realms, The Outer Planes, Transitive Planes

### Community 140 - "Dropping to 0 Hit Points"
Cohesion: 0.33
Nodes (6): Character Demise, Death Saving Throws, Dropping to 0 Hit Points, Falling Unconscious, Instant Death, Stabilizing a Character

### Community 141 - "Step 5: Fill In Details"
Cohesion: 0.33
Nodes (6): Create Final Details, Fill In Numbers, Level 1 Hit Points by Class, Name Your Character, Record Class Features, Step 5: Fill In Details

### Community 142 - "Introduction: Welcome to Adventure"
Cohesion: 0.33
Nodes (6): Dungeon Master's Guide and Monster Manual, Introduction: Welcome to Adventure, Player's Handbook, Using This Book, What You Need, Worlds of Adventure

### Community 143 - "DamageAppliedEvent"
Cohesion: 0.40
Nodes (3): DamageAppliedEvent, DamageComponent, DamageRolledEvent

### Community 144 - "Ability Checks"
Cohesion: 0.40
Nodes (5): Ability Checks, Group Checks, Passive Checks, Proficiency, Trying Again

### Community 145 - "Activating a Magic Item"
Cohesion: 0.40
Nodes (5): Activating a Magic Item, Charges, Command Word, Consumable Items, Spells Cast from Items

### Community 146 - "Chapter 4: Creating Adventures"
Cohesion: 0.40
Nodes (5): Adventure Climax, Bring It to an End, Chapter 4: Creating Adventures, Denouement, Step-by-Step Adventures

### Community 147 - "Using Your Journal"
Cohesion: 0.40
Nodes (5): Adventure Stockpile, Foreshadowing, Keeping a Journal, Using Your Journal, Your Campaign Journal

### Community 148 - "Useful Additions"
Cohesion: 0.40
Nodes (5): Adventures and Sourcebooks, Battle Grid and Miniatures, Card Accessories, DM Screen, Useful Additions

### Community 149 - "Traps"
Cohesion: 0.40
Nodes (5): Building a Trap, Building Your Own Traps, Example Traps, Parts of a Trap, Traps

### Community 150 - "Elemental Plane of Earth"
Cohesion: 0.40
Nodes (5): City of Jewels, Elemental Plane of Earth, Furnaces, Mud Hills, Plane of Earth Adventures

### Community 151 - "Consequences"
Cohesion: 0.40
Nodes (5): Consequences, Critical Success or Failure, Degrees of Failure, Degrees of Success, Success at a Cost

### Community 152 - "Magic Item Special Features"
Cohesion: 0.40
Nodes (5): Magic Item's Creator or Intended User, Magic Item's History, Magic Item's Minor Property, Magic Item's Quirk, Magic Item Special Features

### Community 153 - "Actions"
Cohesion: 0.40
Nodes (5): Actions, Actions, Bonus Actions, One Thing at a Time, Reactions

### Community 154 - "Effects"
Cohesion: 0.40
Nodes (5): Attack Rolls, Combining Spell Effects, Effects, Saving Throws, Targets

### Community 155 - "Temporary Hit Points"
Cohesion: 0.40
Nodes (5): Duration, Lose Temporary Hit Points First, Temporary Hit Points, Temporary Hit Points Don't Stack, They're Not Hit Points or Healing

### Community 156 - "Large Groups"
Cohesion: 0.50
Nodes (4): Large Groups, Party Leader, Speeding Combat, Structured Turns

### Community 157 - "Casting Time"
Cohesion: 0.50
Nodes (4): Casting Time, Longer Casting Times, One Spell with a Spell Slot per Turn, Reaction and Bonus Action Triggers

### Community 158 - "Components"
Cohesion: 0.50
Nodes (4): Components, Material (M), Somatic (S), Verbal (V)

### Community 160 - "Acheron"
Cohesion: 0.67
Nodes (3): Acheron, Acheron Adventures, Layers of Acheron

### Community 161 - "Arborea"
Cohesion: 0.67
Nodes (3): Arborea, Arborea Adventures, Layers of Arborea

### Community 162 - "Beastlands"
Cohesion: 0.67
Nodes (3): Beastlands, Beastlands Adventures, Layers of the Beastlands

### Community 163 - "Bytopia"
Cohesion: 0.67
Nodes (3): Bytopia, Bytopia Adventures, Layers of Bytopia

### Community 164 - "Outlands"
Cohesion: 0.67
Nodes (3): Gate-Towns of the Outlands, Outlands, Outlands Adventures

### Community 165 - "Gehenna"
Cohesion: 0.67
Nodes (3): Gehenna, Gehenna Adventures, Layers of Gehenna

### Community 166 - "Pandemonium"
Cohesion: 0.67
Nodes (3): Layers of Pandemonium, Pandemonium, Pandemonium Adventures

### Community 167 - "Ysgard"
Cohesion: 0.67
Nodes (3): Layers of Ysgard, Ysgard, Ysgard Adventures

### Community 168 - "Limbo"
Cohesion: 0.67
Nodes (3): Limbo, Limbo Adventures, Power of the Mind

## Knowledge Gaps
- **1206 isolated node(s):** `CharacterSummary`, `state`, `STD_ARRAY`, `STEPS`, `github.com/hadnu/arcanum` (+1201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Chapter 3: DM's Toolbox` connect `Chapter 3: DM's Toolbox` to `Fear and Mental Stress`, `Traps`, `Detailed NPCs`, `Explosives`, `Chases`, `Designing Dungeon Rooms`, `What If Everyone Dies?`, `Minor Alterations`, `Common Doors`, `Modifying a Magic Item`, `Curses`, `Marks of Prestige`, `Alignment`, `Renown`, `Settlement Tables and Tracker`, `Gods and Other Powers`, `Dungeon Master's Guide (2024).md`, `Mobs`, `Creating a Background`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `Chapter 6: Cosmology` connect `Dungeon Master's Guide (2024).md` to `The Planes`, `Tour of the Multiverse`, `Traveling the Outer Planes`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Tour of the Multiverse` connect `Tour of the Multiverse` to `Elemental Plane of Fire`, `Material Plane`, `Para-elemental Planes`, `Elemental Plane of Earth`, `Acheron`, `Arborea`, `Beastlands`, `Bytopia`, `Nine Hells`, `Gehenna`, `Pandemonium`, `Outlands`, `Limbo`, `Ysgard`, `Abyss`, `Shadowfell`, `Astral Plane`, `Feywild`, `Ethereal Plane`, `Elemental Plane of Water`, `Dungeon Master's Guide (2024).md`, `Elemental Plane of Air`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `CharacterSummary`, `state`, `STD_ARRAY` to the rest of the system?**
  _1206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Event` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08156028368794327 - nodes in this community are weakly interconnected._
- **Should `Class` be split into smaller, more focused modules?**
  _Cohesion score 0.14444444444444443 - nodes in this community are weakly interconnected._