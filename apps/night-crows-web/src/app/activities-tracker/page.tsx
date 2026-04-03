import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { Activities, ActivityReset, CustomActivities } from "@repo/ui/data";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ActivitiesProvider, type Activity } from "@repo/ui/providers";
import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: {
    canonical: "/activities-tracker",
  },
  title: "Activities Tracker – The Hidden Gaming Lair",
  description:
    "Track your progress and conquer the challenges of Night Crows with this Activity Tracker. Monitor your achievements, quests, and milestones!",
  openGraph: {
    title: "Activities Tracker – The Hidden Gaming Lair",
    description:
      "Track your progress and conquer the challenges of Night Crows with this Activity Tracker. Monitor your achievements, quests, and milestones!",
    url: "/activities-tracker",
  },
};
export default function ActivitiesTracker(): JSX.Element {
  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Activities Tracker – The Hidden Gaming Lair",
          description:
            "Track your progress and conquer the challenges of Night Crows with this Activity Tracker. Monitor your achievements, quests, and milestones!",
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
          mainEntityOfPage: "https://night-crows.th.gl/activities-tracker",
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
              item: "https://night-crows.th.gl/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Activities Tracker",
              item: "https://night-crows.th.gl/activities-tracker",
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
            id="night-crows"
            header={
              <>
                <h2 className="text-2xl">Activities Tracker</h2>
                <p className="text-sm">
                  This tracker puts you in control of your Night Crows journey.
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

const activities: Activity[] = [
  {
    title: "Irlette Temple",
    category: "Dungeon",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Masarta Ice Cavern",
    category: "Dungeon",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Guild Dungeon",
    category: "Dungeon",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Guild Shop",
    category: "Shop",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Contribution Coins",
    category: "Shop",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Daily Quests",
    category: "Quests",
    max: 30,
    frequently: "daily",
  },
  {
    title: "Guild Check In",
    category: "Guild",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Guild Donation Gold",
    category: "Guild",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Guild Donation Morion",
    category: "Guild",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Guild Donation Diamond",
    category: "Guild",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Guild Orders",
    category: "Guild",
    max: 5,
    frequently: "daily",
  },
  {
    title: "Land of Prosperity",
    category: "Dungeon",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Forest of Training",
    category: "Dungeon",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Sancona Ruins",
    category: "Dungeon",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Battlefront Shop",
    category: "Shop",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Artifact Shop",
    category: "Shop",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Gold Shop",
    category: "Shop",
    max: 1,
    frequently: "daily",
  },
];
