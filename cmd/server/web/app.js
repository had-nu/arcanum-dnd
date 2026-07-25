console.log('Arcanum v5');
let content = null;
let state = {
  step: 1, name: '',
  classes: [],
  backgroundId: null, backgroundData: null,
  bgAlignment: '', bgFaith: '', bgTrait: '', bgIdeal: '', bgBond: '', bgFlaw: '',
  bgAge: '', bgHeight: '', bgWeight: '', bgEyes: '', bgSkin: '', bgHair: '',
  bgNotes: '',
  speciesId: null, speciesVariant: null, speciesHybrid: null,
  subclassId: null,
  level: 1,
  abilityMethod: 'standard-array',
  rolledScores: [],
  abilities: {},
  skills: [],
  feats: [],
  equipment: [],
  spells: [],
  result: null,
};
const STD_ARRAY = [15, 14, 13, 12, 10, 8];
const STEPS = ['Name','Class','Background','Species','Abilities','Equipment','Sheet'];

function abName(id) { return {STR:'Strength',DEX:'Dexterity',CON:'Constitution',INT:'Intelligence',WIS:'Wisdom',CHA:'Charisma'}[id]||id; }
function abMod(v) { return Math.floor((v-10)/2); }
function fmtMod(v) { var m=abMod(v); return m>=0?'+'+m:''+m; }
function skillLabel(id) {
  return {acrobatics:'Acrobatics','animal-handling':'Animal Handling',arcana:'Arcana',athletics:'Athletics',
    deception:'Deception',history:'History',insight:'Insight',intimidation:'Intimidation',
    investigation:'Investigation',medicine:'Medicine',nature:'Nature',perception:'Perception',
    performance:'Performance',persuasion:'Persuasion',religion:'Religion','sleight-of-hand':'Sleight of Hand',
    stealth:'Stealth',survival:'Survival'}[id]||id;
}
function esc(s) { return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function ucFirst(s) { return s.charAt(0).toUpperCase()+s.slice(1); }
function getMain() { return document.querySelector('.main-content .container'); }

async function loadContent() {
  var r = await fetch('/api/content');
  content = await r.json();
  var sr = await fetch('/api/spells');
  var spellData = await sr.json();
  content.spells = {};
  content.spellsByName = {}; // name -> spell object
  if (spellData.cantrips) {
    spellData.cantrips.forEach(function(s){ content.spells[s.id] = {id:s.id, name:s.name, level:0, school:s.school, castingTime:s.time, range:s.range, duration:s.duration, concentration:s.concentration, damage:s.damage, save:s.save, attack:s.attack, ritual:s.ritual}; content.spellsByName[s.name] = content.spells[s.id]; });
  }
  if (spellData.leveled) {
    spellData.leveled.forEach(function(arr, idx){
      arr.forEach(function(s){ content.spells[s.id] = {id:s.id, name:s.name, level:idx+1, school:s.school, castingTime:s.time, range:s.range, duration:s.duration, concentration:s.concentration, damage:s.damage, save:s.save, attack:s.attack, ritual:s.ritual}; content.spellsByName[s.name] = content.spells[s.id]; });
    });
  }

  window.CLASS_SPELL_LISTS = {};
  if (content.classes) {
    content.classes.forEach(function(cls) {
      if (cls.spellcasting && cls.spellcasting.spellLists) {
        var perLevel = {};
        var spellLists = cls.spellcasting.spellLists;
        Object.keys(spellLists).forEach(function(lvl) {
          perLevel[lvl] = { cantrips: [], spells: [] };
          spellLists[lvl].forEach(function(spellName) {
            var sp = content.spellsByName[spellName];
            if (sp && sp.level === 0) perLevel[lvl].cantrips.push(sp.id);
            else if (sp) perLevel[lvl].spells.push(sp.id);
          });
        });
        window.CLASS_SPELL_LISTS[cls.id] = perLevel;
      }
    });
  }
}

function init() { 
  loadContent()
    .then(function(){ renderSteps(); showStep(1); })
    .catch(function(err){ 
      console.error('Init failed:', err); 
      document.body.innerHTML = '<pre style="color:red;padding:20px;">Init error: ' + err.message + '</pre>'; 
    }); 
}

function renderSteps() {
  document.querySelector('.steps-inner').innerHTML = STEPS.map(function(s,i){
    return '<div class="step" data-step="'+(i+1)+'" onclick="goToStep('+(i+1)+')">'+s+'</div>';
  }).join('');
  updateSteps();
}

function goToStep(n) {
  if (n <= state.step || canNavigateTo(n)) {
    goTo(n);
  }
}

function canNavigateTo(n) {
  if (n === 1) return true;
  if (n === 2 && state.name) return true;
  if (n === 3 && state.classes.length > 0) return true;
  if (n === 4 && state.backgroundId) return true;
  if (n === 5 && state.speciesId) return true;
  if (n === 6 && Object.keys(state.abilities).length === 6) return true;
  if (n === 7) return true;
  return false;
}
function updateSteps() {
  document.querySelectorAll('.step').forEach(function(el){
    var n = parseInt(el.dataset.step);
    el.className = 'step' + (n===state.step?' active':n<state.step?' done':'');
  });
}
function showStep(n) {
  state.step = n; updateSteps();
  var main = getMain();
  if (n===1) renderName(main);
  else if (n===2) renderClass(main);
  else if (n===3) renderBackground(main);
  else if (n===4) renderSpecies(main);
  else if (n===5) renderAbilities(main);
  else if (n===6) renderEquipment(main);
  else if (n===7) renderSheet(main);
  window.scrollTo(0,0);
}
function goTo(n) { showStep(Math.max(1,Math.min(n,STEPS.length))); }

// ─── 1: Name ───
function renderName(main) {
  var h = '<div class="name-section">';
  h += '<h2 class="sec-title">Character Name</h2>';
  h += '<div class="form-group" style="max-width:400px">';
  h += '<label class="form-label">Name your hero</label>';
  h += '<input class="form-input" type="text" id="name-input" value="'+esc(state.name)+'" placeholder="e.g. Kaelen Dawnbringer" autofocus>';
  h += '</div>';
  h += '<div class="actions"><span></span><button class="btn btn-primary" onclick="confirmName()">Next</button></div>';
  h += '<div class="saved-chars-section" id="saved-chars-section"></div>';
  h += '</div>';
  main.innerHTML = h;
  var inp = document.getElementById('name-input');
  inp.focus();
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter') confirmName(); });
  loadSavedCharacters();
}

async function loadSavedCharacters() {
  var chars = await listCharacters();
  var box = document.getElementById('saved-chars-section');
  if (!box || !chars || chars.length === 0) return;
  var h = '<div class="saved-chars-divider"><span>or load a saved character</span></div>';
  h += '<div class="saved-chars-list">';
  chars.forEach(function(ch){
    h += '<div class="saved-char-row" onclick="loadCharacter(\''+esc(ch.name)+'\')">';
    h += '<div class="saved-char-info">';
    h += '<div class="saved-char-name">'+esc(ch.name)+'</div>';
    h += '<div class="saved-char-meta">Level '+ch.level+' &middot; '+esc(ch.classes)+' &middot; '+esc(ch.species)+'</div>';
    h += '</div>';
    h += '<div class="saved-char-arrow">&#10132;</div>';
    h += '</div>';
  });
  h += '</div>';
  box.innerHTML = h;
}
function confirmName() {
  var v = document.getElementById('name-input').value.trim();
  if (!v) { alert('Enter a name.'); return; }
  state.name = v; goTo(2);
}

// ─── 2: Class ───
var CLASS_FEATURES = {
  barbarian: { name:'Barbarian', hitDie:12, features:[
    {level:1,name:'Rage',desc:'Enter a rage as a Bonus Action. While raging, you have Resistance to physical damage, bonus to melee damage, and Advantage on STR checks/saves.'},
    {level:1,name:'Unarmored Defense',desc:'While not wearing armor, your AC equals 10 + DEX mod + CON mod.'},
    {level:2,name:'Reckless Attack',desc:'Advantage on melee STR attack rolls, but attacks against you have advantage.'},
    {level:2,name:'Danger Sense',desc:'Advantage on DEX saving throws against effects you can see.'},
    {level:3,name:'Primal Knowledge',desc:'Gain an additional skill proficiency from your class list.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass archetype.',subclass:true},
    {level:5,name:'Extra Attack',desc:'Attack twice when you take the Attack action.'},
    {level:5,name:'Fast Movement',desc:'Speed increases by 10 feet while not wearing heavy armor.'},
    {level:6,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:7,name:'Feral Instinct',desc:'Advantage on Initiative rolls.'},
    {level:9,name:'Brutal Strike',desc:'Once per turn, deal extra damage with a melee weapon attack.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:11,name:'Relentless Rage',desc:'If you drop to 0 HP, make a CON save to stay at 1 HP.'},
    {level:13,name:'Improved Brutal Strike',desc:'Brutal Strike deals more damage.'},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:15,name:'Persistent Rage',desc:'Rage ends only if you fall unconscious or choose to end it.'},
    {level:17,name:'Brutal Strike (Enhanced)',desc:'Brutal Strike improved further.'},
    {level:18,name:'Indomitable Might',desc:'If STR check result is less than 20, use 20.'},
    {level:20,name:'Primal Champion',desc:'STR and CON increase by 4 each (max 25).'}
  ]},
  bard: { name:'Bard', hitDie:8, features:[
    {level:1,name:'Spellcasting',desc:'Cast bard spells using Charisma as your spellcasting ability.'},
    {level:1,name:'Bardic Inspiration',desc:'Grant an inspiration die (d6) to an ally as a Bonus Action.'},
    {level:2,name:'Jack of All Trades',desc:'Add half proficiency bonus to any ability check not already proficient.'},
    {level:2,name:'Expertise',desc:'Double proficiency bonus on two chosen skill proficiencies.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass archetype.',subclass:true},
    {level:4,name:'Font of Inspiration',desc:'Bardic Inspiration restores on a Short Rest.'},
    {level:6,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:6,name:'Countercharm',desc:'As an action, grant advantage on saves against charm/fright for allies.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:10,name:'Magical Secrets',desc:'Learn 2 spells from any class list.'},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:14,name:'Magical Secrets',desc:'Learn 2 more spells from any class list.'},
    {level:18,name:'Magical Secrets',desc:'Learn 2 more spells from any class list.'},
    {level:20,name:'Words of Creation',desc:'Cast Power Word Heal or Power Word Kill once per Long Rest.'}
  ]},
  cleric: { name:'Cleric', hitDie:8, features:[
    {level:1,name:'Spellcasting',desc:'Cast cleric spells using Wisdom as your spellcasting ability.'},
    {level:1,name:'Divine Order',desc:'Choose a divine order for additional proficiencies.'},
    {level:1,name:'Subclass Feature',desc:'Choose a subclass (Divine Domain) at level 1.',subclass:true},
    {level:2,name:'Channel Divinity',desc:'Channel divine energy for powerful effects.'},
    {level:5,name:'Bloodlets of Divinity',desc:'Your cleric spells deal extra radiant/necrotic damage.'},
    {level:7,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Avatar of Battle',desc:'Resistance to bludgeoning, piercing, slashing from nonmagical attacks.'}
  ]},
  druid: { name:'Druid', hitDie:8, features:[
    {level:1,name:'Druidic',desc:'You know Druidic, the secret language of druids.'},
    {level:1,name:'Spellcasting',desc:'Cast druid spells using Wisdom as your spellcasting ability.'},
    {level:2,name:'Wild Shape',desc:'Transform into a beast you have seen. 2 uses per Short Rest.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass archetype.',subclass:true},
    {level:6,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:7,name:'Wild Strikes',desc:'Wild Shape forms can attack twice.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:15,name:'Thousand Forms',desc:'You can cast Alter Self at will.'},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:18,name:'Beast Spells',desc:'Cast spells while in Wild Shape form.'},
    {level:20,name:'Archdruid',desc:'Unlimited Wild Shape uses. STR/CON max becomes 25.'}
  ]},
  fighter: { name:'Fighter', hitDie:10, features:[
    {level:1,name:'Second Wind',desc:'Regain 1d10+level HP as a Bonus Action. 1 use per Short Rest.'},
    {level:1,name:'Weapon Mastery',desc:'Choose weapons to gain mastery properties (Vex, Push, etc.).'},
    {level:2,name:'Action Surge',desc:'Gain one additional action on your turn. 1 use per Short Rest.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass archetype.',subclass:true},
    {level:5,name:'Extra Attack',desc:'Attack twice when you take the Attack action.'},
    {level:5,name:'Tactical Master',desc:'Apply tactical maneuvers to weapon attacks.'},
    {level:7,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:9,name:'Indomitable',desc:'Reroll a failed saving throw. 1 use per Long Rest.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:11,name:'Extra Attack (2)',desc:'Attack three times when you take the Attack action.'},
    {level:15,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:17,name:'Action Surge (2)',desc:'Two additional actions per Short Rest.'},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Extra Attack (3)',desc:'Attack four times when you take the Attack action.'}
  ]},
  monk: { name:'Monk', hitDie:8, features:[
    {level:1,name:'Martial Arts',desc:'Use DEX for unarmed strikes and monk weapons. Bonus action unarmed strike.'},
    {level:1,name:'Unarmored Movement',desc:'Speed increases by 10 feet while not wearing armor.'},
    {level:2,name:'Ki',desc:'Spend Ki points for Flurry of Blows, Patient Defense, Step of the Wind.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass (Monastic Tradition).',subclass:true},
    {level:3,name:'Deflect Attacks',desc:'Use reaction to reduce incoming damage.'},
    {level:5,name:'Extra Attack',desc:'Attack twice when you take the Attack action.'},
    {level:5,name:'Stunning Strike',desc:'Spend 1 Ki to attempt to stun a target on hit.'},
    {level:6,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:7,name:'Evasion',desc:'On successful DEX save, take no damage instead of half.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:10,name:'Heightened Focus',desc:'Ki pool increases. Unarmored Movement improves.'},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:14,name:'Body and Mind',desc:'STR and DEX max increase to 22.'},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Perfect Self',desc:'When you roll initiative, regain 4 Ki points if at 0.'}
  ]},
  paladin: { name:'Paladin', hitDie:10, features:[
    {level:1,name:'Divine Sense',desc:'Detect celestials, fiends, and undead within 60 feet.'},
    {level:1,name:'Lay on Hands',desc:'Restore HP from a pool equal to paladin level x 5.'},
    {level:2,name:'Fighting Style',desc:'Choose a fighting style (Defense, Dueling, etc.).'},
    {level:2,name:'Spellcasting',desc:'Cast paladin spells using Charisma.'},
    {level:2,name:'Divine Smite',desc:'Expend a spell slot to deal extra radiant damage on hit.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass (Sacred Oath).',subclass:true},
    {level:5,name:'Extra Attack',desc:'Attack twice when you take the Attack action.'},
    {level:6,name:'Aura of Protection',desc:'You and allies within 10 feet add CHA mod to saves.'},
    {level:7,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:10,name:'Aura of Courage',desc:'You and allies within 10 feet can\'t be frightened.'},
    {level:11,name:'Improved Divine Smite',desc:'Melee hits deal extra 1d8 radiant damage.'},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:15,name:'Smite of Hope',desc:'Divine Smite restores HP to allies instead of damaging.'},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Holy Nimbus',desc:'Emanate sunlight in 30-foot radius. Enemies take 10 radiant damage.'}
  ]},
  ranger: { name:'Ranger', hitDie:10, features:[
    {level:1,name:'Favored Enemy',desc:'Choose a favored enemy type. Advantage on tracking and recalling info.'},
    {level:1,name:'Deft Explorer',desc:'Gain additional skill proficiencies and expertise.'},
    {level:2,name:'Fighting Style',desc:'Choose a fighting style (Archery, Dueling, etc.).'},
    {level:2,name:'Spellcasting',desc:'Cast ranger spells using Wisdom.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass (Ranger Archetype).',subclass:true},
    {level:5,name:'Extra Attack',desc:'Attack twice when you take the Attack action.'},
    {level:7,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:11,name:'Relentless Hunter',desc:'Take damage only once per turn from effects that deal damage repeatedly.'},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:15,name:'Feral Senses',desc:'Sense invisible creatures within 30 feet.'},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Epic Boon',desc:'Gain an Epic Boon feat.'}
  ]},
  rogue: { name:'Rogue', hitDie:8, features:[
    {level:1,name:'Expertise',desc:'Double proficiency on chosen skill proficiencies.'},
    {level:1,name:'Sneak Attack',desc:'Deal extra 1d6 damage when you have advantage or an ally nearby.'},
    {level:1,name:'Thieves\' Cant',desc:'Secret language for communication. Includes rogue signals.'},
    {level:2,name:'Cunning Action',desc:'Dash, Disengage, or Hide as a Bonus Action.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass (Roguish Archetype).',subclass:true},
    {level:5,name:'Uncanny Dodge',desc:'Use reaction to halve damage from an attack you can see.'},
    {level:6,name:'Expertise',desc:'Choose 2 more skills for expertise.'},
    {level:8,name:'Evasion',desc:'On successful DEX save, take no damage instead of half.'},
    {level:9,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:11,name:'Reliable Talent',desc:'Treat any d20 roll of 9 or lower as a 10 on proficient abilities.'},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:17,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:19,name:'Elusive',desc:'No attack has advantage against you.'},
    {level:20,name:'Stroke of Luck',desc:'Treat a missed attack as a hit, or a failed check as a nat 20. 1/Short Rest.'}
  ]},
  sorcerer: { name:'Sorcerer', hitDie:6, features:[
    {level:1,name:'Spellcasting',desc:'Cast sorcerer spells using Charisma.'},
    {level:1,name:'Innate Sorcery',desc:'Activate sorcerous origins. Gain bonus to spell attacks and AC.'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass (Sorcerous Origin).',subclass:true},
    {level:6,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:7,name:'Sorcery Points',desc:'Gain meta-magic options: Quickened, Twinned, Heightened Spell.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Arcane Apotheosis',desc:'While Sorcery Points remain, you can cast one spell per turn as a reaction.'}
  ]},
  warlock: { name:'Warlock', hitDie:8, features:[
    {level:1,name:'Otherworldly Patron',desc:'Choose a patron: Fiend, Archfey, Great Old One, etc.',subclass:true},
    {level:1,name:'Pact Magic',desc:'Cast warlock spells using Charisma. Spells are always cast at highest slot.'},
    {level:2,name:'Eldritch Invocations',desc:'Gain special abilities tied to your patron and pact.'},
    {level:3,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:5,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:6,name:'Mystic Arcanum',desc:'Cast a 6th-level spell once per Long Rest.'},
    {level:7,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:9,name:'Mystic Arcanum (7th)',desc:'Cast a 7th-level spell once per Long Rest.'},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:11,name:'Mystic Arcanum (6th)',desc:'Additional 6th-level Mystic Arcanum.'},
    {level:13,name:'Mystic Arcanum (8th)',desc:'Cast an 8th-level spell once per Long Rest.'},
    {level:15,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:17,name:'Mystic Arcanum (9th)',desc:'Cast a 9th-level spell once per Long Rest.'},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Eldritch Master',desc:'Regain all Pact Magic slots after a 1-minute short rest.'}
  ]},
  wizard: { name:'Wizard', hitDie:6, features:[
    {level:1,name:'Spellcasting',desc:'Cast wizard spells using Intelligence.'},
    {level:1,name:'Arcane Recovery',desc:'After a Short Rest, recover spell slots equal to half wizard level (rounded up).'},
    {level:3,name:'Subclass Feature',desc:'Choose a subclass (Arcane Tradition).',subclass:true},
    {level:6,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:10,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:14,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:18,name:'Subclass Feature',desc:'Additional subclass feature.',subclass:true},
    {level:20,name:'Signature Spells',desc:'Choose 2 3rd-level spells as always prepared. Cast each once for free.'}
  ]}
};

function calcHP(classId, level, conMod, hitDie) {
  if (!hitDie) hitDie = CLASS_FEATURES[classId] ? CLASS_FEATURES[classId].hitDie : 8;
  var hd = parseInt(String(hitDie).replace('d',''));
  var avg = Math.floor(hd/2) + 1;
  if (level === 1) return hd + conMod;
  return hd + conMod + (level-1) * (avg + conMod);
}

function getSubclassLevel(classId) {
  var cf = CLASS_FEATURES[classId];
  if (!cf) return 3;
  var f = cf.features.find(function(x){return x.subclass;});
  return f ? f.level : 3;
}

function renderClass(main) {
  var sel = state.classes.map(function(c){return c.id;});
  var sortAlpha = content.classes.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
  var conMod = state.abilities.CON ? abMod(state.abilities.CON) : 0;

  var h = '<div class="class-section">';
  if (state.classes.length === 0) {
    h += '<h2 class="sec-title">Choose Class</h2>';
    h += '<div class="class-picker" id="class-picker">';
    h += '<div class="picker-header">';
    h += '<div class="picker-search"><input class="form-input picker-search-input" type="text" placeholder="Search classes..." oninput="filterClassPicker(this.value)"></div>';
    h += '</div>';
    h += '<div class="picker-list" id="picker-list">';
    sortAlpha.forEach(function(c){
      h += '<div class="picker-row" onclick="openClassPopup(\''+c.id+'\')">';
      h += '<div class="picker-row-icon"><img src="/static/img/classes/'+c.id+'.svg" alt="'+esc(c.name)+'" onerror="this.style.display=\'none\'"></div>';
      h += '<div class="picker-row-info">';
      h += '<div class="picker-row-name">'+esc(c.name)+'</div>';
      h += '<div class="picker-row-meta">Player\'s Handbook &middot; HD d'+CLASS_FEATURES[c.id].hitDie+' &middot; '+(c.spellcaster?'Spellcaster':'Martial')+'</div>';
      h += '</div>';
      h += '<div class="picker-row-arrow">&#10132;</div>';
      h += '</div>';
    });
    h += '</div></div>';

  } else {
    h += '<div class="selected-classes">';
    state.classes.forEach(function(c, idx){
      var cd = c.data;
      var cf = CLASS_FEATURES[c.id];
      var subLvl = getSubclassLevel(c.id);
      var hp = calcHP(c.id, c.level, conMod, cd.hitDie);
      h += '<div class="selected-class-row">';
      h += '<div class="selected-class-hdr">';
      h += '<div class="selected-class-name"><img class="class-icon" src="/static/img/classes/'+c.id+'.svg" alt="" onerror="this.style.display=\'none\'"> '+esc(cd.name)+'</div>';
      h += '<div class="selected-class-sub">Level <select class="class-level-select" onchange="setClassLevel('+idx+',this.value)">';
      for (var l=1;l<=20;l++){ h += '<option value="'+l+'"'+(c.level===l?' selected':'')+'>'+l+'</option>'; }
      h += '</select></div>';
      h += '<div class="selected-class-hp">HP <strong>'+hp+'</strong> <span class="hp-detail">(d'+String(cd.hitDie).replace('d','')+' + CON)</span></div>';
      h += '<button class="btn btn-sm btn-danger" onclick="removeClass('+idx+')">&#10005;</button>';
      h += '</div>';

      h += '<div class="selected-class-body">';

      var classSpells = window.CLASS_SPELL_LISTS ? window.CLASS_SPELL_LISTS[c.id] : null;

      h += '<div class="class-body-tabs">';
      h += '<button class="class-tab'+(c.classTab==='features'?' active':'')+'" onclick="setClassTab('+idx+',\'features\')">Features</button>';
      if (cd.spellcaster && classSpells) {
        h += '<button class="class-tab'+(c.classTab==='spells'?' active':'')+'" onclick="setClassTab('+idx+',\'spells\')">Spells</button>';
      }
      h += '</div>';

      if (c.classTab === 'spells' && classSpells) {
        h += '<div class="class-body-spells">';
        h += renderClassSelectedSpells(idx, c);
        h += '<details class="class-spell-details" id="class-spell-details-'+idx+'">';
        h += '<summary class="class-spell-summary">Available Spells</summary>';
        h += renderClassSpellPicker(idx, c);
        h += '</details>';
        h += '</div>';
      } else {
        h += '<div class="selected-class-features">';
        if (cf) {
          cf.features.forEach(function(f){
            var unlocked = f.level <= c.level;
            var isSub = f.subclass;
            h += '<div class="class-feature-row'+(unlocked?'':' locked')+(isSub?' subclass-feature':'')+'">';
            h += '<span class="feat-level-badge">Lv.'+f.level+'</span>';
            h += '<span class="feat-name">'+esc(f.name)+'</span>';
            if (isSub) {
              if (c.subclassId) {
                var scData = cd.subClasses?cd.subClasses.find(function(s){return s.id===c.subclassId;}):null;
                h += '<span class="subclass-badge">'+esc(scData?scData.name:c.subclassId)+'</span>';
              } else if (c.level >= subLvl) {
                h += '<span class="subclass-badge pending">Choose Subclass</span>';
              }
            }
            h += unlocked?'<span class="feat-unlocked">&#10003;</span>':'<span class="feat-locked">&#128274;</span>';
            h += '</div>';
          });
        }

        if (c.level >= subLvl && cd.subClasses && cd.subClasses.length) {
          h += '<div class="subclass-select-row">';
          h += '<label class="form-label">Subclass</label>';
          h += '<select class="form-input subclass-select" onchange="setSubclass('+idx+',this.value)">';
          h += '<option value="">-- Choose --</option>';
          cd.subClasses.forEach(function(sc){
            h += '<option value="'+sc.id+'"'+(c.subclassId===sc.id?' selected':'')+'>'+esc(sc.name)+'</option>';
          });
          h += '</select></div>';
          if (c.subclassId) {
            var scDesc = cd.subClasses.find(function(s){return s.id===c.subclassId;});
            if (scDesc) {
              h += '<div class="subclass-desc-box"><div class="subclass-desc-title">'+esc(scDesc.name)+'</div>';
              h += '<div class="subclass-desc-text">'+esc(scDesc.description)+'</div></div>';
            }
          }
        }
        h += '</div>';
      }

      h += '</div></div></div>';
    });
    h += '</div>';

    if (state.classes.length < 2) {
      var remaining = sortAlpha.filter(function(c){ return sel.indexOf(c.id)===-1; });
      if (remaining.length > 0) {
        h += '<div class="add-class-section">';
        h += '<button class="btn btn-add-class" id="btn-add-class" onclick="toggleClassPicker()">+ Add Another Class</button>';
        h += '<div class="class-picker" id="class-picker" style="display:none">';
        h += '<div class="picker-header">';
        h += '<div class="picker-search"><input class="form-input picker-search-input" type="text" placeholder="Search classes..." oninput="filterClassPicker(this.value)"></div>';
        h += '<button class="btn btn-sm btn-danger" onclick="toggleClassPicker()">Cancel</button>';
        h += '</div>';
        h += '<div class="picker-list" id="picker-list">';
        remaining.forEach(function(c){
          h += '<div class="picker-row" onclick="openClassPopup(\''+c.id+'\')">';
          h += '<div class="picker-row-icon"><img src="/static/img/classes/'+c.id+'.svg" alt="'+esc(c.name)+'" onerror="this.style.display=\'none\'"></div>';
          h += '<div class="picker-row-info">';
          h += '<div class="picker-row-name">'+esc(c.name)+'</div>';
          h += '<div class="picker-row-meta">Player\'s Handbook &middot; HD d'+CLASS_FEATURES[c.id].hitDie+' &middot; '+(c.spellcaster?'Spellcaster':'Martial')+'</div>';
          h += '</div>';
          h += '<div class="picker-row-arrow">&#10132;</div>';
          h += '</div>';
        });
        h += '</div></div>';
      }
    }
  }

  h += '<div class="actions"><button class="btn" onclick="goTo(1)">Back</button>';
  h += '<button class="btn btn-primary" onclick="confirmClass()"'+(state.classes.length===0?' disabled':'')+'>Next</button></div>';
  h += '</div>';
  main.innerHTML = h;
}

function setSubclass(idx, val) {
  state.classes[idx].subclassId = val || null;
  renderClass(getMain());
}

function toggleClassPicker() {
  var picker = document.getElementById('class-picker');
  var btn = document.getElementById('btn-add-class');
  if (!picker) return;
  var visible = picker.style.display !== 'none';
  picker.style.display = visible ? 'none' : 'block';
  if (btn) btn.style.display = visible ? '' : 'none';
}

function filterClassPicker(q) {
  q = q.toLowerCase();
  var rows = document.querySelectorAll('#picker-list .picker-row');
  rows.forEach(function(r){
    var name = r.querySelector('.picker-row-name').textContent.toLowerCase();
    r.style.display = name.indexOf(q) !== -1 ? '' : 'none';
  });
}

function openClassPopup(classId) {
  var c = content.classes.find(function(x){return x.id===classId;});
  if (!c) return;
  var cf = CLASS_FEATURES[classId];
  var existing = state.classes.find(function(x){return x.id===classId;});
  var lvl = existing ? existing.level : 1;
  var subLvl = getSubclassLevel(classId);
  var conMod = state.abilities.CON ? abMod(state.abilities.CON) : 0;

  var h = '<div class="class-popup-overlay" onclick="closeClassPopup(event)">';
  h += '<div class="class-popup">';
  h += '<div class="popup-hdr">';
  h += '<div class="popup-class-name">'+esc(c.name)+'</div>';
  h += '<div class="popup-class-sub">';
  h += 'Player\'s Handbook &middot; HD d'+cf.hitDie+' &middot; Saves '+c.savingThrows.join(', ');
  if (c.spellcaster) h += ' &middot; <span class="tag tag-blue" style="margin-left:4px">Spellcaster</span>';
  h += '</div>';
  h += '<button class="popup-close" onclick="closeClassPopup(event)">&#10005;</button>';
  h += '</div>';

  h += '<div class="popup-body" id="popup-body">';

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Primary Abilities</h3>';
  h += '<div class="popup-tags">';
  (c.primaryAbility||[]).forEach(function(a){ h += '<span class="tag tag-blue">'+abName(a)+'</span>'; });
  h += '<span class="tag tag-gold">d'+cf.hitDie+'</span>';
  h += '</div></div>';

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Proficiencies</h3>';
  h += '<div class="popup-profs">';
  h += '<div class="popup-prof"><span class="prof-label">Skills:</span> '+c.skillChoices+' from '+c.skillPool.map(skillLabel).join(', ')+'</div>';
  h += '</div></div>';

  if (c.subClasses && c.subClasses.length) {
    h += '<div class="popup-section">';
    h += '<h3 class="popup-section-title">Subclasses (available at level '+subLvl+')</h3>';
    h += '<div class="popup-subclasses">';
    c.subClasses.forEach(function(sc){
      h += '<div class="popup-subclass">';
      h += '<div class="popup-subclass-name">'+esc(sc.name)+'</div>';
      h += '<div class="popup-subclass-desc">'+esc(sc.description)+'</div>';
      h += '</div>';
    });
    h += '</div></div>';
  }

  h += '<div class="popup-section" id="popup-features-section">';
  h += '<h3 class="popup-section-title">Class Features by Level</h3>';
  h += '<div class="popup-levels" id="popup-features-list">';
  h += buildPopupFeaturesList(cf, lvl);
  h += '</div></div>';

  h += '</div>';

  h += '<div class="popup-footer">';
  h += '<div class="popup-footer-left">';
  h += '<div class="popup-level-row">';
  h += '<label class="form-label">Level</label>';
  h += '<select class="form-input popup-level-select" id="popup-level-select">';
  for (var l=1;l<=20;l++){ h += '<option value="'+l+'"'+(l===lvl?' selected':'')+'>'+l+'</option>'; }
  h += '</select></div>';
  h += '<div class="popup-hp-preview">HP: <strong id="popup-hp-val">'+calcHP(classId, lvl, conMod, cf.hitDie)+'</strong></div>';
  h += '</div>';
  if (existing) {
    h += '<button class="btn btn-primary" onclick="confirmClassPopup(\''+classId+'\')">Update Class</button>';
  } else {
    h += '<button class="btn btn-primary" onclick="confirmClassPopup(\''+classId+'\')">Confirm & Add Class</button>';
  }
  h += '</div>';

  h += '</div></div>';

  var overlay = document.createElement('div');
  overlay.id = 'class-popup-container';
  overlay.innerHTML = h;
  document.body.appendChild(overlay);
  setTimeout(function(){
    document.querySelector('.class-popup').classList.add('open');
    var sel = document.getElementById('popup-level-select');
    if (sel) sel.addEventListener('change', function(){
      var v = parseInt(this.value);
      var hp = calcHP(classId, v, conMod, cf.hitDie);
      var hpEl = document.getElementById('popup-hp-val');
      if (hpEl) hpEl.textContent = hp;
      var featList = document.getElementById('popup-features-list');
      if (featList) featList.innerHTML = buildPopupFeaturesList(cf, v);
    });
  }, 10);
}

function buildPopupFeaturesList(cf, lvl) {
  if (!cf) return '';
  var h = '';
  cf.features.forEach(function(f){
    var unlocked = f.level <= lvl;
    var isSub = f.subclass;
    h += '<div class="popup-level-group'+(unlocked?' unlocked':' locked')+(isSub?' subclass-feature':'')+'">';
    h += '<div class="popup-level-hdr">Level '+f.level+'</div>';
    h += '<div class="popup-feature"><span class="popup-feat-name">'+esc(f.name)+'</span></div>';
    h += '<div class="popup-feature-desc">'+esc(f.desc)+'</div>';
    h += '</div>';
  });
  return h;
}

function closeClassPopup(e) {
  if (e && e.target && !e.target.classList.contains('class-popup-overlay') && !e.target.classList.contains('popup-close')) return;
  var container = document.getElementById('class-popup-container');
  if (container) container.remove();
}

function confirmClassPopup(classId) {
  var c = content.classes.find(function(x){return x.id===classId;});
  if (!c) return;
  var lvlEl = document.getElementById('popup-level-select');
  var lvl = parseInt(lvlEl?lvlEl.value:1);
  var existingIdx = -1;
  state.classes.forEach(function(x,i){ if(x.id===classId) existingIdx=i; });
  if (existingIdx !== -1) {
    state.classes[existingIdx].level = lvl;
  } else {
    if (state.classes.length >= 2) { alert('Max 2 classes.'); return; }
    state.classes.push({id:classId, level:lvl, subclassId:null, data:c, classTab:'features'});
  }
  closeClassPopup({target:document.querySelector('.class-popup-overlay')});
  renderClass(getMain());
}

function setClassLevel(idx, val) {
  state.classes[idx].level = parseInt(val);
  renderClass(getMain());
}

function removeClass(idx) {
  state.classes.splice(idx, 1);
  renderClass(getMain());
}

function setClassTab(idx, tab) {
  state.classes[idx].classTab = tab;
  renderClass(getMain());
}

function confirmClass() {
  if (!state.classes.length) { alert('Select a class.'); return; }
  goTo(3);
}

// ─── 3: Background ───
var BG_DETAILS = {
  acolyte: { desc:'You served the clergy of a temple, tending to sacred rites and assisting pilgrims. Your faith defines your purpose.', feature:'Magic Initiate (Cleric)', featureDesc:'You learn two Cleric cantrips and one 1st-level Cleric spell. You can cast the spell once without a spell slot, and regain the ability after a Long Rest.', personalityTraits:['I idolize a particular hero of my faith and constantly refer to that person\'s deeds.', 'I can find common ground between enemies, defusing their hostility.', 'I see omens in every event and action.', 'I am tolerant of other faiths and respect all worshipers.'], ideals:['Tradition. The ancient traditions of worship must be preserved.', 'Charity. I always try to help those in need.', 'Change. We must all embrace change.', 'Power. The strongest faiths are the ones that command obedience.'], bonds:['I would die to recover an ancient relic that was lost long ago.', 'I will do anything to protect the temple where I served.', 'I seek to preserve a sacred text that my enemies consider heretical.', 'I owe my life to the priest who took me in as a child.'], flaws:['I judge others harshly, and myself even more severely.', 'I put too much trust in authority.', 'I am inflexible in my thinking.', 'I am blind to the faults of my faith.'] },
  artisan: { desc:'You are a skilled crafter who creates goods of lasting value. Your workshop and tools are your livelihood.', feature:'Crafter', featureDesc:'You can craft items at half cost and have a network of artisans who can provide goods and services.', personalityTraits:['I believe that anything worth doing is worth doing right.', 'I am always calm, no matter how the situation looks.', 'I am obsessed with a particular type of craft.', 'I never pass up a chance to bargain.'], ideals:['Craft. My work is a reflection of who I am.', 'Commerce. The trade is all that matters.', 'Creativity. Every creation begins with an idea.', 'Community. I help my community thrive.'], bonds:['I will do anything to prove my work is the finest.', 'I need to pay off a debt to the guildmaster.', 'My tools are my most prized possession.', 'I seek to create something that will outlast me.'], flaws:['I am never satisfied with my work.', 'I am argumentative and stubborn.', 'I see only my way of doing things.', 'I am jealous of other artisans\' work.'] },
  charlatan: { desc:'You are a smooth talker and a con artist. You know how to manipulate people to get what you want.', feature:'Skilled', featureDesc:'You gain proficiency in any three skills of your choice.', personalityTraits:['I never let them see me coming.', 'I am a charming liar who always gets away.', 'I flatter and cajole to get my way.', 'I am always looking for a mark.'], ideals:['I believe that the rich deserve to lose their wealth.', 'Freedom. I believe that people should be free to do as they please.', 'Charisma. I believe that charm and deception are tools of survival.', 'Profit. I do everything for personal gain.'], bonds:['I cheat a powerful person who is hunting me.', 'I swindled a noble out of their inheritance.', 'I owe a debt to a crime lord.', 'I am searching for a person who ruined my life.'], flaws:['I have a weakness for the vices of the city.', 'I am too greedy to share my profits.', 'I am deeply in debt to someone dangerous.', 'I am overconfident in my abilities.'] },
  criminal: { desc:'You are an experienced criminal with contacts in the underworld. You know the ins and outs of illegal activities.', feature:'Alert', featureDesc:'You can\'t be surprised while conscious and have bonus to initiative.', personalityTraits:['I always have a plan for when things go wrong.', 'I am always calm, even in danger.', 'I love a good fight.', 'I am always ready to exploit others.'], ideals:['I believe that the law is for the weak.', 'Independence. I answer to no one.', 'Power. I seek to control everything around me.', 'Loyalty. I am loyal to my allies, above all else.'], bonds:['I am seeking revenge against those who wronged me.', 'I owe my freedom to someone who broke me out of prison.', 'I am hiding from the law.', 'I am loyal to a criminal organization.'], flaws:['I am violent and reckless.', 'I am deeply in debt.', 'I am addicted to a substance.', 'I am paranoid and distrustful.'] },
  entertainer: { desc:'You are a performer who thrives in the spotlight. Your art is your life, and you share it with the world.', feature:'Musician', featureDesc:'You are proficient with a musical instrument. You can use it to inspire others.', personalityTraits:['I am always ready to perform.', 'I can captivate anyone with my performance.', 'I am always looking for an audience.', 'I thrive on applause and admiration.'], ideals:['Beauty. I believe that art is the highest form of expression.', 'Creativity. I believe that art should push boundaries.', 'Passion. I put my heart into every performance.', 'Fame. I seek to be known throughout the land.'], bonds:['I seek to impress someone with my performances.', 'I owe my career to a patron who discovered me.', 'I am searching for a lost masterpiece.', 'I am haunted by a failed performance.'], flaws:['I am vain and self-absorbed.', 'I am jealous of other performers.', 'I am easily distracted by applause.', 'I am always looking for the next spotlight.'] },
  farmer: { desc:'You come from a simple life of tending the land. Your connection to nature is strong, and you know the value of hard work.', feature:'Tough', featureDesc:'Hit Point Maximum Increase. Your hit point maximum increases by an amount equal to twice your character level.', personalityTraits:['I am always ready to lend a hand.', 'I am deeply connected to the land.', 'I am practical and resourceful.', 'I am slow to trust outsiders.'], ideals:['Community. I believe in helping my neighbors.', 'Nature. I believe that the land provides for those who respect it.', 'Simplicity. I believe that a simple life is a good life.', 'Duty. I believe in fulfilling my obligations.'], bonds:['I am protecting my family\'s farm.', 'I owe a debt to the community that raised me.', 'I am seeking to restore my family\'s honor.', 'I am haunted by a past failure.'], flaws:['I am stubborn and set in my ways.', 'I am suspicious of outsiders.', 'I am quick to judge others.', 'I am slow to change.'] },
  guard: { desc:'You are a member of a local militia or city watch. You are trained to protect the innocent and uphold the law.', feature:'Alert', featureDesc:'You can\'t be surprised while conscious and have bonus to initiative.', personalityTraits:['I am always vigilant and alert.', 'I am quick to act in defense of others.', 'I am disciplined and methodical.', 'I am always ready for a fight.'], ideals:['I believe that the law must be upheld.', 'Authority. I believe in the chain of command.', 'Protection. I believe that the weak must be protected.', 'Justice. I believe in fair and equal treatment.'], bonds:['I owe my loyalty to the captain of the guard.', 'I am protecting the city from a hidden threat.', 'I am seeking justice for a wrong done to me.', 'I am haunted by a past failure.'], flaws:['I am too rigid in my thinking.', 'I am quick to judge others.', 'I am slow to trust outsiders.', 'I am always looking for a fight.'] },
  guide: { desc:'You are a skilled tracker and survivalist. You know the wilds like the back of your hand.', feature:'Magic Initiate (Druid)', featureDesc:'You learn two Druid cantrips and one 1st-level Druid spell. You can cast the spell once without a spell slot, and regain the ability after a Long Rest.', personalityTraits:['I am always ready for the unexpected.', 'I am calm and patient in the wild.', 'I am always looking for a shortcut.', 'I am always looking for a new challenge.'], ideals:['Nature. I believe that the wilds are sacred.', 'Freedom. I believe that the wilds are free for all.', 'Survival. I believe that the strongest survive.', 'Knowledge. I believe that knowledge of the wilds is power.'], bonds:['I am seeking a lost civilization in the wilds.', 'I owe my life to a companion who saved me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of nature.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new adventure.'] },
  hermit: { desc:'You have lived in seclusion, either by choice or by circumstance. Your time alone has given you insight and wisdom.', feature:'Healer', featureDesc:'You can use a healer\'s kit to restore HP to a creature.', personalityTraits:['I am always looking for a new discovery.', 'I am deeply spiritual.', 'I am always looking for a new challenge.', 'I am always looking for a new truth.'], ideals:['I believe that knowledge is power.', 'Solitude. I believe that solitude brings clarity.', 'Truth. I believe that truth is the highest virtue.', 'Enlightenment. I believe that wisdom comes from within.'], bonds:['I am seeking a lost truth.', 'I owe my life to someone who saved me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new truth.'] },
  noble: { desc:'You are a member of a noble family with a lineage of power and privilege. You carry the weight of your family name.', feature:'Skilled', featureDesc:'You gain proficiency in any three skills of your choice.', personalityTraits:['I carry myself with dignity.', 'I am accustomed to getting my way.', 'I am always looking for a way to improve my standing.', 'I am always looking for a way to help others.'], ideals:['Noblesse Oblige. I believe that nobility comes with responsibility.', 'Power. I believe that power is the key to change.', 'Tradition. I believe that tradition must be preserved.', 'Legacy. I believe that my family name must be honored.'], bonds:['I owe my loyalty to my family.', 'I am seeking to restore my family\'s honor.', 'I am haunted by a past failure.', 'I am protecting a family secret.'], flaws:['I am arrogant and entitled.', 'I am quick to judge others.', 'I am slow to trust outsiders.', 'I am always looking for a way to get ahead.'] },
  sage: { desc:'You are a scholar who has dedicated your life to the pursuit of knowledge. You have studied the arcane and the mundane.', feature:'Magic Initiate (Wizard)', featureDesc:'You learn two cantrips and one 1st-level spell from the wizard spell list.', personalityTraits:['I am always looking for a new discovery.', 'I am always looking for a new challenge.', 'I am always looking for a new truth.', 'I am always looking for a new way to help others.'], ideals:['I believe that knowledge is power.', 'Discovery. I believe that knowledge is the highest virtue.', 'Truth. I believe that truth is the highest virtue.', 'Enlightenment. I believe that wisdom comes from within.'], bonds:['I am seeking a lost truth.', 'I owe my life to someone who saved me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new truth.'] },
  sailor: { desc:'You have spent your life on the open sea. You know the ways of the wind and the waves.', feature:'Tavern Brawler', featureDesc:'You are proficient with improvised weapons and unarmed strikes.', personalityTraits:['I am always ready for a fight.', 'I am always looking for a new adventure.', 'I am always looking for a new port.', 'I am always looking for a new story.'], ideals:['I believe that the sea is the ultimate freedom.', 'Freedom. I believe that the sea is free for all.', 'Adventure. I believe that the sea is full of adventure.', 'Loyalty. I believe in loyalty to my crew.'], bonds:['I am seeking a lost treasure.', 'I owe my life to a companion who saved me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new adventure.'] },
  soldier: { desc:'You are a veteran of the battlefield. You know the ways of war and the value of discipline.', feature:'Savage Attacker', featureDesc:'Once per turn when you hit with a melee weapon attack, you can reroll the damage dice and use either result.', personalityTraits:['I am always ready for a fight.', 'I am always looking for a new challenge.', 'I am always looking for a new way to help others.', 'I am always looking for a new way to get ahead.'], ideals:['I believe that discipline is the key to victory.', 'Discipline. I believe that discipline is the key to strength.', 'Honor. I believe that honor is the key to respect.', 'Duty. I believe that duty is the key to loyalty.'], bonds:['I owe my loyalty to my unit.', 'I am seeking revenge against those who wronged me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new fight.'] },
  wayfarer: { desc:'You are a traveler who lives on the road. You know the ways of the world and the people who live in it.', feature:'Lucky', featureDesc:'When you roll a d20 for an attack, ability check, or saving throw and roll a 1, you can reroll the die and must use the new roll.', personalityTraits:['I am always ready for a new adventure.', 'I am always looking for a new port.', 'I am always looking for a new story.', 'I am always looking for a new friend.'], ideals:['I believe that the road is the ultimate freedom.', 'Freedom. I believe that the road is free for all.', 'Adventure. I believe that the road is full of adventure.', 'Loyalty. I believe in loyalty to my companions.'], bonds:['I am seeking a lost treasure.', 'I owe my life to a companion who saved me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new adventure.'] },
  scribe: { desc:'You are a meticulous record-keeper with a talent for uncovering hidden knowledge.', feature:'Skilled', featureDesc:'You gain proficiency in any three skills of your choice.', personalityTraits:['I am always looking for a new discovery.', 'I am meticulous and detail-oriented.', 'I am always looking for a new truth.', 'I am always looking for a new way to help others.'], ideals:['I believe that knowledge must be preserved.', 'Accuracy. I believe that records must be precise.', 'Truth. I believe that truth is the highest virtue.', 'Legacy. I believe that knowledge must outlast us.'], bonds:['I am seeking a lost truth.', 'I owe my life to someone who saved me.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am obsessed with trivial details.'] },
  merchant: { desc:'You are a shrewd trader who knows the value of goods and people alike.', feature:'Lucky', featureDesc:'You have 3 Luck Points. Spend one to gain Advantage on a d20 test, or impose Disadvantage on an attack roll against you. Regain all uses after a Long Rest.', personalityTraits:['I always get a fair deal.', 'I am always looking for a new opportunity.', 'I am always looking for a new way to help others.', 'I am always looking for a new way to get ahead.'], ideals:['I believe that commerce is the backbone of civilization.', 'Profit. I believe that profit is the key to success.', 'Fairness. I believe in fair trade.', 'Legacy. I believe that a good reputation is worth more than gold.'], bonds:['I owe my loyalty to my guild.', 'I am seeking a lost fortune.', 'I am haunted by a past failure.', 'I am protecting a family business.'], flaws:['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge others.', 'I am always looking for a new deal.'] }
};

function renderBackground(main) {
  var sel = state.backgroundId;
  var sortAlpha = content.backgrounds.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });

  var h = '<div class="bg-section">';
  if (sel) {
    var bg = content.backgrounds.find(function(b){return b.id===sel;});
    if (bg) {
      h += '<div class="selected-bg-row">';
      h += '<div class="selected-bg-hdr">';
      h += '<div class="selected-bg-name">'+esc(bg.name)+'</div>';
      h += '<div class="selected-bg-meta">';
      h += '<span class="tag tag-gold">Feat: '+esc(bg.feat)+'</span>';
      h += bg.skills.map(function(s){return '<span class="tag tag-blue">'+skillLabel(s)+'</span>';}).join('');
      h += '</div>';
      h += '<button class="btn btn-sm btn-danger" onclick="removeBg()">&#10005;</button>';
      h += '</div>';

      var details = BG_DETAILS[sel]||{};
      h += '<div class="selected-bg-body">';

      h += '<div class="bg-detail-section">';
      h += '<div class="bg-detail-desc">'+esc(details.desc||'')+'</div>';
      if (details.feature) {
        h += '<div class="bg-feature-box">';
        h += '<div class="bg-feature-name">'+esc(details.feature)+'</div>';
        h += '<div class="bg-feature-desc">'+esc(details.featureDesc||'')+'</div>';
        h += '</div>';
      }
      h += '</div>';

      h += '<div class="bg-personality-section">';
      h += '<h3 class="bg-section-title">Skill Proficiencies</h3>';
      h += '<p class="sec-subtitle">Background grants: '+(bg.skills||[]).map(skillLabel).join(', ')+'</p>';
      var maxSkills = 0;
      state.classes.forEach(function(c){
        if (c.data && c.data.skillChoices) maxSkills += c.data.skillChoices;
      });
      if (maxSkills === 0) maxSkills = 2;
      var bgSkillCount = bg.skills ? bg.skills.length : 0;
      var extraNeeded = Math.max(0, maxSkills - bgSkillCount);
      var userExtraCount = state.skills.filter(function(s){return (bg.skills||[]).indexOf(s)===-1;}).length;
      h += '<p class="sec-subtitle">Choose '+extraNeeded+' additional skill(s) from your class ('+userExtraCount+'/'+extraNeeded+')</p>';
      h += '<div class="skills-grid" id="bg-skills-grid"></div>';
      h += '</div>';

      h += '<div class="bg-personality-section">';
      h += '<h3 class="bg-section-title">Character Details</h3>';
      h += '<div class="bg-detail-grid">';
      h += '<div class="bg-detail-item"><label class="form-label">Alignment</label>';
      h += '<select class="form-input bg-select" onchange="state.bgAlignment=this.value">';
      ['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil'].forEach(function(a){
        h += '<option value="'+a+'"'+((state.bgAlignment||'')===a?' selected':'')+'>'+a+'</option>';
      });
      h += '</select></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Faith / Deity</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgFaith||'')+'" onchange="state.bgFaith=this.value" placeholder="e.g. Tempus, Pelor">';
      h += '</div>';
      h += '</div></div>';

      h += '<div class="bg-personality-section">';
      h += '<h3 class="bg-section-title">Personality Traits</h3>';
      h += '<div class="bg-detail-grid">';
      h += '<div class="bg-detail-item"><label class="form-label">Trait</label>';
      h += '<select class="form-input bg-select" onchange="state.bgTrait=this.value"><option value="">Choose...</option>';
      (details.personalityTraits||[]).forEach(function(t,i){
        h += '<option value="'+i+'"'+((state.bgTrait!==undefined&&state.bgTrait==i)?' selected':'')+'>'+esc(t)+'</option>';
      });
      h += '</select></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Ideal</label>';
      h += '<select class="form-input bg-select" onchange="state.bgIdeal=this.value"><option value="">Choose...</option>';
      (details.ideals||[]).forEach(function(t,i){
        h += '<option value="'+i+'"'+((state.bgIdeal!==undefined&&state.bgIdeal==i)?' selected':'')+'>'+esc(t)+'</option>';
      });
      h += '</select></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Bond</label>';
      h += '<select class="form-input bg-select" onchange="state.bgBond=this.value"><option value="">Choose...</option>';
      (details.bonds||[]).forEach(function(t,i){
        h += '<option value="'+i+'"'+((state.bgBond!==undefined&&state.bgBond==i)?' selected':'')+'>'+esc(t)+'</option>';
      });
      h += '</select></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Flaw</label>';
      h += '<select class="form-input bg-select" onchange="state.bgFlaw=this.value"><option value="">Choose...</option>';
      (details.flaws||[]).forEach(function(t,i){
        h += '<option value="'+i+'"'+((state.bgFlaw!==undefined&&state.bgFlaw==i)?' selected':'')+'>'+esc(t)+'</option>';
      });
      h += '</select></div>';
      h += '</div></div>';

      h += '<div class="bg-personality-section">';
      h += '<h3 class="bg-section-title">Physical Characteristics</h3>';
      h += '<div class="bg-detail-grid">';
      h += '<div class="bg-detail-item"><label class="form-label">Age</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgAge||'')+'" onchange="state.bgAge=this.value" placeholder="e.g. 28"></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Height</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgHeight||'')+'" onchange="state.bgHeight=this.value" placeholder="e.g. 5\'10&quot;"></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Weight</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgWeight||'')+'" onchange="state.bgWeight=this.value" placeholder="e.g. 165 lbs"></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Eyes</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgEyes||'')+'" onchange="state.bgEyes=this.value" placeholder="e.g. Green"></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Skin</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgSkin||'')+'" onchange="state.bgSkin=this.value" placeholder="e.g. Tan"></div>';
      h += '<div class="bg-detail-item"><label class="form-label">Hair</label>';
      h += '<input class="form-input" type="text" value="'+esc(state.bgHair||'')+'" onchange="state.bgHair=this.value" placeholder="e.g. Brown"></div>';
      h += '</div></div>';

      h += '<div class="bg-personality-section">';
      h += '<h3 class="bg-section-title">Notes</h3>';
      h += '<textarea class="form-input bg-notes" rows="4" onchange="state.bgNotes=this.value" placeholder="Additional notes about your character...">'+esc(state.bgNotes||'')+'</textarea>';
      h += '</div>';

      h += '</div></div>';
    }
  } else {
    h += '<h2 class="sec-title">Choose Background</h2>';
    h += '<div class="class-picker" id="bg-picker">';
    h += '<div class="picker-header">';
    h += '<div class="picker-search"><input class="form-input picker-search-input" type="text" placeholder="Search backgrounds..." oninput="filterBgPicker(this.value)"></div>';
    h += '</div>';
    h += '<div class="picker-list" id="bg-picker-list">';
    sortAlpha.forEach(function(b){
      var details = BG_DETAILS[b.id]||{};
      h += '<div class="picker-row" onclick="openBgPopup(\''+b.id+'\')">';
      h += '<div class="picker-row-icon">&#128220;</div>';
      h += '<div class="picker-row-info">';
      h += '<div class="picker-row-name">'+esc(b.name)+'</div>';
      h += '<div class="picker-row-meta">Feat: '+esc(b.feat)+' &middot; '+b.skills.map(skillLabel).join(', ')+'</div>';
      h += '</div>';
      h += '<div class="picker-row-arrow">&#10132;</div>';
      h += '</div>';
    });
    h += '</div></div>';
  }

  h += '<div class="actions"><button class="btn" onclick="goTo(2)">Back</button>';
  h += '<button class="btn btn-primary" onclick="confirmBg()"'+(!sel?' disabled':'')+'>Next</button></div>';
  h += '</div>';
  main.innerHTML = h;
  if (sel) renderBgSkillsGrid();
}

