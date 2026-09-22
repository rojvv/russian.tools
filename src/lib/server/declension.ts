import type { Adjective, Declinable, Noun } from "$lib/declension";
import { adjectiveDictionaryFiles } from "$lib/declension";

let dictionary: Promise<Noun[]> | undefined;
export function getNouns(): Promise<Noun[]> {
  return dictionary ??= import("../../../static/data/nouns.json").then(({ default: data }) => data as Noun[]);
}

let adjectives: Promise<Adjective[]> | undefined;
export function getAdjectives(fetch: typeof globalThis.fetch): Promise<Adjective[]> {
  // Fetch local static assets rather than embedding 41 MB in the Worker bundle.
  return adjectives ??= Promise.all(adjectiveDictionaryFiles.map(async (file) => {
    const response = await fetch(`/data/${file}`);
    if (!response.ok) throw new Error("Could not load adjective dictionary");
    return response.json() as Promise<Adjective[]>;
  })).then((chunks) => chunks.flat()).catch((error) => {
    adjectives = undefined;
    throw error;
  });
}

let declinables: Promise<Declinable[]> | undefined;
export function getDeclinables(fetch: typeof globalThis.fetch): Promise<Declinable[]> {
  return declinables ??= Promise.all([getNouns(), getAdjectives(fetch)])
    .then(([nouns, adjectives]) => [...nouns, ...adjectives]).catch((error) => {
      declinables = undefined;
      throw error;
    });
}
