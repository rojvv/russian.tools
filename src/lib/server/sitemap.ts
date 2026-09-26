import { hasLatin, normalizeText, validSearchText } from "../search-text.ts";
import { languageUrl } from "../seo.ts";
const origin = "https://russian.tools";
const namespace = "http://www.sitemaps.org/schemas/sitemap/0.9";

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;").replaceAll("'", "&apos;");
}

export function sitemap(paths: string[], index = false): Response {
  const root = index ? "sitemapindex" : "urlset";
  const entry = index ? "sitemap" : "url";
  const entries = paths.map((path) => `  <${entry}><loc>${escapeXml(origin + path)}</loc></${entry}>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="${namespace}">\n${entries.join("\n")}\n</${root}>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}

export function dictionaryPaths<T extends { bare: string }>(
  path: string,
  entries: T[],
  locale = "en",
  include: (entry: T) => boolean = () => true,
): string[] {
  // Lookup chooses the first normalized headword in dictionary order. Deduplicate
  // before checking content so a later homonym cannot advertise an empty default.
  const headwords = new Map<string, T>();
  for (const entry of entries) {
    const key = normalizeText(entry.bare);
    if (!headwords.has(key)) headwords.set(key, entry);
  }
  const words = [...headwords.values()].filter(entry =>
    entry.bare.length <= 40
    && validSearchText(entry.bare, path === "/conjugator")
    // Latin and mixed-script searches use transliteration matching, which may
    // resolve to a different headword and is not a canonical dictionary URL.
    && !hasLatin(entry.bare)
    && include(entry)
  ).map(entry => entry.bare);
  return words.sort().map((word) => languageUrl(`${path}?${encodeURIComponent(word)}`, locale).replace(origin, ""));
}
