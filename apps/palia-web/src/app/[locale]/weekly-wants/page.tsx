import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { Button } from "@repo/ui/controls";
import Image from "next/image";
import WeeklyWantsGuide from "./weekly-wants.webp";
import Villagers from "./villagers.webp";
import { getT, getMetadataAlternates } from "@repo/lib";
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

  return {
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    title: t("weeklyWants.meta.title"),
    description: t("weeklyWants.meta.description"),
  };
}

export default async function WeeklyWants({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  return (
    <HeaderOffset full>
      <ContentLayout
        id="palia"
        header={
          <>
            <h2 className="text-2xl">{t("weeklyWants.heading")}</h2>
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
  );
}
