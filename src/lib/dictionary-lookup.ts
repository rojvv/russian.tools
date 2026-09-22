export const normalizeWord = (text: string) =>
  text.normalize("NFC").toLocaleLowerCase("ru").replaceAll("\u0301", "").trim();

export function findWords<T extends { bare: string }>(words: T[], text: string): T[] {
  const query = normalizeWord(text);
  const exact = words.filter((entry) => normalizeWord(entry.bare) === query);
  return exact.length
    ? exact
    : words.filter((entry) => normalizeWord(entry.bare).replaceAll("ё", "е") === query.replaceAll("ё", "е"));
}

/** Prefer exact spellings, then common prefix matches, then the smallest edit distance. */
export function suggestWords<T extends { bare: string }>(words: T[], text: string): T[] {
  const query = normalizeWord(text).replaceAll("ё", "е");
  if (!query || query.length > 40) return [];
  const exact = findWords(words, text);
  if (exact.length) return exact;
  const prefix = words.find((entry) => normalizeWord(entry.bare).replaceAll("ё", "е").startsWith(query));
  if (prefix) return findWords(words, prefix.bare);
  let closest: T | undefined;
  let best = Infinity;
  for (const entry of words) {
    const word = normalizeWord(entry.bare).replaceAll("ё", "е");
    if (Math.abs(word.length - query.length) > best) continue;
    let previous = Array.from({ length: word.length + 1 }, (_, i) => i);
    for (let i = 1; i <= query.length; i++) {
      const current = [i];
      for (let j = 1; j <= word.length; j++) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (query[i - 1] === word[j - 1] ? 0 : 1),
        );
      }
      previous = current;
    }
    if (previous[word.length] < best) {
      best = previous[word.length];
      closest = entry;
    }
  }
  return closest ? findWords(words, closest.bare) : [];
}
