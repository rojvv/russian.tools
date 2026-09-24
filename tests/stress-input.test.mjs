import assert from "node:assert/strict";
import test from "node:test";
import { env } from "onnxruntime-web/wasm";
import { markSupportedText } from "../src/lib/stress-input.ts";

env.wasm.numThreads = 1;
const { markStresses } = await import("@roj/rustress");
const mark = text => markStresses(text, { markSingleVowels: false });

test("oversized tokens survive while surrounding words receive stress", async () => {
  for (const length of [37, 40, 41, 100, 19000]) {
    const word = "а".repeat(length);
    const text = `молоко,${word}\n\tмолоко`;
    assert.equal(await markSupportedText(text, mark), `молоко́,${word}\n\tмолоко́`);
  }
});

test("safe model boundary and ordinary text retain engine behavior", async () => {
  for (const text of ["", "молоко за́мок\nмолоко", `молоко ${"а".repeat(36)}`]) {
    assert.equal(await markSupportedText(text, mark), await mark(text));
  }
});

test("multiple oversized tokens preserve existing accents and punctuation", async () => {
  const word = "а".repeat(41) + "́";
  assert.equal(await markSupportedText(`${word} — ${word}!`, mark), `${word} — ${word}!`);
});
