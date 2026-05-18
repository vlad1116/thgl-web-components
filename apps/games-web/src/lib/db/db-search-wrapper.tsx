import { DbSearch } from "./db-search";

export function DbSearchWrapper({ locale = "en" }: { locale?: string }) {
  return <DbSearch locale={locale} />;
}
