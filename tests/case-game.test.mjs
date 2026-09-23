import assert from "node:assert/strict";
import test from "node:test";
import { answerForms, caseQuestions, createCaseRound, isCaseAnswer } from "../src/lib/case-game.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

const words = [...readDictionary("nouns"), ...readDictionary("adjectives")];
const book = words.find(word => word.bare === "книга");
const fresh = words.find(word => word.bare === "новый" && word.kind === "adjective");

test("rounds contain ten usable questions for every word selection", () => {
  for (const kind of ["both", "noun", "adjective"]) {
    const round = createCaseRound(words, kind, () => 0.42);
    assert.equal(round.length, 10);
    assert.equal(new Set(round.map(q => q.word)).size, 10);
    for (const question of round) {
      if (kind !== "both") assert.equal(question.word.kind ?? "noun", kind);
      assert.notEqual(question.sourceCase, question.targetCase);
      assert.ok(question.answers.length);
      assert.equal(isCaseAnswer(question, question.source), false);
      assert.ok(question.answers.every(answer => isCaseAnswer(question, answer)));
    }
  }
});

test("questions allow non-nominative sources and every target case", () => {
  const questions = caseQuestions(book);
  assert.ok(questions.some(q => q.sourceCase === "Instrumental" && q.targetCase === "Dative"));
  assert.equal(new Set(questions.map(q => q.targetCase)).size, 6);
  assert.deepEqual([...new Set(questions.map(q => q.section))], ["Singular", "Plural"]);
});

test("answers accept alternative endings, accents, case, and е for ё", () => {
  const question = caseQuestions(fresh).find(q => q.section === "Feminine" && q.targetCase === "Instrumental");
  assert.ok(isCaseAnswer(question, " НОВОЮ "));
  assert.ok(isCaseAnswer(question, "но́вой"));
  assert.equal(isCaseAnswer(question, "новый"), false);
  assert.equal(isCaseAnswer(question, ""), false);
  assert.ok(isCaseAnswer({ answers: ["зелёного"] }, "зеленого"));
  assert.deepEqual(answerForms("—, -, , unknown, но́вой, но́вою"), ["но́вой", "но́вою"]);
});

test("adjective accusatives preserve animacy and never turn into each other", () => {
  const questions = caseQuestions(fresh);
  assert.ok(
    questions.some(q =>
      q.section === "Masculine" && q.targetCase === "AccusativeAnimate" && q.answers.includes("но́вого")
    ),
  );
  assert.ok(
    questions.some(q =>
      q.section === "Masculine" && q.targetCase === "AccusativeInanimate" && q.answers.includes("но́вый")
    ),
  );
  assert.ok(questions.every(q => !(q.sourceCase.startsWith("Accusative") && q.targetCase.startsWith("Accusative"))));
});

test("unavailable paradigms and indeclinable words are excluded", () => {
  assert.deepEqual(caseQuestions({ ...book, indeclinable: true }), []);
  assert.ok(caseQuestions({ ...book, singularOnly: true }).every(q => q.section === "Singular"));
  assert.ok(caseQuestions({ ...book, pluralOnly: true }).every(q => q.section === "Plural"));
  assert.deepEqual(caseQuestions({ ...book, singular: [], plural: [] }), []);
  assert.deepEqual(createCaseRound([]), []);
});

test("custom rounds honor the requested length and avoid duplicate questions", () => {
  for (const kind of ["both", "noun", "adjective"]) {
    for (const count of [1, 5, 25, 100]) {
      const round = createCaseRound(words, kind, () => 0.42, count);
      assert.equal(round.length, count);
      assert.equal(new Set(round.map(q => JSON.stringify(q))).size, count);
      assert.ok(round.every(q => kind === "both" || (q.word.kind ?? "noun") === kind));
    }
  }
});

test("invalid round lengths are bounded", () => {
  for (const [count, expected] of [[0, 1], [-3, 1], [2.9, 2], [101, 100], [NaN, 10], [Infinity, 10]]) {
    assert.equal(createCaseRound(words, "both", () => 0.42, count).length, expected);
  }
});
