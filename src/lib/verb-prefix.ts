import { matchesSearch, normalizeText } from "./search-text.ts";
import { type PrefixVerb, verbFamilies } from "./verb-prefix-data.ts";

export interface PrefixQuery {
  query: string;
  family: string;
}

const normalize = (value: string) => normalizeText(value).replaceAll("ё", "е");

export function exactPrefixVerb(entry: PrefixVerb, query: string): boolean {
  return Boolean(normalize(query))
    && [entry.imperfective, entry.perfective].some((form) => form && matchesSearch(form, query));
}

export function matchesPrefixVerb(entry: PrefixVerb, query: string): boolean {
  const needle = normalize(query);
  if (!needle) return true;
  if ([entry.imperfective, entry.perfective].some((form) => form && matchesSearch(form, query, true))) return true;
  const text = normalize([entry.meaning.en, entry.meaning.ru].join(" "));
  return needle.split(/\s+/u).every((token) => text.includes(token));
}

/** Keep the whole family visible so learners can compare a match with its relatives. */
export function searchVerbFamilies(query: string, family = "all") {
  return verbFamilies.filter((item) => family === "all" || item.id === family)
    .filter((item) => item.entries.some((entry) => matchesPrefixVerb(entry, query)))
    .sort((a, b) =>
      Number(b.entries.some((entry) => exactPrefixVerb(entry, query)))
      - Number(a.entries.some((entry) => exactPrefixVerb(entry, query)))
    );
}

function validFamily(value: string | null, query: string): string {
  return value === "all" || verbFamilies.some((family) => family.id === value)
    ? value!
    : query.trim()
    ? "all"
    : "speak";
}

export function readPrefixQuery(url: URL): PrefixQuery {
  const query = (url.searchParams.get("q") ?? "").slice(0, 120);
  return { query, family: validFamily(url.searchParams.get("family"), query) };
}

export function writePrefixQuery(url: URL, state: PrefixQuery): URL {
  const next = new URL(url);
  const query = state.query.slice(0, 120);
  const family = validFamily(state.family, query);
  if (query) next.searchParams.set("q", query);
  else next.searchParams.delete("q");
  if (family === (query.trim() ? "all" : "speak")) next.searchParams.delete("family");
  else next.searchParams.set("family", family);
  return next;
}

export const prefixCopy = {
  en: {
    description:
      "Compare Russian verbs and their prefixes, with meanings, aspect pairs, and examples across eight everyday verb families.",
    intro:
      "Explore how prefixes change a verb’s meaning. Compare related verbs, their aspects, and the situations they describe.",
    search: "Find a verb or meaning",
    placeholder: "договорить, dogovorit, finish…",
    hint:
      "Search infinitives in Cyrillic or Latin, or meanings in English or Russian. Matching families stay together for comparison.",
    family: "Verb family",
    all: "All families",
    apply: "Explore",
    reset: "Reset",
    count: "Families shown:",
    match: "Search match",
    base: "Base verb",
    prefix: "Prefix",
    reflexive: "Prefix + -ся",
    imperfective: "Imperfective",
    perfective: "Perfective",
    empty: "No matching family in this selection. Try another infinitive or meaning, or choose all families.",
    aspectHint:
      "Imperfective describes a process, repetition, or an action without emphasizing its completion. Perfective presents an action as a whole, with a result or boundary. Prefixes can also change the meaning itself.",
    formHint:
      "Each card covers a selected meaning. Paired forms share that meaning; a single form does not imply that the other aspect is impossible. Click any verb for its conjugation.",
    scope:
      "A curated selection of common meanings, not every derivative or sense. Prefix meanings depend on the verb; -ся and changes to the stem can also matter.",
    motion: "For movement verbs, use the Motion Verb Chooser.",
    reference: "Dictionary reference",
    familyLink: "Show this family",
  },
  ru: {
    description:
      "Сравнивайте русские глаголы с приставками: значения, видовые пары и примеры в восьми распространённых семействах.",
    intro:
      "Узнайте, как приставки меняют значение глагола. Сравните родственные глаголы, их вид и ситуации употребления.",
    search: "Найти глагол или значение",
    placeholder: "договорить, dogovorit, закончить…",
    hint:
      "Ищите инфинитивы кириллицей или латиницей либо значения по-русски или по-английски. Родственные глаголы показаны вместе для сравнения.",
    family: "Семейство глаголов",
    all: "Все семейства",
    apply: "Показать",
    reset: "Сбросить",
    count: "Показано семейств:",
    match: "Совпадение",
    base: "Исходный глагол",
    prefix: "Приставка",
    reflexive: "Приставка + -ся",
    imperfective: "Несовершенный вид",
    perfective: "Совершенный вид",
    empty:
      "В выбранных семействах совпадений нет. Попробуйте другой инфинитив или значение либо выберите все семейства.",
    aspectHint:
      "Несовершенный вид описывает процесс, повторение или действие без акцента на завершении. Совершенный вид представляет действие как целое, с результатом или границей. Приставки могут менять и само значение.",
    formHint:
      "Каждая карточка описывает отдельное значение. Указанные пары сохраняют это значение; одна форма не означает, что другой вид невозможен. Нажмите на глагол, чтобы открыть спряжение.",
    scope:
      "Подборка распространённых значений, а не всех производных и употреблений. Значение приставки зависит от глагола; -ся и изменения основы тоже могут быть важны.",
    motion: "Для глаголов движения используйте отдельный инструмент.",
    reference: "Словарная справка",
    familyLink: "Показать это семейство",
  },
};
