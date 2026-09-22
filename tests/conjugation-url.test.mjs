import assert from "node:assert/strict";
import test from "node:test";
import { readVerbQuery, writeVerbQuery } from "../src/lib/conjugation-url.ts";
const url = (search) => new URL(`https://russian.tools/conjugation${search}`);

test("reads the first bare or named query, decoding Cyrillic and accents", () => {
  assert.equal(readVerbQuery(url("?читать")), "читать");
  assert.equal(readVerbQuery(url("?%D1%87%D0%B8%D1%82%D0%B0%D1%82%D1%8C")), "читать");
  assert.equal(readVerbQuery(url("?чита́ть&ignored=идти")), "чита́ть");
  assert.equal(readVerbQuery(url("?verb=читать&ignored")), "читать");
  assert.equal(readVerbQuery(url("")), "");
  assert.equal(readVerbQuery(url("?" + "а".repeat(100))).length, 40);
});

test("serializes user input in bare-query format and clears empty input", () => {
  const original = url("?читать#forms");
  const next = writeVerbQuery(original, "идти");
  assert.equal(next.search, "?" + encodeURIComponent("идти"));
  assert.equal(next.hash, "#forms");
  assert.equal(readVerbQuery(next), "идти");
  assert.equal(writeVerbQuery(next, "").search, "");
  assert.equal(readVerbQuery(original), "читать");
});
