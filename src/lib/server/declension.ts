import type { Adjective, Declinable, Noun } from "$lib/declension";
import { cachedDictionary } from "$lib/dictionary-data";

export const getNouns = cachedDictionary<Noun>("nouns");
export const getAdjectives = cachedDictionary<Adjective>("adjectives");

let declinables: Promise<Declinable[]> | undefined;
export function getDeclinables(fetch: typeof globalThis.fetch): Promise<Declinable[]> {
  return declinables ??= Promise.all([getNouns(fetch), getAdjectives(fetch)])
    .then(([nouns, adjectives]) => [...nouns, ...adjectives]).catch((error) => {
      declinables = undefined;
      throw error;
    });
}
