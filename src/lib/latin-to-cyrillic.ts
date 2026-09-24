/** Common informal spellings plus Russian passport spellings, longest match first.
 * Alternatives include digraphs that may represent separate Russian letters.
 * This is transliteration, not dictionary-based spelling restoration.
 */
const mappings: Record<string, string[]> = {
  shch: ["щ", "шч", "схч"],
  sch: ["щ", "сч", "сх"],
  zh: ["ж", "зх"],
  kh: ["х", "кх"],
  ts: ["ц", "тс"],
  ch: ["ч", "цх"],
  sh: ["ш", "сх"],
  yo: ["ё", "йо", "ыо"],
  jo: ["ё", "йо"],
  yu: ["ю", "йу", "ыу"],
  ju: ["ю", "йу"],
  iu: ["ю", "иу"],
  ya: ["я", "йа", "ыа"],
  ja: ["я", "йа"],
  ia: ["я", "иа"],
  ye: ["е", "йе", "ые"],
  je: ["е", "йе"],
  ie: ["ие", "ъ", "ье"],
  a: ["а"],
  b: ["б"],
  v: ["в"],
  g: ["г"],
  d: ["д"],
  e: ["е", "ё", "э"],
  z: ["з"],
  i: ["и", "й"],
  j: ["й"],
  k: ["к"],
  l: ["л"],
  m: ["м"],
  n: ["н"],
  o: ["о"],
  p: ["п"],
  r: ["р"],
  s: ["с"],
  t: ["т"],
  u: ["у"],
  f: ["ф"],
  h: ["х"],
  c: ["ц", "к", "с"],
  y: ["ы", "й", "и"],
  x: ["кс", "х"],
  w: ["в"],
  q: ["к"],
  č: ["ч"],
  š: ["ш"],
  ž: ["ж"],
  ë: ["ё"],
  "ʹ": ["ь"],
  "ʺ": ["ъ"],
  "''": ["ъ", "''"],
  "’’": ["ъ", "’’"],
  "'": ["ь", "ъ", "'"],
  "’": ["ь", "ъ", "’"],
};
const latin = /[a-zčšžë]/i;

export interface CyrillicSegment {
  start: number;
  source: string;
  options: string[];
}

export function cyrillicSegments(text: string): CyrillicSegment[] {
  const segments: CyrillicSegment[] = [];
  // Process words separately so punctuation and unrelated scripts stay intact.
  const words = /[a-zčšžëʹʺ]+(?:['’][a-zčšžëʹʺ]*)*/gi;
  let end = 0;
  for (const match of text.matchAll(words)) {
    const start = match.index;
    if (start > end) segments.push({ start: end, source: text.slice(end, start), options: [text.slice(end, start)] });
    const word = match[0];
    const letters = word.replace(/[^a-zčšžë]/gi, "");
    const caps = letters.length > 1 && letters === letters.toUpperCase();
    for (let offset = 0; offset < word.length;) {
      let source = word[offset];
      let options: string[] = [source];
      for (let length = Math.min(4, word.length - offset); length > 0; length--) {
        const candidate = word.slice(offset, offset + length);
        const mapped = mappings[candidate.toLowerCase()];
        if (!mapped) continue;
        source = candidate;
        options = mapped.map((value) => {
          if (caps) return value.toUpperCase();
          if (latin.test(source[0]) && source[0] === source[0].toUpperCase()) {
            return value[0].toUpperCase() + value.slice(1);
          }
          return value;
        });
        break;
      }
      segments.push({ start: start + offset, source, options });
      offset += source.length;
    }
    end = start + word.length;
  }
  if (end < text.length) segments.push({ start: end, source: text.slice(end), options: [text.slice(end)] });
  return segments;
}

export function renderCyrillic(segments: CyrillicSegment[], choices: Record<number, string> = {}): string {
  return segments.map((segment) =>
    segment.options.includes(choices[segment.start])
      ? choices[segment.start]
      : segment.options[0]
  ).join("");
}
