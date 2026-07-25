interface BackgroundPickerProps {
  backgrounds: any[];
  value: string;
  onChange: (id: string) => void;
  personalityState?: {
    alignment: string;
    faith: string;
    trait: string;
    ideal: string;
    bond: string;
    flaw: string;
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    notes: string;
  };
  onPersonalityChange?: (field: string, value: string) => void;
  errors?: string;
}

const BG_DETAILS: Record<string, { desc: string; feature: string; featureDesc: string; personalityTraits: string[]; ideals: string[]; bonds: string[]; flaws: string[] }> = {
  acolyte: { desc: 'You served the clergy of a temple, tending to sacred rites and assisting pilgrims.', feature: 'Magic Initiate (Cleric)', featureDesc: 'You learn two Cleric cantrips and one 1st-level Cleric spell.', personalityTraits: ['I idolize a particular hero of my faith.', 'I can find common ground between enemies.', 'I see omens in every event and action.', 'I am tolerant of other faiths.'], ideals: ['Tradition. The ancient traditions must be preserved.', 'Charity. I always try to help those in need.', 'Change. We must all embrace change.', 'Power. The strongest faiths command obedience.'], bonds: ['I would die to recover an ancient relic.', 'I will do anything to protect the temple where I served.', 'I seek to preserve a sacred text.', 'I owe my life to the priest who took me in.'], flaws: ['I judge others harshly.', 'I put too much trust in authority.', 'I am inflexible in my thinking.', 'I am blind to the faults of my faith.'] },
  artisan: { desc: 'You are a skilled crafter who creates goods of lasting value.', feature: 'Crafter', featureDesc: 'You can craft items at half cost.', personalityTraits: ['I believe anything worth doing is worth doing right.', 'I am always calm.', 'I am obsessed with a particular type of craft.', 'I never pass up a chance to bargain.'], ideals: ['Craft. My work is a reflection of who I am.', 'Commerce. The trade is all that matters.', 'Creativity. Every creation begins with an idea.', 'Community. I help my community thrive.'], bonds: ['I will do anything to prove my work is the finest.', 'I need to pay off a debt.', 'My tools are my most prized possession.', 'I seek to create something that will outlast me.'], flaws: ['I am never satisfied with my work.', 'I am argumentative.', 'I see only my way of doing things.', 'I am jealous of other artisans.'] },
  charlatan: { desc: 'You are a smooth talker and a con artist.', feature: 'Skilled', featureDesc: 'You gain proficiency in any three skills of your choice.', personalityTraits: ['I never let them see me coming.', 'I am a charming liar.', 'I flatter and cajole to get my way.', 'I am always looking for a mark.'], ideals: ['The rich deserve to lose their wealth.', 'Freedom. People should be free to do as they please.', 'Charm and deception are tools of survival.', 'I do everything for personal gain.'], bonds: ['I cheat a powerful person who is hunting me.', 'I swindled a noble out of their inheritance.', 'I owe a debt to a crime lord.', 'I am searching for someone who ruined my life.'], flaws: ['I have a weakness for vices.', 'I am too greedy.', 'I am deeply in debt.', 'I am overconfident.'] },
  criminal: { desc: 'You are an experienced criminal with contacts in the underworld.', feature: 'Alert', featureDesc: "You can't be surprised while conscious.", personalityTraits: ['I always have a plan.', 'I am always calm, even in danger.', 'I love a good fight.', 'I am ready to exploit others.'], ideals: ['The law is for the weak.', 'Independence. I answer to no one.', 'Power. I seek to control everything.', 'Loyalty. I am loyal to my allies.'], bonds: ['I am seeking revenge.', 'I owe my freedom to someone.', 'I am hiding from the law.', 'I am loyal to a criminal organization.'], flaws: ['I am violent and reckless.', 'I am deeply in debt.', 'I am addicted to something.', 'I am paranoid.'] },
  entertainer: { desc: 'You are a performer who thrives in the spotlight.', feature: 'Musician', featureDesc: 'You are proficient with a musical instrument.', personalityTraits: ['I am always ready to perform.', 'I can captivate anyone.', 'I am always looking for an audience.', 'I thrive on applause.'], ideals: ['Beauty. Art is the highest expression.', 'Creativity. Art should push boundaries.', 'Passion. I put my heart into every performance.', 'Fame. I seek to be known.'], bonds: ['I seek to impress someone.', 'I owe my career to a patron.', 'I am searching for a lost masterpiece.', 'I am haunted by a failed performance.'], flaws: ['I am vain.', 'I am jealous of other performers.', 'I am easily distracted by applause.', 'I am always looking for the spotlight.'] },
  farmer: { desc: 'You come from a simple life of tending the land.', feature: 'Tough', featureDesc: 'Your hit point maximum increases by twice your character level.', personalityTraits: ['I am always ready to lend a hand.', 'I am deeply connected to the land.', 'I am practical and resourceful.', 'I am slow to trust outsiders.'], ideals: ['Community. I help my neighbors.', 'Nature. The land provides.', 'Simplicity. A simple life is a good life.', 'Duty. I fulfill my obligations.'], bonds: ['I am protecting my family\'s farm.', 'I owe a debt to the community.', 'I am seeking to restore my family\'s honor.', 'I am haunted by a past failure.'], flaws: ['I am stubborn.', 'I am suspicious of outsiders.', 'I am quick to judge.', 'I am slow to change.'] },
  guard: { desc: 'You are a member of a local militia or city watch.', feature: 'Alert', featureDesc: "You can't be surprised while conscious.", personalityTraits: ['I am always vigilant.', 'I am quick to act in defense of others.', 'I am disciplined.', 'I am always ready for a fight.'], ideals: ['The law must be upheld.', 'Authority. I believe in the chain of command.', 'Protection. The weak must be protected.', 'Justice. Fair and equal treatment.'], bonds: ['I owe loyalty to the captain.', 'I am protecting the city.', 'I am seeking justice.', 'I am haunted by a past failure.'], flaws: ['I am too rigid.', 'I am quick to judge.', 'I am slow to trust.', 'I am always looking for a fight.'] },
  guide: { desc: 'You are a skilled tracker and survivalist.', feature: 'Magic Initiate (Druid)', featureDesc: 'You learn two Druid cantrips and one 1st-level Druid spell.', personalityTraits: ['I am always ready for the unexpected.', 'I am calm and patient in the wild.', 'I am always looking for a shortcut.', 'I am always looking for a new challenge.'], ideals: ['Nature. The wilds are sacred.', 'Freedom. The wilds are free for all.', 'Survival. The strongest survive.', 'Knowledge of the wilds is power.'], bonds: ['I am seeking a lost civilization.', 'I owe my life to a companion.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting of nature.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for adventure.'] },
  hermit: { desc: 'You have lived in seclusion.', feature: 'Healer', featureDesc: "You can use a healer's kit to restore HP.", personalityTraits: ['I am always looking for a new discovery.', 'I am deeply spiritual.', 'I am always looking for a challenge.', 'I am always looking for truth.'], ideals: ['Knowledge is power.', 'Solitude. Solitude brings clarity.', 'Truth. The highest virtue.', 'Enlightenment. Wisdom comes from within.'], bonds: ['I am seeking a lost truth.', 'I owe my life to someone.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting of others.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for truth.'] },
  merchant: { desc: 'You are a shrewd trader.', feature: 'Lucky', featureDesc: 'You have 3 Luck Points.', personalityTraits: ['I always get a fair deal.', 'I am always looking for opportunity.', 'I am always looking to help others.', 'I am always looking to get ahead.'], ideals: ['Commerce is the backbone of civilization.', 'Profit. The key to success.', 'Fairness. Fair trade.', 'Legacy. A good reputation is worth more than gold.'], bonds: ['I owe loyalty to my guild.', 'I am seeking a lost fortune.', 'I am haunted by a past failure.', 'I am protecting a family business.'], flaws: ['I am too trusting.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for a deal.'] },
  noble: { desc: 'You are a member of a noble family.', feature: 'Skilled', featureDesc: 'You gain proficiency in any three skills of your choice.', personalityTraits: ['I carry myself with dignity.', 'I am accustomed to getting my way.', 'I am always looking to improve my standing.', 'I am always looking to help others.'], ideals: ['Noblesse Oblige. Nobility comes with responsibility.', 'Power. Power is the key to change.', 'Tradition. Tradition must be preserved.', 'Legacy. My family name must be honored.'], bonds: ['I owe loyalty to my family.', 'I am seeking to restore my family\'s honor.', 'I am haunted by a past failure.', 'I am protecting a family secret.'], flaws: ['I am arrogant.', 'I am quick to judge.', 'I am slow to trust outsiders.', 'I am always looking to get ahead.'] },
  sage: { desc: 'You are a scholar dedicated to the pursuit of knowledge.', feature: 'Magic Initiate (Wizard)', featureDesc: 'You learn two cantrips and one 1st-level wizard spell.', personalityTraits: ['I am always looking for a new discovery.', 'I am always looking for a challenge.', 'I am always looking for truth.', 'I am always looking to help others.'], ideals: ['Knowledge is power.', 'Discovery. The highest virtue.', 'Truth. The highest virtue.', 'Enlightenment. Wisdom comes from within.'], bonds: ['I am seeking a lost truth.', 'I owe my life to someone.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for truth.'] },
  sailor: { desc: 'You have spent your life on the open sea.', feature: 'Tavern Brawler', featureDesc: 'You are proficient with improvised weapons and unarmed strikes.', personalityTraits: ['I am always ready for a fight.', 'I am always looking for adventure.', 'I am always looking for a new port.', 'I am always looking for a new story.'], ideals: ['The sea is the ultimate freedom.', 'Freedom. The sea is free for all.', 'Adventure. The sea is full of adventure.', 'Loyalty. Loyalty to my crew.'], bonds: ['I am seeking a lost treasure.', 'I owe my life to a companion.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for adventure.'] },
  soldier: { desc: 'You are a veteran of the battlefield.', feature: 'Savage Attacker', featureDesc: 'Once per turn when you hit with a melee weapon attack, you can reroll the damage dice.', personalityTraits: ['I am always ready for a fight.', 'I am always looking for a challenge.', 'I am always looking to help others.', 'I am always looking to get ahead.'], ideals: ['Discipline is the key to victory.', 'Discipline is the key to strength.', 'Honor is the key to respect.', 'Duty is the key to loyalty.'], bonds: ['I owe loyalty to my unit.', 'I am seeking revenge.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for a fight.'] },
  scribe: { desc: 'You are a meticulous record-keeper.', feature: 'Skilled', featureDesc: 'You gain proficiency in any three skills of your choice.', personalityTraits: ['I am always looking for discovery.', 'I am meticulous.', 'I am always looking for truth.', 'I am always looking to help others.'], ideals: ['Knowledge must be preserved.', 'Accuracy. Records must be precise.', 'Truth. The highest virtue.', 'Legacy. Knowledge must outlast us.'], bonds: ['I am seeking a lost truth.', 'I owe my life to someone.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am obsessed with details.'] },
  wayfarer: { desc: 'You are a traveler who lives on the road.', feature: 'Lucky', featureDesc: 'When you roll a 1 on a d20, you can reroll.', personalityTraits: ['I am always ready for adventure.', 'I am always looking for a new port.', 'I am always looking for a new story.', 'I am always looking for a new friend.'], ideals: ['The road is the ultimate freedom.', 'Freedom. The road is free for all.', 'Adventure. The road is full of adventure.', 'Loyalty. Loyalty to companions.'], bonds: ['I am seeking a lost treasure.', 'I owe my life to a companion.', 'I am haunted by a past failure.', 'I am protecting a sacred place.'], flaws: ['I am too trusting.', 'I am slow to trust outsiders.', 'I am quick to judge.', 'I am always looking for adventure.'] },
};

