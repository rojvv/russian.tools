import { readDictionaryQuery } from "./dictionary-url.ts";

/** The first query entry accepts either ?книга or a named value such as ?noun=книга or ?adjective=новый. */
export function readDeclensionQuery(url: URL): string {
  return readDictionaryQuery(url);
}

/** Use the short, shareable ?книга format for text entered in the editor. */
export function writeDeclensionQuery(url: URL, query: string): URL {
  const next = new URL(url);
  next.search = query ? `?${encodeURIComponent(query)}` : "";
  const language = url.searchParams.get("lang");
  if (language === "en" || language === "ru") {
    next.search += `${next.search ? "&" : "?"}lang=${language}`;
  }
  return next;
}

// Preserve existing imports and noun URLs.
export { readDeclensionQuery as readNounQuery, writeDeclensionQuery as writeNounQuery };
