// Russian international passport mappings (ICAO Doc 9303, Part 3, section 6B).
// https://www.icao.int/sites/default/files/publications/DocSeries/9303_p3_cons_en.pdf
const letters: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
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
  ъ: "ie",
  ы: "y",
  ь: "",
  э: "e",
  ю: "iu",
  я: "ia",
};

/** Convert modern Russian letters; leave other scripts and formatting intact. */
export function transliterate(text: string): string {
  // Normalize Russian graphemes only, preserving unrelated decomposed text.
  return text.replace(/[А-ЯЁа-яё][\p{M}]*(?:[А-ЯЁа-яё][\p{M}]*)*/gu, (word) => {
    const normalized = word.normalize("NFC").replaceAll("\u0301", "");
    const allCaps = normalized.length > 1 && normalized === normalized.toUpperCase();
    const characters = [...normalized];
    return characters.map((character) => {
      const lower = character.toLowerCase();
      let result = letters[lower];
      if (result === undefined) return character;
      if (!result) return "";
      if (character !== lower) {
        result = allCaps ? result.toUpperCase() : result[0].toUpperCase() + result.slice(1);
      }
      return result;
    }).join("");
  });
}
