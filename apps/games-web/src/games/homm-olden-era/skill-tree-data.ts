import { fetchVersion, getIconsUrl } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

const APP_NAME = "homm-olden-era";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DatabaseEntry = {
  type: string;
  items: {
    id: string;
    icon?: IconSprite | string;
    groupId?: string;
    props?: Record<string, unknown>;
  }[];
};

export type ResolvedIcon = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SkillNode = {
  id: string;
  name: string;
  icon?: ResolvedIcon;
  groupId?: string;
  subSkills: { id: string; name: string; icon?: ResolvedIcon }[];
};

export async function buildSkillNodes(
  database: DatabaseEntry[],
  dict: Record<string, string>,
): Promise<SkillNode[]> {
  const skillsEntry = database.find((e) => e.type === "skills");
  const subSkillsEntry = database.find((e) => e.type === "sub_skills");
  if (!skillsEntry) return [];

  const version = await fetchVersion(APP_NAME);
  const resolveIcon = (raw?: IconSprite | string): ResolvedIcon | undefined => {
    if (!raw || typeof raw === "string") return undefined;
    return {
      src: getIconsUrl(APP_NAME, raw.url, version.more.icons),
      x: raw.x,
      y: raw.y,
      width: raw.width,
      height: raw.height,
    };
  };

  const subSkillMap = new Map<
    string,
    { id: string; name: string; icon?: ResolvedIcon }
  >();
  if (subSkillsEntry) {
    for (const item of subSkillsEntry.items) {
      subSkillMap.set(item.id, {
        id: item.id,
        name: resolveDict(dict, item.id),
        icon: resolveIcon(item.icon as IconSprite | string | undefined),
      });
    }
  }

  return skillsEntry.items.map((skill) => {
    const levels = (skill.props?.levels as { subSkills?: string[] }[]) ?? [];
    const subSkillIds = levels.flatMap((l) => l.subSkills ?? []);
    const seen = new Set<string>();
    const subSkills: SkillNode["subSkills"] = [];
    for (const id of subSkillIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      const sub = subSkillMap.get(id);
      if (sub) subSkills.push(sub);
    }

    return {
      id: skill.id,
      name: resolveDict(dict, skill.id),
      icon: resolveIcon(skill.icon as IconSprite | string | undefined),
      groupId: skill.groupId
        ? resolveDict(dict, skill.groupId)
        : undefined,
      subSkills,
    };
  });
}
