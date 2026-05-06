import { type Metadata } from "next";
import Link from "next/link";
import { generateCategoryMetadata } from "@/components/metadata";
import { fetchDatabase, fetchVersion, DEFAULT_LOCALE, localizePath } from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { EntityGrid } from "@/components/entity-grid";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "artifacts", "Artifacts");
}

export default async function Page({ params }: PageProps) {
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    getFullDictionary(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
    fetchVersion(APP_CONFIG.name),
  ]);
  const items = database.filter((item) => item.type === "items");
  const itemSets = database.find((item) => item.type === "item_sets");
  const sectionLabel = resolveDict(dict, "config.internalLinks.items.title");
  const iconsHash = version.more.icons;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb crumbs={[{ label: sectionLabel }]} locale={locale} dict={dict} />
        <h1 className="text-2xl font-bold mb-6">{sectionLabel}</h1>
      </div>

      {/* Artifact Sets overview */}
      {itemSets && itemSets.items.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <h2 className="text-lg font-semibold mb-3">
            <Link href={localizePath("/db/artifacts/sets", locale)} className="hover:text-amber-400 transition-colors">
              {resolveDict(dict, "item_sets")}
              <span className="ml-2 text-sm text-muted-foreground font-normal">{itemSets.items.length}</span>
            </Link>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
            {itemSets.items.map((set) => {
              const setName = resolveDict(dict, set.id);
              const memberCount = (set.props as any)?.itemsInSet?.length ?? 0;
              const bonusTiers = (set.props as any)?.bonuses?.length ?? 0;
              return (
                <Link
                  key={set.id}
                  href={localizePath(`/db/artifacts/${set.id}`, locale)}
                  className="group border border-slate-800 hover:border-amber-800/50 rounded-lg px-4 py-3 transition-all hover:bg-slate-900/50"
                >
                  <div className="font-medium group-hover:text-amber-400 transition-colors">
                    {setName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {memberCount} items · {bonusTiers} bonus {bonusTiers === 1 ? "tier" : "tiers"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid entries={items} section="artifacts" dict={dict} locale={locale} groupLabelPrefix="ui.slot_" linkGroups iconsHash={iconsHash} />
      </div>
    </>
  );
}
