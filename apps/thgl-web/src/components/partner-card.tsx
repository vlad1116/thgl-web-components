import { ExternalLink } from "lucide-react";
import { PartnerApp } from "@repo/lib";
import { InfoCard } from "./info-card";

export function PartnerCard({ app }: { app: PartnerApp }) {
  return (
    <InfoCard
      title={app.title}
      description={app.description}
      href={app.web}
      linkLabel="Visit Website"
      icon={ExternalLink}
      badge={{ label: "Partner", variant: "secondary" }}
      external
    />
  );
}
