import Link from "next/link";
import { Card, CardContent } from "@repo/ui/controls";
import { LabelBadge } from "./faq-label-badge";
import { normalizeTags } from "@/lib/blog-tag-mapping";
import type { BlogEntry } from "@/lib/blog-entries";

interface BlogPostCardProps {
  entry: BlogEntry;
  variant?: "compact" | "full";
  maxTags?: number;
}

export function BlogPostCard({
  entry,
  variant = "full",
  maxTags = 3,
}: BlogPostCardProps) {
  const normalizedTags = normalizeTags(entry.contentReference);

  if (variant === "compact") {
    return (
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-4">
          <Link
            href={`/blog/${entry.id}`}
            className="space-y-2 block"
            aria-label={`Read more about ${entry.title}`}
          >
            <h2 className="text-lg font-semibold text-brand">{entry.title}</h2>
            <p className="text-muted-foreground text-sm">{entry.description}</p>
            <span className="text-sm underline text-brand" aria-hidden="true">
              Read more →
            </span>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/blog/${entry.id}`}>
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with date and tags */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <time className="text-sm text-muted-foreground">
                {new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {normalizedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {normalizedTags.slice(0, maxTags).map((reference) => (
                    <LabelBadge key={reference} text={reference} />
                  ))}
                  {normalizedTags.length > maxTags && (
                    <span className="text-xs text-muted-foreground">
                      +{normalizedTags.length - maxTags} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Title and description */}
            <div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {entry.title}
              </h3>
              <p className="text-muted-foreground">{entry.description}</p>
            </div>

            {/* Headline */}
            {entry.headline && (
              <p className="text-sm text-muted-foreground italic">
                {entry.headline}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
