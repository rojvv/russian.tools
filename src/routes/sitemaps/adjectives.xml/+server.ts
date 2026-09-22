import { getAdjectives, getNouns } from "$lib/server/declension";
import { dictionaryPaths, sitemap } from "$lib/server/sitemap";

export const prerender = true;

export async function GET({ fetch }: { fetch: typeof globalThis.fetch }) {
  const [adjectives, nouns] = await Promise.all([getAdjectives(fetch), getNouns(fetch)]);
  const nounWords = new Set(nouns.map(({ bare }) => bare));
  return sitemap(dictionaryPaths("/decliner", adjectives.filter(({ bare }) => !nounWords.has(bare)), "en"));
}
