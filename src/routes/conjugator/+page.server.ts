import { suggestVerbs } from "$lib/conjugation";
import { readVerbQuery } from "$lib/conjugation-url";
import { messages } from "$lib/i18n";
import { validSearchText } from "$lib/search-text";
import { canonicalRedirect, dictionarySeo } from "$lib/seo";
import { getVerbs } from "$lib/server/conjugation";
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
  try {
    matches = suggestVerbs(await getVerbs(fetch), query);
  } catch {
    // Transient asset failures must not turn valid word URLs into noindex pages.
    setHeaders({ "Retry-After": "60", "Cache-Control": "no-store" });
    error(503, messages[locals.locale].dictionaryError);
  }
  const seo = dictionarySeo("/conjugator", query, matches[0]?.bare);
  if (!seo.noindex) {
    const target = canonicalRedirect(url, seo.canonical, locals.locale);
    if (target) redirect(308, target);
  }
  return {
    query,
    matches,
    message: matches.length ? "" as const : "verbNotFound" as const,
  };
};
