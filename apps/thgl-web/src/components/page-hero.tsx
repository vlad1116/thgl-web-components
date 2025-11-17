import Link from "next/link";
import { Button } from "@repo/ui/controls";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface CTAButton {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: "default" | "outline";
  download?: boolean;
}

interface PageHeroProps {
  badge?: string;
  title: string | ReactNode;
  description: string;
  ctaButtons?: CTAButton[];
  metaInfo?: string;
}

export function PageHero({
  badge,
  title,
  description,
  ctaButtons,
  metaInfo,
}: PageHeroProps) {
  return (
    <div className="text-center space-y-6">
      {badge && (
        <div className="inline-block px-4 py-1 bg-primary/10 rounded-full text-sm text-primary mb-2">
          {badge}
        </div>
      )}
      <h1 className="text-4xl md:text-6xl font-bold">
        {typeof title === "string" ? title : title}
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
        {description}
      </p>
      {ctaButtons && ctaButtons.length > 0 && (
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-2">
          {ctaButtons.map((button, idx) => {
            const Icon = button.icon;
            const ButtonContent = (
              <>
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {button.label}
              </>
            );

            return (
              <Button
                key={idx}
                size="lg"
                variant={button.variant || "default"}
                className="text-lg"
                asChild
              >
                {button.download ? (
                  <a href={button.href} download>
                    {ButtonContent}
                  </a>
                ) : (
                  <Link href={button.href}>{ButtonContent}</Link>
                )}
              </Button>
            );
          })}
        </div>
      )}
      {metaInfo && (
        <p className="text-xs text-muted-foreground pt-2">{metaInfo}</p>
      )}
    </div>
  );
}
