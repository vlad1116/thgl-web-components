import Link from "next/link";
import { type Tier, perks } from "@/games/thgl-web/lib/tiers";
import { cn } from "@/games/thgl-web/lib/utils";
import { Button, Card, CardContent, Badge } from "@repo/ui/controls";
import { Check, X } from "lucide-react";

export function TierCard({ tier }: { tier: Tier }) {
  return (
    <Card
      className={cn(
        "flex flex-col w-full max-w-[320px] transition-all",
        tier.highlight &&
          "border-primary shadow-lg shadow-primary/20 scale-105",
      )}
    >
      <CardContent className="p-6 flex flex-col gap-6 h-full">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{tier.title}</h3>

          {/* Pricing */}
          <div className="flex items-baseline gap-1">
            {tier.gift ? (
              <>
                <span className="text-3xl font-bold line-through text-muted-foreground">
                  ${tier.price}
                </span>
                <span className="text-5xl font-bold text-primary">$0</span>
              </>
            ) : (
              <span className="text-5xl font-bold text-primary">
                ${tier.price}
              </span>
            )}
            <span className="text-muted-foreground text-sm">
              {tier.gift ? "" : "/ month"}
            </span>
          </div>

          {tier.gift && (
            <p className="text-sm text-muted-foreground">
              Free for the first {tier.gift.months} months
            </p>
          )}
        </div>

        {/* Perks List */}
        <ul className="grow space-y-3">
          {perks.map((perk) => {
            const isIncluded = tier.perks.includes(perk.id);
            return (
              <li
                key={perk.title}
                className={cn(
                  "flex items-start gap-2 text-sm",
                  isIncluded ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {isIncluded ? (
                  <Check className="h-5 w-5 text-primary shrink-0" />
                ) : (
                  <X className="h-5 w-5 shrink-0" />
                )}
                <span>{perk.title}</span>
              </li>
            );
          })}
        </ul>

        {/* CTA Button */}
        <Button
          variant={tier.highlight ? "default" : "secondary"}
          size="lg"
          className="w-full"
          asChild
        >
          <Link
            href={
              tier.gift
                ? tier.gift.url
                : `https://www.patreon.com/join/devleon/checkout?rid=${tier.id}`
            }
            target="_blank"
          >
            {tier.gift ? "Join for Free" : "Get Started"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
