import { getVerbs } from "$lib/server/conjugation";
import { dictionaryPaths, sitemap } from "$lib/server/sitemap";

export const prerender = true;

export async function GET() {
  return sitemap(dictionaryPaths("/conjugator", await getVerbs(), "ru"));
}
