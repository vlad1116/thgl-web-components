import { PageShell } from "@/components/page-shell";
import Link from "next/link";

export const metadata = {
  title: "Sponsor TH.GL – Reach Thousands of Gamers",
  description:
    "TH.GL reaches thousands of players daily through interactive maps, overlays, and game tools. Explore sponsorship options to promote your brand.",
  alternates: {
    canonical: "/advertise",
  },
};

export default function AdvertisePage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold">Sponsor TH.GL</h1>
        <p className="text-lg text-muted-foreground">
          TH.GL reaches <strong className="text-foreground">tens of thousands of players daily</strong>{" "}
          through interactive maps, in-game overlays, and second-screen tools.
          From games like <em>Palworld</em>, <em>Once Human</em>, and{" "}
          <em>Wuthering Waves</em> to niche communities, the Companion App and
          web-based tools are used across platforms by engaged, genre-savvy
          players.
        </p>
      </div>

      <hr className="border-border" />

      {/* Why Sponsor Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">Why Sponsor?</h2>
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🚫</span>
            <div>Reach gamers directly — without intrusive third-party ads</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🎯</span>
            <div>Target specific audiences based on the games they play</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📈</span>
            <div>Build brand trust by supporting a creator-driven project</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📢</span>
            <div>Appear in-app, on the web, or even on Discord</div>
          </li>
        </ul>
      </section>

      <hr className="border-border" />

      {/* Audience Snapshot Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">Audience Snapshot</h2>
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🌍</span>
            <div>
              Tens of thousands of daily users across Companion App and tools
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">💬</span>
            <div>25,000+ members in the Discord server</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📊</span>
            <div>High engagement in niche gaming communities</div>
          </li>
        </ul>
      </section>

      <hr className="border-border" />

      {/* What's Possible Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">What's Possible?</h2>
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🖼️</span>
            <div>Banner or logo placements in specific games or tools</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🔗</span>
            <div>Sponsored links or SEO-friendly mentions</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📣</span>
            <div>Feature shoutouts in release notes or Discord</div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🧪</span>
            <div>Custom ideas? I'm open to creative partnerships</div>
          </li>
        </ul>
      </section>

      <hr className="border-border" />

      {/* Interested Section */}
      <section className="space-y-6 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold">Interested?</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            I'm open to sponsorships that are relevant, respectful, and help grow
            the tools I maintain for the gaming community.
          </p>
          <p className="text-muted-foreground">
            Reach out via{" "}
            <Link
              href="https://th.gl/discord"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Discord
            </Link>{" "}
            and DM me (<strong className="text-foreground">devleon</strong>).
          </p>
          <p className="text-sm text-muted-foreground italic pt-2">
            Let's see if it's a good fit. No pressure, no formality.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
