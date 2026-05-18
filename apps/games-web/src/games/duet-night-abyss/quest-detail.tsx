import Link from "next/link";
import { localizePath } from "@repo/lib";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import {
  QUEST_CATEGORY_ACCENT,
  QUEST_CATEGORY_LABEL,
  type Quest,
} from "./quests";

/**
 * Structured quest detail page. Renders:
 *   1. Breadcrumb (Home → Quests → <Category> → <Quest name>)
 *   2. Header with category pill + auto-start badge
 *   3. The chain visualisation when this quest is part of a multi-part
 *      episode — highlights the current step and lets users jump
 *      across the chain.
 *   4. A definition list of all the structured fields (chapter,
 *      episode, NPC, unlock/show/requires conditions with cross-links,
 *      rewards as a bulleted list).
 *
 * The page is server-rendered; cross-links resolve their display
 * names through the loaded byId map so the user sees the target
 * quest's title rather than its numeric id.
 */
export function QuestDetail({
  quest,
  chain,
  byId,
  locale = "en",
}: {
  quest: Quest;
  /** Ordered list of quests in this quest's episode, or `[quest]` when alone. */
  chain: Quest[];
  byId: Map<string, Quest>;
  locale?: string;
}) {
  const { props } = quest;
  const partIdx = chain.findIndex((q) => q.id === quest.id);
  const isInChain = chain.length > 1;

  const categoryLabel = QUEST_CATEGORY_LABEL[quest.type];
  const accent = QUEST_CATEGORY_ACCENT[quest.type];

  // The data files often duplicate `showCondition` and
  // `unlockCondition` when they refer to the same prereq. Render one
  // combined "Unlocks after" line in that case and two specific lines
  // ("Appears after" + "Available after") when they diverge.
  const sameUnlockShow =
    props.unlockCondition && props.showCondition === props.unlockCondition;

  /** Render a cross-link to another quest if we have its id, else plain text. */
  const linkOrText = (id: string | undefined, fallback: string | undefined) => {
    if (!fallback) return null;
    const target = id ? byId.get(id) : undefined;
    if (target) {
      return (
        <Link
          href={localizePath(`/db/quests/${target.id}`, locale)}
          prefetch={false}
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          {fallback}
        </Link>
      );
    }
    return <span>{fallback}</span>;
  };

  const rewards = props.rewards
    ? props.rewards.split(",").map((r) => r.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumb
        crumbs={[
          { label: "Quests", href: "/db/quests" },
          { label: categoryLabel },
          { label: props.name },
        ]}
        locale={locale}
        dict={{}}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded border ${accent}`}>
            {categoryLabel}
          </span>
          {props.autoStart && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Auto-starts
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{props.name}</h1>
        {(props.chapterName || props.episode) && (
          <p className="text-sm text-muted-foreground">
            {props.chapterName}
            {props.chapterName && props.episode && " · "}
            {props.episode}
          </p>
        )}
      </div>

      {isInChain && (
        <section className="border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              Quest Chain
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              Part {partIdx + 1} of {chain.length}
            </span>
          </div>
          <ol className="space-y-1.5">
            {chain.map((step, i) => {
              const isCurrent = step.id === quest.id;
              return (
                <li key={step.id}>
                  {isCurrent ? (
                    <div className="px-3 py-2 rounded bg-amber-900/30 border border-amber-800/50 text-amber-400 text-sm">
                      <span className="tabular-nums mr-2">{i + 1}.</span>
                      {step.props.name}
                    </div>
                  ) : (
                    <Link
                      href={localizePath(`/db/quests/${step.id}`, locale)}
                      prefetch={false}
                      className="block px-3 py-2 rounded bg-slate-900/40 hover:bg-slate-900/70 border border-transparent hover:border-slate-800 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="tabular-nums mr-2">{i + 1}.</span>
                      {step.props.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        {props.questType && (
          <Row label="Quest Type">
            <span className="capitalize">{props.questType}</span>
          </Row>
        )}
        {props.chapterName && (
          <Row label="Chapter">{props.chapterName}</Row>
        )}
        {props.episode && <Row label="Episode">{props.episode}</Row>}
        {props.questNpcName && (
          <Row label="Quest NPC">{props.questNpcName}</Row>
        )}
        {sameUnlockShow ? (
          <Row label="Unlocks After">
            {linkOrText(props.unlockCondition, props.unlockConditionName)}
          </Row>
        ) : (
          <>
            {props.showConditionName && (
              <Row label="Appears After">
                {linkOrText(props.showCondition, props.showConditionName)}
              </Row>
            )}
            {props.unlockConditionName && (
              <Row label="Available After">
                {linkOrText(props.unlockCondition, props.unlockConditionName)}
              </Row>
            )}
          </>
        )}
        {props.requiresQuestName && (
          <Row label="Requires Quest">
            {linkOrText(props.requiresQuest, props.requiresQuestName)}
          </Row>
        )}
      </dl>

      {rewards.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Rewards
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {rewards.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground self-center">
        {label}
      </dt>
      <dd>{children}</dd>
    </>
  );
}
