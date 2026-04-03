import Link from "next/link";
import { TierCard } from "@/components/tier-card";
import { tiers } from "@/lib/tiers";
import { Button } from "@repo/ui/controls";

export const metadata = {
  title: "Support TH.GL – Unlock Ad-Free Access & Perks",
  description:
    "Become a supporter of TH.GL and unlock ad-free access, premium features, and preview releases across all tools and platforms.",

  alternates: {
    canonical: "/support-me",
  },
  openGraph: {
    url: "/support-me",
  },
};

export default function SupportMe() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Support TH.GL – Unlock Ad-Free Access & Perks",
            description:
              "Become a supporter of TH.GL and unlock ad-free access, premium features, and preview releases across all tools and platforms.",
            url: "https://www.th.gl/support-me",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div className="space-y-16 px-4 pt-10 pb-20 max-w-7xl mx-auto">
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground"
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
            <li aria-current="page">Support Me</li>
          </ol>
        </nav>
        {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold">
          Support TH.GL Development
        </h1>
        <p className="text-lg text-muted-foreground">
          I'm working full time on TH.GL as a solo developer — building
          companion apps, overlays, and websites to support a wide range of
          games. Your support helps keep the project alive and enables continued
          development.
        </p>
      </div>

      {/* Tier Cards */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">
          Choose Your Support Tier
        </h2>
        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {tiers
            .filter((tier) => !tier.hidden)
            .map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6 italic">
          💡 Pro Tip: Annual plans include a 10% discount
        </p>
      </div>

      {/* How to Activate */}
      <div className="bg-muted/30 rounded-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          How to Activate Your Perks
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Companion App</h3>
            <p className="text-muted-foreground">
              Unlock perks directly inside the app after subscribing. No
              additional setup required.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Overwolf & Web Apps</h3>
            <p className="text-muted-foreground">
              <Link
                href="/support-me/account"
                className="text-primary underline font-medium"
              >
                Activate your account
              </Link>{" "}
              to enable perks across all Overwolf apps and game websites.
            </p>
          </div>
        </div>
      </div>

      {/* Perk Details */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">What You Get</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold">* Ad Removal</h3>
            <p className="text-muted-foreground">
              Available in all official TH.GL projects — Companion App, Overwolf
              apps, and browser-based tools.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">** Premium Features</h3>
            <p className="text-muted-foreground">
              Unlock advanced tools and options highlighted directly inside
              supported apps and websites.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">*** Preview Release Access</h3>
            <p className="text-muted-foreground">
              Early access to upcoming features and app updates before public
              release.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Discord Supporter Role</h3>
            <p className="text-muted-foreground">
              Get a special role in our Discord server.{" "}
              <Link
                href="/faq/discord-supporter-role"
                className="text-primary underline"
              >
                Learn how to activate it
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Already a Subscriber CTA */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Already a Subscriber?</h2>
        <p className="text-muted-foreground mb-6">
          Thank you for supporting TH.GL! ❤️ Authenticate with Patreon to unlock
          your perks for Overwolf and web apps.
        </p>
        <Button size="lg" asChild>
          <Link href="/support-me/account">Unlock Your Perks</Link>
        </Button>
      </div>
      </div>
    </>
  );
}
