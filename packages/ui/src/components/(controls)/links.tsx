"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ReleaseNotesLink,
  ExternalAnchor,
  NavMenu,
  HeaderLink,
  DiscordIcon,
  GitHubIcon,
  RedditIcon,
} from "../(header)";
import { ExternalLink } from "lucide-react";
import { AppConfig, localizePath } from "@repo/lib";
import { NavIcon } from "../(content)";
import { useMemo } from "react";
import { Badge } from "../ui/badge";
import { useI18n } from "../(providers)";
import { ScriptLoader } from "../(ads)";
import ConsentLink from "../(ads)/consent-link";

const HOME_INTERNAL_LINK = {
  href: "/",
  title: "home.title",
  description: "home.description",
  iconName: "House",
} as const;

const DEFAULT_INTERNAL_LINKS = [
  {
    href: "/",
    title: "defaultMap.title",
    description: "defaultMap.description",
    iconName: "Map",
  },
] as const;

export function Links({
  appConfig,
  hideReleaseNotes,
  children,
}: {
  appConfig: AppConfig;
  hideReleaseNotes?: boolean;
  children?: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const { locale, t } = useI18n();

  const internalLinks = useMemo(() => {
    const list = appConfig.internalLinks ?? DEFAULT_INTERNAL_LINKS;
    const hasHome = list.some((l) => l.href === HOME_INTERNAL_LINK.href);
    return hasHome ? list : [HOME_INTERNAL_LINK, ...list];
  }, [appConfig.internalLinks]);

  const links = internalLinks.map((l) => {
    const localizedHref = localizePath(l.href, locale);
    const isHome = l.href === "/";
    const isExactMatch = isHome
      ? pathname === "/" || pathname === `/${locale}`
      : pathname === localizedHref;

    const isNestedMatch = !isHome && pathname.startsWith(localizedHref + "/");

    return {
      href: localizedHref,
      isActive: isExactMatch || isNestedMatch,
      content: (
        <HeaderLink active={isExactMatch || isNestedMatch}>
          <div>
            <NavIcon iconName={l.iconName} className="w-4 h-4" />
            <span>{t(l.title)}</span>
          </div>
        </HeaderLink>
      ),
    };
  });

  const active = links.find((link) => link.isActive) ?? links[0];

  return (
    <NavMenu
      active={active.content}
      external={
        <>
          {appConfig.appUrl && (
            <ExternalAnchor
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors"
              href={appConfig.appUrl}
            >
              {t("links.inGameApp")}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </ExternalAnchor>
          )}

          {appConfig.promoLinks?.map(({ href, title }) => (
            <Link key={href} href={localizePath(href, locale)}>
              <Badge>{t(title)}</Badge>
            </Link>
          ))}

          {appConfig.externalLinks?.map(({ href, title }) => (
            <ExternalAnchor
              key={href}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors"
              href={href}
            >
              {t(title)}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </ExternalAnchor>
          ))}

          {!hideReleaseNotes && (
            <ReleaseNotesLink
              href={`https://www.th.gl/apps/${appConfig.name}`}
            />
          )}

          {/* Locale + social icons — mobile nav only */}
          <div className="md:hidden flex items-center justify-center gap-1.5 w-full">
            {children}
            <ExternalAnchor
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
              href="https://th.gl/discord"
              title="Discord"
            >
              <DiscordIcon size={14} className="opacity-70" />
            </ExternalAnchor>
            <ExternalAnchor
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
              href="https://github.com/The-Hidden-Gaming-Lair"
              title="GitHub"
            >
              <GitHubIcon size={14} className="opacity-70" />
            </ExternalAnchor>
            <ExternalAnchor
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
              href="https://www.reddit.com/r/TheHiddenGamingLair/"
              title="Reddit"
            >
              <RedditIcon size={14} className="opacity-70" />
            </ExternalAnchor>
          </div>
        </>
      }
      externalFooter={
        <div className="flex flex-wrap justify-center gap-1.5 w-full">
          <ExternalAnchor
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            href="https://www.th.gl/legal-notice"
          >
            {t("legal_notice")}
            <ExternalLink className="w-2.5 h-2.5 opacity-40" />
          </ExternalAnchor>
          <ExternalAnchor
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            href="https://www.th.gl/privacy-policy"
          >
            {t("privacy_policy")}
            <ExternalLink className="w-2.5 h-2.5 opacity-40" />
          </ExternalAnchor>
          <ScriptLoader>
            <ConsentLink />
          </ScriptLoader>
        </div>
      }
    >
      {internalLinks.map((l) => (
        <Link
          key={l.href}
          href={localizePath(l.href, locale)}
          className="flex h-full w-full select-none flex-col justify-end rounded-md hover:bg-gradient-to-b from-muted/50 to-muted p-4 space-y-1 no-underline outline-none focus:shadow-md"
        >
          <div className="flex items-center uppercase truncate">
            <NavIcon
              iconName={l.iconName}
              className="inline-block h-4 w-4 mr-2"
            />
            <span className="truncate">{t(l.title)}</span>
          </div>
          {l.description && (
            <p className="text-sm leading-tight text-muted-foreground">
              {t(l.description)}
            </p>
          )}
        </Link>
      ))}
    </NavMenu>
  );
}
