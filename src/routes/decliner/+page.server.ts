import type { Declinable } from "$lib/declension";
import { readDeclensionQuery } from "$lib/declension-url";
import { messages } from "$lib/i18n";
import { validSearchText } from "$lib/search-text";
import { canonicalRedirect, dictionarySeo } from "$lib/seo";
import { searchDictionary } from "$lib/server/dictionary-search";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, fetch, locals, setHeaders }) => {
  const query = readDeclensionQuery(url);
  if (!query.trim()) {
    const target = canonicalRedirect(url, dictionarySeo("/decliner", "").canonical, locals.locale);
    if (target) redirect(308, target);
    return { query, matches: [], message: "" as const };
  }
  if (!validSearchText(query)) {
    return { query, matches: [], message: "invalidNoun" as const };
  }
  let matches;
  let deferred = false;
  try {
    ({ matches, deferred } = await searchDictionary<Declinable>(fetch, "decliner", query));
  } catch {
    // Transient asset failures must not turn valid word URLs into noindex pages.
    setHeaders({ "Retry-After": "60", "Cache-Control": "no-store" });
    error(503, messages[locals.locale].nounDictionaryError);
  }
  const seo = dictionarySeo("/decliner", query, matches[0]?.bare);
  if (!seo.noindex) {
    const target = canonicalRedirect(url, seo.canonical, locals.locale);
    if (target) redirect(308, target);
  }
  return {
    query,
    matches,
    message: matches.length || deferred ? "" as const : "nounNotFound" as const,
  };
};
