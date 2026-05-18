import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { DetailSidebarClient } from "@/lib/db/detail-sidebar-client";
import { loadSection } from "./data";
import { BPSR_SECTIONS, type BpsrSection } from "./sections";

const APP_NAME = "blue-protocol-star-resonance";

/**
 * Shared wrapper for the three BPSR `/db/<section>` routes. Loads the
 * section's categories, builds a flat sidebar grouped by category, and
 * renders the standard ContentLayout shell. The detail/listing content
 * is rendered as `children` so each route stays simple.
 */
export async function BpsrSectionLayout({
  segment,
  locale = "en",
  children,
}: {
  segment: BpsrSection["segment"];
  locale?: string;
  children: React.ReactNode;
}) {
  const section = BPSR_SECTIONS[segment];
  const grouped = await loadSection(section, locale);

  // Build the side nav: one accordion group per database category. The
  // sidebar component highlights the active item from the URL.
  const sidebarGroups = grouped.map((g) => ({
    label: g.category.label,
    items: g.items.map((i) => ({ id: i.id, name: i.props.title })),
  }));

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_NAME}
        sidebar={
          <DetailSidebarClient
            groups={sidebarGroups}
            section={segment}
            locale={locale}
          />
        }
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
