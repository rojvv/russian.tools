import { type CurseLevel, curseLevels, type CurseType, curseTypes, curseWords } from "./curse-data.ts";
import { hasLatin, normalizeText, searchKey } from "./search-text.ts";

const key = (text: string) => normalizeText(text).replaceAll("ё", "е").replace(/\s+/gu, " ");
const indexed = curseWords.map((entry) => {
  const forms = [entry.word, entry.latin, ...entry.aliases];
  const text = [
    ...forms,
    ...Object.values(entry.meaning),
    ...Object.values(entry.usage),
    ...Object.values(curseLevels[entry.level]),
    ...Object.values(curseTypes[entry.type]),
  ].join(" ");
  return { entry, forms: forms.map(key), latinForms: forms.map(searchKey), text: key(text), latin: searchKey(text) };
});

export interface CurseQuery {
  query: string;
  level: CurseLevel | "";
  type: CurseType | "";
}

export function searchCurses(query: string, level: CurseLevel | "" = "", type: CurseType | "" = "") {
  const needle = key(query);
  const latin = hasLatin(query);
  const latinNeedle = searchKey(needle);
  const tokens = needle.split(/\s+/u).filter(Boolean).map((token) => ({ text: token, latin: searchKey(token) }));
  const headword = (item: typeof indexed[number]) => item.forms[0] === needle;
  const exact = (item: typeof indexed[number]) =>
    item.forms.includes(needle)
    || (latin && item.latinForms.includes(latinNeedle));
  return indexed.filter((item) => {
    if (level && item.entry.level !== level || type && item.entry.type !== type) return false;
    return !needle || exact(item)
      || tokens.every((token) => item.text.includes(token.text) || (latin && item.latin.includes(token.latin)));
  }).sort((a, b) => Number(headword(b)) - Number(headword(a)) || Number(exact(b)) - Number(exact(a)))
    .map(({ entry }) => entry);
}

function levelValue(value: string | null): CurseLevel | "" {
  return value && Object.hasOwn(curseLevels, value) ? value as CurseLevel : "";
}
function typeValue(value: string | null): CurseType | "" {
  return value && Object.hasOwn(curseTypes, value) ? value as CurseType : "";
}
export function readCurseQuery(url: URL): CurseQuery {
  return {
    query: (url.searchParams.get("q") ?? "").slice(0, 120),
    level: levelValue(url.searchParams.get("level")),
    type: typeValue(url.searchParams.get("type")),
  };
}
export function writeCurseQuery(url: URL, state: CurseQuery): URL {
  const next = new URL(url);
  next.searchParams.delete("p");
  for (
    const [name, value] of [["q", state.query.slice(0, 120)], ["level", levelValue(state.level)], [
      "type",
      typeValue(state.type),
    ]]
  ) {
    if (value) next.searchParams.set(name, value);
    else next.searchParams.delete(name);
  }
  return next;
}

export const curseCopy = {
  en: {
    description:
      "Browse Russian curse words and expressions with English meanings, usage notes, examples, and intensity filters.",
    intro:
      "Russian swear words, insults, and derogatory expressions, from mild exclamations to mat. Explore their meanings and usage.",
    search: "Search words or meanings",
    placeholder: "блин, blyat, nonsense…",
    hint: "Search in Cyrillic, Latin transliteration, or English. Stress marks and е/ё are optional.",
    level: "Intensity",
    type: "Expression type",
    allLevels: "All intensities",
    allTypes: "All types",
    count: "Matches:",
    englishDefinition: "Definition in English",
    attribution: "Dictionary definitions adapted from English Wiktionary contributors via Kaikki, under",
    of: "of",
    clear: "Clear filters",
    submit: "Search",
    empty: "No matching entries. Try a different word or clear the filters.",
    usage: "Usage",
    example: "Example",
    variants: "Related forms / spellings:",
    scope:
      "Intensity is approximate and depends on context and tone. English translations are approximate equivalents. This curated selection is not a complete dictionary; mild expressions can still be inappropriate in formal conversation.",
  },
  ru: {
    description:
      "Русские ругательства и выражения: значения, примеры употребления, английские переводы и фильтр по степени грубости.",
    intro:
      "Русские ругательства, оскорбления и пренебрежительные выражения — от мягких восклицаний до мата. Значения и употребление.",
    search: "Поиск по словам и значениям",
    placeholder: "блин, blyat, ерунда…",
    hint: "Ищите кириллицей, латиницей или по-английски. Ударения необязательны, е и ё равнозначны.",
    level: "Степень грубости",
    type: "Тип выражения",
    allLevels: "Любая грубость",
    allTypes: "Все типы",
    count: "Найдено:",
    englishDefinition: "Значение на английском",
    attribution: "Словарные определения адаптированы из английского Викисловаря через Kaikki по лицензии",
    of: "из",
    clear: "Сбросить фильтры",
    submit: "Найти",
    empty: "Совпадений нет. Попробуйте другое слово или сбросьте фильтры.",
    usage: "Употребление",
    example: "Пример",
    variants: "Другие формы / написания:",
    scope:
      "Степень грубости условна и зависит от контекста и интонации. Английские переводы приблизительны. Подборка не является полным словарём; даже мягкие выражения могут быть неуместны в официальном общении.",
  },
};
