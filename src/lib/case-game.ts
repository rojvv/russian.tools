import { createTable, type Declinable, normalizeWord } from "./declension.ts";

type Section = ReturnType<typeof createTable>[number];
export type CaseQuestion = {
  word: Declinable;
  section: Section["title"];
  sourceCase: Section["rows"][number]["label"];
  targetCase: Section["rows"][number]["label"];
  source: string;
  answers: string[];
};
export type WordKind = "both" | "noun" | "adjective";
const commonWords = new Set((
  "книга стол дом школа город друг мама папа окно море письмо работа комната страна "
  + "новый старый большой маленький хороший плохой красивый русский синий красный белый молодой"
).split(" "));

export function answerForms(form: string): string[] {
  return form.split(/[,;/]/u).map(value => value.trim())
    .filter(value => /^[а-яё\u0301]+(?:-[а-яё\u0301]+)*$/iu.test(value));
}
const normalizeAnswer = (value: string) => normalizeWord(value).replaceAll("ё", "е");
export function isCaseAnswer(question: CaseQuestion, answer: string): boolean {
  return question.answers.some(form => normalizeAnswer(form) === normalizeAnswer(answer));
}

/** Keep grammatical number/gender fixed, and never ask for the same case or spelling. */
export function caseQuestions(word: Declinable): CaseQuestion[] {
  if (word.kind !== "adjective" && word.indeclinable) return [];
  const questions: CaseQuestion[] = [];
  for (const section of createTable(word)) {
    for (const source of section.rows) {
      for (const target of section.rows) {
        if (source.label.startsWith("Accusative") && target.label.startsWith("Accusative")) continue;
        if (source.label === target.label) continue;
        const sources = answerForms(source.form);
        const answers = answerForms(target.form);
        if (!sources.length || !answers.length) continue;
        if (sources.some(form => answers.some(answer => normalizeAnswer(form) === normalizeAnswer(answer)))) continue;
        questions.push({
          word,
          section: section.title,
          sourceCase: source.label,
          targetCase: target.label,
          source: sources[0],
          answers,
        });
      }
    }
  }
  return questions;
}

export function createCaseRound(words: Declinable[], kind: WordKind = "both", random = Math.random): CaseQuestion[] {
  const candidates = words.filter(word =>
    commonWords.has(word.bare)
    && (kind === "both" || (word.kind ?? "noun") === kind)
  )
    .map(caseQuestions).filter(questions => questions.length);
  // Shuffle words first so each round practices different vocabulary.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, 10).map(questions => questions[Math.floor(random() * questions.length)]);
}
