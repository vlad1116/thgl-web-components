"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Card, CardContent, Input, Button } from "@repo/ui/controls";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  blogEntries,
  allBlogContentReferences,
  type BlogContentReference,
} from "@/lib/blog-entries";
import { normalizeTags } from "@/lib/blog-tag-mapping";
import { LabelBadge } from "@/components/faq-label-badge";

// Popular/priority tags to show by default
const PRIORITY_TAGS: BlogContentReference[] = [
  "TH.GL Companion App",
  "Overwolf",
  "Palworld",
  "Dune Awakening",
  "Once Human",
  "Palia",
  "New World",
  "Grounded 2",
  "Infinity Nikki",
  "Soulframe",
];

export function BlogList() {
  const [selectedReferences, setSelectedReferences] = useState<
    BlogContentReference[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  const sortedEntries = useMemo(
    () =>
      [...blogEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedEntries.filter((entry) => {
      const normalizedEntryTags = normalizeTags(entry.contentReference);
      const matchesReferences =
        selectedReferences.length === 0 ||
        normalizedEntryTags.some((reference) =>
          selectedReferences.includes(reference),
        );

      if (!matchesReferences) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        entry.headline,
        entry.title,
        entry.description,
        entry.content,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedReferences, sortedEntries]);

  const toggleReference = (reference: BlogContentReference) => {
    setSelectedReferences((previous) =>
      previous.includes(reference)
        ? previous.filter((label) => label !== reference)
        : [...previous, reference],
    );
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearFilters = () => {
    setSelectedReferences([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedReferences.length > 0 || searchQuery.trim().length > 0;

  const displayedTags = useMemo(() => {
    if (showAllTags) {
      return allBlogContentReferences;
    }
    return allBlogContentReferences.filter((tag) => PRIORITY_TAGS.includes(tag));
  }, [showAllTags]);

  const hiddenTagsCount = allBlogContentReferences.length - PRIORITY_TAGS.length;

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search blog posts..."
          aria-label="Search blog posts"
          className="bg-background"
        />

        {/* Tags */}
        {allBlogContentReferences.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Filter by Topic</h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {displayedTags.map((reference) => {
                const isSelected = selectedReferences.includes(reference);
                return (
                  <button
                    key={reference}
                    type="button"
                    onClick={() => toggleReference(reference)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <LabelBadge
                      text={reference}
                      variant="minimal"
                      dotClassName="h-2.5 w-2.5"
                    />
                  </button>
                );
              })}
            </div>

            {hiddenTagsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTags(!showAllTags)}
                className="w-full"
              >
                {showAllTags ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show fewer tags
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show {hiddenTagsCount} more tags
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Results count */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredEntries.length} of {sortedEntries.length} posts
          </div>
        )}
      </div>

      {/* Blog Posts */}
      {filteredEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No posts match the current filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Link key={entry.id} href={`/blog/${entry.id}`}>
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
                      {(() => {
                        const normalizedTags = normalizeTags(entry.contentReference);
                        return normalizedTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {normalizedTags.slice(0, 3).map((reference) => (
                              <LabelBadge key={reference} text={reference} />
                            ))}
                            {normalizedTags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{normalizedTags.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Title and description */}
                    <div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {entry.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {entry.description}
                      </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
