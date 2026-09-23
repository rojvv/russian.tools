import { suggestDeclinables } from "$lib/declension";
import { readDeclensionQuery } from "$lib/declension-url";
import { validSearchText } from "$lib/search-text";
import { getDeclinables } from "$lib/server/declension";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, fetch }) => {
  const query = readDeclensionQuery(url);
  if (!query.trim()) return { query, matches: [], message: "" as const };
  if (!validSearchText(query)) {
    return { query, matches: [], message: "invalidNoun" as const };
  }
  let matches;
  try {
    matches = suggestDeclinables(await getDeclinables(fetch), query);
  } catch {
    return { query, matches: [], message: "nounDictionaryError" as const };
  }
  return {
    query,
    matches,
    message: matches.length ? "" as const : "nounNotFound" as const,
  };
};
