import { Card, Button } from "@repo/ui/controls";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import Link from "next/link";

interface Feature {
  text: string;
  enabled: boolean;
}

interface ComparisonCardData {
  icon: LucideIcon;
  title: string;
  features: Feature[];
  cta: {
    label: string;
    href: string;
    variant?: "default" | "outline";
  };
  highlighted?: boolean;
}

interface ComparisonCardsProps {
  cards: ComparisonCardData[];
  className?: string;
}

export function ComparisonCards({ cards, className = "" }: ComparisonCardsProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-8 max-w-4xl mx-auto ${className}`}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={card.highlighted ? "border-primary/20" : "border-border"}
          >
            <div className="p-6 space-y-4">
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  card.highlighted ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${card.highlighted ? "text-primary" : ""}`}
                />
              </div>
              <h3 className="text-xl font-semibold">{card.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {card.features.map((feature, featureIdx) => (
                  <li key={featureIdx} className="flex items-start">
                    <span
                      className={`${feature.enabled ? "text-primary" : "text-muted-foreground/50"} mr-2`}
                    >
                      {feature.enabled ? "✓" : "✗"}
                    </span>
                    <span
                      className={
                        feature.enabled ? "" : "text-muted-foreground/70"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={card.cta.variant || "default"}
                asChild
              >
                <Link href={card.cta.href}>{card.cta.label}</Link>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
