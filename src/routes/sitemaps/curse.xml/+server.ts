import { curseWords } from "$lib/curse-data";
import { curseEntryPath } from "$lib/curse-entry";
import { languagePath } from "$lib/seo";
import { sitemap } from "$lib/server/sitemap";

export const prerender = true;

export function GET() {
  return sitemap(
    curseWords.flatMap((entry) => ["en", "ru"].map((locale) => languagePath(curseEntryPath(entry), locale))),
  );
}
