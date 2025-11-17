import { Button } from "@repo/ui/controls";
import { Subtitle } from "@repo/ui/content";
import Link from "next/link";
import { type ReactNode } from "react";

interface CTASectionProps {
  title: string;
  description: string | ReactNode;
  ctaLabel: string;
  ctaHref: string;
  footer?: string | ReactNode;
  className?: string;
}

export function CTASection({
  title,
  description,
  ctaLabel,
  ctaHref,
  footer,
  className = "",
}: CTASectionProps) {
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <Subtitle title={title} />
      {typeof description === "string" ? (
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {description}
        </p>
      ) : (
        <div className="text-sm text-muted-foreground max-w-xl mx-auto">
          {description}
        </div>
      )}
      <Button asChild>
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
      {footer && (
        <>
          {typeof footer === "string" ? (
            <p className="text-xs text-muted-foreground pt-2 italic">{footer}</p>
          ) : (
            <div className="text-xs text-muted-foreground pt-2">{footer}</div>
          )}
        </>
      )}
    </div>
  );
}
