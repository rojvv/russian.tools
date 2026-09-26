import type { Verb } from "$lib/conjugation";
import { conjugationSeo } from "$lib/conjugation-seo";
import { readVerbQuery } from "$lib/conjugation-url";
import { messages } from "$lib/i18n";
import { validSearchText } from "$lib/search-text";
import { canonicalRedirect, dictionarySeo } from "$lib/seo";
import { searchDictionary } from "$lib/server/dictionary-search";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, fetch, locals, setHeaders }) => {
  const query = readVerbQuery(url);
  if (!query.trim()) {
    const target = canonicalRedirect(url, dictionarySeo("/conjugator", "").canonical, locals.locale);
    if (target) redirect(308, target);
    return { query, matches: [], message: "" as const };
  }
  if (!validSearchText(query, true)) {
    return { query, matches: [], message: "invalidVerb" as const };
  }
  let matches;
  let deferred = false;
  try {
    ({ matches, deferred } = await searchDictionary<Verb>(fetch, "conjugator", query));
  } catch {
    // Transient asset failures must not turn valid word URLs into noindex pages.
    setHeaders({ "Retry-After": "60", "Cache-Control": "no-store" });
    error(503, messages[locals.locale].dictionaryError);
  }
  const seo = conjugationSeo(query, matches[0]);
  if (!seo.noindex) {
    const target = canonicalRedirect(url, seo.canonical, locals.locale);
    if (target) redirect(308, target);
  }
  return {
    query,
    matches,
    message: matches.length || deferred ? "" as const : "verbNotFound" as const,
  };
};
