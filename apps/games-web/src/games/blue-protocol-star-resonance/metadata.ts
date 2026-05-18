import type { Metadata } from "next";
import { getMetadataAlternates } from "@repo/lib";
import { blueProtocolStarResonance } from "@/configs/blue-protocol-star-resonance";
import type { WikiSection } from "@/lib/db/wiki";

const APP = blueProtocolStarResonance;
const GAME_TITLE = APP.title;
const OG_IMAGE = "https://starresonance.th.gl/opengraph-image.jpg";

/**
 * Build the `<title>`, `<meta description>`, canonical/hreflang, and
 * Open Graph tags for BPSR DB pages. Section pages and entry pages
 * share the same shape; entry pages append the entry title to the
 * canonical title and use the entry description (HTML stripped by the
 * caller) as the meta description.
 */
function buildMeta({
  locale,
  path,
  title,
  description,
  keywords,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
}): Metadata {
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    APP.supportedLocales,
  );
  return {
    title,
    description,
    keywords,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [OG_IMAGE],
    },
  };
}

export function sectionMetadata(
  section: WikiSection,
  locale: string,
): Metadata {
  return buildMeta({
    locale,
    path: section.href,
    title: `${section.label} – ${GAME_TITLE}`,
    description: section.tagline,
    keywords: [...APP.keywords, ...(section.keywords ?? [])],
  });
}

export function entryMetadata(
  section: WikiSection,
  id: string,
  entryTitle: string,
  entryExcerpt: string,
  locale: string,
): Metadata {
  return buildMeta({
    locale,
    path: `${section.href}/${id}`,
    title: `${entryTitle} – ${section.label} – ${GAME_TITLE}`,
    description: entryExcerpt.slice(0, 160),
    keywords: [...APP.keywords, ...(section.keywords ?? []), entryTitle],
  });
}
