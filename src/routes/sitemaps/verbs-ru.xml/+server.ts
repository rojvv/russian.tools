import { hasConjugationForms } from "$lib/conjugation";
import { getVerbs } from "$lib/server/conjugation";
import { dictionaryPaths, sitemap } from "$lib/server/sitemap";

export const prerender = true;

export async function GET({ fetch }: { fetch: typeof globalThis.fetch }) {
  return sitemap(dictionaryPaths("/conjugator", await getVerbs(fetch), "ru", hasConjugationForms));
}
