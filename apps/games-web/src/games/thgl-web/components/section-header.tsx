import { Subtitle } from "@repo/ui/content";

interface SectionHeaderProps {
  title: string;
  description?: string;
  centered?: boolean;
}

export function SectionHeader({
  title,
  description,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={centered ? "text-center mb-8" : "mb-8"}>
      <Subtitle title={title} />
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
