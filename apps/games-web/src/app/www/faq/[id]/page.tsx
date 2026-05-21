import { notFound } from "next/navigation";
import Link from "next/link";
import { faqEntries } from "@/games/thgl-web/lib/faq-entries";
import { FaqLabelBadge } from "@/games/thgl-web/components/faq-label-badge";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { DiscordMessage } from "@repo/ui/content";
import { Button } from "@repo/ui/controls";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = faqEntries.find((q) => q.id === id);
  if (!entry) return {};
  return {
    title: `${entry.question} | FAQ – TH.GL`,
    description: `Answer to: ${entry.question}`,
    alternates: { canonical: `/faq/${entry.id}` },
    openGraph: {
      url: `/faq/${entry.id}`,
    },
  };
}

export default async function FAQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = faqEntries.find((q) => q.id === id);
  if (!entry) return notFound();

  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: entry.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: entry.answer,
                },
              },
            ],
            url: `https://www.th.gl/faq/${entry.id}`,
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
              href="/faq"
              className="hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{entry.question}</li>
        </ol>
      </nav>
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/faq">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to FAQ
          </Link>
        </Button>
      </div>

      {/* Question Header */}
      <header className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          {entry.question}
        </h1>

        {entry.labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.labels.map((label) => (
              <FaqLabelBadge key={label} label={label} />
            ))}
          </div>
        )}
      </header>

      <hr className="border-border" />

      {/* Answer Content */}
      <article className="prose prose-invert prose-lg max-w-none">
        <DiscordMessage>{entry.answer}</DiscordMessage>
      </article>

      <hr className="border-border" />

      {/* Footer with back button */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/faq">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all questions
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
