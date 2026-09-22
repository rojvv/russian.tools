export const siteOrigin = "https://russian.tools";

/** Match dictionary normalization without treating a fuzzy suggestion as an entry. */
export function dictionarySeo(path: string, query: string, bare?: string) {
  const normalize = (value: string) =>
    value.trim().toLowerCase().normalize("NFC")
      .replaceAll("\u0301", "").replaceAll("ё", "е");
  const exact = Boolean(bare && normalize(query) === normalize(bare));
  return {
    canonical: siteOrigin + path + (exact ? `?${encodeURIComponent(bare!)}` : ""),
    noindex: Boolean(query.trim()) && !exact,
  };
}

/** Prevent dictionary text from terminating an inline JSON-LD script. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

/** Explicit language URLs give crawlers stable English and Russian versions. */
export function languageUrl(href: string, locale: string): string {
  const url = new URL(href, siteOrigin);
  // Keep bare word queries intact instead of serializing them with a trailing '='.
  const query = url.search.slice(1).split("&")
    .filter((part) => part && !new URLSearchParams(part).has("lang")).join("&");
  url.search = `${query ? `${query}&` : ""}lang=${locale === "ru" ? "ru" : "en"}`;
  return url.href;
}
