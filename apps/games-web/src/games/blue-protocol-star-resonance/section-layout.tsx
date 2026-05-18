import { WikiSectionLayout } from "@/lib/db/wiki";
import { BPSR_SECTIONS, type BpsrSectionKey } from "./sections";

const APP_NAME = "blue-protocol-star-resonance";

/** Thin wrapper around the generic WikiSectionLayout for BPSR routes. */
export function BpsrSectionLayout({
  segment,
  locale = "en",
  children,
}: {
  segment: BpsrSectionKey;
  locale?: string;
  children: React.ReactNode;
}) {
  return (
    <WikiSectionLayout
      appName={APP_NAME}
      section={BPSR_SECTIONS[segment]}
      locale={locale}
    >
      {children}
    </WikiSectionLayout>
  );
}
