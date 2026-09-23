import { formLookup } from "./dictionary-lookup.ts";
export { normalizeWord, normalizeWord as normalizeNoun } from "./dictionary-lookup.ts";
const declensionLookup = formLookup<Declinable>(word => [
  word.bare,
  ...createTable(word).flatMap(section => section.rows.map(row => row.form)),
]);
export const findDeclinables = declensionLookup.find;
export const suggestDeclinables = declensionLookup.suggest;
export const findNouns = (words: Noun[], text: string) => declensionLookup.find(words, text) as Noun[];
export const suggestNouns = (words: Noun[], text: string) => declensionLookup.suggest(words, text) as Noun[];

export interface Noun {
  kind?: "noun";
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
export interface Adjective {
  kind: "adjective";
  bare: string;
  nominative: string;
  meaning: string;
  masculine: string[];
  feminine: string[];
  neuter: string[];
  plural: string[];
}
export type Declinable = Noun | Adjective;

// Adjectives distinguish animate and inanimate accusatives in each paradigm.
export const adjectiveCases = [
  "Nominative",
  "Genitive",
  "Dative",
  "AccusativeInanimate",
  "AccusativeAnimate",
  "Instrumental",
  "Prepositional",
] as const;
type Section = {
  title: "Singular" | "Plural" | "Masculine" | "Feminine" | "Neuter";
  rows: { label: typeof cases[number] | typeof adjectiveCases[number]; form: string }[];
};

export function createTable(noun: Declinable): Section[] {
  if (noun.kind === "adjective") {
    return ([
      ["Masculine", noun.masculine],
      ["Feminine", noun.feminine],
      ["Neuter", noun.neuter],
      ["Plural", noun.plural],
    ] as const).map(([title, forms]) => ({
      title,
      rows: adjectiveCases.map((label, index) => ({ label, form: forms[index]?.replace(/^-$/, "") ?? "" })),
    }));
  }
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
