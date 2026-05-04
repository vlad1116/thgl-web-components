import { type Metadata } from "next";
import { DEFAULT_LOCALE, getMetadataAlternates } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";

const GAME_TITLE = "Heroes of Might & Magic: Olden Era";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const title = `Game Mechanics | ${GAME_TITLE}`;
  const description = `Learn how combat stats, luck, morale, and other mechanics work in ${GAME_TITLE}.`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/mechanics",
    locale,
    APP_CONFIG.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical },
  };
}

const stats = [
  {
    name: "Attack",
    color: "text-red-400",
    desc: "Increases damage dealt by the hero's units. Each point of Attack above the target's Defense adds +5% damage (up to +300%).",
  },
  {
    name: "Defense",
    color: "text-blue-400",
    desc: "Reduces damage taken by the hero's units. Each point of Defense above the attacker's Attack reduces damage by ~2.5%.",
  },
  {
    name: "Spell Power",
    color: "text-purple-400",
    desc: "Increases the effectiveness of spells cast by the hero. Affects damage, healing, duration, and area of effect depending on the spell.",
  },
  {
    name: "Intelligence",
    color: "text-cyan-400",
    desc: "Determines the hero's maximum mana pool. Each point of Intelligence adds 10 mana. Higher mana allows casting more spells per battle.",
  },
];

const unitStats = [
  {
    name: "Health",
    color: "text-green-400",
    desc: "Total hit points for each creature in the stack. When a creature's HP reaches 0, it dies. Only the top creature in a stack can be partially damaged.",
  },
  {
    name: "Damage",
    color: "text-red-400",
    desc: "The range of base damage each creature deals per attack (e.g. 50–75). Actual damage is modified by Attack vs Defense difference and other bonuses.",
  },
  {
    name: "Initiative",
    color: "text-yellow-400",
    desc: "Determines turn order in combat. Higher initiative units act first. If initiative values are equal, the defending army acts first.",
  },
  {
    name: "Speed",
    color: "text-amber-400",
    desc: "How many tiles a unit can move per turn on the combat grid. Flying units ignore obstacles and can reach any tile within their speed range.",
  },
  {
    name: "Value",
    color: "text-slate-300",
    desc: "The AI value of each creature, used for army strength calculations and balancing encounters on the adventure map.",
  },
];

const battleMechanics = [
  {
    name: "Luck",
    icon: "🍀",
    desc: "Each point of Luck gives a 6% chance to trigger a Lucky Strike (dealing +50% damage) or an Unlucky Strike (dealing –50% damage) during combat. Luck ranges from –3 to +3. At +3 Luck, there's an 18% chance for a Lucky Strike and 0% for Unlucky.",
  },
  {
    name: "Morale",
    icon: "⚡",
    desc: "Each point of Morale gives a 6% chance for a unit to get a bonus action (extra turn) or lose a turn. Morale ranges from –3 to +3. Mixing creature types from different factions reduces Morale. At +3, there's an 18% chance for a bonus turn.",
  },
  {
    name: "Retaliation",
    icon: "🔄",
    desc: "When a melee unit is attacked, it automatically retaliates once. Each unit can only retaliate once per round unless it has the 'Unlimited Retaliation' passive. Ranged units do not retaliate against melee attacks at close range.",
  },
  {
    name: "Ranged Penalty",
    icon: "🏹",
    desc: "Ranged units deal full damage at close and medium range. At long range (more than half the battlefield), damage is reduced by 50%. Ranged units deal reduced damage in melee combat.",
  },
  {
    name: "Magic Schools",
    icon: "✦",
    desc: "Spells belong to five schools: Day, Night, Primal, Space, and Neutral. Heroes learn spells from Magic Guilds or through skills. Spell effectiveness scales with Spell Power. The Magic Guild in each town offers spells based on the town type.",
  },
];

export default async function MechanicsPage({ params }: PageProps) {
  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        header={null}
        content={
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Game Mechanics
              </h1>
              <p className="text-muted-foreground">
                How combat stats, luck, morale, and other systems work in{" "}
                {GAME_TITLE}.
              </p>
            </div>

            {/* Hero Stats */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-amber-400">
                Hero Stats
              </h2>
              <div className="space-y-2">
                {stats.map((s) => (
                  <div
                    key={s.name}
                    className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                  >
                    <h3 className={`font-medium ${s.color}`}>{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Unit Stats */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-amber-400">
                Unit Stats
              </h2>
              <div className="space-y-2">
                {unitStats.map((s) => (
                  <div
                    key={s.name}
                    className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                  >
                    <h3 className={`font-medium ${s.color}`}>{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Battle Mechanics */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-amber-400">
                Battle Mechanics
              </h2>
              <div className="space-y-2">
                {battleMechanics.map((m) => (
                  <div
                    key={m.name}
                    className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                  >
                    <h3 className="font-medium">
                      <span className="mr-2">{m.icon}</span>
                      {m.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {m.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Damage Formula */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-amber-400">
                Damage Formula
              </h2>
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Base damage is rolled between the unit&apos;s min and max
                  damage values, then multiplied by the number of creatures in
                  the stack.
                </p>
                <div className="bg-black/30 rounded p-3 font-mono text-sm">
                  <div>
                    Final Damage = Base Damage × Stack Size × ATK/DEF Modifier
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    <span className="text-amber-500">&#x25C6;</span>{" "}
                    If Attack {">"} Defense: +5% damage per point difference (max
                    +300%)
                  </li>
                  <li>
                    <span className="text-amber-500">&#x25C6;</span>{" "}
                    If Defense {">"} Attack: ~2.5% damage reduction per point
                    difference
                  </li>
                  <li>
                    <span className="text-amber-500">&#x25C6;</span> Lucky
                    Strike: +50% damage
                  </li>
                  <li>
                    <span className="text-amber-500">&#x25C6;</span> Unlucky
                    Strike: –50% damage
                  </li>
                  <li>
                    <span className="text-amber-500">&#x25C6;</span> Native
                    Terrain bonus applies when fighting on matching terrain
                  </li>
                </ul>
              </div>
            </section>
          </div>
        }
      />
    </HeaderOffset>
  );
}
