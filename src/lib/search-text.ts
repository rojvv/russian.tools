const latin: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export const normalizeText = (text: string) => text.normalize("NFC").toLowerCase().replaceAll("\u0301", "").trim();

export const hasLatin = (text: string) => /\p{Script=Latin}/u.test(text);

/** A tolerant comparison key, never a replacement for displayed Cyrillic. */
export function searchKey(text: string): string {
  return normalizeText(text)
    .replace(/[а-яё]/gu, (letter) => latin[letter])
    .replaceAll("č", "ch").replaceAll("š", "sh").replaceAll("ž", "zh").replaceAll("ë", "yo")
    .replace(/[’'`ʹʺ\u0300\u0301]/gu, "")
    .replace(/sch/gu, "shch")
    .replace(/kh/gu, "h").replace(/x/gu, "ks")
    .replace(/tz/gu, "ts").replace(/c(?!h)/gu, "ts")
    .replace(/[yj]o/gu, "e")
    .replace(/(^|[\s-]|[aeou])[iyj]e/gu, "$1e")
    .replace(/[yj]/gu, "i")
    .replace(/i+/gu, "i");
}

export function matchesSearch(value: string, query: string, partial = false): boolean {
  const normalize = hasLatin(query) ? searchKey : (text: string) => normalizeText(text).replaceAll("ё", "е");
  const word = normalize(value);
  const needle = normalize(query);
  return partial ? word.includes(needle) : word === needle;
}

export function validSearchText(text: string, phrases = false): boolean {
  const query = normalizeText(text);
  const letters = "[а-яёa-zčšžë]+(?:[’'`ʹʺ][а-яёa-zčšžë]*)*";
  return new RegExp(`^${letters}(?:${phrases ? "[-\\s]" : "-"}${letters})*$`, "u").test(query);
}
