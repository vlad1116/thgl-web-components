"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../(data)";
import { Button } from "../ui/button";
import Link from "next/link";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  "es-MX": "Español (México)",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  pl: "Polski",
  "pt-BR": "Português (Brasil)",
  ru: "Русский",
  th: "ไทย",
  tr: "Türkçe",
  uk: "Українська",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
};

export function LocaleSwitcher({
  locales,
  current,
  defaultLocale = "en",
}: {
  locales: string[];
  current: string;
  defaultLocale?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSegments = pathname.split("/").filter(Boolean);
  const currentIsLocale = locales.includes(currentSegments[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">{LOCALE_LABELS[current] ?? current}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => {
          const segments = [...currentSegments];

          if (currentIsLocale) {
            // Replace or remove the locale segment
            if (locale === defaultLocale) {
              segments.shift(); // Remove locale for default
            } else {
              segments[0] = locale;
            }
          } else {
            // Only add locale prefix for non-default locales
            if (locale !== defaultLocale) {
              segments.unshift(locale);
            }
          }

          const href =
            "/" +
            segments.join("/") +
            (searchParams.size ? `?${searchParams}` : "");

          return (
            <DropdownMenuItem key={locale} asChild>
              <Link href={href}>{LOCALE_LABELS[locale] ?? locale}</Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
