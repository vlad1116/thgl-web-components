import { Card, CardContent, Badge } from "@repo/ui/controls";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface InfoCardProps {
  title: string;
  description?: string;
  href: string;
  linkLabel: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant?: ComponentProps<typeof Badge>["variant"];
  };
  external?: boolean;
  titleSize?: "default" | "large";
}

export function InfoCard({
  title,
  description,
  href,
  linkLabel,
  icon: Icon,
  badge,
  external = false,
  titleSize = "default",
}: InfoCardProps) {
  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          {titleSize === "large" ? (
            <h2 className="text-xl font-semibold">{title}</h2>
          ) : (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          {badge && (
            <Badge
              variant={badge.variant || "secondary"}
              className="flex-shrink-0"
            >
              {badge.label}
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <Link
          href={href}
          target={external ? "_blank" : undefined}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {Icon && <Icon className="h-4 w-4" />}
          {linkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
