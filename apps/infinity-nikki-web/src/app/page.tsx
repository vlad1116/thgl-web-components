import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import { NavGrid, ReleaseNotes, Subtitle } from "@repo/ui/content";
import { getUpdateMessages } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: `${APP_CONFIG.title} Interactive Maps & Locations – The Hidden Gaming Lair`,
  description: `Explore ${APP_CONFIG.title} interactive maps for Miraland, Firework Isles, Serenty Island and Sea of Stars, featuring ${APP_CONFIG.keywords!.slice(0, 5).join(", ")}. Stay updated with the latest map updates and guides!`,
  openGraph: {
    url: `/`,
  },
};
export default async function Home() {
  const updateMessages = await getUpdateMessages(APP_CONFIG.name);

  return (
    <HeaderOffset full>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `${APP_CONFIG.title} Interactive Map - The Hidden Gaming Lair`,
            url: `https://${APP_CONFIG.domain}.th.gl`,
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageTitle title={`${APP_CONFIG.title} Interactive Maps & Locations`} />
      <ContentLayout
        id={APP_CONFIG.name}
        header={
          <section className="space-y-4">
            <Subtitle title={`${APP_CONFIG.title} Interactive Maps`} />
            <p className="text-muted-foreground">
              Explore Miraland Map and Firework Isles Map in Infinity Nikki with{" "}
              {APP_CONFIG.keywords!.join(", ")}, plus more locations brought you
              by <span className="text-nowrap">The Hidden Gaming Lair</span>!
            </p>

            {APP_CONFIG.internalLinks ? (
              <NavGrid cards={APP_CONFIG.internalLinks} />
            ) : null}
          </section>
        }
        content={<ReleaseNotes updateMessages={updateMessages} />}
      />
    </HeaderOffset>
  );
}
