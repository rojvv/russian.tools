import { hasConjugationForms, type Verb } from "./conjugation.ts";
import { dictionarySeo } from "./seo.ts";

/** Empty paradigms remain usable, but must not be advertised as indexed conjugations. */
export function conjugationSeo(query: string, verb?: Verb | null) {
  return dictionarySeo("/conjugator", query, verb && hasConjugationForms(verb) ? verb.bare : undefined);
}
