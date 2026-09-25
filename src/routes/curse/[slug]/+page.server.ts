import { curseWords } from "$lib/curse-data";
import { curseEntryPath, curseEntrySlug } from "$lib/curse-entry";
import { canonicalRedirect } from "$lib/seo";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const entries = new Map(curseWords.map((entry) => [curseEntrySlug(entry.word), entry]));

export const load: PageServerLoad = ({ params, url, locals }) => {
  const entry = entries.get(curseEntrySlug(params.slug));
  if (!entry) error(404, locals.locale === "ru" ? "Слово не найдено" : "Word not found");
  const target = canonicalRedirect(url, curseEntryPath(entry), locals.locale);
  if (target) redirect(308, target);
  return { entry };
};
