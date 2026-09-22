import { normalizeNoun, suggestNouns } from "$lib/declension";
import { readNounQuery } from "$lib/declension-url";
import { getNouns } from "$lib/server/declension";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const query = readNounQuery(url);
  if (!query.trim()) return { query, matches: [], message: "" as const };
  if (!/^[а-яё]+(?:-[а-яё]+)*$/u.test(normalizeNoun(query))) {
    return { query, matches: [], message: "invalidNoun" as const };
  }
  const matches = suggestNouns(await getNouns(), query);
  return {
    query,
    matches,
    message: matches.length ? "" as const : "nounNotFound" as const,
  };
};