function filterBgPicker(q) {
  q = q.toLowerCase();
  var rows = document.querySelectorAll('#bg-picker-list .picker-row');
  rows.forEach(function(r){
    var name = r.querySelector('.picker-row-name').textContent.toLowerCase();
    r.style.display = name.indexOf(q) !== -1 ? '' : 'none';
  });
}

function openBgPopup(bgId) {
  var b = content.backgrounds.find(function(x){return x.id===bgId;});
  if (!b) return;
  var details = BG_DETAILS[bgId]||{};

  var h = '<div class="class-popup-overlay" onclick="closeBgPopup(event)">';
  h += '<div class="class-popup">';
  h += '<div class="popup-hdr">';
  h += '<div class="popup-class-name">'+esc(b.name)+'</div>';
  h += '<div class="popup-class-sub">Player\'s Handbook Background</div>';
  h += '<button class="popup-close" onclick="closeBgPopup(event)">&#10005;</button>';
  h += '</div>';

  h += '<div class="popup-body">';

  h += '<div class="popup-section">';
  h += '<p class="popup-bg-desc">'+esc(details.desc||'')+'</p>';
  h += '</div>';

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Skill Proficiencies</h3>';
  h += '<div class="popup-tags">';
  b.skills.forEach(function(s){ h += '<span class="tag tag-blue">'+skillLabel(s)+'</span>'; });
  h += '</div></div>';

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Tool Proficiencies</h3>';
  h += '<div class="popup-tags">';
  var bgYaml = {acolyte:'Calligrapher\'s Supplies',artisan:'Artisan\'s Tools',charlatan:'Forgery Kit',criminal:'Thieves\' Tools',entertainer:'Musical Instrument',farmer:'Farming Tools',guard:'Gaming Set',guide:'Cartographer\'s Tools',hermit:'Herbalism Kit',merchant:'Navigator\'s Tools',noble:'Gaming Set',sage:'Herbalism Kit',scribe:'Calligrapher\'s Supplies',sailor:'Navigator\'s Tools',soldier:'Gaming Set',wayfarer:'Thieves\' Tools'};
  h += '<span class="tag tag-gold">'+(bgYaml[b.id]||'None')+'</span>';
  h += '</div></div>';

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Feat</h3>';
  h += '<div class="popup-tags"><span class="tag tag-gold">'+esc(b.feat)+'</span></div>';
  h += '</div>';

  if (details.feature) {
    h += '<div class="popup-section">';
    h += '<h3 class="popup-section-title">Background Feature</h3>';
    h += '<div class="popup-bg-feature">';
    h += '<div class="popup-feat-name">'+esc(details.feature)+'</div>';
    h += '<div class="popup-feature-desc">'+esc(details.featureDesc||'')+'</div>';
    h += '</div></div>';
  }

  h += '</div>';

  h += '<div class="popup-footer">';
  h += '<span></span>';
  h += '<button class="btn btn-primary" onclick="confirmBgPopup(\''+bgId+'\')">Confirm & Select</button>';
  h += '</div>';

  h += '</div></div>';

  var overlay = document.createElement('div');
  overlay.id = 'bg-popup-container';
  overlay.innerHTML = h;
  document.body.appendChild(overlay);
  setTimeout(function(){ document.querySelector('.class-popup').classList.add('open'); }, 10);
}

