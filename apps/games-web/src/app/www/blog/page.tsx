import { BlogList } from "@/games/thgl-web/components/blog-list";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import Link from "next/link";

export const metadata = {
  title: "Blog – The Hidden Gaming Lair",
  description:
    "Updates, game guides, new feature announcements, and development insights from TH.GL",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    url: "/blog",
  },
};

export default function BlogPage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Blog – The Hidden Gaming Lair",
            description:
              "Updates, game guides, new feature announcements, and development insights from TH.GL",
            url: "https://www.th.gl/blog",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Blog & Updates"
        description="Announcements, behind-the-scenes insights, game guides, and development updates from The Hidden Gaming Lair."
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
          <li aria-current="page">Blog</li>
        </ol>
      </nav>

      <BlogList />
    </PageShell>
  );
}
