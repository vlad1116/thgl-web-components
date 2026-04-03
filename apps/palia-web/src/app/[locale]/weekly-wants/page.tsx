import { ExternalAnchor, HeaderOffset, PageTitle } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { Button } from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import WeeklyWantsGuide from "./weekly-wants.webp";
import Villagers from "./villagers.webp";
import { getT, getMetadataAlternates, localizePath } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { getStaticDictionary } from "@repo/ui/dicts";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/weekly-wants",
    locale,
    APP_CONFIG.supportedLocales,
  );

  const title = t("weeklyWants.meta.title");
  const description = t("weeklyWants.meta.description");

  return {
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

export default async function WeeklyWants({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  const pageTitle = t("weeklyWants.meta.title");
  const heading = t("weeklyWants.heading");

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pageTitle,
          description: t("weeklyWants.meta.description"),
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
          mainEntityOfPage: `https://palia.th.gl${localizePath("/weekly-wants", locale)}`,
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
              item: `https://palia.th.gl${localizePath("/", locale)}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: heading,
              item: `https://palia.th.gl${localizePath("/weekly-wants", locale)}`,
            },
          ],
        }}
      />
      <HeaderOffset full>
        <PageTitle title={pageTitle} />
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground px-4 py-2">
          <ol className="flex items-center gap-1">
            <li>
              <Link href={localizePath("/", locale)} className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{heading}</li>
          </ol>
        </nav>
        <ContentLayout
          id="palia"
          header={
            <>
              <h2 className="text-2xl">{heading}</h2>
              <p className="text-sm">{t("weeklyWants.description")}</p>
            </>
          }
          content={
            <div className="flex flex-col gap-2 items-center">
              <p>{t("weeklyWants.step1")}</p>
              <Button asChild>
                <ExternalAnchor href="https://www.th.gl/companion-app">
                  {t("weeklyWants.appButton")}
                </ExternalAnchor>
              </Button>
              <p>{t("weeklyWants.step2")}</p>
              <Image src={WeeklyWantsGuide} alt={t("weeklyWants.guideAlt")} />
              <p>{t("weeklyWants.step3")}</p>
              <Image src={Villagers} alt={t("weeklyWants.villagersAlt")} />
            </div>
          }
        />
      </HeaderOffset>
    </>
  );
}
