import { FAQList } from "@/components/faq-list";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export const metadata = {
  title: "FAQ – Frequently Asked Questions | TH.GL",
  description:
    "Find answers to common questions about TH.GL, the Companion App, ads, subscriptions, and more.",
  alternates: { canonical: "/faq" },
  openGraph: {
    url: `/faq`,
  },
};

export default function FAQIndexPage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "FAQ – Frequently Asked Questions | TH.GL",
            description:
              "Find answers to common questions about TH.GL, the Companion App, ads, subscriptions, and more.",
            url: "https://www.th.gl/faq",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about TH.GL tools, subscriptions, and app usage."
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
          <li aria-current="page">FAQ</li>
        </ol>
      </nav>

      <FAQList />
    </PageShell>
  );
}
