export const siteOrigin = "https://russian.tools";

export const toolPaths = [
  "/",
  "/stress",
  "/stress-practice",
  "/conjugator",
  "/decliner",
  "/motion",
  "/verb-prefixes",
  "/diminutive",
  "/abbreviation",
  "/acknowledgements",
  "/case-game",
  "/transliterate",
  "/keyboard",
];

/** Compare path/query only so development and preview servers stay on their own host. */
export function canonicalRedirect(url: URL, canonical: string, locale: string): string | null {
  const path = languagePath(canonical, locale);
  return url.pathname + url.search === path ? null : path;
}

/** Keep internal navigation on the current host, including local previews. */
export function languagePath(href: string, locale: string): string {
  const url = new URL(languageUrl(href, locale));
  return url.pathname + url.search + url.hash;
}

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
