import { getSuggestionsAndIssues } from "@repo/lib";
import type { Metadata } from "next";
import { SuggestionsIssuesList } from "./[id]/suggestions-issues";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@repo/ui/controls";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suggestions & Issues - The Hidden Gaming Lair",
  description:
    "View and discuss suggestions and reported issues for The Hidden Gaming Lair projects.",
  alternates: { canonical: "/suggestions-issues" },
  openGraph: {
    url: `/suggestions-issues`,
  },
};

export default async function SuggestionsPage() {
  const posts = await getSuggestionsAndIssues(50);

  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Suggestions & Issues - The Hidden Gaming Lair",
            description:
              "View and discuss suggestions and reported issues for The Hidden Gaming Lair projects.",
            url: "https://www.th.gl/suggestions-issues",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Suggestions & Issues"
        description={
          <>
            Browse through community suggestions and reported issues from our{" "}
            <a
              href="https://th.gl/discord"
              target="_blank"
              className="text-primary hover:underline font-medium"
            >
              Discord server
            </a>
            . Join the{" "}
            <a
              href="https://discord.com/channels/320539672663031818/1021543411293106217"
              target="_blank"
              className="text-primary hover:underline font-medium"
            >
              #suggestions-issues
            </a>{" "}
            channel to contribute your own ideas!
          </>
        }
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
          <li aria-current="page">Suggestions & Issues</li>
        </ol>
      </nav>

      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No suggestions or issues found. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <SuggestionsIssuesList posts={posts} initialLimit={10} />
      )}
    </PageShell>
  );
}
