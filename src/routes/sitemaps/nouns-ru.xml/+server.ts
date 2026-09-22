import { getNouns } from "$lib/server/declension";
import { dictionaryPaths, sitemap } from "$lib/server/sitemap";

export const prerender = true;

export async function GET({ fetch }: { fetch: typeof globalThis.fetch }) {
  return sitemap(dictionaryPaths("/decliner", await getNouns(fetch), "ru"));
}
