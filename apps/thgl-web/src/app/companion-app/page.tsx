import { games } from "@repo/lib";
import { Subtitle } from "@repo/ui/content";
import {
  Button,
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@repo/ui/controls";
import {
  Download,
  MonitorSmartphone,
  Info,
  Gamepad2,
  Shield,
  Zap,
  Monitor,
  Eye,
  Lock,
  CheckCircle2,
  XCircle,
  Smartphone,
  MapPin,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title:
    "TH.GL Companion App – Gaming Overlays & Interactive Maps for Windows",
  description:
    "Download the TH.GL Companion App (7MB): Lightweight app with in-game overlays, real-time position tracking, and second-screen maps for 10+ games including Palworld, Dune Awakening, and Once Human. No additional platform required.",
  keywords:
    "gaming overlay app, in-game map overlay, companion app, palworld overlay, dune awakening map, game tracker, overwolf alternative, position tracking",
  alternates: {
    canonical: "/companion-app",
  },
  openGraph: {
    title: "TH.GL Companion App – In-Game Overlays & Live Maps",
    description:
      "Lightweight gaming companion app (7MB) with overlays, live tracking, and interactive maps. Supports 10+ games. No additional platform required.",
    url: "/companion-app",
    type: "website",
    images: [
      {
        url: "/images/overlay-palworld.webp",
        width: 1200,
        height: 630,
        alt: "TH.GL Companion App Overlay",
      },
    ],
  },
};

const supportedGames = games.filter((game) => game.companion);
const totalGamesCount = supportedGames.length;

export default function CompanionAppPage() {
  return (
    <section className="space-y-16 px-4 pt-10 pb-20 mx-auto max-w-7xl">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-block px-4 py-1 bg-primary/10 rounded-full text-sm text-primary mb-2">
          Standalone Windows App • No Platform Required
        </div>
        <h1 className="text-4xl md:text-6xl font-bold">
          Interactive Maps & Overlays
          <br />
          <span className="text-primary">For {totalGamesCount}+ Games</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Get real-time in-game overlays, interactive maps, and position
          tracking across {totalGamesCount}+ supported games. No Overwolf
          required — just a simple, lightweight app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" className="text-lg" asChild>
            <a href="https://app.th.gl/THGL_Installer.exe" download>
              <Download className="mr-2 h-5 w-5" /> Download for Windows
            </a>
          </Button>
          <Button size="lg" variant="outline" className="text-lg" asChild>
            <Link href="#how-it-works">See How It Works</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Windows 10/11 • Free Download • ~7MB • No Overwolf Required
        </p>
      </div>

      {/* Screenshot Carousel */}
      <div>
        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            <CarouselItem>
              <div className="relative">
                <Image
                  src="/images/overlay-dune-awakening.webp"
                  alt="Dune Awakening overlay with live map showing player position and nearby points of interest"
                  width={1200}
                  height={675}
                  className="rounded-lg object-cover"
                  priority
                />
                <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">
                    Dune Awakening - In-Game Overlay
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Live position tracking with interactive map
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="relative">
                <Image
                  src="/images/overlay-palworld.webp"
                  alt="Palworld overlay showing minimap with nearby Pals and resource locations"
                  width={1200}
                  height={675}
                  className="rounded-lg object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">
                    Palworld - Real-time Tracking
                  </p>
                  <p className="text-xs text-muted-foreground">
                    See nearby Pals and resources in real-time
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="relative">
                <Image
                  src="/images/second-screen.webp"
                  alt="Second screen mode showing full interactive map on external monitor"
                  width={1200}
                  height={675}
                  className="rounded-lg object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">Second Screen Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Use a separate display for full map view
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="relative">
                <Image
                  src="/images/app-launcher.webp"
                  alt="TH.GL Companion App launcher showing all supported games"
                  width={1200}
                  height={675}
                  className="rounded-lg object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">Game Launcher</p>
                  <p className="text-xs text-muted-foreground">
                    Manage all supported games from one place
                  </p>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Key Features Grid */}
      <div>
        <div className="text-center mb-8">
          <Subtitle title="Why Choose TH.GL Companion App?" />
          <p className="text-muted-foreground mt-2">
            Everything you need for an enhanced gaming experience
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">In-Game Overlays</h3>
              <p className="text-sm text-muted-foreground">
                Interactive maps and minimaps that show your live player
                position, nearby points of interest, and resources — all
                directly within your game without alt-tabbing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Second Screen Mode</h3>
              <p className="text-sm text-muted-foreground">
                Prefer a separate display? Switch to second-screen mode with one
                hotkey. Perfect for dual-monitor setups, tracking, routing, or
                managing multiple maps.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                See your exact position on the map in real-time as you move
                in-game. Track nearby collectibles, NPCs, enemies, and resources
                that are actually spawned right now.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Lightweight & Fast</h3>
              <p className="text-sm text-muted-foreground">
                Uses significantly less memory and CPU than Overwolf. No
                background services eating your resources. Minimal performance
                impact on your games.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Privacy-Conscious</h3>
              <p className="text-sm text-muted-foreground">
                The app runs locally on your machine. Uses Plausible for
                anonymous analytics only. No account required. Ads are served
                through Nitro — subscribing removes them completely.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Safe & Approved</h3>
              <p className="text-sm text-muted-foreground">
                Read-only memory access. No game modifications. Officially
                approved by developers of Dune Awakening, Once Human, and Palia.
                Thousands of daily users with zero bans reported.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Features Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent -mx-4 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Subtitle title="More Than Just an Overlay" />
            <p className="text-muted-foreground mt-2">
              Powerful features that set TH.GL apart from competitors
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Peer Link</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your companion app with any device. Use your phone or
                  tablet as a live minimap that syncs your position and live mode
                  in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Unlimited Discoveries</h3>
                <p className="text-sm text-muted-foreground">
                  Mark locations as discovered with no limits — completely free.
                  Track your progress across all games without restrictions or
                  paywalls.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Custom Content</h3>
                <p className="text-sm text-muted-foreground">
                  Create custom markers, draw routes, and share them with friends
                  or your guild. Perfect for planning strategies and coordinating
                  group activities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Smart Live Mode</h3>
                <p className="text-sm text-muted-foreground">
                  When supported, shows monsters, animals, and NPCs in real-time
                  while auto-hiding collected items. Some games only support
                  player position tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Supported Games Section */}
      <div id="supported-games">
        <div className="text-center mb-8">
          <Subtitle title={`${totalGamesCount} Supported Games`} />
          <p className="text-muted-foreground mt-2">
            Live position tracking, overlays, and interactive maps
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {supportedGames.map((game) => (
            <Link
              key={game.id}
              href={game.web || "#"}
              className="group flex flex-col items-center space-y-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                <Image
                  src={game.logo}
                  alt={`${game.title} logo`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <p className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {game.title}
              </p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            More games coming soon! Request support in our{" "}
            <Link href="https://th.gl/discord" className="underline">
              Discord server
            </Link>
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-muted/30 -mx-4 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Subtitle title="How It Works" />
            <p className="text-muted-foreground mt-2">
              Get started in 3 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold">Download & Install</h3>
              <p className="text-muted-foreground">
                Download the installer (~7MB) and run it. The app installs in
                seconds with no additional setup required.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold">Launch Your Game</h3>
              <p className="text-muted-foreground">
                Start any supported game. The app automatically detects it and
                shows available features for that game.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold">Enable Overlay</h3>
              <p className="text-muted-foreground">
                Press the hotkey (default: F6) to toggle the overlay. Use F9 to
                lock/unlock, F7/F8 to zoom, and F5 for live tracking. All hotkeys
                are fully customizable in settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <div className="text-center mb-8">
          <Subtitle title="Frequently Asked Questions" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">
                Is the companion app safe to use?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes! The app only reads local memory and does not modify games.
                It has been officially approved by developers of Dune Awakening,
                Once Human, and Palia. Thousands of players use it daily with
                zero bans reported.{" "}
                <Link href="/faq/apps-bannable" className="underline">
                  Learn more
                </Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">
                How do I update the companion app?
              </h3>
              <p className="text-sm text-muted-foreground">
                The app updates automatically. When a new version is available,
                it will download and install in the background.{" "}
                <Link href="/faq/update-companion-app" className="underline">
                  Manual update guide
                </Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">
                What are the system requirements?
              </h3>
              <p className="text-sm text-muted-foreground">
                Windows 10 or 11 (64-bit) with WebView2 Runtime (included with
                Windows 11 or installed automatically). ~7MB download size. Works
                on most gaming PCs without performance impact.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">
                Can I use this on Linux or macOS?
              </h3>
              <p className="text-sm text-muted-foreground">
                The companion app is Windows-only. However, you can use our web
                versions (e.g., palworld.th.gl, duneawakening.th.gl) on any
                platform. They won't have overlay or position tracking, but all
                map features work.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-lg">
                Why does my antivirus flag the app?
              </h3>
              <p className="text-sm text-muted-foreground">
                Some antivirus tools may show false positives. The app is safe
                and signed. You can verify on VirusTotal.{" "}
                <Link
                  href="/faq/antivirus-false-positive"
                  className="underline"
                >
                  More details
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="text-sm underline text-muted-foreground hover:text-white"
          >
            View all FAQs →
          </Link>
        </div>
      </div>

      {/* Download CTA */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-12 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to Enhance Your Gaming?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of players using TH.GL Companion App every day. Free
          download, no account required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg" asChild>
            <a href="https://app.th.gl/THGL_Installer.exe" download>
              <Download className="mr-2 h-5 w-5" /> Download Now
            </a>
          </Button>
          <Button size="lg" variant="outline" className="text-lg" asChild>
            <Link href="https://th.gl/discord">Join Discord</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Need help? Visit the{" "}
          <Link href="/faq" className="underline">
            FAQ
          </Link>{" "}
          or join the{" "}
          <Link href="https://th.gl/discord" className="underline">
            Discord server
          </Link>
          .
        </p>
      </div>

      {/* Blog Posts Section */}
      <div>
        <div className="text-center mb-8">
          <Subtitle title="Learn More" />
          <p className="text-muted-foreground mt-2">
            Read about the companion app development and updates
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-semibold">
                <Link
                  href="/blog/why-i-built-companion-app"
                  className="hover:text-primary transition-colors"
                >
                  Why I Created a Standalone Companion App After 10+ Overwolf
                  Apps
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">
                After years of developing Overwolf apps, I built the TH.GL
                Companion App to be lighter, faster, and more flexible.
              </p>
              <Link
                href="/blog/why-i-built-companion-app"
                className="text-sm text-primary underline"
              >
                Read more →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-semibold">
                <Link
                  href="/blog/overlay-input-freeze-fix"
                  className="hover:text-primary transition-colors"
                >
                  How We Fixed the Overlay Input Freeze
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">
                Technical deep-dive into solving overlay responsiveness issues
                with dedicated input threading.
              </p>
              <Link
                href="/blog/overlay-input-freeze-fix"
                className="text-sm text-primary underline"
              >
                Read more →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
