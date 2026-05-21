import Link from "next/link";
import { cn } from "@/games/thgl-web/lib/utils";

interface ViewMoreLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function ViewMoreLink({
  href,
  label = "View all →",
  className,
}: ViewMoreLinkProps) {
  return (
    <div className={cn("text-center pt-2", className)}>
      <Link
        href={href}
        className="underline text-sm text-muted-foreground hover:text-white"
      >
        {label}
      </Link>
    </div>
  );
}
