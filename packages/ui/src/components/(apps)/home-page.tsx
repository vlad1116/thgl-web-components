import type { Metadata } from "next";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { NavGrid, ReleaseNotes, Subtitle } from "../(content)";
import {
  AppConfig,
  DEFAULT_LOCALE,
  getMetadataAlternates,
  getT,
  getUpdateMessages,
} from "@repo/lib";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createHomePageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    const dict = await getStaticDictionary(appConfig.name, locale);
    const t = getT(dict);

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords =
      appConfig.keywords
        .slice(0, 5)
        .map((k) => t(k))
        .join(", ") ?? "";

    const title = t("home.pageTitle", { vars: { title: appConfig.title } });
    const description = t("home.intro", {
      vars: { title: appConfig.title, features, keywords },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/",
      locale,
      appConfig.supportedLocales,
    );

    return {
      title,
      description,
      keywords: appConfig.keywords.map((k) => t(k)),
      alternates: {
        canonical: canonical,
        languages: languageAlternates,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        images: ["/opengraph-image.jpg"],
      },
    };
  };
}

export function createHomePage(appConfig: AppConfig) {
  return async function Home({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, updateMessages] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      getUpdateMessages(appConfig.name),
    ]);
    const t = getT(dict);

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords = appConfig.keywords?.map((k) => t(k)).join(", ") ?? "";

    const hasCompanionApp = appConfig.appUrl && appConfig.appUrl.includes("companion-app");

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `${appConfig.title} Interactive Map - The Hidden Gaming Lair`,
            url: `https://${appConfig.domain}.th.gl`,
            description: t("home.intro", {
              vars: { title: appConfig.title, features, keywords },
            }),
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
          }}
        />
        <HeaderOffset full>
          <PageTitle
            title={t("home.pageTitle", { vars: { title: appConfig.title } })}
          />
          <ContentLayout
            id={appConfig.name}
            header={
              <section className="space-y-4">
                <Subtitle
                  title={t("home.sectionTitle", {
                    vars: { title: appConfig.title },
                  })}
                />
                <p className="text-muted-foreground">
                  {t("home.intro", {
                    vars: { title: appConfig.title, features, keywords },
                  })}
                </p>
                {appConfig.internalLinks && (
                  <NavGrid cards={appConfig.internalLinks} />
                )}
                {hasCompanionApp && (
                  <a
                    href={appConfig.appUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </span>
                    <span>
                      <strong className="text-foreground">In-Game Companion App</strong>
                      {" — "}live overlay with player tracking and auto-discovery.
                      <span className="text-primary ml-1 group-hover:underline">Get it free →</span>
                    </span>
                  </a>
                )}
              </section>
            }
            content={<ReleaseNotes updateMessages={updateMessages} />}
          />
        </HeaderOffset>
      </>
    );
  };
}
