import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface BenefitItem {
  icon: string | LucideIcon;
  label?: string;
  description: string | ReactNode;
}

interface BenefitListProps {
  items: BenefitItem[];
  iconSize?: "sm" | "md" | "lg";
  spacing?: "tight" | "normal" | "relaxed";
}

const ICON_SIZES = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

const SPACING = {
  tight: "space-y-2",
  normal: "space-y-3",
  relaxed: "space-y-4",
};

export function BenefitList({
  items,
  iconSize = "md",
  spacing = "relaxed",
}: BenefitListProps) {
  return (
    <ul className={`${SPACING[spacing]} text-muted-foreground`}>
      {items.map((item, index) => {
        const isStringIcon = typeof item.icon === "string";

        return (
          <li key={index} className="flex gap-3">
            {isStringIcon ? (
              <span
                className={`${ICON_SIZES[iconSize]} shrink-0`}
                aria-hidden="true"
              >
                {item.icon as string}
              </span>
            ) : (
              (() => {
                const Icon = item.icon as LucideIcon;
                return <Icon className={`${ICON_SIZES[iconSize]} shrink-0`} />;
              })()
            )}
            <div>
              {item.label ? (
                <>
                  <strong className="text-foreground">{item.label}:</strong>{" "}
                  {item.description}
                </>
              ) : (
                <span>{item.description}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
