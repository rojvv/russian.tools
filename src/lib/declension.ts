export {
  findWords as findNouns,
  normalizeWord as normalizeNoun,
  suggestWords as suggestNouns,
} from "./dictionary-lookup.ts";

export interface Noun {
  bare: string;
  nominative: string;
  meaning: string;
  gender: string;
  animate: boolean;
  indeclinable: boolean;
  singularOnly: boolean;
  pluralOnly: boolean;
  singular: string[];
  plural: string[];
}
export const cases = ["Nominative", "Genitive", "Dative", "Accusative", "Instrumental", "Prepositional"] as const;
export function createTable(noun: Noun) {
  return (["Singular", "Plural"] as const).map((title) => ({
    title,
    rows: cases.map((label, index) => ({
      label,
      form: (title === "Singular" && noun.pluralOnly) || (title === "Plural" && noun.singularOnly)
        ? ""
        : (title === "Singular" ? noun.singular : noun.plural)[index]?.replace(/^-$/, "") ?? "",
    })),
  }));
}
