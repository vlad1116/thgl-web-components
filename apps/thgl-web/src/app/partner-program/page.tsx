import { PartnerCard } from "@/components/partner-card";
import { games } from "@repo/lib";
import { PartnerCarousel } from "./partner-carousel";
import { partners } from "./partners";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Partner With TH.GL – Streamers, Creators & Sharers",
  description:
    "Partner with The Hidden Gaming Lair and get free perks, exposure, and more for sharing my tools or featuring them in your content.",
  alternates: {
    canonical: "/partner-program",
  },
};

export default function PartnerProgramPage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold">Partner With TH.GL</h1>
        <p className="text-lg text-muted-foreground">
          Are you a streamer, content creator, or someone who shares useful
          tools with others? Partner with TH.GL and get rewarded for spreading
          the word.
        </p>
      </div>

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
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🎁</span>
            <div>
              <strong className="text-foreground">Free Perks:</strong> Get a
              free or discounted premium subscription (up to 100% off).
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📢</span>
            <div>
              <strong className="text-foreground">Visibility:</strong> I can
              promote you on my Discord or even inside the apps (as fallback
              instead of ads).
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🔗</span>
            <div>
              <strong className="text-foreground">SEO Backlinks:</strong> I'll
              link to your website or channel — helpful for exposure and search
              engines.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📣</span>
            <div>
              <strong className="text-foreground">Referral Codes:</strong> Get
              your own discount code to share with your community.
            </div>
          </li>
        </ul>
      </section>

      <hr className="border-border" />

      {/* Who It's For Section */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center">Who It's For</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-xl flex-shrink-0">🎬</span>
            <span>Streamers using overlays or tools during gameplay</span>
          </li>
          <li className="flex gap-3">
            <span className="text-xl flex-shrink-0">📺</span>
            <span>YouTubers including TH.GL in guides or descriptions</span>
          </li>
          <li className="flex gap-3">
            <span className="text-xl flex-shrink-0">🔗</span>
            <span>Website/blog owners linking to TH.GL or partner apps</span>
          </li>
          <li className="flex gap-3">
            <span className="text-xl flex-shrink-0">📣</span>
            <span>Anyone who shares useful tools and drives visibility</span>
          </li>
        </ul>
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
                rel="noopener noreferrer"
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
