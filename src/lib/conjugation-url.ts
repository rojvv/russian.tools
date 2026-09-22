/** The first query entry accepts either ?читать or a named value such as ?verb=читать. */
export function readVerbQuery(url: URL): string {
  const first = url.searchParams.entries().next().value;
  return first ? (first[1] || first[0]).slice(0, 40) : "";
}

/** Use the short, shareable ?читать format for text entered in the editor. */
export function writeVerbQuery(url: URL, query: string): URL {
  const next = new URL(url);
  next.search = query ? `?${encodeURIComponent(query)}` : "";
  return next;
}
