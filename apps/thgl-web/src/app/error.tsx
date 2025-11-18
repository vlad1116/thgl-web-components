"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@repo/ui/controls";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error); // Optionally replace with external logging service
  }, [error]);

  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      <PageHeader
        title="Oops, something went wrong"
        description="We hit an unexpected error. Try reloading the page — or let us know if it keeps happening."
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button onClick={reset}>Try Again</Button>
        <Link
          href="https://th.gl/discord"
          rel="noopener noreferrer"
          target="_blank"
          className="text-primary hover:underline font-medium"
        >
          Contact us on Discord
        </Link>
      </div>

      {/* Error Details */}
      {error.message && (
        <>
          <hr className="border-border" />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              Error Details
            </h2>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words bg-muted/20 p-4 rounded-md border border-border">
              {error.message}
            </pre>
          </div>
        </>
      )}
    </PageShell>
  );
}
