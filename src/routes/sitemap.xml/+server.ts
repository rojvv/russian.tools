import { sitemap } from "$lib/server/sitemap";

export const prerender = true;

export function GET() {
  return sitemap([
    "/sitemaps/tools.xml",
    "/sitemaps/curse.xml",
    "/sitemaps/verbs.xml",
    "/sitemaps/nouns.xml",
    "/sitemaps/nouns-ru.xml",
    "/sitemaps/verbs-ru.xml",
    "/sitemaps/adjectives.xml",
    "/sitemaps/adjectives-ru.xml",
  ], true);
}