const ALIGNMENT_OPTIONS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

export function BackgroundPicker({ backgrounds, value, onChange, personalityState, onPersonalityChange, errors }: BackgroundPickerProps) {
  const selected = backgrounds.find(b => b.id === value);
  const details = value ? BG_DETAILS[value] : null;

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onPersonalityChange?.(field, e.currentTarget.value);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Background</label>
        <select
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value)}
          className="input"
        >
          <option value="">Select background</option>
          {backgrounds.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {errors && <p className="mt-1 text-sm text-red-600">{errors}</p>}
      </div>

      {selected && details && (
        <>
          <div className="p-4 bg-dnd-stone-50 dark:bg-dnd-stone-800/50 rounded-xl border border-dnd-stone-200 dark:border-dnd-stone-700 space-y-3">
            <p className="text-sm text-dnd-stone-700 dark:text-dnd-stone-300">{details.desc}</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-dnd-gold-100 dark:bg-dnd-gold-900/50 text-dnd-gold-800 dark:text-dnd-gold-300 font-medium">
                Feat: {selected.feat || details.feature}
              </span>
              {selected.skills?.map((s: string) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-dnd-blood-50 dark:bg-dnd-blood-900/30 text-dnd-blood-700 dark:text-dnd-blood-300">
                  {s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
              ))}
            </div>
            {details.feature && (
              <div className="mt-2 p-3 bg-white dark:bg-dnd-stone-900 rounded-lg border border-dnd-stone-200 dark:border-dnd-stone-700">
                <div className="font-medium text-sm text-dnd-stone-900 dark:text-dnd-stone-100">{details.feature}</div>
                <div className="text-xs text-dnd-stone-600 dark:text-dnd-stone-400 mt-1">{details.featureDesc}</div>
              </div>
            )}
          </div>

          {personalityState && onPersonalityChange && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3 uppercase tracking-wider">Alignment & Faith</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Alignment</label>
                    <select value={personalityState.alignment} onChange={setField('alignment')} className="input text-sm">
                      <option value="">Choose...</option>
                      {ALIGNMENT_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Faith / Deity</label>
                    <input type="text" value={personalityState.faith} onChange={setField('faith')} className="input text-sm" placeholder="e.g. Tempus, Pelor" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3 uppercase tracking-wider">Personality</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Trait</label>
                    <select value={personalityState.trait} onChange={setField('trait')} className="input text-sm">
                      <option value="">Choose...</option>
                      {details.personalityTraits.map((t, i) => <option key={i} value={String(i)}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Ideal</label>
                    <select value={personalityState.ideal} onChange={setField('ideal')} className="input text-sm">
                      <option value="">Choose...</option>
                      {details.ideals.map((t, i) => <option key={i} value={String(i)}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Bond</label>
                    <select value={personalityState.bond} onChange={setField('bond')} className="input text-sm">
                      <option value="">Choose...</option>
                      {details.bonds.map((t, i) => <option key={i} value={String(i)}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Flaw</label>
                    <select value={personalityState.flaw} onChange={setField('flaw')} className="input text-sm">
                      <option value="">Choose...</option>
                      {details.flaws.map((t, i) => <option key={i} value={String(i)}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3 uppercase tracking-wider">Physical Characteristics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label text-xs">Age</label>
                    <input type="text" value={personalityState.age} onChange={setField('age')} className="input text-sm" placeholder="e.g. 28" />
                  </div>
                  <div>
                    <label className="label text-xs">Height</label>
                    <input type="text" value={personalityState.height} onChange={setField('height')} className="input text-sm" placeholder="e.g. 5'10&quot;" />
                  </div>
                  <div>
                    <label className="label text-xs">Weight</label>
                    <input type="text" value={personalityState.weight} onChange={setField('weight')} className="input text-sm" placeholder="e.g. 165 lbs" />
                  </div>
                  <div>
                    <label className="label text-xs">Eyes</label>
                    <input type="text" value={personalityState.eyes} onChange={setField('eyes')} className="input text-sm" placeholder="e.g. Green" />
                  </div>
                  <div>
                    <label className="label text-xs">Skin</label>
                    <input type="text" value={personalityState.skin} onChange={setField('skin')} className="input text-sm" placeholder="e.g. Tan" />
                  </div>
                  <div>
                    <label className="label text-xs">Hair</label>
                    <input type="text" value={personalityState.hair} onChange={setField('hair')} className="input text-sm" placeholder="e.g. Brown" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label text-xs">Notes</label>
                <textarea
                  value={personalityState.notes}
                  onChange={setField('notes')}
                  className="input text-sm"
                  rows={3}
                  placeholder="Additional notes about your character..."
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
