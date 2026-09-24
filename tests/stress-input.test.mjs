import assert from "node:assert/strict";
import test from "node:test";
import { env } from "onnxruntime-web/wasm";

env.wasm.numThreads = 1;
const { markStresses } = await import("@roj/rustress");
const mark = text => markStresses(text, { markSingleVowels: false });

test("oversized tokens survive while surrounding words receive stress", async () => {
  for (const length of [40, 41, 100, 19000]) {
    const word = "а".repeat(length);
    const text = `молоко,${word}\n\tмолоко`;
    assert.equal(await mark(text), `молоко́,${word}\n\tмолоко́`);
  }
});

test("model boundary accounts for actual context instead of a fixed word limit", async () => {
  for (const [prefix, length] of [["", 39], ["молоко ", 36]]) {
    const word = "а".repeat(length);
    const result = await markStresses(prefix + word, { accuracyThreshold: 0 });
    const markedWord = result.split(" ").at(-1);
    assert.equal(markedWord.replaceAll("\u0301", ""), word);
    assert.equal(markedWord.length, word.length + 1);
  }
  const oversized = "а".repeat(37);
  assert.equal(await mark(`молоко ${oversized} молоко`), `молоко́ ${oversized} молоко́`);
});

test("ordinary text, existing accents, and Latin characters retain their behavior", async () => {
  assert.equal(await mark(""), "");
  assert.equal(await mark("hello молоко за́мок\nмолоко"), "hello молоко́ за́мок\nмолоко́");
});

test("multiple oversized tokens preserve existing accents and punctuation", async () => {
  const word = "а".repeat(41) + "́";
  assert.equal(await mark(`${word} — ${word}!`), `${word} — ${word}!`);
});
