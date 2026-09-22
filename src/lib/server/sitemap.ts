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

export function dictionaryPaths(path: string, entries: { bare: string }[]): string[] {
  return [...new Set(entries.map(({ bare }) => bare))].sort().map((word) => `${path}?${encodeURIComponent(word)}`);
}