function closeBgPopup(e) {
  if (e && e.target && !e.target.classList.contains('class-popup-overlay') && !e.target.classList.contains('popup-close')) return;
  var container = document.getElementById('bg-popup-container');
  if (container) container.remove();
}

function confirmBgPopup(bgId) {
  var b = content.backgrounds.find(function(x){return x.id===bgId;});
  if (!b) return;
  state.backgroundId = bgId;
  state.backgroundData = b;
  closeBgPopup({target:document.querySelector('.class-popup-overlay')});
  renderBackground(getMain());
}

var CLASS_RECOMMENDED_SKILLS = {
  barbarian: ['athletics','intimidation','survival','animal-handling'],
  bard: ['persuasion','performance','deception','insight'],
  cleric: ['medicine','insight','religion','persuasion'],
  druid: ['nature','survival','animal-handling','insight'],
  fighter: ['athletics','intimidation','perception','survival'],
  monk: ['acrobatics','athletics','stealth','insight'],
  paladin: ['athletics','persuasion','insight','medicine'],
  ranger: ['survival','animal-handling','perception','stealth'],
  rogue: ['stealth','sleight-of-hand','deception','investigation'],
  sorcerer: ['arcana','deception','persuasion','intimidation'],
  warlock: ['arcana','deception','intimidation','investigation'],
  wizard: ['arcana','history','investigation','insight']
};

function renderBgSkillsGrid() {
  var grid = document.getElementById('bg-skills-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var allSkills = [
    {id:'acrobatics',ab:'DEX'},{id:'animal-handling',ab:'WIS'},{id:'arcana',ab:'INT'},{id:'athletics',ab:'STR'},
    {id:'deception',ab:'CHA'},{id:'history',ab:'INT'},{id:'insight',ab:'WIS'},{id:'intimidation',ab:'CHA'},
    {id:'investigation',ab:'INT'},{id:'medicine',ab:'WIS'},{id:'nature',ab:'INT'},{id:'perception',ab:'WIS'},
    {id:'performance',ab:'CHA'},{id:'persuasion',ab:'CHA'},{id:'religion',ab:'INT'},
    {id:'sleight-of-hand',ab:'DEX'},{id:'stealth',ab:'DEX'},{id:'survival',ab:'WIS'}
  ];
  var bg = content.backgrounds.find(function(b){return b.id===state.backgroundId;});
  var bgSkills = (bg && bg.skills) ? bg.skills : [];
  var maxSkills = 0;
  state.classes.forEach(function(c){
    if (c.data && c.data.skillChoices) maxSkills += c.data.skillChoices;
  });
  if (maxSkills === 0) maxSkills = 2;
  var extraNeeded = Math.max(0, maxSkills - bgSkills.length);

  // Build recommended list from all classes
  var recommended = {};
  state.classes.forEach(function(c){
    var rec = CLASS_RECOMMENDED_SKILLS[c.id];
    if (rec) rec.forEach(function(s){ recommended[s] = true; });
  });

  allSkills.forEach(function(sk){
    var isBgSkill = bgSkills.indexOf(sk.id) !== -1;
    var isSelected = state.skills.indexOf(sk.id) !== -1;
    var isRecommended = recommended[sk.id] && !isBgSkill;
    var mod = abMod(state.abilities[sk.ab]||10);
    var row = document.createElement('div');
    row.className = 'skill-row' + (isSelected?' selected':'') + (isBgSkill?' bg-granted':'');
    var checkmark = isBgSkill ? '✓' : isSelected ? '✓' : '';
    var badge = isRecommended ? ' <span class="skill-rec-badge">Recommended</span>' : '';
    var source = isBgSkill ? ' <span class="skill-source">(background)</span>' : '';
    row.innerHTML = '<div class="skill-pick">'+checkmark+'</div>'
      + '<div class="skill-name">'+skillLabel(sk.id)+source+badge+'</div>'
      + '<div class="skill-ab">'+sk.ab+'</div>'
      + '<div class="skill-mod">'+fmtMod(mod+2)+'</div>';
    if (!isBgSkill) {
      row.onclick = function(){
        if (isSelected) {
          state.skills = state.skills.filter(function(s){return s!==sk.id;});
        } else {
          var currentExtra = state.skills.filter(function(s){return bgSkills.indexOf(s)===-1;}).length;
          if (currentExtra >= extraNeeded) { alert('You can only pick '+extraNeeded+' additional skills.'); return; }
          state.skills.push(sk.id);
        }
        renderBgSkillsGrid();
      };
    }
    grid.appendChild(row);
  });
}

function removeBg() {
  state.backgroundId = null;
  state.backgroundData = null;
  renderBackground(getMain());
}

function confirmBg() {
  if (!state.backgroundId) return;
  goTo(4);
}

