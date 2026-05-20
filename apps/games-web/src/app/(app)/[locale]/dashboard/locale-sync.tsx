"use client";

import { useEffect } from "react";
import { useLocale } from "@repo/ui/providers";
import { setLocaleOnNative } from "@repo/lib/thgl-app";

export function LocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    setLocaleOnNative(locale).catch(console.error);
  }, [locale]);

  return null;
}
