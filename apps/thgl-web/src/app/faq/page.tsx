import { FAQList } from "@/components/faq-list";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";

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
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about TH.GL tools, subscriptions, and app usage."
      />

      <FAQList />
    </PageShell>
  );
}
