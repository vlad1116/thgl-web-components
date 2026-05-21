import { notFound } from "next/navigation";
import { blogEntries } from "@/games/thgl-web/lib/blog-entries";
import { normalizeTags } from "@/games/thgl-web/lib/blog-tag-mapping";
import { LabelBadge } from "@/games/thgl-web/components/faq-label-badge";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { Button } from "@repo/ui/controls";
import Link from "next/link";
import { DiscordMessage } from "@repo/ui/content";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = blogEntries.find((e) => e.id === id);
  if (!entry) return {};
  return {
    title: `${entry.title} | Blog – TH.GL`,
    description: entry.description,
    alternates: { canonical: `/blog/${entry.id}` },
    openGraph: {
      url: `/blog/${entry.id}`,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = blogEntries.find((e) => e.id === id);
  if (!entry) return notFound();

  const normalizedTags = normalizeTags(entry.contentReference);

  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: entry.title,
            datePublished: entry.date,
            author: {
              "@type": "Person",
              name: "DevLeon",
            },
            url: `https://www.th.gl/blog/${entry.id}`,
          }).replace(/</g, "\\u003c"),
        }}
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
          <li>
            <Link
              href="/blog"
              className="hover:text-foreground transition-colors"
            >
              Blog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{entry.title}</li>
        </ol>
      </nav>
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Article Header */}
      <header className="space-y-6">
        {/* Headline */}
        {entry.headline && (
          <p className="text-sm font-medium text-primary uppercase tracking-wide">
            {entry.headline}
          </p>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          {entry.title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <time dateTime={entry.date}>
            {new Date(entry.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>

          {normalizedTags.length > 0 && (
            <>
              <span className="text-border">•</span>
              <div className="flex flex-wrap gap-2">
                {normalizedTags.map((reference) => (
                  <LabelBadge key={reference} text={reference} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Description */}
        {entry.description && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {entry.description}
          </p>
        )}
      </header>

      {/* Divider */}
      <hr className="border-border" />

      {/* Article Content */}
      <article className="prose prose-invert prose-lg max-w-none">
        <DiscordMessage>{entry.content}</DiscordMessage>
      </article>

      {/* Divider */}
      <hr className="border-border" />

      {/* Footer with back button */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all posts
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
