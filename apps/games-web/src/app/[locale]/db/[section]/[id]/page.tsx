import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchVersion,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { GenericEntityView } from "@/lib/db/generic-view";

/**
 * Generic DB entry (detail) page — tenant-resolved counterpart of the
 * per-game entry-page factories. Validates the id belongs to one of the
 * section's database types, then renders the shared GenericEntityView.
 */
type Params = Promise<{ id: string; locale?: string; section: string }>;
type IconSprite = { url: string; x: number; y: number; width: number; height: number };

async function resolveSection(section: string) {
  const appConfig = await getAppConfig();
  if (!appConfig.db) notFound();
  const secCfg = appConfig.db.homeSections.find(
    (s) => s.href === `/db/${section}` || s.type === section,
  );
  if (!secCfg) notFound();
  const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];
  return { appConfig, secCfg, types };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id, locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig } = await resolveSection(section);
  const dict = await getFullDictionary(appConfig.name, locale);
  const name = resolveDict(dict, id) || id;
  return {
    title: `${name} - ${appConfig.title}`,
    description: `${name} in ${appConfig.title}.`,
  };
}

export default async function Page({ params }: { params: Params }) {
  const { id, locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, secCfg, types } = await resolveSection(section);

  const [index, dict, version] = await Promise.all([
    fetchDatabaseIndex(appConfig.name),
    getFullDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const iconsHash = version.more.icons;

  // id → sprite icon for every DB entry, so cross-links (sold-by / sells) can
  // show the target's icon.
  const icons: Record<string, IconSprite> = {};
  for (const cat of index) {
    for (const it of cat.items) {
      if (it.icon && typeof it.icon === "object") {
        icons[it.id] = it.icon as IconSprite;
      }
    }
  }

  const matchingType = index.find((cat) =>
    cat.items.some((i) => i.id === id),
  )?.type;
  if (
    !matchingType ||
    (!types.includes(matchingType) &&
      !(secCfg.typePrefix && matchingType.startsWith(secCfg.typePrefix)))
  ) {
    notFound();
  }

  const fullType = await fetchDatabaseType(appConfig.name, matchingType);
  const item = fullType.items.find((i) => i.id === id);
  if (!item) notFound();

  const name = resolveDict(dict, id) || id;
  const desc = resolveDict(dict, `${id}_desc`);
  const sectionLabel =
    appConfig.db?.typeLabels?.[secCfg.type] ||
    resolveDict(dict, secCfg.type) ||
    section;
  const groupId = (item as { groupId?: string }).groupId;
  const groupLabel = groupId ? resolveDict(dict, groupId) : undefined;
  const icon =
    item.icon && typeof item.icon === "object"
      ? (item.icon as IconSprite)
      : undefined;

  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig,
          section,
          sectionLabel,
          entityId: item.id,
          entityName: name,
          description: hasDesc ? desc : undefined,
          locale,
        })}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[
            { label: sectionLabel, href: `/db/${section}` },
            { label: name },
          ]}
          locale={locale}
          dict={dict}
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <GenericEntityView
          id={item.id}
          name={name}
          desc={desc}
          groupLabel={groupLabel}
          icon={icon}
          props={item.props as Record<string, unknown> | undefined}
          iconsHash={iconsHash}
          appName={appConfig.name}
          locale={locale}
          icons={icons}
        />
      </div>
    </>
  );
}
