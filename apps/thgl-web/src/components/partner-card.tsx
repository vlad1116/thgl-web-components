import { Card, CardContent, Badge } from "@repo/ui/controls";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PartnerApp } from "@repo/lib";

export function PartnerCard({ app }: { app: PartnerApp }) {
  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{app.title}</h3>
          <Badge variant="secondary" className="flex-shrink-0">
            Partner
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{app.description}</p>

        <Link
          href={app.web}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Visit Website
        </Link>
      </CardContent>
    </Card>
  );
}
