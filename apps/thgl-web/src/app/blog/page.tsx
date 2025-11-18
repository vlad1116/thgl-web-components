import { BlogList } from "@/components/blog-list";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Blog – The Hidden Gaming Lair",
  description:
    "Updates, game guides, new feature announcements, and development insights from TH.GL",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return (
    <PageShell className="space-y-12 max-w-6xl mx-auto">
      <PageHeader
        title="Blog & Updates"
        description="Announcements, behind-the-scenes insights, game guides, and development updates from The Hidden Gaming Lair."
      />

      <BlogList />
    </PageShell>
  );
}
