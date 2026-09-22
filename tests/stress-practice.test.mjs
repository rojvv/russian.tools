import assert from "node:assert/strict";
import test from "node:test";
import { createStressQuestions, stressAt } from "../src/lib/stress-practice.ts";

test("questions retain context but hide all stress marks in it", () => {
  const questions = createStressQuestions("Она́ пьёт молоко́. У́тро!");
  assert.equal(questions.length, 3);
  const milk = questions[1];
  assert.equal(milk.word, "молоко");
  assert.deepEqual(milk.vowels, [1, 3, 5]);
  assert.equal(milk.stress, 5);
  assert.equal(milk.answer, "молоко́");
  assert.equal(milk.before, "Она пьёт ");
  assert.equal(milk.after, ". Утро!");
});

test("each occurrence keeps its own accent, including uppercase words", () => {
  const questions = createStressQuestions("за́мок замо́к МОЛОКО́");
  assert.deepEqual(questions.map(({ stress }) => stress), [1, 3, 5]);
  assert.equal(questions[2].answer, "МОЛОКО́");
});

test("ё identifies stress unless an explicit accent overrides it", () => {
  const questions = createStressQuestions("ёлочка ЁЛОЧКА трёхме́рный ё́лочка");
  assert.deepEqual(questions.map(({ stress }) => stress), [0, 0, 5, 0]);
  assert.deepEqual(questions.map(({ answer }) => answer), ["ёлочка", "ЁЛОЧКА", "трёхме́рный", "ёлочка"]);
});

test("skip unknown stress, monosyllables, invalid accents and ambiguous markings", () => {
  assert.deepEqual(createStressQuestions("молоко дом я и́ ма́ма́ ма́м́а ёмоё 123 English"), []);
});

test("do not extract partial words from compounds, mixed scripts or numbers", () => {
  assert.deepEqual(createStressQuestions("кто́-то сине́-зелёный сине́‑зелёный aма́ма ма́ма2 ма́ма's"), []);
});

test("normalize decomposed Russian letters while preserving stress", () => {
  const questions = createStressQuestions("ёлочка ра́йоны".normalize("NFD"));
  assert.deepEqual(questions.map(({ word }) => word), ["ёлочка", "районы"]);
  assert.deepEqual(questions.map(({ stress }) => stress), [0, 1]);
});

test("long context is bounded and marked with ellipses", () => {
  const [question] = createStressQuestions("x".repeat(100) + " молоко́ " + "x".repeat(100));
  assert.equal(question.before.length, 71);
  assert.equal(question.after.length, 71);
  assert.ok(question.before.startsWith("…"));
  assert.ok(question.after.endsWith("…"));
});

test("empty text is safe and selected vowels can be shown as stressed words", () => {
  assert.deepEqual(createStressQuestions("  \n"), []);
  assert.equal(stressAt("молоко", 3), "моло́ко");
});
