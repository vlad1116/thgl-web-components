import { ExternalLink, Download, Globe } from "lucide-react";
import { InfoCard } from "./info-card";
import type { ComponentProps } from "react";
import type { Badge } from "@repo/ui/controls";

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
    badgeVariant: "default" as ComponentProps<typeof Badge>["variant"],
  },
  overwolf: {
    icon: ExternalLink,
    badgeLabel: "Overwolf",
    badgeVariant: "outline" as ComponentProps<typeof Badge>["variant"],
  },
  web: {
    icon: Globe,
    badgeLabel: "Web",
    badgeVariant: "secondary" as ComponentProps<typeof Badge>["variant"],
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

  return (
    <InfoCard
      title={title}
      description={description}
      href={href}
      linkLabel={buttonLabel}
      icon={config.icon}
      badge={{ label: config.badgeLabel, variant: config.badgeVariant }}
      external={external}
      titleSize="large"
    />
  );
}
