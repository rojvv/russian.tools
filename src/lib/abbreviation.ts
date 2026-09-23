import {
  type Abbreviation,
  abbreviationCategories,
  type AbbreviationCategory,
  abbreviations,
} from "./abbreviation-data.ts";
import { hasLatin, normalizeText, searchKey } from "./search-text.ts";

/** Ignore optional dots and spaces, but keep meaningful slashes and hyphens. */
export function abbreviationKey(value: string): string {
  return normalizeText(value).replaceAll("ё", "е").replace(/[.\s]/gu, "").replace(/[‐‑–]/gu, "-");
}

const indexed = abbreviations.map((entry) => {
  const forms = [entry.short, ...entry.aliases].map(abbreviationKey);
  const category = abbreviationCategories[entry.category];
  const text = normalizeText(
    [entry.short, ...entry.aliases, entry.expansion, entry.english, category.en, category.ru].join(" "),
  )
    .replaceAll("ё", "е");
  return { entry, forms, latinForms: forms.map(searchKey), text, latinText: searchKey(text) };
});

/** Exact Cyrillic/alias matches take priority; never discard ambiguous meanings. */
export function findAbbreviations(query: string): Abbreviation[] {
  const needle = abbreviationKey(query);
  if (!needle) return [];
  const exact = indexed.filter(({ forms }) => forms.includes(needle));
  if (exact.length || !hasLatin(query)) return exact.map(({ entry }) => entry);
  const latin = searchKey(needle);
  return indexed.filter(({ latinForms }) => latinForms.includes(latin)).map(({ entry }) => entry);
}

/** Search abbreviations, expansions, English glosses, and bilingual subject labels. */
export function searchAbbreviations(query: string, category: AbbreviationCategory | "" = ""): Abbreviation[] {
  const text = normalizeText(query).replaceAll("ё", "е");
  const needle = abbreviationKey(query);
  const tokens = text.split(/\s+/u).filter(Boolean);
  const latin = hasLatin(query);
  const exactIds = new Set(findAbbreviations(query).map(({ id }) => id));
  return indexed.filter((item) => {
    if (category && item.entry.category !== category) return false;
    if (!text) return true;
    if (!needle) return false;
    return exactIds.has(item.entry.id)
      || item.forms.some((form) => form.includes(needle))
      || (latin && item.latinForms.some((form) => form.includes(searchKey(needle))))
      || tokens.every((token) => item.text.includes(token) || (latin && item.latinText.includes(searchKey(token))));
  }).sort((a, b) => Number(exactIds.has(b.entry.id)) - Number(exactIds.has(a.entry.id)))
    .map(({ entry }) => entry);
}

export interface AbbreviationQuery {
  query: string;
  directory: string;
  category: AbbreviationCategory | "";
}

function categoryValue(value: string | null): AbbreviationCategory | "" {
  return value && Object.hasOwn(abbreviationCategories, value) ? value as AbbreviationCategory : "";
}

export function readAbbreviationQuery(url: URL): AbbreviationQuery {
  return {
    query: (url.searchParams.get("q") ?? "").slice(0, 120),
    directory: (url.searchParams.get("directory") ?? "").slice(0, 120),
    category: categoryValue(url.searchParams.get("category")),
  };
}

export function writeAbbreviationQuery(url: URL, state: AbbreviationQuery): URL {
  const next = new URL(url);
  for (
    const [key, value] of [["q", state.query], ["directory", state.directory], [
      "category",
      categoryValue(state.category),
    ]]
  ) {
    if (value) next.searchParams.set(key, value.slice(0, 120));
    else next.searchParams.delete(key);
  }
  return next;
}

export const abbreviationCopy = {
  en: {
    description:
      "Decode Russian abbreviations and acronyms. Search a directory of everyday, official, medical, technical, and historical meanings.",
    input: "Abbreviation",
    placeholder: "СНИЛС, т. е., КПП…",
    hint: "Enter Cyrillic or Latin transliteration, e.g. SNILS. Capitalization, dots, and spaces are optional.",
    results: "Meanings",
    partial: "Related directory entries",
    ambiguous:
      "This abbreviation has several listed meanings. Use the subject and surrounding text to choose the right one.",
    empty: "No matching entry. Try a different spelling, an expansion, or a broader directory search.",
    more: "Showing the first 8 related entries. Use the directory below to see more.",
    variants: "Also written:",
    directory: "Abbreviation directory",
    directorySearch: "Search the directory",
    directoryPlaceholder: "Abbreviation, Russian expansion, or English meaning…",
    category: "Subject",
    all: "All subjects",
    count: "Meanings shown:",
    of: "of",
    short: "Abbreviation",
    expansion: "Expansion",
    gloss: "English gloss",
    scope:
      "A curated selection, not an exhaustive dictionary. One abbreviation can have several meanings; this tool does not infer meaning from a sentence. Historical and informal terms are labeled by subject. Borrowed chat expressions include their Russian meaning.",
  },
  ru: {
    description:
      "Расшифровка русских аббревиатур и сокращений. Справочник бытовых, официальных, медицинских, технических и исторических значений с поиском.",
    input: "Сокращение или аббревиатура",
    placeholder: "СНИЛС, т. е., КПП…",
    hint: "Введите кириллицей или латиницей, например SNILS. Регистр, точки и пробелы не важны.",
    results: "Значения",
    partial: "Похожие записи в справочнике",
    ambiguous: "У этого сокращения несколько значений. Выберите подходящее по теме и контексту.",
    empty: "Совпадений нет. Попробуйте другое написание, полную расшифровку или более широкий запрос в справочнике.",
    more: "Показаны первые 8 похожих записей. Остальные можно найти в справочнике ниже.",
    variants: "Варианты написания:",
    directory: "Справочник сокращений",
    directorySearch: "Поиск по справочнику",
    directoryPlaceholder: "Сокращение, расшифровка или значение по-английски…",
    category: "Тема",
    all: "Все темы",
    count: "Показано значений:",
    of: "из",
    short: "Сокращение",
    expansion: "Расшифровка",
    gloss: "Пояснение на английском",
    scope:
      "Подборка не является полным словарём. У сокращения может быть несколько значений; инструмент не определяет значение по предложению. Исторические и разговорные формы отмечены по темам. Для заимствований из переписки дано значение по-русски.",
  },
};
