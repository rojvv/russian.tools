import { readDictionaryQuery } from "./dictionary-url.ts";

/** The first query entry accepts either ?читать or a named value such as ?verb=читать. */
export function readVerbQuery(url: URL): string {
  return readDictionaryQuery(url);
}

/** Use the short, shareable ?читать format for text entered in the editor. */
export function writeVerbQuery(url: URL, query: string): URL {
  const next = new URL(url);
  next.search = query ? `?${encodeURIComponent(query)}` : "";
  const language = url.searchParams.get("lang");
  if (language === "en" || language === "ru") {
    next.search += `${next.search ? "&" : "?"}lang=${language}`;
  }
  return next;
}
