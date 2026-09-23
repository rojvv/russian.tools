import { type RussianName, russianNames } from "./diminutive-data.ts";
import { matchesSearch } from "./search-text.ts";

export function normalizeName(value: string): string {
  return value.normalize("NFC").replaceAll("\u0301", "").trim().toLowerCase().replaceAll("ё", "е");
}

function names(entry: RussianName): string[] {
  return [entry.name, ...(entry.aliases ?? []), ...entry.forms];
}

/** Return every listed parent, including names shared across genders. */
export function findNames(query: string): RussianName[] {
  const needle = normalizeName(query);
  return needle ? russianNames.filter((entry) => names(entry).some((name) => matchesSearch(name, query))) : [];
}

/** Both full names and diminutives participate in directory and partial lookup. */
export function searchNames(query: string): RussianName[] {
  const needle = normalizeName(query);
  return needle
    ? russianNames.filter((entry) => names(entry).some((name) => matchesSearch(name, query, true)))
    : russianNames;
}

export interface DiminutiveQuery {
  query: string;
  directory: string;
}

export function readDiminutiveQuery(url: URL): DiminutiveQuery {
  return {
    query: (url.searchParams.get("q") ?? "").slice(0, 100),
    directory: (url.searchParams.get("directory") ?? "").slice(0, 100),
  };
}

export function writeDiminutiveQuery(url: URL, state: DiminutiveQuery): URL {
  const next = new URL(url);
  for (const [key, value] of [["q", state.query], ["directory", state.directory]]) {
    if (value) next.searchParams.set(key, value.slice(0, 100));
    else next.searchParams.delete(key);
  }
  return next;
}

export const diminutiveCopy = {
  en: {
    description:
      "Find Russian name diminutives or look up the full name behind a familiar form. Browse a searchable directory of names.",
    input: "Full name or diminutive",
    placeholder: "Александр, Саша, Маша…",
    hint:
      "Search in Cyrillic or Latin, e.g. Саша or Sasha. Capitalization and stress marks are optional; е also matches ё.",
    results: "Matching full names",
    partial: "Partial matches",
    empty: "No matching name in this directory. Check the spelling or try another form.",
    ambiguous: "This form belongs to more than one listed name.",
    forms: "Short and affectionate forms",
    variants: "Also written:",
    directory: "Name directory",
    directorySearch: "Search the directory",
    directoryPlaceholder: "Search full names or diminutives…",
    count: "Names shown:",
    of: "of",
    fullName: "Full name",
    more: "Showing the first 8 partial matches. Keep typing or search the directory below.",
    scope:
      "A selection of Russian names and their short and affectionate forms. Some forms have several possible full names; the list is not exhaustive. How a form sounds depends on the relationship and context.",
  },
  ru: {
    description:
      "Найдите уменьшительные формы русского имени или полное имя по краткой форме. Алфавитный справочник с поиском.",
    input: "Полное имя или уменьшительная форма",
    placeholder: "Александр, Саша, Маша…",
    hint:
      "Ищите кириллицей или латиницей, например Саша или Sasha. Регистр и ударения не важны; вместо ё можно писать е.",
    results: "Подходящие полные имена",
    partial: "Частичные совпадения",
    empty: "В справочнике нет такого имени. Проверьте написание или попробуйте другую форму.",
    ambiguous: "Эта форма относится к нескольким именам в справочнике.",
    forms: "Краткие и ласкательные формы",
    variants: "Варианты написания:",
    directory: "Справочник имён",
    directorySearch: "Поиск по справочнику",
    directoryPlaceholder: "Полное имя или уменьшительная форма…",
    count: "Показано имён:",
    of: "из",
    fullName: "Полное имя",
    more: "Показаны первые 8 частичных совпадений. Уточните запрос или воспользуйтесь поиском по справочнику ниже.",
    scope:
      "Подборка русских имён и их кратких и ласкательных форм. Одна форма может относиться к нескольким полным именам; список не исчерпывающий. Оттенок обращения зависит от отношений и контекста.",
  },
};
