import Link from "next/link";
import { Button, Card } from "@repo/ui/controls";
import { games, testimonials } from "@repo/lib";
import { GameCard } from "@/components/game-card";
import { blogEntries } from "@/lib/blog-entries";
import { Subtitle } from "@repo/ui/content";
import { Download, Monitor, Gamepad2, Shield } from "lucide-react";
import Image from "next/image";

const featuredGames = games.slice(0, 6);
const companionGames = games.filter((g) => g.companion);

export const metadata = {
  title: "TH.GL – Interactive Maps, Overlays & Gaming Tools",
  description:
    "Get in-game overlays, real-time position tracking, and interactive maps for 20+ games. Use the TH.GL Companion App or browser-based tools — completely free.",
  keywords:
    "gaming tools, interactive maps, game overlay, companion app, palworld map, dune awakening, once human, gaming companion, position tracking",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "TH.GL – Gaming Overlays & Interactive Maps",
    description:
      "Real-time overlays, position tracking, and interactive maps for 20+ games. Lightweight companion app or browser-based tools.",
    images: [
      {
        url: "/images/overlay-palworld.webp",
        width: 1200,
        height: 630,
        alt: "TH.GL Gaming Companion Tools",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <section className="space-y-16 px-4 pt-10 pb-20 mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-block px-4 py-1 bg-primary/10 rounded-full text-sm text-primary mb-2">
          20+ Games Supported • 10,000+ Daily Users
        </div>
        <h1 className="text-4xl md:text-6xl font-bold">
          Interactive Maps & Overlays
          <br />
          <span className="text-primary">For Your Favorite Games</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Get real-time in-game overlays, position tracking, and interactive
          maps. Use our lightweight companion app or browser-based tools.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button size="lg" className="text-lg" asChild>
            <Link href="/companion-app">
              <Download className="mr-2 h-4 w-4" /> Get Companion App
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg" asChild>
            <Link href="/apps">Browse All Games</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Windows 10/11 • Free Download • ~7MB • No Account Required
        </p>
      </div>

      {/* Companion App Showcase */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-primary/20 rounded-full text-xs text-primary font-semibold">
              FEATURED
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              TH.GL Companion App
            </h2>
            <p className="text-lg text-muted-foreground">
              Standalone Windows app with in-game overlays, live position
              tracking, and second-screen support for {companionGames.length}+
              games.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Gamepad2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">In-Game Overlays</p>
                  <p className="text-xs text-muted-foreground">
                    No alt-tabbing needed
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Monitor className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Second Screen</p>
                  <p className="text-xs text-muted-foreground">
                    Dual monitor support
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Safe & Approved</p>
                  <p className="text-xs text-muted-foreground">
                    Officially permitted
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-sm">Free Download</p>
                  <p className="text-xs text-muted-foreground">~7MB only</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <a href="https://app.th.gl/THGL_Installer.exe" download>
                  <Download className="mr-2 h-4 w-4" /> Download for Windows
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/companion-app">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/images/overlay-palworld.webp"
              alt="TH.GL Companion App showing in-game overlay"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl"
              priority
            />
            <div className="absolute -bottom-4 -left-4 bg-black/90 p-3 rounded-lg border border-primary/20">
              <p className="text-xs font-semibold text-primary">
                {companionGames.length} Games Supported
              </p>
              <p className="text-xs text-muted-foreground">
                Palworld, Dune, Once Human & more
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg mb-2">🗺️ Interactive Maps</h3>
          <p className="text-muted-foreground text-sm">
            Track nodes, collectibles, NPCs, and resources with comprehensive
            filters. Create custom markers and routes to share with friends.
          </p>
        </div>
        <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg mb-2">📍 Live Tracking</h3>
          <p className="text-muted-foreground text-sm">
            See your exact position and nearby actors in real-time. Use Peer
            Link to sync with your phone or tablet as a live minimap.
          </p>
        </div>
        <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg mb-2">🔐 Privacy First</h3>
          <p className="text-muted-foreground text-sm">
            No account required. Local-first. Anonymous analytics. Mark
            unlimited locations as discovered — completely free.
          </p>
        </div>
        <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
          <h3 className="font-semibold text-lg mb-2">🎮 20+ Games</h3>
          <p className="text-muted-foreground text-sm">
            Supports popular titles like Palworld, Dune Awakening, Wuthering
            Waves, and more. New games added regularly.
          </p>
        </div>
      </div>

      {/* Featured Games */}
      <div className="space-y-6">
        <Subtitle title="Featured Games" />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        <div className="text-center pt-2">
          <Link
            href="/apps"
            className="underline text-sm text-muted-foreground hover:text-white"
          >
            View all supported games →
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <Subtitle title="Choose Your Experience" />
          <p className="text-muted-foreground mt-2">
            Use the companion app for overlays or access web tools from any
            device
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Companion App</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>In-game overlays with real-time tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Second screen mode for dual monitors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Auto-updates and hotkey controls</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Windows 10/11 only</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/companion-app">Learn More</Link>
              </Button>
            </div>
          </Card>
          <Card className="border-border">
            <div className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Monitor className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Web-Based Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Works on any device and platform</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Full interactive map features</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>No download required</span>
                </li>
                <li className="flex items-start">
                  <span className="text-muted-foreground/50 mr-2">✗</span>
                  <span className="text-muted-foreground/70">
                    No overlay or position tracking
                  </span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/apps">Browse Games</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Community & Support */}
      <div className="p-6 rounded-lg text-center space-y-4">
        <Subtitle title="Join the Community" />
        <p className="text-sm text-muted-foreground">
          Join <strong>tens of thousands</strong> of players using TH.GL every
          day. Get help, share tips, or just hang out.
        </p>
        <Button asChild>
          <Link href="https://th.gl/discord" target="_blank">
            Join the Discord
          </Link>
        </Button>
      </div>

      <div className="space-y-4 text-center">
        <Subtitle title="What Players Are Saying" />
        <div className="grid sm:grid-cols-2 gap-4">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-4">
              <blockquote className="text-sm text-muted-foreground italic">
                "{t.message}"
              </blockquote>
              <footer className="pt-2 text-xs text-right text-muted-foreground">
                — {t.author}
              </footer>
            </Card>
          ))}
        </div>
      </div>

      {/* Blog Teaser */}
      <div className="space-y-4 text-center">
        <Subtitle title="From the Blog" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {blogEntries.slice(0, 3).map((entry) => (
            <Card key={entry.id} className="p-4 text-left">
              <Link href={`/blog/${entry.id}`} className="space-y-2 block">
                <h3 className="text-lg font-semibold text-brand">
                  {entry.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {entry.description}
                </p>
                <span className="text-sm underline text-brand">
                  Read more →
                </span>
              </Link>
            </Card>
          ))}
        </div>
        <div className="pt-2">
          <Link
            href="/blog"
            className="underline text-sm text-muted-foreground hover:text-white"
          >
            View all blog posts →
          </Link>
        </div>
      </div>

      {/* Support CTA */}
      <div className="text-center space-y-3 pt-10">
        <Subtitle title="Support Development" />
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          TH.GL is free to use and ad-supported. You can unlock a better
          experience by becoming a supporter on Patreon.
        </p>
        <Button asChild>
          <Link href="/support-me">Support Me on Patreon</Link>
        </Button>
        <p className="text-xs text-muted-foreground pt-2 italic">
          Built and maintained by a solo developer — thank you for your support!
        </p>
        <p className="text-xs text-muted-foreground pt-4">
          Want to contribute?{" "}
          <Link
            href="https://github.com/The-Hidden-Gaming-Lair"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            View the source code on GitHub
          </Link>{" "}
          and submit a pull request.
        </p>
      </div>
    </section>
  );
}
