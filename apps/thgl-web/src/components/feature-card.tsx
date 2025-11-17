import { Card, CardContent } from "@repo/ui/controls";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface FeatureCardProps {
  icon?: LucideIcon | string; // LucideIcon or emoji
  title: string;
  description: string | ReactNode;
  variant?: "default" | "bordered"; // bordered = with Card wrapper
}

export function FeatureCard({
  icon,
  title,
  description,
  variant = "default",
}: FeatureCardProps) {
  const content = (
    <>
      {icon && (
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          {typeof icon === "string" ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            (() => {
              const Icon = icon;
              return <Icon className="h-6 w-6 text-primary" />;
            })()
          )}
        </div>
      )}
      <h3
        className={
          variant === "bordered" ? "text-xl font-semibold" : "font-semibold text-lg mb-2"
        }
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </>
  );

  if (variant === "bordered") {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 space-y-3">{content}</CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors text-center space-y-3">
      {content}
    </div>
  );
}
