import Link from "next/link";
import { localizePath } from "@repo/lib";

type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumb({
  crumbs,
  locale = "en",
  dict = {},
}: {
  crumbs: Crumb[];
  locale?: string;
  dict?: Record<string, string>;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
      <Link
        href={localizePath("/", locale)}
        className="hover:text-amber-400 transition-colors"
      >
        {dict["ui.nav_home"] || "Home"}
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="opacity-40">›</span>
          {crumb.href ? (
            <Link
              href={localizePath(crumb.href, locale)}
              className="hover:text-amber-400 transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
