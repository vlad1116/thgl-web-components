import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { DetailSidebarClient } from "@/lib/db/detail-sidebar-client";
import { loadSection } from "./data";
import type { WikiSection } from "./types";

/**
 * Shared wrapper for `/db/<section>` wiki routes. Loads the section's
 * categories, builds a flat sidebar grouped by category, and renders
 * the standard ContentLayout shell. Listing and detail pages are
 * passed as `children`.
 *
 * The sidebar derives its URL stem from `section.href`; it does not
 * assume `/db/` prefixed routes so games can host wiki sections at any
 * path (e.g. legacy `/remnants/<id>` URLs during a migration window).
 */
export async function WikiSectionLayout({
  appName,
  section,
  locale = "en",
  children,
}: {
  appName: string;
  section: WikiSection;
  locale?: string;
  children: React.ReactNode;
}) {
  const grouped = await loadSection(appName, section, locale);

  const sidebarGroups = grouped.map((g) => ({
    label: g.category.label,
    items: g.items.map((i) => ({ id: i.id, name: i.props.title })),
  }));

  return (
    <HeaderOffset full>
      <ContentLayout
        id={appName}
        sidebar={
          <DetailSidebarClient
            groups={sidebarGroups}
            section={section.href}
            locale={locale}
          />
        }
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
