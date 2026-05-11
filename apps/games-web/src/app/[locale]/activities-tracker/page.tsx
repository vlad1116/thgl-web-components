import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { Activities, ActivityReset, CustomActivities } from "@repo/ui/data";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ActivitiesProvider } from "@repo/ui/providers";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppConfig } from "@/lib/get-app-config";
import { ACTIVITIES_BY_GAME } from "@/data/activities";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig();
  if (!ACTIVITIES_BY_GAME[config.name]) notFound();

  const title = `Activities Tracker – The Hidden Gaming Lair`;
  const description = `Track your progress and conquer the challenges of ${config.title} with this Activity Tracker. Monitor your achievements, quests, and milestones!`;
  return {
    alternates: { canonical: "/activities-tracker" },
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/activities-tracker",
      images: [
        {
          url: "/activities-tracker/opengraph-image.jpg",
          alt: `${config.title} Activities Tracker`,
        },
      ],
    },
  };
}

export default async function ActivitiesTracker() {
  const config = await getAppConfig();
  const activities = ACTIVITIES_BY_GAME[config.name];
  if (!activities) notFound();

  const baseUrl = `https://${config.domain}.th.gl`;
  const description = `Track your progress and conquer the challenges of ${config.title} with this Activity Tracker. Monitor your achievements, quests, and milestones!`;

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Activities Tracker – The Hidden Gaming Lair",
          description,
          author: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          publisher: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          mainEntityOfPage: `${baseUrl}/activities-tracker`,
        }}
      />
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${baseUrl}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Activities Tracker",
              item: `${baseUrl}/activities-tracker`,
            },
          ],
        }}
      />
      <ActivitiesProvider activities={activities}>
        <HeaderOffset full>
          <PageTitle title="Activities Tracker" />
          <nav
            aria-label="Breadcrumb"
            className="text-xs text-muted-foreground px-4 py-2"
          >
            <ol className="flex items-center gap-1">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Activities Tracker</li>
            </ol>
          </nav>
          <ContentLayout
            id={config.name}
            header={
              <>
                <h2 className="text-2xl">Activities Tracker</h2>
                <p className="text-sm">
                  This tracker puts you in control of your {config.title} journey.
                  Customize and track the in-game activities and resources that
                  matter most to you. Keep tabs on your progress and optimize your
                  gameplay.
                </p>
              </>
            }
            content={
              <div className="flex flex-col gap-4 grow">
                <div className="ml-auto flex gap-2 mt-4">
                  <CustomActivities />
                  <ActivityReset />
                </div>
                <Activities />
              </div>
            }
          />
        </HeaderOffset>
      </ActivitiesProvider>
    </>
  );
}
