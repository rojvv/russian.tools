export type StressQuestion = {
  word: string;
  answer: string;
  vowels: number[];
  stress: number;
  before: string;
  after: string;
};

export const practiceSample =
  "Утром Анна читает интересную книгу. Потом она готовит завтрак и пьёт молоко. Вечером друзья гуляют по городу.";

export function unmarkStress(text: string): string {
  return text.replaceAll("\u0301", "");
}

export function stressAt(word: string, index: number): string {
  return word.slice(0, index + 1) + "\u0301" + word.slice(index + 1);
}

// Keep each occurrence: identical spellings may have different stress in context.
export function createStressQuestions(text: string): StressQuestion[] {
  const normalized = text.normalize("NFC");
  const questions: StressQuestion[] = [];
  // Match whole tokens so mixed scripts and compounds do not become partial words.
  for (const match of normalized.matchAll(/[\p{L}\p{M}\p{N}]+(?:[-‑'’][\p{L}\p{M}\p{N}]+)*/gu)) {
    const marked = match[0];
    if (!/^[а-яё\u0301]+$/iu.test(marked)) continue;
    const word = unmarkStress(marked);
    const vowels = [...word.matchAll(/[аеёиоуыэюя]/giu)].map((vowel) => vowel.index);
    if (vowels.length < 2) continue;

    const stresses = new Set<number>();
    let position = -1;
    let invalid = false;
    for (const letter of marked) {
      if (letter === "\u0301") {
        if (!vowels.includes(position)) invalid = true;
        stresses.add(position);
      } else {
        position++;
      }
    }
    // An explicit accent takes precedence (e.g. трёхме́рный).
    if (!stresses.size) {
      for (const yo of word.matchAll(/ё/giu)) stresses.add(yo.index);
    }
    if (invalid || stresses.size !== 1) continue;
    const stress = [...stresses][0];
    const start = match.index;
    const end = start + marked.length;
    const before = unmarkStress(normalized.slice(Math.max(0, start - 70), start));
    const after = unmarkStress(normalized.slice(end, end + 70));
    questions.push({
      word,
      answer: word[stress].toLowerCase() === "ё" ? word : stressAt(word, stress),
      vowels,
      stress,
      before: (start > 70 ? "…" : "") + before,
      after: after + (end + 70 < normalized.length ? "…" : ""),
    });
  }
  return questions;
}
