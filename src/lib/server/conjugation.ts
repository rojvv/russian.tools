import type { Verb } from "$lib/conjugation";
import { cachedDictionary } from "$lib/dictionary-data";

export const getVerbs = cachedDictionary<Verb>("verbs");
