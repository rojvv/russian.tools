import { languageUrl, siteOrigin, toolPaths } from "$lib/seo";
import { sitemap } from "$lib/server/sitemap";

export const prerender = true;

export function GET() {
  return sitemap(
    toolPaths.flatMap(
      (path) => ["en", "ru"].map((locale) => languageUrl(path, locale).replace(siteOrigin, "")),
    ),
  );
}
