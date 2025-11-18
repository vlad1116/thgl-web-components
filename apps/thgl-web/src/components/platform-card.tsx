import { Card, CardContent, Badge } from "@repo/ui/controls";
import Link from "next/link";
import { ExternalLink, Download, Globe } from "lucide-react";

interface PlatformCardProps {
  type: "companion" | "overwolf" | "web";
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  external?: boolean;
}

const PLATFORM_CONFIG = {
  companion: {
    icon: Download,
    badgeLabel: "Windows App",
    badgeVariant: "default" as const,
  },
  overwolf: {
    icon: ExternalLink,
    badgeLabel: "Overwolf",
    badgeVariant: "outline" as const,
  },
  web: {
    icon: Globe,
    badgeLabel: "Web",
    badgeVariant: "secondary" as const,
  },
};

export function PlatformCard({
  type,
  title,
  description,
  href,
  buttonLabel,
  external = false,
}: PlatformCardProps) {
  const config = PLATFORM_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card className="hover:border-primary transition-colors">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant={config.badgeVariant} className="flex-shrink-0">
            {config.badgeLabel}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm">{description}</p>

        <Link
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Icon className="h-4 w-4" />
          {buttonLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
