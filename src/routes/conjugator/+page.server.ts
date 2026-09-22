import { normalizeVerb, suggestVerbs } from "$lib/conjugation";
import { readVerbQuery } from "$lib/conjugation-url";
import { getVerbs } from "$lib/server/conjugation";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, fetch }) => {
  const query = readVerbQuery(url);
  if (!query.trim()) return { query, matches: [], message: "" as const };
  if (!/^[а-яё]+(?:-[а-яё]+)*$/u.test(normalizeVerb(query))) {
    return { query, matches: [], message: "invalidVerb" as const };
  }
  let matches;
  try {
    matches = suggestVerbs(await getVerbs(fetch), query);
  } catch {
    return { query, matches: [], message: "dictionaryError" as const };
  }
  return {
    query,
    matches,
    message: matches.length ? "" as const : "verbNotFound" as const,
  };
};
