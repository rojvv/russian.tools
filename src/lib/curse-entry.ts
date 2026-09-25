import type { CurseEntry } from "./curse-data.ts";
import { languageUrl, siteOrigin } from "./seo.ts";

export function curseEntrySlug(word: string): string {
  return word.normalize("NFC").toLowerCase().replaceAll("\u0301", "").replaceAll(" ", "_");
}

export function curseEntryPath(entry: Pick<CurseEntry, "word">): string {
  return `/curse/${encodeURIComponent(curseEntrySlug(entry.word))}`;
}

export function curseEntrySeo(entry: CurseEntry, locale: "en" | "ru") {
  const word = entry.word.replaceAll("\u0301", "");
  const definition = entry.meaning[locale] ?? entry.meaning.en;
  const meaningLanguage = entry.meaning[locale] ? locale : "en";
  const title = locale === "ru"
    ? `${word} — значение и употребление | russian.tools`
    : `${word} (${entry.latin}) — meaning and usage | russian.tools`;
  const summary = `${word}: ${definition}`.replace(/\s+/gu, " ");
  const description = summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}…` : summary;
  const canonical = siteOrigin + curseEntryPath(entry);
  const url = languageUrl(canonical, locale);
  return {
    title,
    description,
    canonical,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": url,
      url,
      name: title,
      description,
      inLanguage: locale,
      mainEntity: {
        "@type": "DefinedTerm",
        "@id": `${url}#term`,
        name: entry.word,
        alternateName: [entry.latin, ...entry.aliases],
        description: { "@value": definition, "@language": meaningLanguage },
        inDefinedTermSet: languageUrl("/curse", locale),
        url,
      },
      ...(entry.imported
        ? {
          license: "https://creativecommons.org/licenses/by-sa/4.0/",
          creditText: "English Wiktionary contributors; extracted by Kaikki / Wiktextract",
        }
        : {}),
      ...(entry.source ? { citation: entry.source } : {}),
    },
  };
}
