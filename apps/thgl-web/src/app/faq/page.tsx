import { FAQList } from "@/components/faq-list";
import { PageShell } from "@/components/page-shell";

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
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about TH.GL tools, subscriptions, and
          app usage.
        </p>
      </div>

      <FAQList />
    </PageShell>
  );
}