// ─── 4: Species ───
var SPECIES_TRAITS = {
  aasimar: { desc:'Aasimar bear the touch of the Upper Planes in their blood. They are descendants of celestial beings and carry a spark of divine light.', traits:['Healing Hands (Touch to heal HP equal to proficiency bonus, 1/Long Rest)','Light Bearer (You can cast the Light cantrip)','Celestial Resistance (Resistance to radiant damage)','Celestial Revelation (Transform for 1 minute: Necrotic Shroud, Radiant Consumption, or Heavenly Wings)'], languages:['Common','Celestial'], variants:{protector:'Protector: Gain radiant wings for flight (30ft, 1 minute, proficiency bonus/Long Rest).',scourge:'Scourge: Searing Burst deals 2d6+CON radiant damage in 5ft (proficiency bonus/Long Rest).'} },
  dragonborn: { desc:'Dragonborn combine the best qualities of dragons and humanoids. They are proud, honorable warriors who value clan above all.', traits:['Breath Weapon (15ft cone or 30ft line, dealing acid/cold/fire/lightning/poison/thunder damage, CON save)','Damage Resistance (Resistance to the damage type of your breath weapon)','Ancestry (Choose chromatic, metallic, or gem dragon ancestry)'], languages:['Common','Draconic'], variants:{chromatic:'Chromatic: Fear Bolt (2d8 psychic damage, WIS save or frightened, proficiency bonus/Long Rest).',metallic:'Metallic: Metallic Breath Weapon (5ft cone, enemy is incapacitated for 1 minute, CON save, 1/Long Rest).',gem:'Gem: Psionic Mind (Send telepathic messages up to 30ft, no action required).'} },
  dwarf: { desc:'Dwarves are stout and hardy, delving deep into the earth. They are known for their craftsmanship, resilience, and love of stone.', traits:['Darkvision 60ft (See in dim light as bright light, darkness as dim light)','Dwarven Resilience (Advantage on saves vs. poison, Resistance to poison damage)','Stonecunning (Double proficiency on History checks related to stonework)','Tool Proficiency (Choose one: Smith\'s, Brewer\'s, or Mason\'s supplies)'], languages:['Common','Dwarvish'], variants:{hill:'Hill Dwarf: +1 HP per level.',mountain:'Mountain Dwarf: +2 STR and CON, proficiency with medium armor, and double speed in medium armor.'} },
  elf: { desc:'Elves are graceful and long-lived, with a deep connection to nature and magic. They are divided into many subraces with unique traits.', traits:['Darkvision 60ft (See in dim light as bright light, darkness as dim light)','Fey Ancestry (Advantage on saves vs. charmed, immune to magical sleep)','Trance (4-hour meditation instead of 8-hour sleep)','Keen Senses (Proficiency in Perception)'], languages:['Common','Elvish'], variants:{high:'High Elf: Know one wizard cantrip (INT) and learn one extra language.',wood:'Wood Elf: 35ft speed, can attempt to Hide when lightly obscured by natural phenomena.',drow:'Drow: Superior Darkvision 120ft, Dancing Lights cantrip (CHA), and Faerie Fire (1/Long Rest).'} },
  gnome: { desc:'Gnomes are curious and inventive, with an irrepressible sense of wonder. They are quick-witted and adaptable.', traits:['Darkvision 60ft (See in dim light as bright light, darkness as dim light)','Gnomish Cunning (Advantage on INT, WIS, CHA saves vs. magic)'], languages:['Common','Gnomish'], variants:{rock:'Rock Gnome: Artificer\'s Lore (Double proficiency on History checks for magic items and alchemical objects).',forest:'Forest Gnome: Speak with Small Beasts (Communicate simple ideas with Small or smaller animals).'} },
  goliath: { desc:'Goliaths are massive and athletic, standing 7-8 feet tall. They live for competition and glory, valuing strength above all.', traits:['Large Size (Count as one size larger for carrying capacity and grapple)','Natural Athlete (Proficiency in Athletics)','Stone\'s Endurance (Reaction: reduce damage by 1d12+CON mod, 1/Short Rest)'], languages:['Common','Giant'], variants:{cloud:'Cloud Goliath: Light on Your Feet (Disengage as bonus action, proficiency bonus/Short Rest).',fire:'Fire Goliath: Fire Damage (Melee attacks deal extra 1d6 fire damage).',frost:'Frost Goliath: Cold Resistance (Resistance to cold damage, bonus on cold damage saves).',hill:'Hill Goliath: Iron Will (Advantage on saves vs. frightened).',stone:'Stone Goliath: Stone Power (Reduce damage by 1d6 as reaction, proficiency bonus/Short Rest).',storm:'Storm Goliath: Lightning and Thunder (Resistance to lightning and thunder damage).'} },
  halfling: { desc:'Halflings are small, nimble folk who love comfort and community. They are lucky and resourceful.', traits:['Lucky (Reroll a nat 1 on attack, ability check, or save)','Brave (Advantage on saves vs. frightened)','Halfling Nimbleness (Move through the space of larger creatures)','Naturally Stealthy (Can Hide behind creatures one size larger)'], languages:['Common','Halfling'], variants:{lightfoot:'Lightfoot Halfling: Naturally Stealthy (Can Hide behind creatures one size larger).',stout:'Stout Halfling: Stout Resilience (Advantage on saves vs. poison, Resistance to poison damage).'} },
  human: { desc:'Humans are the most adaptable and ambitious of all races. They live short lives but accomplish great things.', traits:['Resourceful (Proficiency in one skill of your choice)','Versatile (Increase all ability scores by 1, or one by 2 and one by 1)','Ambitious (Gain one feat at level 1)'], languages:['Common','One extra language'] },
  orc: { desc:'Orcs are fierce warriors with a primal connection to Gruumsh. They are strong, enduring, and unafraid of battle.', traits:['Darkvision 60ft (See in dim light as bright light, darkness as dim light)','Powerful Build (Count as one size larger for carrying capacity and grapple)','Menacing (Proficiency in Intimidation)','Relentless Endurance (At 0 HP, drop to 1 HP instead, 1/Long Rest)'], languages:['Common','Orc'] },
  tiefling: { desc:'Tieflings are descendants of devils, marked by their infernal bloodline. They are often mistrusted but fiercely loyal.', traits:['Darkvision 60ft (See in dim light as bright light, darkness as dim light)','Infernal Resistance (Resistance to fire damage)','Legacy (Choose one: Devil\'s Tongue, Fiendish Legacy, or Legacy of Avernus)'], languages:['Common','Infernal'], variants:{abyssal:'Abyssal Tiefling: Demonic Power (Cast Hellish Rebuke 1/Long Rest, gain resistance to cold damage).',chthonic:'Cthonic Tiefling: Earth Connection (Burrow speed 15ft, can cast Speak with Dead 1/Long Rest).'} }
};

function calcSpeciesHP(spId) {
  if (spId === 'dwarf') return 1;
  return 0;
}

function renderSpecies(main) {
  var sel = state.speciesId;
  var sortAlpha = content.species.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });

  var h = '<div class="species-section">';
  if (sel) {
    var sp = content.species.find(function(s){return s.id===sel;});
    if (sp) {
      var traits = SPECIES_TRAITS[sel]||{};
      h += '<div class="selected-species-row">';
      h += '<div class="selected-species-hdr">';
      h += '<div class="selected-species-name">'+esc(sp.name)+'</div>';
      h += '<div class="selected-species-meta">';
      h += '<span class="tag tag-gold">'+esc(sp.size)+'</span>';
      h += '<span class="tag tag-green">'+sp.speed+' ft</span>';
      if (sp.variants && sp.variants.length) h += '<span class="tag tag-blue">'+sp.variants.length+' variants</span>';
      h += '</div>';
      h += '<button class="btn btn-sm btn-danger" onclick="removeSpecies()">&#10005;</button>';
      h += '</div>';

      h += '<div class="selected-species-body">';

      h += '<div class="species-detail-desc">'+esc(traits.desc||'')+'</div>';

      if (sp.variants && sp.variants.length) {
        h += '<div class="species-variant-section">';
        h += '<label class="form-label">Variant / Subspecies</label>';
        h += '<select class="form-input species-select" onchange="setSpeciesVariant(this.value)">';
        h += '<option value="">Base '+esc(sp.name)+'</option>';
        sp.variants.forEach(function(v){
          h += '<option value="'+v.id+'"'+(state.speciesVariant===v.id?' selected':'')+'>'+esc(v.name)+'</option>';
        });
        h += '</select>';
        if (state.speciesVariant) {
          var variantDesc = '';
          var spTraits = SPECIES_TRAITS[sel];
          if (spTraits && spTraits.variants && spTraits.variants[state.speciesVariant]) {
            variantDesc = spTraits.variants[state.speciesVariant];
          }
          if (variantDesc) h += '<div class="species-variant-desc">'+esc(variantDesc)+'</div>';
        }
        h += '</div>';
      }

      h += '<div class="species-traits-section">';
      h += '<h3 class="bg-section-title">Species Traits</h3>';
      h += '<div class="species-traits-list">';
      (traits.traits||[]).forEach(function(t){
        h += '<div class="species-trait">'+esc(t)+'</div>';
      });
      h += '</div></div>';

      h += '<div class="species-traits-section">';
      h += '<h3 class="bg-section-title">Languages</h3>';
      h += '<div class="popup-tags">';
      (traits.languages||[]).forEach(function(l){
        h += '<span class="tag tag-blue">'+esc(l)+'</span>';
      });
      h += '</div></div>';

      h += '</div></div>';
    }

    h += '<div class="species-hybrid-section">';
    h += '<h3 class="bg-section-title" style="margin-top:20px">Hybrid / Half-Blood</h3>';
    h += '<p class="sec-subtitle">5.5e allows half-bloods between any two species. Your main species determines your core traits.</p>';
    if (!state.speciesHybrid) {
      h += '<button class="btn btn-add-class" onclick="toggleHybridPicker()">+ Add Second Species (Hybrid)</button>';
    } else {
      var hybridSp = content.species.find(function(s){return s.id===state.speciesHybrid;});
      if (hybridSp) {
        h += '<div class="selected-species-row">';
        h += '<div class="selected-species-hdr">';
        h += '<div class="selected-species-name">Half-'+esc(hybridSp.name)+'</div>';
        h += '<div class="selected-species-meta"><span class="tag tag-gold">'+esc(hybridSp.size)+'</span></div>';
        h += '<button class="btn btn-sm btn-danger" onclick="removeHybrid()">&#10005;</button>';
        h += '</div>';
        h += '<div class="selected-species-body">';
        h += '<div class="species-detail-desc">Inherits traits from '+esc(hybridSp.name)+'. Your primary species provides core traits; this adds flavor and secondary benefits.</div>';
        h += '</div></div>';
      }
      h += '<button class="btn btn-sm" onclick="toggleHybridPicker()">Change</button>';
    }
    h += '<div class="class-picker" id="hybrid-picker" style="display:none">';
    h += '<div class="picker-header">';
    h += '<div class="picker-search"><input class="form-input picker-search-input" type="text" placeholder="Search species..." oninput="filterHybridPicker(this.value)"></div>';
    h += '<button class="btn btn-sm btn-danger" onclick="toggleHybridPicker()">Cancel</button>';
    h += '</div>';
    h += '<div class="picker-list" id="hybrid-picker-list">';
    sortAlpha.forEach(function(s){
      if (s.id === sel) return;
      h += '<div class="picker-row" onclick="selectHybrid(\''+s.id+'\')">';
      h += '<div class="picker-row-icon"><img src="/static/img/species/'+s.id+'.webp" alt="'+esc(s.name)+'" onerror="this.style.display=\'none\'"></div>';
      h += '<div class="picker-row-info">';
      h += '<div class="picker-row-name">'+esc(s.name)+'</div>';
      h += '<div class="picker-row-meta">'+esc(s.size)+' &middot; '+s.speed+' ft</div>';
      h += '</div>';
      h += '<div class="picker-row-arrow">&#10132;</div>';
      h += '</div>';
    });
    h += '</div></div>';
    h += '</div>';

  } else {
    h += '<h2 class="sec-title">Choose Species</h2>';
    h += '<div class="class-picker" id="species-picker">';
    h += '<div class="picker-header">';
    h += '<div class="picker-search"><input class="form-input picker-search-input" type="text" placeholder="Search species..." oninput="filterSpeciesPicker(this.value)"></div>';
    h += '</div>';
    h += '<div class="picker-list" id="species-picker-list">';
    sortAlpha.forEach(function(sp){
      var traits = SPECIES_TRAITS[sp.id]||{};
      h += '<div class="picker-row" onclick="openSpeciesPopup(\''+sp.id+'\')">';
      h += '<div class="picker-row-icon"><img src="/static/img/species/'+sp.id+'.webp" alt="'+esc(sp.name)+'" onerror="this.style.display=\'none\'"></div>';
      h += '<div class="picker-row-info">';
      h += '<div class="picker-row-name">'+esc(sp.name)+'</div>';
      h += '<div class="picker-row-meta">'+esc(sp.size)+' &middot; '+sp.speed+' ft &middot; '+(sp.variants&&sp.variants.length?sp.variants.length+' variants':'No variants')+'</div>';
      h += '</div>';
      h += '<div class="picker-row-arrow">&#10132;</div>';
      h += '</div>';
    });
    h += '</div></div>';
  }

  h += '<div class="actions"><button class="btn" onclick="goTo(3)">Back</button>';
  h += '<button class="btn btn-primary" onclick="confirmSpecies()"'+(!sel?' disabled':'')+'>Next</button></div>';
  h += '</div>';
  main.innerHTML = h;
}

function filterSpeciesPicker(q) {
  q = q.toLowerCase();
  var rows = document.querySelectorAll('#species-picker-list .picker-row');
  rows.forEach(function(r){
    var name = r.querySelector('.picker-row-name').textContent.toLowerCase();
    r.style.display = name.indexOf(q) !== -1 ? '' : 'none';
  });
}

function openSpeciesPopup(spId) {
  var sp = content.species.find(function(x){return x.id===spId;});
  if (!sp) return;
  var traits = SPECIES_TRAITS[spId]||{};

  var h = '<div class="class-popup-overlay" onclick="closeSpeciesPopup(event)">';
  h += '<div class="class-popup">';
  h += '<div class="popup-hdr">';
  h += '<div class="popup-class-name">'+esc(sp.name)+'</div>';
  h += '<div class="popup-class-sub">Player\'s Handbook Species &middot; '+esc(sp.size)+' &middot; '+sp.speed+' ft</div>';
  h += '<button class="popup-close" onclick="closeSpeciesPopup(event)">&#10005;</button>';
  h += '</div>';

  h += '<div class="popup-body">';

  h += '<div class="popup-section">';
  h += '<p class="popup-bg-desc">'+esc(traits.desc||'')+'</p>';
  h += '</div>';

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Species Traits</h3>';
  h += '<div class="species-traits-list">';
  (traits.traits||[]).forEach(function(t){
    h += '<div class="species-trait">'+esc(t)+'</div>';
  });
  h += '</div></div>';

  if (sp.variants && sp.variants.length) {
    h += '<div class="popup-section">';
    h += '<h3 class="popup-section-title">Variants</h3>';
    h += '<div class="popup-subclasses">';
    sp.variants.forEach(function(v){
      h += '<div class="popup-subclass">';
      h += '<div class="popup-subclass-name">'+esc(v.name)+'</div>';
      h += '</div>';
    });
    h += '</div></div>';
  }

  h += '<div class="popup-section">';
  h += '<h3 class="popup-section-title">Languages</h3>';
  h += '<div class="popup-tags">';
  (traits.languages||[]).forEach(function(l){
    h += '<span class="tag tag-blue">'+esc(l)+'</span>';
  });
  h += '</div></div>';

  h += '</div>';

  h += '<div class="popup-footer">';
  h += '<span></span>';
  h += '<button class="btn btn-primary" onclick="confirmSpeciesPopup(\''+spId+'\')">Confirm & Select</button>';
  h += '</div>';

  h += '</div></div>';

  var overlay = document.createElement('div');
  overlay.id = 'species-popup-container';
  overlay.innerHTML = h;
  document.body.appendChild(overlay);
  setTimeout(function(){ document.querySelector('.class-popup').classList.add('open'); }, 10);
}

function closeSpeciesPopup(e) {
  if (e && e.target && !e.target.classList.contains('class-popup-overlay') && !e.target.classList.contains('popup-close')) return;
  var container = document.getElementById('species-popup-container');
  if (container) container.remove();
}

function confirmSpeciesPopup(spId) {
  var sp = content.species.find(function(x){return x.id===spId;});
  if (!sp) return;
  state.speciesId = spId;
  state.speciesVariant = null;
  closeSpeciesPopup({target:document.querySelector('.class-popup-overlay')});
  renderSpecies(getMain());
}

function setSpeciesVariant(val) {
  state.speciesVariant = val || null;
  renderSpecies(getMain());
}

function removeSpecies() {
  state.speciesId = null;
  state.speciesVariant = null;
  state.speciesHybrid = null;
  renderSpecies(getMain());
}

