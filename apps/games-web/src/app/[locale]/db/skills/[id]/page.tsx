import { type Metadata } from "next";
import { fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import { generateEntryMetadata } from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  return generateEntryMetadata(locale, "skills", id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const appConfig = await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const dict = await fetchDict(appConfig.name, locale);

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: resolveDict(dict, "skills"), href: "/db/skills" },
          { label: resolveDict(dict, id) },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="skills" locale={locale} />
      </div>
    </>
  );
}
