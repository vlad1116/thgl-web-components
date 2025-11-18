import { BlogList } from "@/components/blog-list";
import { PageShell } from "@/components/page-shell";

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
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold">Blog & Updates</h1>
        <p className="text-lg text-muted-foreground">
          Announcements, behind-the-scenes insights, game guides, and development updates from The Hidden Gaming Lair.
        </p>
      </div>

      <BlogList />
    </PageShell>
  );
}