function toggleHybridPicker() {
  var picker = document.getElementById('hybrid-picker');
  if (!picker) return;
  picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

function filterHybridPicker(q) {
  q = q.toLowerCase();
  var rows = document.querySelectorAll('#hybrid-picker-list .picker-row');
  rows.forEach(function(r){
    var name = r.querySelector('.picker-row-name').textContent.toLowerCase();
    r.style.display = name.indexOf(q) !== -1 ? '' : 'none';
  });
}

function selectHybrid(spId) {
  state.speciesHybrid = spId;
  toggleHybridPicker();
  renderSpecies(getMain());
}

function removeHybrid() {
  state.speciesHybrid = null;
  renderSpecies(getMain());
}

function confirmSpecies() {
  if (!state.speciesId) return;
  goTo(5);
}

// ─── 5: Abilities ───
function renderAbilities(main) {
  var methods = [
    {id:'standard-array',label:'Standard Array',desc:'Assign 15, 14, 13, 12, 10, 8'},
    {id:'roll',label:'Roll 4d6',desc:'Roll 4d6, drop lowest'},
    {id:'point-buy',label:'Point Buy',desc:'27 points to spend'}
  ];
  var h = '<div class="abilities-section">';
  h += '<h2 class="sec-title">Ability Scores</h2>';

  h += '<div class="method-tabs">';
  methods.forEach(function(m){
    h += '<div class="method-tab'+(state.abilityMethod===m.id?' active':'')+'" onclick="setMethod(\''+m.id+'\')">';
    h += '<div class="method-name">'+m.label+'</div>';
    h += '<div class="method-desc">'+m.desc+'</div>';
    h += '</div>';
  });
  h += '</div>';

  h += '<div id="ability-editor"></div>';

  h += '<div class="actions"><button class="btn" onclick="goTo(4)">Back</button>';
  h += '<button class="btn btn-primary" onclick="confirmAbilities()">Next</button></div>';
  h += '</div>';
  main.innerHTML = h;
  renderAbilityEditor();
}

function setMethod(m) {
  state.abilityMethod = m;
  state.abilities = {};
  if (m === 'roll') state.rolledScores = [];
  if (m === 'point-buy') state.pointBuyRemaining = 27;
  renderAbilities(getMain());
}

function renderAbilityEditor() {
  var box = document.getElementById('ability-editor');
  if (!box) return;
  var abs = ['STR','DEX','CON','INT','WIS','CHA'];

  if (state.abilityMethod === 'roll') {
    renderRollEditor(box, abs);
  } else if (state.abilityMethod === 'standard-array') {
    renderStandardArrayEditor(box, abs);
  } else if (state.abilityMethod === 'point-buy') {
    renderPointBuyEditor(box, abs);
  }
}

function renderRollEditor(box, abs) {
  if (state.rolledScores.length < 6) {
    var h = '<div class="roll-section">';
    h += '<div class="roll-instructions">';
    h += '<p class="sec-subtitle">Roll 4d6 and drop the lowest die for each score. You need 6 scores.</p>';
    h += '<p class="sec-subtitle">Rolled: <strong>'+state.rolledScores.length+'</strong>/6</p>';
    h += '</div>';
    h += '<div class="roll-dice" id="roll-dice"></div>';
    h += '<div class="roll-result" id="roll-result"></div>';
    h += '<div class="roll-actions">';
    h += '<button class="btn btn-primary" onclick="rollDice()">Roll 4d6</button>';
    if (state.rolledScores.length > 0) {
      h += '<button class="btn btn-danger" onclick="resetRolls()">Reset All</button>';
    }
    h += '</div>';
    h += '<div class="roll-scores" id="roll-scores">';
    state.rolledScores.forEach(function(s, i){
      h += '<div class="roll-score-chip">'+s+'</div>';
    });
    h += '</div>';
    h += '</div>';
    box.innerHTML = h;
    return;
  }

  var h = '<div class="ability-assign">';
  h += '<div class="ability-pool">';
  h += '<div class="pool-label">Available Scores (click to assign)</div>';
  h += '<div class="pool-chips" id="pool-chips">';
  var used = abs.map(function(a){ return state.abilities[a]; }).filter(function(v){ return v !== undefined && v !== null; });
  state.rolledScores.forEach(function(s){
    var count = used.filter(function(u){ return u === s; }).length;
    var total = state.rolledScores.filter(function(x){ return x === s; }).length;
    if (count < total) {
      h += '<div class="pool-chip available" onclick="assignFromPool('+s+')">'+s+'</div>';
    } else {
      h += '<div class="pool-chip used">'+s+'</div>';
    }
  });
  h += '</div></div>';
  h += '<div class="ability-slots">';
  abs.forEach(function(a){
    var val = state.abilities[a];
    h += '<div class="ability-slot">';
    h += '<img class="ability-icon" src="/img/abilities/'+a.toLowerCase()+'.svg" alt="'+a+'">';
    h += '<div class="ability-slot-info">';
    h += '<div class="ability-slot-name">'+abName(a)+'</div>';
    h += '<div class="ability-slot-value">'+(val !== undefined && val !== null ? val : '—')+'</div>';
    h += '<div class="ability-slot-mod">'+(val !== undefined && val !== null ? fmtMod(val) : '')+'</div>';
    h += '</div>';
    if (val !== undefined && val !== null) {
      h += '<button class="btn btn-sm btn-danger" onclick="unassignAbility(\''+a+'\')">&#10005;</button>';
    }
    h += '</div>';
  });
  h += '</div></div>';
  h += '<div class="roll-actions"><button class="btn btn-danger" onclick="resetRolls()">Reset All Rolls</button></div>';
  box.innerHTML = h;
}

function renderStandardArrayEditor(box, abs) {
  var h = '<div class="ability-assign">';
  h += '<div class="ability-pool">';
  h += '<div class="pool-label">Available Scores (click to assign)</div>';
  h += '<div class="pool-chips" id="pool-chips">';
  var used = abs.map(function(a){ return state.abilities[a]; }).filter(function(v){ return v !== undefined && v !== null; });
  STD_ARRAY.forEach(function(s){
    var count = used.filter(function(u){ return u === s; }).length;
    var total = STD_ARRAY.filter(function(x){ return x === s; }).length;
    if (count < total) {
      h += '<div class="pool-chip available" onclick="assignFromPool('+s+')">'+s+'</div>';
    } else {
      h += '<div class="pool-chip used">'+s+'</div>';
    }
  });
  h += '</div></div>';
  h += '<div class="ability-slots">';
  abs.forEach(function(a){
    var val = state.abilities[a];
    h += '<div class="ability-slot">';
    h += '<img class="ability-icon" src="/img/abilities/'+a.toLowerCase()+'.svg" alt="'+a+'">';
    h += '<div class="ability-slot-info">';
    h += '<div class="ability-slot-name">'+abName(a)+'</div>';
    h += '<div class="ability-slot-value">'+(val !== undefined && val !== null ? val : '—')+'</div>';
    h += '<div class="ability-slot-mod">'+(val !== undefined && val !== null ? fmtMod(val) : '')+'</div>';
    h += '</div>';
    if (val !== undefined && val !== null) {
      h += '<button class="btn btn-sm btn-danger" onclick="unassignAbility(\''+a+'\')">&#10005;</button>';
    }
    h += '</div>';
  });
  h += '</div></div>';
  box.innerHTML = h;
}

function renderPointBuyEditor(box, abs) {
  var costTable = {8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9};
  var spent = 0;
  abs.forEach(function(a){
    var v = state.abilities[a] || 8;
    spent += costTable[v] || 0;
  });
  var remaining = 27 - spent;

  var h = '<div class="pointbuy-section">';
  h += '<div class="pointbuy-header">';
  h += '<div class="pointbuy-remaining">Points Remaining: <strong class="'+(remaining<0?'text-danger':remaining===0?'text-success':'')+'">'+remaining+'</strong> / 27</div>';
  h += '<div class="pointbuy-bar"><div class="pointbuy-bar-fill" style="width:'+((27-remaining)/27*100)+'%"></div></div>';
  h += '</div>';
  h += '<div class="ability-slots pointbuy-slots">';
  abs.forEach(function(a){
    var val = state.abilities[a] || 8;
    var cost = costTable[val] || 0;
    h += '<div class="ability-slot pointbuy-slot">';
    h += '<img class="ability-icon" src="/img/abilities/'+a.toLowerCase()+'.svg" alt="'+a+'">';
    h += '<div class="ability-slot-info">';
    h += '<div class="ability-slot-name">'+abName(a)+'</div>';
    h += '<div class="ability-slot-value">'+val+'</div>';
    h += '<div class="ability-slot-mod">'+fmtMod(val)+'</div>';
    h += '<div class="ability-slot-cost">Cost: '+cost+'</div>';
    h += '</div>';
    h += '<div class="pointbuy-controls">';
    h += '<button class="btn btn-sm" onclick="changePointBuy(\''+a+'\',-1)"'+(val<=8?' disabled':'')+'>-</button>';
    h += '<button class="btn btn-sm" onclick="changePointBuy(\''+a+'\',1)"'+(val>=15?' disabled':'')+'>+</button>';
    h += '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div class="pointbuy-presets">';
  h += '<span class="preset-label">Quick presets:</span>';
  h += '<button class="btn btn-sm" onclick="setPointBuyPreset(\'melee\')">Melee (STR)</button>';
  h += '<button class="btn btn-sm" onclick="setPointBuyPreset(\'ranged\')">Ranged (DEX)</button>';
  h += '<button class="btn btn-sm" onclick="setPointBuyPreset(\'caster\')">Caster (INT/WIS/CHA)</button>';
  h += '<button class="btn btn-sm" onclick="setPointBuyPreset(\'balanced\')">Balanced</button>';
  h += '</div>';
  h += '</div>';
  box.innerHTML = h;
}

function assignFromPool(val) {
  var abs = ['STR','DEX','CON','INT','WIS','CHA'];
  for (var i = 0; i < abs.length; i++) {
    if (state.abilities[abs[i]] === undefined || state.abilities[abs[i]] === null) {
      state.abilities[abs[i]] = val;
      break;
    }
  }
  renderAbilityEditor();
}

function unassignAbility(ab) {
  delete state.abilities[ab];
  renderAbilityEditor();
}

function changePointBuy(ab, delta) {
  var costTable = {8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9};
  var current = state.abilities[ab] || 8;
  var newVal = current + delta;
  if (newVal < 8 || newVal > 15) return;
  var newCost = costTable[newVal];
  var spent = 0;
  ['STR','DEX','CON','INT','WIS','CHA'].forEach(function(a){
    var v = (a === ab) ? newVal : (state.abilities[a] || 8);
    spent += costTable[v] || 0;
  });
  if (spent > 27) return;
  state.abilities[ab] = newVal;
  renderAbilityEditor();
}

function setPointBuyPreset(type) {
  var presets = {
    melee: {STR:15, DEX:14, CON:14, INT:8, WIS:10, CHA:10},
    ranged: {STR:8, DEX:15, CON:14, INT:10, WIS:12, CHA:12},
    caster: {STR:8, DEX:12, CON:14, INT:15, WIS:14, CHA:8},
    balanced: {STR:12, DEX:12, CON:12, INT:12, WIS:12, CHA:12}
  };
  state.abilities = {};
  var p = presets[type];
  Object.keys(p).forEach(function(k){ state.abilities[k] = p[k]; });
  renderAbilityEditor();
}

function rollDice() {
  var rolls = [];
  for (var i = 0; i < 4; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  rolls.sort(function(a, b){ return b - a; });
  var score = rolls[0] + rolls[1] + rolls[2];
  state.rolledScores.push(score);

  var diceEl = document.getElementById('roll-dice');
  var resultEl = document.getElementById('roll-result');
  if (diceEl) {
    diceEl.innerHTML = rolls.map(function(d){
      var dropped = d === rolls[3];
      return '<span class="die'+(dropped?' dropped':'')+'">'+d+'</span>';
    }).join('');
  }
  if (resultEl) {
    resultEl.innerHTML = '[' + rolls.join(', ') + '] drop ' + rolls[3] + ' = <strong>' + score + '</strong>';
  }
  setTimeout(function(){
    renderAbilityEditor();
  }, 1000);
}

function resetRolls() {
  state.rolledScores = [];
  state.abilities = {};
  renderAbilityEditor();
}

function confirmAbilities() {
  var abs = ['STR','DEX','CON','INT','WIS','CHA'];
  var filled = abs.filter(function(a){ return state.abilities[a] !== undefined && state.abilities[a] !== null; }).length;
  if (filled < 6) { alert('Assign all 6 ability scores.'); return; }
  goTo(6);
}

// ─── 7: Equipment ───
function renderEquipment(main) {
  var packs = {
    'artisans-tools':{name:"Artisan's Tools Pack",items:["Artisan's tools (chosen)","Traveler's clothes","Belt pouch with 15gp"]},
    'dungeoneers':{name:"Dungeoneer's Pack",items:["Backpack","Crowbar","Hammer","10 pitons","10 torches","Tinderbox","10 days rations","Waterskin","50ft hempen rope"]},
    'explorers':{name:"Explorer's Pack",items:["Backpack","Bedroll","Mess kit","Tinderbox","10 torches","10 days rations","Waterskin","50ft hempen rope"]},
    'scholars':{name:"Scholar's Pack",items:["Backpack","Book of lore","Ink bottle","Quill","Little knife","Common clothes","Belt pouch with 10gp"]}
  };
  var classPackKeys = {};
  state.classes.forEach(function(c){
    var packsList = ['dungeoneers','explorers'];
    if (c.id==='bard'||c.id==='cleric'||c.id==='druid') packsList = ['explorers','scholars'];
    else if (c.id==='wizard') packsList = ['scholars','explorers'];
    else if (c.id==='fighter'||c.id==='paladin') packsList = ['dungeoneers','explorers'];
    classPackKeys[c.id] = packsList;
  });
  var firstClass = state.classes[0]?state.classes[0].id:'fighter';
  var packIds = classPackKeys[firstClass]||['dungeoneers','explorers'];
  var selectedPack = state.equipment[0]||packIds[0];
  var h = '<h2 class="sec-title">Starting Equipment</h2>'
    + '<div class="card-grid" id="equip-grid">';
  packIds.forEach(function(pk){
    var p = packs[pk];
    h += '<div class="card'+(selectedPack===pk?' selected':'')+'" onclick="selectPack(\''+pk+'\')">'
      + '<div class="card-title">'+p.name+'</div>'
      + '<div class="card-tags">'+p.items.map(function(it){return '<span class="tag tag-gold">'+esc(it)+'</span>';}).join('')+'</div>'
      + '</div>';
  });
  h += '</div><div class="actions"><button class="btn" onclick="goTo(5)">Back</button>'
    + '<button class="btn btn-primary" onclick="confirmEquipment()">Next</button></div>';
  main.innerHTML = h;
}
function selectPack(pk) {
  state.equipment = [pk];
  renderEquipment(getMain());
}
function confirmEquipment() { goTo(10); }

// ─── 10: Spells ───
var SPELL_SCHOOLS = {abjuration:'Abjuration',conjuration:'Conjuration',divination:'Divination',
  enchantment:'Enchantment',evocation:'Evocation',illusion:'Illusion',
  necromancy:'Necromancy',transmutation:'Transmutation'};

var SUBCLASS_AFFINITIES = {
  // Sorcerer
  'aberrant-sorcery':      { schools:['illusion','enchantment','divination'], damageTypes:['psychic'], desc:'Illusion, enchantment, and psychic magic' },
  'clockwork-sorcery':     { schools:['abjuration','divination'],            damageTypes:['force'],  desc:'Order, protection, and force magic' },
  'draconic-sorcery':      { schools:['evocation'],                          damageTypes:['fire','cold','lightning','acid','poison','thunder'], desc:'Elemental and draconic damage spells' },
  'wild-magic-sorcery':    { schools:['evocation','conjuration'],            damageTypes:[],         desc:'Raw, unpredictable evocation and conjuration' },
  // Cleric
  'life-domain':           { schools:['abjuration','necromancy'],            damageTypes:['radiant'],desc:'Healing, protection, and radiant magic' },
  'light-domain':          { schools:['evocation','abjuration'],             damageTypes:['fire','radiant'], desc:'Radiant fire, light, and protective magic' },
  'trickery-domain':       { schools:['illusion','enchantment'],             damageTypes:[],         desc:'Deception, illusion, and charm magic' },
  'war-domain':            { schools:['evocation','transmutation'],          damageTypes:[],         desc:'Battle magic, buffs, and martial support' },
  // Paladin
  'oath-of-devotion':      { schools:['abjuration','enchantment'],           damageTypes:['radiant'],desc:'Protection, holy radiance, and consecration' },
  'oath-of-glory':         { schools:['abjuration','evocation'],             damageTypes:[],         desc:'Heroic buffs, speed, and inspirational magic' },
  'oath-of-the-ancients':  { schools:['abjuration','conjuration'],           damageTypes:[],         desc:'Nature ward, fey protection, and ancient power' },
  'oath-of-vengeance':     { schools:['necromancy','evocation'],             damageTypes:[],         desc:'Hunting, debuffs, and relentlessness damage' },
  // Warlock
  'archfey-patron':        { schools:['enchantment','illusion','conjuration'], damageTypes:[],       desc:'Fey trickery, charm, illusion, and teleportation' },
  'the-fiend':             { schools:['evocation','necromancy'],             damageTypes:['fire'],   desc:'Fire, destruction, and fiendish power' },
  'the-great-old-one':     { schools:['enchantment','divination'],           damageTypes:['psychic'],desc:'Mind control, psychic damage, and forbidden knowledge' },
  // Druid
  'circle-of-the-land':    { schools:['conjuration','divination','abjuration'], damageTypes:[],      desc:'Nature attunement, terrain-based, and primal magic' },
  'circle-of-the-moon':    { schools:['conjuration','transmutation'],        damageTypes:[],         desc:"Shapeshifting, primal beasts, and nature's fury" },
  'circle-of-the-sea':     { schools:['conjuration','evocation'],            damageTypes:['cold','lightning','thunder'], desc:'Water, storms, waves, and ocean magic' },
  // Wizard
  'abjurer':               { schools:['abjuration'],                         damageTypes:[],         desc:'Protective wards, barriers, and counterspells' },
  'diviner':               { schools:['divination'],                         damageTypes:[],         desc:'Foresight, detection, and knowledge magic' },
  'evoker':                { schools:['evocation'],                          damageTypes:[],         desc:'Raw destructive elemental and force magic' },
  'illusionist':           { schools:['illusion'],                           damageTypes:[],         desc:'Deceptive illusions, phantasms, and misdirection' },
  // Bard
  'college-of-dance':      { schools:['transmutation','enchantment','illusion'], damageTypes:[],     desc:'Graceful movement, charm, and dazzling performances' },
  'college-of-glamour':    { schools:['enchantment','illusion'],             damageTypes:[],         desc:'Fey-touched charm, beauty, and beguiling magic' },
  'college-of-valor':      { schools:['evocation','transmutation','abjuration'], damageTypes:[],     desc:'Battle inspiration, combat buffs, and war magic' },
  // Ranger
  'beast-master':          { schools:['conjuration','enchantment'],          damageTypes:[],         desc:'Beast-bonding, animal friendship, and nature magic' },
  'fey-wanderer':          { schools:['enchantment','illusion','conjuration'], damageTypes:[],       desc:'Fey charm, misdirection, and otherworldly magic' },
  'gloom-stalker':         { schools:['illusion','necromancy'],              damageTypes:[],         desc:'Shadow, darkness, ambush, and fear magic' },
  'hunter':                { schools:['divination','evocation','necromancy'],damageTypes:[],         desc:'Tracking, quarry-hunting, and offensive nature magic' }
};

// Granted spells from subclass/feat/species
var SUBCLASS_SPELLS = {
  'eldritch-knight': { cantrips: 2, spells: 3, source: 'wizard', bonus: false },
  'arcane-trickster': { cantrips: 2, spells: 3, source: 'wizard', bonus: false },
  'college-of-lore': { cantrips: 0, spells: 2, source: 'bard', bonus: true },
  'college-of-dance': { cantrips: 0, spells: 0, source: null, bonus: true }
};

// ─── BACKGROUND GRANTED SPELLS (Origin Feats) ───
var BG_GRANTED_SPELLS = {
  'acolyte': { cantrips: 2, spells: 1, source: 'cleric', bonus: true },
  'guide': { cantrips: 2, spells: 1, source: 'druid', bonus: true },
  'sage': { cantrips: 2, spells: 1, source: 'wizard', bonus: true }
};

// ─── MULTICLASS SPELL SLOT TABLE (2024 PHB) ───
// Source: data/spellcasting/multiclass-slots.yaml
// Index = combined caster level, values = [slot1, slot2, slot3, slot4, slot5]
var MULTICLASS_SLOTS = [
  [],           // 0
  [2],          // 1
  [3],          // 2
  [4, 2],       // 3
  [4, 3],       // 4
  [4, 3, 2],    // 5
  [4, 3, 3],    // 6
  [4, 3, 3, 1], // 7
  [4, 3, 3, 2], // 8
  [4, 3, 3, 3, 1], // 9
  [4, 3, 3, 3, 2], // 10
  [4, 3, 3, 3, 2, 1], // 11
  [4, 3, 3, 3, 2, 1, 1], // 12
  [4, 3, 3, 3, 2, 1, 1, 1], // 13
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 1, 1], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 1, 1, 1], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1] // 20
];

function getMaxSpellsKnownPerLevel() {
  // For per-level limits, use multiclass spell slots (how many you can CAST per day)
  // For known casters, also track TOTAL spells known vs selected
  var spellSlots = getSpellSlots();
  var maxPerLevel = {};
  maxPerLevel[0] = spellSlots.cantrips;
  spellSlots.slots.forEach(function(s, i) { if (s > 0) maxPerLevel[i+1] = s; });
  if (spellSlots.warlock.count > 0) {
    maxPerLevel[spellSlots.warlock.level] = (maxPerLevel[spellSlots.warlock.level] || 0) + spellSlots.warlock.count;
  }
  return maxPerLevel;
}

function getMaxSpellLevel(classId, classLevel) {
  if (classId === 'warlock') {
    if (classLevel >= 9) return 5;
    if (classLevel >= 7) return 4;
    if (classLevel >= 5) return 3;
    if (classLevel >= 3) return 2;
    return 1;
  }
  if (classLevel >= 17) return 9;
  if (classLevel >= 15) return 8;
  if (classLevel >= 13) return 7;
  if (classLevel >= 11) return 6;
  if (classLevel >= 9) return 5;
  if (classLevel >= 7) return 4;
  if (classLevel >= 5) return 3;
  if (classLevel >= 3) return 2;
  return 1;
}

function getCantripsKnown(classId, classLevel) {
  if (classId === 'wizard') return classLevel >= 10 ? 5 : classLevel >= 4 ? 4 : 3;
  if (classId === 'sorcerer') return classLevel >= 10 ? 6 : classLevel >= 4 ? 5 : 4;
  if (classId === 'bard') return classLevel >= 10 ? 4 : classLevel >= 4 ? 3 : 2;
  if (classId === 'warlock') return classLevel >= 10 ? 4 : classLevel >= 4 ? 3 : 2;
  if (classId === 'cleric') return classLevel >= 10 ? 5 : classLevel >= 4 ? 4 : 3;
  if (classId === 'druid') return classLevel >= 10 ? 4 : classLevel >= 4 ? 3 : 2;
  return 0;
}

function getSpellsKnown(classId, classLevel) {
  if (classId === 'warlock') {
    if (classLevel >= 10) return 10;
    if (classLevel >= 9) return 10;
    if (classLevel >= 8) return 9;
    if (classLevel >= 7) return 9;
    if (classLevel >= 6) return 8;
    if (classLevel >= 5) return 8;
    if (classLevel >= 4) return 7;
    if (classLevel >= 3) return 6;
    if (classLevel >= 2) return 5;
    return 4;
  }
  if (classId === 'sorcerer') {
    if (classLevel >= 17) return 15;
    if (classLevel >= 15) return 14;
    if (classLevel >= 13) return 13;
    if (classLevel >= 11) return 12;
    if (classLevel >= 9) return 11;
    if (classLevel >= 7) return 10;
    if (classLevel >= 5) return 9;
    if (classLevel >= 3) return 8;
    if (classLevel >= 2) return 6;
    return 2;
  }
  if (classId === 'bard') {
    if (classLevel >= 17) return 22;
    if (classLevel >= 15) return 20;
    if (classLevel >= 13) return 18;
    if (classLevel >= 11) return 16;
    if (classLevel >= 9) return 14;
    if (classLevel >= 7) return 12;
    if (classLevel >= 5) return 10;
    if (classLevel >= 3) return 8;
    return 4;
  }
  return 0; // Prepared casters don't have "known" limit
}

function getSpellListsForClass(classId, classLevel) {
  var cls = content && content.classes && content.classes.find(function(c){return c.id===classId;});
  if (!cls) {
    return aggregateClassSpells(classId, classLevel); // fallback
  }
  if (!cls.spellcasting || !cls.spellcasting.spellLists) {
    return aggregateClassSpells(classId, classLevel); // fallback
  }

  var spellLists = cls.spellcasting.spellLists;
  var cantrips = [];
  var spells = [];

  // Collect all spells up to the given level
  for (var lvl = 1; lvl <= classLevel; lvl++) {
    if (spellLists[lvl]) {
      spellLists[lvl].forEach(function(spellName) {
        // Find spell ID by name
        var spellId = Object.keys(content.spells).find(function(id) {
          return content.spells[id].name === spellName;
        });
        if (spellId) {
          var sp = content.spells[spellId];
          if (sp.level === 0) {
            if (cantrips.indexOf(spellId) === -1) cantrips.push(spellId);
          } else {
            if (spells.indexOf(spellId) === -1) spells.push(spellId);
          }
        }
      });
    }
  }

  return {
    cantrips: cantrips,
    spells: spells,
    prepared: true
  };
}

function getCantripsKnown(classId, classLevel) {
  if (classId === 'wizard') return classLevel >= 10 ? 5 : classLevel >= 4 ? 4 : 3;
  if (classId === 'sorcerer') return classLevel >= 10 ? 6 : classLevel >= 4 ? 5 : 4;
  if (classId === 'bard') return classLevel >= 10 ? 4 : classLevel >= 4 ? 3 : 2;
  if (classId === 'warlock') return classLevel >= 10 ? 4 : classLevel >= 4 ? 3 : 2;
  if (classId === 'cleric') return classLevel >= 10 ? 5 : classLevel >= 4 ? 4 : 3;
  if (classId === 'druid') return classLevel >= 10 ? 4 : classLevel >= 4 ? 3 : 2;
  return 0;
}

function getCasterLevel() {
  var total = 0;
  state.classes.forEach(function(c) {
    if (c.id === 'warlock') return;
    if (c.data && c.data.spellcasting) {
      var type = c.data.spellcasting.type || 'full';
      if (type === 'full') total += c.level;
      else if (type === 'half' || type === 'half-rounded-up') total += Math.floor(c.level / 2);
      else if (type === 'third') total += Math.floor(c.level / 3);
      else total += c.level;
    }
  });
  return total;
}

function getSpellSlots() {
  var casterLevel = getCasterLevel();
  var slots = MULTICLASS_SLOTS[Math.min(casterLevel, 20)] || [];

  // Warlock Pact Magic (separate)
  var warlockSlots = {level: 0, count: 0};
  state.classes.forEach(function(c) {
    if (c.id === 'warlock') {
      warlockSlots.level = getMaxSpellLevel('warlock', c.level);
      warlockSlots.count = c.level >= 2 ? 2 : 1;
    }
  });

  // Total cantrips from all classes
  var cantrips = 0;
  state.classes.forEach(function(c) {
    if (c.data && c.data.spellcaster) {
      cantrips += getCantripsKnown(c.id, c.level);
    }
  });

  return {
    cantrips: cantrips,
    slots: slots,           // [slot1, slot2, slot3, ...]
    warlock: warlockSlots   // {level, count}
  };
}

function getGrantedSpells() {
  var granted = [];

  // Class & subclass granted spells
  state.classes.forEach(function(cls) {
    var classId = cls.id;
    var classLevel = cls.level;
    var list = getSpellListsForClass(classId, classLevel);
    if (!list) return;

    // Cantrips known (auto-pick first N)
    var numCantrips = getCantripsKnown(classId, classLevel);
    list.cantrips.slice(0, numCantrips).forEach(function(id){
      var sp = content.spells[id];
      if (sp) granted.push({ id: id, name: sp.name, school: sp.school, level: 0, source: cls.data.name || classId, bonus: false });
    });

    // Spells known (for known casters like Sorcerer, Warlock, Bard)
    if (list.known) {
      var numSpells = getSpellsKnown(classId, classLevel);
      var maxLevel = getMaxSpellLevel(classId, classLevel);
      list.spells.filter(function(id){ var sp=content.spells[id]; return sp && sp.level <= maxLevel; }).slice(0, numSpells).forEach(function(id){
        var sp = content.spells[id];
        if (sp) granted.push({ id: id, name: sp.name, school: sp.school, level: sp.level, source: cls.data.name || classId, bonus: false });
      });
    }

    // Subclass granted spells
    if (cls.subclassId && SUBCLASS_SPELLS[cls.subclassId]) {
      var sub = SUBCLASS_SPELLS[cls.subclassId];
      if (sub.bonus) {
        var subList = sub.source ? aggregateClassSpells(sub.source, 20) : null;
        if (subList) {
          subList.cantrips.slice(0, sub.cantrips).forEach(function(id){
            var sp = content.spells[id];
            if (sp) granted.push({ id: id, name: sp.name, school: sp.school, level: 0, source: 'Subclass', bonus: true });
          });
          subList.spells.slice(0, sub.spells).forEach(function(id){
            var sp = content.spells[id];
            if (sp) granted.push({ id: id, name: sp.name, school: sp.school, level: sp.level, source: 'Subclass', bonus: true });
          });
        }
}
      }
    });

    // Warlock Mystic Arcanum (bonus spells that don't count against spells known)
    state.classes.forEach(function(cls) {
    if (cls.id !== 'warlock') return;
    if (cls.level >= 11) {
      var arcanumLevels = [
        { classLevel: 11, spellLevel: 6 },
        { classLevel: 13, spellLevel: 7 },
        { classLevel: 15, spellLevel: 8 },
        { classLevel: 17, spellLevel: 9 }
      ];
      arcanumLevels.forEach(function(a) {
        if (cls.level >= a.classLevel) {
          var arcanumSpells = content.classes.find(function(c){return c.id==='warlock';});
          if (arcanumSpells && arcanumSpells.levels) {
            var levelData = arcanumSpells.levels.find(function(l){return l.level===a.classLevel;});
            if (levelData && levelData.mysticArcanum) {
              levelData.mysticArcanum.forEach(function(spellName){
                var sp = content.spellsByName[spellName];
                if (sp) granted.push({ id: sp.id, name: sp.name, school: sp.school, level: sp.level, source: 'Mystic Arcanum', bonus: true });
              });
            }
          }
        }
      });
    }
  });

  // Background granted spells (Origin Feats) — always bonus
  if (state.backgroundId && BG_GRANTED_SPELLS[state.backgroundId]) {
    var bgFeat = BG_GRANTED_SPELLS[state.backgroundId];
    var bgList = bgFeat.source ? aggregateClassSpells(bgFeat.source, 20) : null;
    if (bgList) {
      bgList.cantrips.slice(0, bgFeat.cantrips).forEach(function(id){
        var sp = content.spells[id];
        if (sp) granted.push({ id: id, name: sp.name, school: sp.school, level: 0, source: 'Background', bonus: true });
      });
      bgList.spells.slice(0, bgFeat.spells).forEach(function(id){
        var sp = content.spells[id];
        if (sp) granted.push({ id: id, name: sp.name, school: sp.school, level: sp.level, source: 'Background', bonus: true });
      });
    }
  }

  return granted;
}

function getSelectableSpells() {
  var granted = getGrantedSpells();
  var grantedIds = granted.map(function(g){ return g.id; });

  var result = [];
  var allSpells = Object.values(content.spells);

  state.classes.forEach(function(cls) {
    var classId = cls.id;
    var classLevel = cls.level;
    var list = getClassSpellList(classId, classLevel);
    if (!list) return;

    var maxLevel = getMaxSpellLevel(classId, classLevel);

    allSpells.forEach(function(sp){
      var classList = (sp.level === 0) ? list.cantrips : list.spells;
      if (classList.indexOf(sp.id) !== -1 && grantedIds.indexOf(sp.id) === -1 && sp.level <= maxLevel) {
        // Avoid duplicates from multiple classes
        if (result.findIndex(function(r){return r.id===sp.id;}) === -1) {
          result.push(sp);
        }
      }
    });
  });

  return result;
}

function isSpellRecommended(spell) {
  for (var i = 0; i < state.classes.length; i++) {
    var cls = state.classes[i];
    var scId = cls.subclassId;
    if (!scId) continue;
    var aff = SUBCLASS_AFFINITIES[scId];
    if (!aff) continue;
    if (aff.schools && aff.schools.indexOf(spell.school) !== -1) return aff.desc;
    if (aff.damageTypes && spell.damage) {
      var dmg = spell.damage.toLowerCase();
      for (var d = 0; d < aff.damageTypes.length; d++) {
        if (dmg.indexOf(aff.damageTypes[d]) !== -1) return aff.desc;
      }
    }
  }
  return null;
}

function getClassSpellList(classId, classLevel) {
  var classData = content.classes && content.classes.find(function(c){return c.id===classId;});
  if (classData && classData.spellcasting && classData.spellcasting.spellLists) {
    // Combine all spell lists up to classLevel
    var cantrips = [];
    var spells = [];
    for (var lvl = 1; lvl <= classLevel; lvl++) {
      var levelSpells = classData.spellcasting.spellLists[lvl];
      if (levelSpells) {
        levelSpells.forEach(function(spellName) {
          // Find spell ID by name
          var spell = Object.values(content.spells).find(function(s) { return s.name === spellName; });
          if (spell) {
            if (spell.level === 0) cantrips.push(spell.id);
            else spells.push(spell.id);
          }
        });
      }
    }
    // Remove duplicates
    cantrips = [...new Set(cantrips)];
    spells = [...new Set(spells)];
    return { cantrips: cantrips, spells: spells, known: false }; // default to prepared
  }
  return aggregateClassSpells(classId, classLevel);
}

function aggregateClassSpells(classId, classLevel) {
  var perLevel = CLASS_SPELL_LISTS[classId];
  if (!perLevel) return null;
  var cantrips = [], spells = [];
  Object.keys(perLevel).forEach(function(lvl){
    if (parseInt(lvl,10) > classLevel) return;
    perLevel[lvl].cantrips.forEach(function(sid){
      if (cantrips.indexOf(sid)===-1) cantrips.push(sid);
    });
    perLevel[lvl].spells.forEach(function(sid){
      if (spells.indexOf(sid)===-1) spells.push(sid);
    });
  });
  return { cantrips: cantrips, spells: spells, prepared: true, known: false };
}

function getClassSpellsForPicker(c) {
  var perLevel = CLASS_SPELL_LISTS ? CLASS_SPELL_LISTS[c.id] : null;
  if (perLevel) return perLevel;
  // Fallback for subclasses that draw from another class's list (EK, AT)
  if (c.subclassId && SUBCLASS_SPELLS[c.subclassId] && !SUBCLASS_SPELLS[c.subclassId].bonus) {
    var sub = SUBCLASS_SPELLS[c.subclassId];
    if (sub.source && CLASS_SPELL_LISTS[sub.source]) return CLASS_SPELL_LISTS[sub.source];
  }
  return null;
}

function renderSpells(main) {
  var firstClass = state.classes[0]?state.classes[0]:null;
  var isCaster = firstClass && firstClass.data && firstClass.data.spellcaster;
  if (!isCaster) {
    state.classes.forEach(function(c) {
      if (c.data && c.data.spellcaster) isCaster = true;
    });
  }
  if (!isCaster) {
    main.innerHTML = '<h2 class="sec-title">Spells</h2>'
      + '<p class="sec-subtitle">Your class does not cast spells.</p>'
      + '<div class="actions"><button class="btn" onclick="goTo(6)">Back</button>'
      + '<button class="btn btn-primary" onclick="goTo(8)">View Sheet</button></div>';
    return;
  }

  var spellSlots = getSpellSlots();
  var granted = getGrantedSpells();
  var grantedCantrips = granted.filter(function(g){return g.level===0;});
  var grantedLevel = granted.filter(function(g){return g.level>=1;});
  var totalCantrips = grantedCantrips.length + state.spells.filter(function(s){var sp=content.spells[s];return sp&&sp.level===0;}).length;
  var totalSpells = grantedLevel.length + state.spells.filter(function(s){var sp=content.spells[s];return sp&&sp.level>=1;}).length;

  var h = '<div class="spell-section">';
  h += '<h2 class="sec-title">Spellbook</h2>';
  h += '<div class="spell-summary">';
  h += '<div class="spell-summary-item"><span class="spell-summary-count">'+totalCantrips+'</span><span class="spell-summary-label"> Cantrips</span></div>';
  h += '<div class="spell-summary-item"><span class="spell-summary-count">'+totalSpells+'</span><span class="spell-summary-label"> Spells</span></div>';
  if (spellSlots.warlock.count > 0) {
    h += '<div class="spell-summary-item"><span class="spell-summary-count">'+spellSlots.warlock.count+'</span><span class="spell-summary-label"> Pact Magic (Lv'+spellSlots.warlock.level+')</span></div>';
  }
  h += '</div>';

  // Selected spells per class
  h += '<div class="spell-class-summaries">';
  state.classes.forEach(function(c, idx){
    if (!c.data || !c.data.spellcaster) return;
    var classSpells = window.CLASS_SPELL_LISTS ? window.CLASS_SPELL_LISTS[c.id] : null;
    if (!classSpells) return;
    var cName = c.data.name || c.id;
    var cLevel = c.level;
    h += '<div class="spell-class-summary">';
    h += '<div class="spell-class-summary-name">'+esc(cName)+' '+cLevel+'</div>';
    // Class spell IDs
    var classSpellIds = [];
    Object.keys(classSpells).forEach(function(lvl){
      if (parseInt(lvl,10) > cLevel) return;
      classSpells[lvl].cantrips.forEach(function(sid){if (classSpellIds.indexOf(sid)===-1) classSpellIds.push(sid);});
      classSpells[lvl].spells.forEach(function(sid){if (classSpellIds.indexOf(sid)===-1) classSpellIds.push(sid);});
    });
    var sel = state.spells.filter(function(sid){return classSpellIds.indexOf(sid)!==-1;});
    var gr = granted.filter(function(g){return classSpellIds.indexOf(g.id)!==-1;});
    if (sel.length) {
      h += '<div class="spell-class-summary-list">';
      sel.forEach(function(sid){
        var sp = content.spells[sid];
        if (!sp) return;
        var si = (sp.school||'evocation').toLowerCase();
        h += '<div class="spell-class-summary-spell"><img src="/static/img/spell-schools/'+si+'.png" alt="" width="14" height="14" onerror="this.style.display=\'none\'"> '+esc(sp.name)+'</div>';
      });
      h += '</div>';
    }
    if (gr.length) {
      h += '<div class="spell-class-summary-granted">Granted:</div>';
      gr.forEach(function(g){
        var si = (g.school||'evocation').toLowerCase();
        h += '<div class="spell-class-summary-spell granted"><img src="/static/img/spell-schools/'+si+'.png" alt="" width="14" height="14" onerror="this.style.display=\'none\'"> '+esc(g.name)+'</div>';
      });
    }
    h += '</div>';
  });
  h += '</div>';

  h += '<div class="actions"><button class="btn" onclick="goTo(6)">Back</button>';
  h += '<button class="btn btn-primary" onclick="confirmSpells()">View Sheet</button></div>';

  main.innerHTML = h;
}

function renderAllSpells() {
  var spellSlots = getSpellSlots();
  var maxKnown = getMaxSpellsKnownPerLevel();
  var counts = {};
  state.spells.forEach(function(s){
    var sp = content.spells[s];
    if (sp) counts[sp.level] = (counts[sp.level]||0) + 1;
  });
  var granted = getGrantedSpells();
  granted.forEach(function(g){ if (!g.bonus) counts[g.level] = (counts[g.level]||0) + 1; });
  var allSelectable = getSelectableSpells();
  var byLevel = {};
  allSelectable.forEach(function(sp){
    var lv = sp.level; if (!byLevel[lv]) byLevel[lv] = []; byLevel[lv].push(sp);
  });
  var box = document.getElementById('spell-content');
  if (!box) return;
  var h = '';
  if (byLevel[0]) {
    var cantripMax = maxKnown[0] || spellSlots.cantrips;
    var cantripTotal = counts[0]||0;
    h += '<div class="spell-level-group"><div class="spell-level-header">Cantrips ('+cantripTotal+'/'+cantripMax+')</div><div class="picker-list">';
    byLevel[0].forEach(function(sp){ h += renderSpellRow(sp); });
    h += '</div></div>';
  }
  Object.keys(byLevel).forEach(function(lvlStr){
    var lvl = parseInt(lvlStr,10); if (lvl === 0) return;
    var max = maxKnown[lvl] || spellSlots.slots[lvl-1] || 0;
    var total = counts[lvl]||0;
    var suffix = lvl===1?'st':lvl===2?'nd':lvl===3?'rd':'th';
    h += '<div class="spell-level-group"><div class="spell-level-header">'+lvl+suffix+' Level ('+total+'/'+max+')</div><div class="picker-list">';
    byLevel[lvl].forEach(function(sp){ h += renderSpellRow(sp); });
    h += '</div></div>';
  });
  if (!h) h = '<p class="spell-section-sub">No spells available.</p>';
  box.innerHTML = h;
}

function renderSpellRow(sp) {
  var isSelected = state.spells.indexOf(sp.id) !== -1;
  var schoolImg = (sp.school||'evocation').toLowerCase();
  var tags = '';
  if (sp.concentration) tags += ' &middot; Concentration';
  if (sp.ritual) tags += ' &middot; Ritual';
  if (sp.damage) tags += ' &middot; '+esc(sp.damage);
  if (sp.save) tags += ' &middot; Save '+esc(sp.save);
  if (sp.attack) tags += ' &middot; Attack';
  var rec = isSpellRecommended(sp);
  var h = '<div class="picker-row spell-picker-row'+(isSelected?' selected':'')+(rec?' recommended':'')+'" data-name="'+esc((sp.name||'').toLowerCase())+'" onclick="toggleSpell(\''+esc(sp.id)+'\','+sp.level+')">';
  h += '<div class="picker-row-icon"><img src="/static/img/spell-schools/'+schoolImg+'.png" alt="'+esc(sp.school)+'" width="28" height="28" onerror="this.style.display=\'none\'"></div>';
  h += '<div class="picker-row-info">';
  h += '<div class="picker-row-name">'+esc(sp.name)+(isSelected?' &#10003;':'')+'</div>';
  h += '<div class="picker-row-meta">'+(SPELL_SCHOOLS[sp.school]||(sp.level===0?'Cantrips':'Level '+sp.level))+' &middot; '+esc(sp.castingTime||'1 action')+' &middot; '+esc(sp.range||'Self')+tags+'</div>';
  h += '</div>';
  h += (rec?'<div class="picker-row-badge" title="'+esc(rec)+'">Recommended</div>':'');
  h += '<div class="picker-row-arrow">'+(isSelected?'&#10003;':'+')+'</div>';
  h += '</div>';
  return h;
}

function renderClassSelectedSpells(idx, c) {
  var classSpells = getClassSpellsForPicker(c);
  var spellSlots = getSpellSlots();
  var maxKnown = getMaxSpellsKnownPerLevel();
  var granted = getGrantedSpells();

  // Collect all spell IDs this class has access to (for filtering)
  var classSpellIds = [];
  if (classSpells) {
    Object.keys(classSpells).forEach(function(lvl){
      if (parseInt(lvl,10) > c.level) return;
      classSpells[lvl].cantrips.forEach(function(sid){ if (classSpellIds.indexOf(sid)===-1) classSpellIds.push(sid); });
      classSpells[lvl].spells.forEach(function(sid){ if (classSpellIds.indexOf(sid)===-1) classSpellIds.push(sid); });
    });
  }
  // Also add spell IDs from the subclass's source list if applicable (EK/AT)
  if (c.subclassId && SUBCLASS_SPELLS[c.subclassId]) {
    var sub = SUBCLASS_SPELLS[c.subclassId];
    if (sub.source && CLASS_SPELL_LISTS && CLASS_SPELL_LISTS[sub.source]) {
      Object.keys(CLASS_SPELL_LISTS[sub.source]).forEach(function(lvl){
        if (parseInt(lvl,10) > c.level) return;
        CLASS_SPELL_LISTS[sub.source][lvl].cantrips.forEach(function(sid){ if (classSpellIds.indexOf(sid)===-1) classSpellIds.push(sid); });
        CLASS_SPELL_LISTS[sub.source][lvl].spells.forEach(function(sid){ if (classSpellIds.indexOf(sid)===-1) classSpellIds.push(sid); });
      });
    }
  }

  // Selected spells that belong to this class
  var selected = state.spells.filter(function(sid){ return classSpellIds.indexOf(sid) !== -1; });
  var grantedHere = granted.filter(function(g){ return classSpellIds.indexOf(g.id) !== -1; });
  var bonusHere = grantedHere.filter(function(g){ return g.bonus; });
  var nonBonusGranted = grantedHere.filter(function(g){ return !g.bonus; });

  // Count per level (excluding bonus spells — they don't count toward limits)
  var counts = {};
  selected.forEach(function(sid){ var sp = content.spells[sid]; if(sp) counts[sp.level] = (counts[sp.level]||0) + 1; });
  nonBonusGranted.forEach(function(g){ counts[g.level] = (counts[g.level]||0) + 1; });

  var totalSelected = selected.length + nonBonusGranted.length;
  var isWarlock = c.id === 'warlock';
  var warlockMaxKnown = isWarlock ? getSpellsKnown('warlock', c.level) : null;
  var warlockCurrentKnown = isWarlock ? selected.filter(function(sid){var sp=content.spells[sid];return sp&&sp.level>=1;}).length : 0;
  var pickedCantrips = selected.filter(function(sid){var sp=content.spells[sid];return sp&&sp.level===0;}).length;
  
  var h = '<div class="class-spells-selected">';
  if (isWarlock) {
    h += '<div class="warlock-known-counter">';
    h += '<span class="counter-label">Spells Known:</span> ';
    h += '<span class="counter-value"><strong>'+warlockCurrentKnown+'</strong> of <strong>'+warlockMaxKnown+'</strong></span>';
    h += '<span class="counter-hint">(Cantrips: '+pickedCantrips+'/'+(maxKnown[0]||spellSlots.cantrips)+')</span>';
    h += '</div>';
  } else {
    h += '<div class="class-spells-selected-summary">Selected: <strong>'+totalSelected+'</strong> spells'+(bonusHere.length?' <span class="spells-selected-bonus-count">+'+bonusHere.length+' bonus</span>':'')+'</div>';
  }

  // Show spells grouped by level - Warlock: Known Spells at top with Cantrips/1st/2nd/Granted
  var spellSlotsCount = getSpellSlots();
  var levelsToShow = [0];
  for (var l=1; l<=20; l++) if (spellSlotsCount.slots[l-1] || maxKnown[l]) levelsToShow.push(l);

  if (isWarlock) {
    // Known Spells section (user selected)
    var selectedByLevel = {};
    selected.forEach(function(sid){ var sp = content.spells[sid]; if(sp && sp.level===0) { if (!selectedByLevel[0]) selectedByLevel[0]=[]; selectedByLevel[0].push({type:'picked', spell:sp}); } else if(sp) { if (!selectedByLevel[sp.level]) selectedByLevel[sp.level]=[]; selectedByLevel[sp.level].push({type:'picked', spell:sp}); } });
    
    // Cantrips
    var cantripMax = maxKnown[0] || spellSlots.cantrips;
    var cantripTotal = counts[0]||0;
    h += '<div class="class-spells-selected-group"><div class="class-spells-selected-label">Cantrips ('+cantripTotal+'/'+cantripMax+')</div>';
    if (selectedByLevel[0]) {
      selectedByLevel[0].forEach(function(item){
        var sp = item.spell;
        var si = (sp.school||'evocation').toLowerCase();
        h += '<div class="class-spells-selected-row">';
        h += '<img src="/static/img/spell-schools/'+si+'.png" alt="" width="16" height="16" onerror="this.style.display=\'none\'">';
        h += '<span class="class-spells-selected-name">'+esc(sp.name||sp.spellName)+'</span>';
        h += '<span class="class-spells-selected-remove" onclick="toggleSpell(\''+esc(sp.id)+'\',0,'+idx+')">&#10005;</span>';
        h += '</div>';
      });
    }
    h += '</div>';

    // Leveled spells
    var maxSpellLevel = getMaxSpellLevel('warlock', c.level);
    for (var l=1; l<=maxSpellLevel; l++) {
      var max = maxKnown[l] || spellSlots.slots[l-1] || 0;
      var total = counts[l]||0;
      if (total === 0 && !bonusHere.some(function(g){return g.level===l;})) continue;
      h += '<div class="class-spells-selected-group"><div class="class-spells-selected-label">'+l+(l===1?'st':l===2?'nd':l===3?'rd':'th')+' Level ('+total+'/'+max+')</div>';
      if (selectedByLevel[l]) {
        selectedByLevel[l].forEach(function(item){
          var sp = item.spell;
          var si = (sp.school||'evocation').toLowerCase();
          h += '<div class="class-spells-selected-row">';
          h += '<img src="/static/img/spell-schools/'+si+'.png" alt="" width="16" height="16" onerror="this.style.display=\'none\'">';
          h += '<span class="class-spells-selected-name">'+esc(sp.name||sp.spellName)+'</span>';
          h += '<span class="class-spells-selected-remove" onclick="toggleSpell(\''+esc(sp.id)+'\','+sp.level+','+idx+')">&#10005;</span>';
          h += '</div>';
        });
      }
      h += '</div>';
    }

    // Granted spells section
    var grantedHereFiltered = grantedHere.filter(function(g){ return g.level <= maxSpellLevel || g.level === 0; });
    if (grantedHereFiltered.length) {
      h += '<div class="class-spells-selected-group"><div class="class-spells-selected-label">Granted</div>';
      grantedHereFiltered.forEach(function(g){
        var sp = content.spells[g.id] || g;
        var si = (sp.school||'evocation').toLowerCase();
        h += '<div class="class-spells-selected-row granted">';
        h += '<img src="/static/img/spell-schools/'+si+'.png" alt="" width="16" height="16" onerror="this.style.display=\'none\'">';
        h += '<span class="class-spells-selected-name">'+esc(sp.name||sp.spellName)+'</span>';
        h += '<span class="class-spells-selected-source">'+esc(g.source||'Granted')+'</span>';
        h += '</div>';
      });
      h += '</div>';
    }
  } else {
    // Non-warlock: original grouped display
    levelsToShow.forEach(function(lvl){
      var sps = [];
      selected.forEach(function(sid){ var sp = content.spells[sid]; if(sp && sp.level===lvl) sps.push({type:'picked', spell:sp}); });
      nonBonusGranted.forEach(function(g){ if(g.level===lvl) sps.push({type:'granted', spell:g, source:g.source, bonus:false}); });
      bonusHere.forEach(function(g){ if(g.level===lvl) sps.push({type:'granted', spell:g, source:g.source, bonus:true}); });
      if (!sps.length) return;
      var max = lvl===0 ? (maxKnown[0]||spellSlots.cantrips) : (maxKnown[lvl]||spellSlots.slots[lvl-1]||0);
      var total = counts[lvl]||0;
      var bonusCount = bonusHere.filter(function(g){ return g.level===lvl; }).length;
      var label;
      if (isWarlock && lvl > 0) {
        label = 'Spells Known ('+total+'/'+warlockMaxKnown+')';
      } else {
        label = lvl===0 ? 'Cantrips' : lvl+(lvl===1?'st':lvl===2?'nd':lvl===3?'rd':'th')+' Level';
        label += ' ('+total+'/'+max+(bonusCount?' +'+bonusCount+' bonus':'')+')';
      }
      h += '<div class="class-spells-selected-group"><div class="class-spells-selected-label">'+label+'</div>';
      sps.forEach(function(item){
        var sp = item.spell;
        var isGranted = item.type === 'granted';
        var isBonus = item.bonus;
        var si = (sp.school||'evocation').toLowerCase();
        h += '<div class="class-spells-selected-row '+(isGranted?'granted':'')+(isBonus?' bonus':'')+'">';
        h += '<img src="/static/img/spell-schools/'+si+'.png" alt="" width="16" height="16" onerror="this.style.display=\'none\'">';
        h += '<span class="class-spells-selected-name">'+esc(sp.name||sp.spellName)+'</span>';
        if (isGranted) h += '<span class="class-spells-selected-source">'+esc(item.source||'Granted')+'</span>';
        if (!isGranted) h += '<span class="class-spells-selected-remove" onclick="toggleSpell(\''+esc(sp.id)+'\','+sp.level+','+idx+')">&#10005;</span>';
        h += '</div>';
      });
      h += '</div>';
    });
  }

  h += '</div>';
  return h;
}

function renderClassSpellPicker(idx, c) {
  var classSpells = getClassSpellsForPicker(c);
  if (!classSpells) return '';

  var isWarlock = c.id === 'warlock';
  var warlockMaxSpellLevel = isWarlock ? getMaxSpellLevel('warlock', c.level) : 9;
  var warlockSpellsKnown = isWarlock ? getSpellsKnown('warlock', c.level) : null;
  var warlockCantripsKnown = isWarlock ? getCantripsKnown('warlock', c.level) : 0;

  // Collect all warlock-available spells up to max spell level
  var allCantrips = [], allSpells = [];
  Object.keys(classSpells).forEach(function(lvl){
    var ilvl = parseInt(lvl,10);
    if (isWarlock && ilvl > c.level) return;
    if (isWarlock && ilvl > warlockMaxSpellLevel) return;
    classSpells[lvl].cantrips.forEach(function(sid){ if (allCantrips.indexOf(sid)===-1) allCantrips.push(sid); });
    classSpells[lvl].spells.forEach(function(sid){ if (allSpells.indexOf(sid)===-1) allSpells.push(sid); });
  });

  // Filter spells - only those up to max spell level
  allCantrips = allCantrips.filter(function(sid){ var sp=content.spells[sid]; return sp && (sp.level||0) <= warlockMaxSpellLevel; });
  allSpells = allSpells.filter(function(sid){ var sp=content.spells[sid]; return sp && sp.level <= warlockMaxSpellLevel; });

  // Get granted spells for this class
  var granted = getGrantedSpells();
  var classSpellIds = allCantrips.concat(allSpells);
  var grantedHere = granted.filter(function(g){ return classSpellIds.indexOf(g.id) !== -1; });
  var bonusGranted = grantedHere.filter(function(g){ return g.bonus; });

  // User-picked spells that belong to this class
  var pickedIds = state.spells.filter(function(sid){ return classSpellIds.indexOf(sid) !== -1; });
  var pickedByLevel = {};
  pickedIds.forEach(function(sid){ var sp=content.spells[sid]; if(sp) pickedByLevel[sp.level] = (pickedByLevel[sp.level]||0)+1; });

  // Count warlock-specific: leveled known and cantrips
  var warlockCurrentKnown = pickedIds.filter(function(sid){var sp=content.spells[sid];return sp&&sp.level>=1;}).length;
  var pickedCantrips = pickedIds.filter(function(sid){var sp=content.spells[sid];return sp&&sp.level===0;}).length;

  // Collect Mystic Arcanum spells (level 11+)
  var mysticArcanum = [];
  if (isWarlock && c.level >= 11) {
    var warlockClass = content.classes.find(function(cl){return cl.id==='warlock';});
    if (warlockClass && warlockClass.levels) {
      var arcanumLevels = [
        {classLevel: 11, spellLevel: 6},
        {classLevel: 13, spellLevel: 7},
        {classLevel: 15, spellLevel: 8},
        {classLevel: 17, spellLevel: 9}
      ];
      arcanumLevels.forEach(function(a){
        if (c.level >= a.classLevel) {
          var levelData = warlockClass.levels.find(function(l){return l.level===a.classLevel;});
          if (levelData && levelData.mysticArcanum) {
            Object.keys(levelData.mysticArcanum).forEach(function(spellLevel){
              levelData.mysticArcanum[spellLevel].forEach(function(spellName){
                var sp = content.spellsByName[spellName];
                if (sp && mysticArcanum.indexOf(sp)===-1) mysticArcanum.push(sp);
              });
            });
          }
        }
      });
    }
  }

  // Group leveled spells by level for Pool Base
  var byLevel = {};
  allSpells.forEach(function(sid){
    var sp = content.spells[sid];
    if (!sp) return;
    var lv = sp.level||1;
    if (!byLevel[lv]) byLevel[lv] = [];
    byLevel[lv].push(sp);
  });

  var spellSlots = getSpellSlots();
  var maxKnown = getMaxSpellsKnownPerLevel();

  var h = '';

  // ====== Known Spells section (top, warlock only) ======
  if (isWarlock) {
    h += '<div class="class-spells-selected">';
    h += '<div class="spell-known-section">';
    h += '<div class="spell-section-header">Known Spells <span class="section-sub">'+warlockCurrentKnown+' of '+warlockSpellsKnown+' (cantrips: '+pickedCantrips+')</span></div>';
    if (pickedIds.length) {
      var pickedByLevelDisplay = {};
      pickedIds.forEach(function(sid){
        var sp = content.spells[sid];
        if (sp) {
          var lv = sp.level||0;
          if (!pickedByLevelDisplay[lv]) pickedByLevelDisplay[lv] = [];
          pickedByLevelDisplay[lv].push(sp);
        }
      });
      Object.keys(pickedByLevelDisplay).sort(function(a,b){return a-b;}).forEach(function(lvlStr){
        var lvl = parseInt(lvlStr,10);
        var suffix = lvl===0?'':(lvl===1?'st':lvl===2?'nd':lvl===3?'rd':'th');
        var label = lvl===0?'Cantrips':lvl+suffix+' Level';
        h += '<div class="spell-level-group"><div class="spell-level-header">'+label+'</div>';
        pickedByLevelDisplay[lvl].forEach(function(sp){ h += renderClassPickedRow(sp, idx); });
        h += '</div>';
      });
    } else {
      h += '<div class="empty-state">No spells selected. Choose from Available Spells below.</div>';
    }
    h += '</div>';
    h += '</div>';
  }

  // ====== Available Spells ======
  h += '<div class="class-spell-picker" data-class="'+idx+'">';

  // Search
  h += '<div class="picker-search" style="margin-bottom:8px">';
  h += '<input class="form-input picker-search-input" type="text" placeholder="Search spells..." oninput="filterClassSpells(this.value,'+idx+')">';
  h += '</div>';

  // ====== Pool Base ======
  h += '<div class="spell-pool-base">';

  // Cantrips
  if (allCantrips.length) {
    var cantripMax = maxKnown[0] || spellSlots.cantrips;
    var cantripPicked = pickedByLevel[0]||0;
    h += '<div class="spell-level-group"><div class="spell-level-header">Cantrips ('+cantripPicked+'/'+cantripMax+')</div>';
    allCantrips.forEach(function(sid){ var sp=content.spells[sid]; if(sp) h+=renderClassSpellRow(sp, idx); });
    h += '</div>';
  }

  // Leveled spells grouped by level
  Object.keys(byLevel).sort(function(a,b){return a-b;}).forEach(function(lvlStr){
    var lvl = parseInt(lvlStr,10);
    var pickable = byLevel[lvl] || [];
    var max = maxKnown[lvl] || spellSlots.slots[lvl-1] || 0;
    var total = pickedByLevel[lvl]||0;
    var suffix = lvl===1?'st':lvl===2?'nd':lvl===3?'rd':'th';
    h += '<div class="spell-level-group"><div class="spell-level-header">'+lvl+suffix+' Level ('+total+'/'+max+')</div>';
    pickable.forEach(function(sp){ h += renderClassSpellRow(sp, idx); });
    h += '</div>';
  });

  h += '</div>';

  // ====== Mystic Arcanum ======
  if (mysticArcanum.length) {
    h += '<div class="spell-subclass-section">';
    h += '<div class="spell-section-header">Subclass Spells <span class="section-sub">Mystic Arcanum - do not count against spells known limit</span></div>';
    var maByLevel = {};
    mysticArcanum.forEach(function(sp){
      var lv = sp.level||6;
      if (!maByLevel[lv]) maByLevel[lv] = [];
      maByLevel[lv].push(sp);
    });
    Object.keys(maByLevel).sort(function(a,b){return a-b;}).forEach(function(lvlStr){
      var lvl = parseInt(lvlStr,10);
      var suffix = lvl===1?'st':lvl===2?'nd':lvl===3?'rd':'th';
      h += '<div class="spell-level-group"><div class="spell-level-header">'+lvl+suffix+' Level (Mystic Arcanum)</div>';
      maByLevel[lvl].forEach(function(sp){ h += renderClassGrantedRow({id:sp.id, name:sp.name, school:sp.school, level:sp.level, source:'Mystic Arcanum', bonus:true}, idx); });
      h += '</div>';
    });
    h += '</div>';
  }

  // ====== Warlock prep note ======
  if (isWarlock) {
    h += '<div class="warlock-prep-note">';
    h += '<strong>Preparation:</strong> Warlocks do not prepare spells daily. ';
    h += 'All spells listed above (Subclass + Known) are always available to cast with Pact slots.';
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function renderClassSpellRow(sp, idx) {
  var isSelected = state.spells.indexOf(sp.id) !== -1;
  var schoolImg = (sp.school||'evocation').toLowerCase();
  var tags = '';
  if (sp.concentration) tags += ' &middot; Concentration';
  if (sp.ritual) tags += ' &middot; Ritual';
  if (sp.damage) tags += ' &middot; '+esc(sp.damage);
  if (sp.save) tags += ' &middot; Save '+esc(sp.save);
  if (sp.attack) tags += ' &middot; Attack';
  var rec = isSpellRecommended(sp);
  var isWarlock = state.classes[idx] && state.classes[idx].id === 'warlock';
  var maxSpellLevel = isWarlock ? getMaxSpellLevel('warlock', state.classes[idx].level) : 9;
  var disabled = sp.level > maxSpellLevel;
  var isClassSpell = isWarlock && sp.level <= maxSpellLevel;
  var h = '<div class="picker-row spell-picker-row class-spell-picker-row'+(isSelected?' selected':'')+(disabled?' disabled':'')+(rec?' recommended':'')+(isClassSpell?' class-spell':'')+'" data-name="'+esc((sp.name||'').toLowerCase())+'" onclick="'+(disabled?'':'openSpellDetailModal(\''+esc(sp.id)+'\','+idx+')')+'">';
  h += '<div class="picker-row-icon"><img src="/static/img/spell-schools/'+schoolImg+'.png" alt="'+esc(sp.school)+'" width="28" height="28" onerror="this.style.display=\'none\'"></div>';
  h += '<div class="picker-row-info">';
  h += '<div class="picker-row-name">'+esc(sp.name)+'</div>';
  h += '<div class="picker-row-meta">'+(SPELL_SCHOOLS[sp.school]||(sp.level===0?'Cantrip':'Level '+sp.level))+' &middot; '+esc(sp.castingTime||'1 action')+' &middot; '+esc(sp.range||'Self')+tags+'</div>';
  h += '</div>';
  h += (rec?'<div class="picker-row-badge" title="'+esc(rec)+'">Recommended</div>':'');
  if (isClassSpell) h += '<div class="picker-row-badge class-spell-badge" title="Warlock spell">Warlock</div>';
  h += '<div class="picker-row-arrow">'+(isSelected?'&#10003;':(disabled?'&#9888;':'+'))+'</div>';
  h += '</div>';
  return h;
}

function renderClassGrantedRow(g, idx) {
  var sp = content.spells[g.id] || g;
  var schoolImg = (sp.school||'evocation').toLowerCase();
  var tags = '';
  if (sp.concentration) tags += ' &middot; Concentration';
  if (sp.ritual) tags += ' &middot; Ritual';
  if (sp.damage) tags += ' &middot; '+esc(sp.damage);
  if (sp.save) tags += ' &middot; Save '+esc(sp.save);
  if (sp.attack) tags += ' &middot; Attack';
  var rec = isSpellRecommended(sp);
  var h = '<div class="picker-row spell-picker-row class-spell-picker-row granted'+(rec?' recommended':'')+'" data-name="'+esc((sp.name||'').toLowerCase())+'">';
  h += '<div class="picker-row-icon"><img src="/static/img/spell-schools/'+schoolImg+'.png" alt="'+esc(sp.school)+'" width="28" height="28" onerror="this.style.display=\'none\'"></div>';
  h += '<div class="picker-row-info">';
  h += '<div class="picker-row-name">'+esc(sp.name)+' &#10003;</div>';
  h += '<div class="picker-row-meta">'+(SPELL_SCHOOLS[sp.school]||(sp.level===0?'Cantrip':'Level '+sp.level))+' &middot; '+esc(sp.castingTime||'1 action')+' &middot; '+esc(sp.range||'Self')+tags+'</div>';
  h += '</div>';
  h += '<div class="picker-row-source">'+esc(g.source||'Granted')+'</div>';
  h += (rec?'<div class="picker-row-badge" title="'+esc(rec)+'">Recommended</div>':'');
  h += '</div>';
  return h;
}
function renderClassPickedRow(sp, idx) {
  var schoolImg = (sp.school||'evocation').toLowerCase();
  var h = '<div class="picked-row">';
  h += '<div class="picked-row-icon"><img src="/static/img/spell-schools/'+schoolImg+'.png" width="20" height="20" onerror="this.style.display=\'none\'"></div>';
  h += '<div class="picked-row-info">';
  h += '<div class="picked-row-name">'+esc(sp.name)+'</div>';
  h += '<div class="picked-row-meta">'+(SPELL_SCHOOLS[sp.school]||(sp.level===0?'Cantrips':'Level '+sp.level))+'</div>';
  h += '</div>';
  h += '<button class="picked-row-remove" onclick="toggleSpell(\''+esc(sp.id)+'\','+sp.level+','+idx+')" title="Remove">&#10005;</button>';
  h += '</div>';
  return h;
}
function renderSpellDetailModal(spellId, classIdx) {
  var sp = content.spells[spellId];
  if (!sp) return '';
  var c = state.classes[classIdx];
  var isWarlock = c && c.id === 'warlock';
  var maxLevel = isWarlock ? getMaxSpellLevel('warlock', c.level) : 9;
  var canLearn = !isWarlock || sp.level <= maxLevel;
  var isSelected = state.spells.indexOf(sp.id) !== -1;
  var isGranted = false;
  var granted = getGrantedSpells();
  for (var i = 0; i < granted.length; i++) {
    if (granted[i].id === sp.id) { isGranted = true; break; }
  }

  var h = '<div class="class-popup-overlay" onclick="closeSpellDetailModal(event)">';
  h += '<div class="class-popup" onclick="event.stopPropagation()">';
  h += '<div class="popup-hdr">';
  h += '<div class="popup-class-name">'+esc(sp.name)+'</div>';
  h += '<div class="popup-class-sub">'+(sp.level===0?'Cantrip':'Level '+sp.level)+' '+esc(SPELL_SCHOOLS[sp.school]||sp.school)+'</div>';
  h += '<button class="popup-close" onclick="closeSpellDetailModal(event)">&#10005;</button>';
  h += '</div>';
  h += '<div class="popup-body">';
  h += '<div class="popup-section">';
  h += '<div class="spell-detail-meta">';
  h += '<div><strong>School:</strong> '+esc(SPELL_SCHOOLS[sp.school]||sp.school)+'</div>';
  h += '<div><strong>Casting Time:</strong> '+esc(sp.castingTime||'1 action')+'</div>';
  h += '<div><strong>Range:</strong> '+esc(sp.range||'Self')+'</div>';
  h += '<div><strong>Duration:</strong> '+esc(sp.duration||'Instantaneous')+'</div>';
  if (sp.concentration) h += '<span class="tag tag-concentration">Concentration</span>';
  if (sp.ritual) h += '<span class="tag tag-ritual">Ritual</span>';
  if (sp.damage) h += '<div><strong>Damage:</strong> '+esc(sp.damage)+'</div>';
  if (sp.save) h += '<div><strong>Save:</strong> '+esc(sp.save)+'</div>';
  if (sp.attack) h += '<div><strong>Attack:</strong> Ranged/Melee Spell Attack</div>';
  h += '</div>';
  if (sp.description) {
    h += '<div class="popup-section">';
    h += '<h3 class="popup-section-title">Description</h3>';
    h += '<div class="spell-description">'+esc(sp.description)+'</div>';
  }
  h += '</div>';
  h += '<div class="popup-footer">';
  h += '<div class="popup-footer-left">';
  if (isSelected) {
    h += '<span class="popup-hp-preview">Already in spellbook</span>';
  } else if (!canLearn) {
    h += '<span class="popup-hp-preview" style="color:var(--red)">Too high level (max '+maxLevel+')</span>';
  } else if (isGranted) {
    h += '<span class="popup-hp-preview">Granted automatically</span>';
  }
  h += '</div>';
  h += '<div class="popup-footer-right">';
  if (!isSelected && canLearn && !isGranted) {
    h += '<button class="btn btn-primary" onclick="confirmSpellSelection(\''+esc(sp.id)+'\','+sp.level+','+classIdx+')">Add to Spellbook</button>';
  }
  h += '<button class="btn" onclick="closeSpellDetailModal(event)">Close</button>';
  h += '</div></div></div></div>';
  return h;
}

function openSpellDetailModal(spellId, classIdx) {
  var modalHtml = renderSpellDetailModal(spellId, classIdx);
  var overlay = document.createElement('div');
  overlay.id = 'spell-detail-popup-container';
  overlay.className = 'class-popup-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) closeSpellDetailModal(e); };
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  setTimeout(function() { document.querySelector('#spell-detail-popup-container .class-popup').classList.add('open'); }, 10);
}

function closeSpellDetailModal(e) {
  if (e && e.target && !e.target.classList.contains('class-popup-overlay') && !e.target.classList.contains('popup-close')) return;
  var container = document.getElementById('spell-detail-popup-container');
  if (container) container.remove();
  document.body.classList.remove('modal-open');
}

function getWarlockSpellIds(c) {
  var classSpells = getClassSpellsForPicker(c);
  if (!classSpells) return [];
  var maxLevel = getMaxSpellLevel('warlock', c.level);
  var ids = [];
  Object.keys(classSpells).forEach(function(lvl){
    var ilvl = parseInt(lvl,10);
    if (ilvl > maxLevel) return;
    classSpells[lvl].cantrips.forEach(function(sid){ if (ids.indexOf(sid)===-1) ids.push(sid); });
    classSpells[lvl].spells.forEach(function(sid){ if (ids.indexOf(sid)===-1) ids.push(sid); });
  });
  return ids;
}

function confirmSpellSelection(spellId, level, classIdx) {
  var c = state.classes[classIdx];
  if (!c) { closeSpellDetailModal(); return; }
  var isWarlock = c.id === 'warlock';
  if (isWarlock) {
    var maxKnown = getSpellsKnown('warlock', c.level);
    var warlockIds = getWarlockSpellIds(c);
    var currentKnown = state.spells.filter(function(s){return warlockIds.indexOf(s)!==-1 && content.spells[s] && content.spells[s].level>=1;}).length;
    if (currentKnown >= maxKnown) {
      alert('Maximum '+maxKnown+' spells known for Warlock level '+c.level+'.');
      closeSpellDetailModal();
      return;
    }
  }
  if (state.spells.indexOf(spellId) === -1) {
    state.spells.push(spellId);
  }
  closeSpellDetailModal();
  renderClass(getMain());
}

function toggleSpell(spellId, level, classIdx) {
  var c = state.classes[classIdx];
  var isWarlock = c && c.id === 'warlock';
  
  var idx = state.spells.indexOf(spellId);
  if (idx !== -1) {
    state.spells.splice(idx, 1);
  } else {
    if (isWarlock) {
      var maxKnown = getSpellsKnown('warlock', c.level);
      var warlockIds = getWarlockSpellIds(c);
      var currentKnown = state.spells.filter(function(s){return warlockIds.indexOf(s)!==-1 && content.spells[s] && content.spells[s].level>=1;}).length;
      if (currentKnown >= maxKnown) { alert('Maximum '+maxKnown+' spells known for Warlock level '+c.level+'.'); return; }
      var maxLevel = getMaxSpellLevel('warlock', c.level);
      var sp = content.spells[spellId];
      if (sp && sp.level > maxLevel) { alert('Cannot learn spells above level '+maxLevel+' at Warlock level '+c.level+'.'); return; }
    } else {
      var maxKnown = getMaxSpellsKnownPerLevel();
      var spellSlots = getSpellSlots();
      var max = level === 0 ? (maxKnown[0] || spellSlots.cantrips) : (maxKnown[level] || spellSlots.slots[level-1] || 0);
      var currentCount = 0;
      state.spells.forEach(function(s){var sp=content.spells[s];if(sp&&sp.level===level) currentCount++;});
      var granted = getGrantedSpells();
      granted.forEach(function(g){if(!g.bonus && g.level===level) currentCount++;});
      if (currentCount >= max) { alert('Maximum '+max+' spells at level '+level+'.'); return; }
    }
    state.spells.push(spellId);
  }
  if (classIdx !== undefined && state.classes[classIdx]) {
    renderClass(getMain());
  } else {
    renderAllSpells();
  }
}

function filterClassSpells(query, classIdx) {
  query = (query||'').toLowerCase();
  var details = document.getElementById('class-spell-details-'+classIdx);
  if (!details) return;
  if (query) details.open = true;
  var rows = details.querySelectorAll('.class-spell-picker-row');
  rows.forEach(function(r){
    var name = r.getAttribute('data-name')||'';
    r.style.display = name.indexOf(query)!==-1 ? '' : 'none';
  });
}


function filterSpells(query) {
  query = (query||'').toLowerCase();
  var rows = document.querySelectorAll('.spell-picker-row:not(.granted)');
  rows.forEach(function(r){
    var name = r.getAttribute('data-name')||'';
    r.style.display = name.indexOf(query)!==-1 ? '' : 'none';
  });
}


function confirmSpells() { goTo(11); }

// ─── 11: Sheet ───
function renderSheet(main) {
  if (state.result) { renderSheetView(main); return; }
  main.innerHTML = '<h2 class="sec-title">Building Character...</h2>'
    + '<p class="sec-subtitle">Please wait while we compile your sheet.</p>'
    + '<div style="text-align:center;padding:32px"><div class="spinner"></div></div>';
  buildCharacter();
}
async function buildCharacter() {
  var classes = state.classes.map(function(c){return {id:c.id, level:c.level};});
  if (classes.length === 0) classes.push({id:'fighter', level:1});
  var body = {
    name: state.name,
    classes: classes,
    speciesId: state.speciesId,
    backgroundId: state.backgroundId,
    abilityMethod: state.abilityMethod,
    abilityScores: state.abilities,
    skills: state.skills,
    feats: state.feats,
    spells: state.spells,
  };
  if (state.speciesVariant) body.speciesVariant = state.speciesVariant;
  try {
    var r = await fetch('/api/build',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if (!r.ok) { var err = await r.json(); throw new Error(err.error||'Build failed'); }
    state.result = await r.json();
    renderSheetView(getMain());
  } catch(e) {
    main.innerHTML = '<h2 class="sec-title">Build Error</h2>'
      + '<div class="card" style="border-color:var(--danger)"><div class="card-title" style="color:var(--danger)">'+esc(e.message)+'</div></div>'
      + '<div class="actions"><button class="btn btn-primary" onclick="state.result=null;goTo(5)">Fix Abilities</button></div>';
  }
}

function renderSheetView(main) {
  var c = state.result;
  if (!c || !c.sheet) return;
  var sheet = c.sheet;
  var abs = sheet.abilityScores || state.abilities;
  var hp = sheet.hp ? sheet.hp.max : 0;
  var hpCurrent = sheet.hp ? sheet.hp.current : hp;
  var ac = sheet.ac || 10;
  var initBonus = sheet.initBonus !== undefined ? sheet.initBonus : abMod(abs.DEX || 10);
  var prof = sheet.proficiencyBonus || 2;
  var speed = sheet.speed || 30;
  var profSkills = {};
  if (sheet.skills) {
    Object.keys(sheet.skills).forEach(function(sk) {
      if (sheet.skills[sk].proficiency && sheet.skills[sk].proficiency !== 'none') {
        profSkills[sk] = sheet.skills[sk];
      }
    });
  }
  var allSkillsList = [
    {id:'acrobatics',ab:'DEX'},{id:'animal-handling',ab:'WIS'},{id:'arcana',ab:'INT'},
    {id:'athletics',ab:'STR'},{id:'deception',ab:'CHA'},{id:'history',ab:'INT'},
    {id:'insight',ab:'WIS'},{id:'intimidation',ab:'CHA'},{id:'investigation',ab:'INT'},
    {id:'medicine',ab:'WIS'},{id:'nature',ab:'INT'},{id:'perception',ab:'WIS'},
    {id:'performance',ab:'CHA'},{id:'persuasion',ab:'CHA'},{id:'religion',ab:'INT'},
    {id:'sleight-of-hand',ab:'DEX'},{id:'stealth',ab:'DEX'},{id:'survival',ab:'WIS'}
  ];

  // Ability scores with icons - D&D Beyond style
  var absHtml = '';
  ['STR','DEX','CON','INT','WIS','CHA'].forEach(function(a){
    var v = abs[a]||10;
    var mod = abMod(v);
    var saveVal = sheet.savingThrows && sheet.savingThrows[a] !== undefined ? sheet.savingThrows[a] : mod;
    var isSaveProf = sheet.savingThrows && sheet.savingThrows[a] !== undefined && sheet.savingThrows[a] !== mod;
    absHtml += '<div class="db-ability">'
      + '<div class="db-ability-icon"><img src="/static/img/abilities/'+a.toLowerCase()+'.svg" alt="'+a+'"></div>'
      + '<div class="db-ability-score">'+v+'</div>'
      + '<div class="db-ability-mod">'+fmtMod(mod)+'</div>'
      + '<div class="db-ability-save'+(isSaveProf?' prof':'')+'">'+fmtMod(saveVal)+'</div>'
      + '</div>';
  });

  // Skills - D&D Beyond style
  var skillsHtml = '';
  allSkillsList.forEach(function(sk){
    var skData = sheet.skills && sheet.skills[sk.id];
    var total = skData ? skData.total : abMod(abs[sk.ab]||10);
    var isProf = profSkills[sk.id];
    skillsHtml += '<div class="db-skill'+(isProf?' prof':'')+'">'
      + '<span class="db-skill-prof">'+(isProf?'●':'○')+'</span>'
      + '<span class="db-skill-name">'+skillLabel(sk.id)+'</span>'
      + '<span class="db-skill-val">'+fmtMod(total)+'</span>'
      + '<span class="db-skill-abil">'+sk.ab+'</span>'
      + '</div>';
  });

  // Features
  var featsHtml = '';
  (c.features||[]).forEach(function(f){
    featsHtml += '<div class="db-feature">'
      + '<div class="db-feature-name">'+esc(f.name||f)+'</div>'
      + (f.class ? '<div class="db-feature-source">'+esc(f.class)+' '+f.level+'</div>' : '')
      + '</div>';
  });
  if (!featsHtml) featsHtml = '<div class="db-empty">No features</div>';

  // Spells — group by level
  var spellsHtml = '';
  var granted = getGrantedSpells();
  var userSpells = state.spells.map(function(s){ return content.spells[s]; }).filter(function(s){ return s; });
  var allSpells = granted.concat(userSpells.map(function(s){ return {id:s.id, name:s.name, school:s.school, level:s.level, source:'Known'}; }));
  if (allSpells.length > 0) {
    spellsHtml = '<div class="db-section"><div class="db-section-title">Spells</div>';
    var groups = {};
    allSpells.forEach(function(sp){
      var key = sp.level === 0 ? 'cantrips' : 'level'+sp.level;
      if (!groups[key]) groups[key] = [];
      groups[key].push(sp);
    });
    if (groups.cantrips) {
      spellsHtml += '<div class="db-spell-group"><div class="db-spell-group-label">Cantrips</div>';
      groups.cantrips.forEach(function(sp){
        spellsHtml += '<div class="db-spell"><span class="db-spell-name">'+esc(sp.name)+'</span><span class="db-spell-school">'+esc(sp.school||'')+'</span></div>';
      });
      spellsHtml += '</div>';
    }
    for (var lv = 1; lv <= 9; lv++) {
      var key = 'level'+lv;
      if (groups[key]) {
        var suffix = lv===1?'st':lv===2?'nd':lv===3?'rd':'th';
        spellsHtml += '<div class="db-spell-group"><div class="db-spell-group-label">'+lv+suffix+' Level</div>';
        groups[key].forEach(function(sp){
          spellsHtml += '<div class="db-spell"><span class="db-spell-name">'+esc(sp.name)+'</span><span class="db-spell-school">'+esc(sp.school||'')+'</span></div>';
        });
        spellsHtml += '</div>';
      }
    }
    spellsHtml += '</div>';
  }

  // Spell slots - use API data with visual pips
  var spellSlotsHtml = '';
  if (sheet.spellSlots && Object.keys(sheet.spellSlots).length > 0) {
    spellSlotsHtml = '<div class="db-section"><div class="db-section-title">Spell Slots</div><div class="db-slots">';
    for (var lv = 1; lv <= 9; lv++) {
      if (sheet.spellSlots[lv] && sheet.spellSlots[lv].total > 0) {
        var sfx = lv===1?'st':lv===2?'nd':lv===3?'rd':'th';
        var slot = sheet.spellSlots[lv];
        spellSlotsHtml += '<div class="db-slot"><div class="db-slot-lv">'+lv+sfx+'</div><div class="db-slot-pips">';
        for (var p = 0; p < slot.total; p++) {
          var filled = p < slot.remaining ? ' used' : '';
          spellSlotsHtml += '<div class="db-slot-pip'+filled+'" title="'+(p < slot.remaining ? 'Used' : 'Available')+'"></div>';
        }
        spellSlotsHtml += '</div></div>';
      }
    }
    // Warlock Pact Magic
    var hasWarlock = state.classes.some(function(c){return c.id==='warlock';});
    if (hasWarlock) {
      var warlockLevel = 0;
      state.classes.forEach(function(c){ if(c.id==='warlock') warlockLevel = c.level; });
      var pactCount = warlockLevel >= 2 ? 2 : 1;
      var pactLevel = warlockLevel >= 9 ? 5 : warlockLevel >= 7 ? 4 : warlockLevel >= 5 ? 3 : warlockLevel >= 3 ? 2 : 1;
      spellSlotsHtml += '<div class="db-slot db-slot-pact"><div class="db-slot-lv">Pact '+pactLevel+sfx+'</div><div class="db-slot-pips">';
      for (var p = 0; p < pactCount; p++) {
        spellSlotsHtml += '<div class="db-slot-pip" title="Pact Magic"></div>';
      }
      spellSlotsHtml += '</div></div>';
    }
    spellSlotsHtml += '</div></div>';
  }

  // Gear
  var gearHtml = '';
  if (c.startingGear && c.startingGear.length) {
    gearHtml = '<div class="db-section"><div class="db-section-title">Equipment</div>';
    c.startingGear.forEach(function(g){ gearHtml += '<div class="db-gear-item">'+esc(g)+'</div>'; });
    gearHtml += '</div>';
  }

  // Attacks
  var attackHtml = '';
  if (sheet.attacks && sheet.attacks.length) {
    attackHtml = '<div class="db-section"><div class="db-section-title">Attacks</div>';
    sheet.attacks.forEach(function(a){
      attackHtml += '<div class="db-attack">'
        + '<span class="db-attack-name">'+esc(a.name)+'</span>'
        + '<span class="db-attack-bonus">+'+a.bonus+'</span>'
        + (a.damage ? '<span class="db-attack-dmg">'+esc(a.damage)+'</span>' : '')
        + '</div>';
    });
    attackHtml += '</div>';
  }

  // Level breakdown
  var levelBreakdown = state.classes.map(function(cls){ return (cls.data?cls.data.name:cls.id)+' '+cls.level; }).join(' / ');
  var bgName = state.backgroundData ? state.backgroundData.name : state.backgroundId || '';
  var speciesName = state.speciesVariant || state.speciesId || '';

  main.innerHTML = ''
    // HEADER
    + '<div class="db-header">'
    + '  <div class="db-header-main">'
    + '    <h1 class="db-char-name">'+esc(state.name)+'</h1>'
    + '    <div class="db-char-meta">'+esc(levelBreakdown)+' · '+esc(speciesName)+' · '+esc(bgName)+'</div>'
    + '  </div>'
    + '</div>'
    // STAT BAR
    + '<div class="db-stats">'
    + '  <div class="db-stat"><span class="db-stat-label">HP</span><span class="db-stat-val db-hp">'+hpCurrent+' / '+hp+'</span></div>'
    + '  <div class="db-stat"><span class="db-stat-label">AC</span><span class="db-stat-val">'+ac+'</span></div>'
    + '  <div class="db-stat"><span class="db-stat-label">Init</span><span class="db-stat-val">'+fmtMod(initBonus)+'</span></div>'
    + '  <div class="db-stat"><span class="db-stat-label">Prof</span><span class="db-stat-val">+'+prof+'</span></div>'
    + '  <div class="db-stat"><span class="db-stat-label">Speed</span><span class="db-stat-val">'+speed+' ft</span></div>'
    + '</div>'
    // BODY - 3 columns like D&D Beyond
    + '<div class="db-body">'
    // LEFT: Abilities + Skills
    + '<div class="db-col db-col-left">'
    + '  <div class="db-section"><div class="db-section-title">Ability Scores</div><div class="db-abilities">'+absHtml+'</div></div>'
    + '  <div class="db-section"><div class="db-section-title">Skills</div><div class="db-skills">'+skillsHtml+'</div></div>'
    + '</div>'
    // MIDDLE: Features, Attacks
    + '<div class="db-col db-col-mid">'
    + '  <div class="db-section"><div class="db-section-title">Features & Traits</div><div class="db-features">'+featsHtml+'</div></div>'
    + '  '+attackHtml
    + '</div>'
    // RIGHT: Spells, Spell Slots, Gear
    + '<div class="db-col db-col-right">'
    + '  '+spellsHtml
    + '  '+spellSlotsHtml
    + '  '+gearHtml
    + '</div>'
    + '</div>'
    // ACTIONS
    + '<div class="db-actions">'
    + '  <button class="btn btn-gold" onclick="goTo(1)">Edit</button>'
    + '  <button class="btn btn-primary" onclick="saveCharacter()">Save</button>'
    + '  <button class="btn" onclick="showCharacterList()">Load</button>'
    + '  <button class="btn btn-danger" onclick="startOver()">New</button>'
    + '</div>';
}
function startOver() {
  state = {step:1,name:'',classes:[],backgroundId:null,backgroundData:null,speciesId:null,speciesVariant:null,subclassId:null,level:1,abilityMethod:'standard-array',rolledScores:[],abilities:{},skills:[],feats:[],equipment:[],spells:[],result:null};
  goTo(1);
}

// ─── Character Storage ──────────────────────────────────────
async function saveCharacter() {
  var charData = {
    name: state.name,
    classes: state.classes.map(function(c){
      return {id:c.id, name:c.data?c.data.name:c.id, level:c.level, subclassId:c.subclassId||''};
    }),
    backgroundId: state.backgroundId || '',
    backgroundName: state.backgroundData ? state.backgroundData.name : '',
    speciesId: state.speciesId || '',
    speciesVariant: state.speciesVariant || '',
    speciesHybrid: state.speciesHybrid || '',
    level: getTotalLevel(),
    abilityMethod: state.abilityMethod,
    abilities: state.abilities,
    skills: state.skills,
    spells: state.spells,
    feats: state.feats,
    equipment: state.equipment,
    subclassId: state.subclassId || '',
    bgAlignment: state.bgAlignment || '',
    bgFaith: state.bgFaith || '',
    bgTrait: state.bgTrait || '',
    bgIdeal: state.bgIdeal || '',
    bgBond: state.bgBond || '',
    bgFlaw: state.bgFlaw || '',
    bgAge: state.bgAge || '',
    bgHeight: state.bgHeight || '',
    bgWeight: state.bgWeight || '',
    bgEyes: state.bgEyes || '',
    bgSkin: state.bgSkin || '',
    bgHair: state.bgHair || '',
    bgNotes: state.bgNotes || '',
    xp: state.xp || 0,
    progressionType: state.progressionType || 'milestone'
  };
  try {
    var r = await fetch('/api/characters/' + encodeURIComponent(state.name), {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(charData)
    });
    var resp = await r.json();
    if (resp.status === 'saved') {
      showSaveNotification('Character saved successfully!');
    }
  } catch(e) {
    showSaveNotification('Failed to save: ' + e.message, true);
  }
}

async function loadCharacter(name) {
  try {
    var r = await fetch('/api/characters/' + encodeURIComponent(name));
    if (!r.ok) throw new Error('Not found');
    var ch = await r.json();
    state.name = ch.name;
    state.classes = (ch.classes||[]).map(function(c){
      var cd = content.classes.find(function(x){return x.id===c.id;});
      return {id:c.id, level:c.level, subclassId:c.subclassId||null, data:cd||{name:c.name,id:c.id}};
    });
    state.backgroundId = ch.backgroundId;
    state.backgroundData = content.backgrounds.find(function(b){return b.id===ch.backgroundId;});
    state.speciesId = ch.speciesId;
    state.speciesVariant = ch.speciesVariant || null;
    state.speciesHybrid = ch.speciesHybrid || null;
    state.level = ch.level;
    state.abilityMethod = ch.abilityMethod || 'standard-array';
    state.abilities = ch.abilities || {};
    state.skills = ch.skills || [];
    state.spells = ch.spells || [];
    state.feats = ch.feats || [];
    state.equipment = ch.equipment || [];
    state.subclassId = ch.subclassId || null;
    state.bgAlignment = ch.bgAlignment || '';
    state.bgFaith = ch.bgFaith || '';
    state.bgTrait = ch.bgTrait || '';
    state.bgIdeal = ch.bgIdeal || '';
    state.bgBond = ch.bgBond || '';
    state.bgFlaw = ch.bgFlaw || '';
    state.bgAge = ch.bgAge || '';
    state.bgHeight = ch.bgHeight || '';
    state.bgWeight = ch.bgWeight || '';
    state.bgEyes = ch.bgEyes || '';
    state.bgSkin = ch.bgSkin || '';
    state.bgHair = ch.bgHair || '';
    state.bgNotes = ch.bgNotes || '';
    state.xp = ch.xp || 0;
    state.progressionType = ch.progressionType || 'milestone';
    goTo(8);
    showSaveNotification('Character loaded: ' + ch.name);
  } catch(e) {
    showSaveNotification('Failed to load: ' + e.message, true);
  }
}

async function listCharacters() {
  try {
    var r = await fetch('/api/characters');
    return await r.json();
  } catch(e) {
    return [];
  }
}

function showSaveNotification(msg, isError) {
  var n = document.createElement('div');
  n.className = 'save-notification' + (isError ? ' error' : '');
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(function(){ n.classList.add('show'); }, 10);
  setTimeout(function(){ n.classList.remove('show'); setTimeout(function(){ n.remove(); }, 300); }, 2500);
}

function getTotalLevel() {
  var total = 0;
  state.classes.forEach(function(c){ total += c.level; });
  return total;
}

async function showCharacterList() {
  var chars = await listCharacters();
  var h = '<div class="char-list-section">';
  h += '<h2 class="sec-title">Saved Characters</h2>';
  if (chars.length === 0) {
    h += '<p class="sec-subtitle">No saved characters yet. Create a new one!</p>';
  } else {
    h += '<div class="char-list">';
    chars.forEach(function(ch){
      h += '<div class="char-row" onclick="loadCharacter(\''+esc(ch.name)+'\')">';
      h += '<div class="char-row-info">';
      h += '<div class="char-row-name">'+esc(ch.name)+'</div>';
      h += '<div class="char-row-meta">Level '+ch.level+' &middot; '+esc(ch.classes)+' &middot; '+esc(ch.species)+'</div>';
      h += '</div>';
      h += '<div class="char-row-actions">';
      h += '<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteCharacter(\''+esc(ch.name)+'\')">&#10005;</button>';
      h += '</div>';
      h += '</div>';
    });
    h += '</div>';
  }
  h += '<div class="actions"><button class="btn btn-primary" onclick="goTo(1)">New Character</button></div>';
  h += '</div>';
  var main = getMain();
  main.innerHTML = h;
}

async function deleteCharacter(name) {
  if (!confirm('Delete "' + name + '"?')) return;
  try {
    await fetch('/api/characters/' + encodeURIComponent(name), {method:'DELETE'});
    showCharacterList();
  } catch(e) {
    showSaveNotification('Failed to delete', true);
  }
}

document.addEventListener('DOMContentLoaded', init);
