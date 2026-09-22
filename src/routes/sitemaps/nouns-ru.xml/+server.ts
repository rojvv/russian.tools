import { getNouns } from "$lib/server/declension";
import { dictionaryPaths, sitemap } from "$lib/server/sitemap";

export const prerender = true;

export async function GET() {
  return sitemap(dictionaryPaths("/decliner", await getNouns(), "ru"));
}
