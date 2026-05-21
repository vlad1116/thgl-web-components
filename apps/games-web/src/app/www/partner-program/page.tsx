import { PartnerCard } from "@/games/thgl-web/components/partner-card";
import { games } from "@repo/lib";
import { PartnerCarousel } from "./partner-carousel";
import { partners } from "./partners";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import { BenefitList } from "@/games/thgl-web/components/benefit-list";
import Link from "next/link";

export const metadata = {
  title: "Partner With TH.GL – Streamers, Creators & Sharers",
  description:
    "Partner with The Hidden Gaming Lair and get free perks, exposure, and more for sharing my tools or featuring them in your content.",
  alternates: {
    canonical: "/partner-program",
  },
  openGraph: {
    url: "/partner-program",
  },
};

export default function PartnerProgramPage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Partner With TH.GL – Streamers, Creators & Sharers",
            description:
              "Partner with The Hidden Gaming Lair and get free perks, exposure, and more for sharing my tools or featuring them in your content.",
            url: "https://www.th.gl/partner-program",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Partner With TH.GL"
        description="Are you a streamer, content creator, or someone who shares useful tools with others? Partner with TH.GL and get rewarded for spreading the word."
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
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
          <li aria-current="page">Partner Program</li>
        </ol>
      </nav>

      {/* Partners Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Our Partners</h2>
        <PartnerCarousel partners={partners} />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {games
            .filter((g) => g.partnerApps)
            .flatMap((game) =>
              game.partnerApps!.map((app) => (
                <PartnerCard key={app.id} app={app} />
              )),
            )}
        </div>
      </section>

      <hr className="border-border" />

      {/* Why Partner Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">Why Partner?</h2>
        <BenefitList
          items={[
            {
              icon: "🎁",
              label: "Free Perks",
              description:
                "Get a free or discounted premium subscription (up to 100% off).",
            },
            {
              icon: "📢",
              label: "Visibility",
              description:
                "I can promote you on my Discord or even inside the apps (as fallback instead of ads).",
            },
            {
              icon: "🔗",
              label: "SEO Backlinks",
              description:
                "I'll link to your website or channel — helpful for exposure and search engines.",
            },
            {
              icon: "📣",
              label: "Referral Codes",
              description:
                "Get your own discount code to share with your community.",
            },
          ]}
        />
      </section>

      <hr className="border-border" />

      {/* Who It's For Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">Who It's For</h2>
        <BenefitList
          spacing="normal"
          iconSize="sm"
          items={[
            {
              icon: "🎬",
              description: "Streamers using overlays or tools during gameplay",
            },
            {
              icon: "📺",
              description:
                "YouTubers including TH.GL in guides or descriptions",
            },
            {
              icon: "🔗",
              description:
                "Website/blog owners linking to TH.GL or partner apps",
            },
            {
              icon: "📣",
              description:
                "Anyone who shares useful tools and drives visibility",
            },
          ]}
        />
      </section>

      <hr className="border-border" />

      {/* How to Join Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">How to Join</h2>
        <ol className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-foreground font-semibold flex-shrink-0">
              1.
            </span>
            <div>
              Join the{" "}
              <a
                href="https://th.gl/discord"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                Discord server
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-semibold flex-shrink-0">
              2.
            </span>
            <div>
              Send me a DM (<strong className="text-foreground">devleon</strong>
              ) and tell me what you do
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-semibold flex-shrink-0">
              3.
            </span>
            <div>I'll set you up with access, a code, and shareable assets</div>
          </li>
        </ol>
        <p className="text-sm italic text-muted-foreground text-center pt-4">
          It's casual and low-pressure — just reach out if you're interested!
        </p>
      </section>

      <hr className="border-border" />

      {/* Footer */}
      <section className="space-y-3 text-center text-muted-foreground max-w-2xl mx-auto">
        <p className="text-base">
          Whether you bring clicks or content, I'd love to support creators who
          support TH.GL.
        </p>
        <p className="italic">Not sure if you qualify? DM me anyway.</p>
      </section>
    </PageShell>
  );
}
