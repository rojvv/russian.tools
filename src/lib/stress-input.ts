/** rustress's 40-character model also prepends up to four context characters. */
const maxWordLength = 36;

/** Leave oversized engine tokens intact without losing stress on nearby text. */
export async function markSupportedText(
  text: string,
  mark: (text: string) => Promise<string>,
): Promise<string> {
  // Include the engine's retained signs and markers when measuring its input.
  const tokens = /[а-яё\u0301'_+]+/giu;
  let start = 0;
  let result = "";
  for (const token of text.matchAll(tokens)) {
    if (token[0].length <= maxWordLength) continue;
    if (token.index > start) result += await mark(text.slice(start, token.index));
    result += token[0];
    start = token.index + token[0].length;
  }
  if (start < text.length) result += await mark(text.slice(start));
  return result;
}
