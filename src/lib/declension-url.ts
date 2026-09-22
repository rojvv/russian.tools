/** The first query entry accepts either ?книга or a named value such as ?noun=книга. */
export function readNounQuery(url: URL): string {
  const first = url.searchParams.entries().next().value;
  return first ? (first[1] || first[0]).slice(0, 40) : "";
}

/** Use the short, shareable ?книга format for text entered in the editor. */
export function writeNounQuery(url: URL, query: string): URL {
  const next = new URL(url);
  next.search = query ? `?${encodeURIComponent(query)}` : "";
  return next;
}
