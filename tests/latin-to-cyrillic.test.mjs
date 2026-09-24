import assert from "node:assert/strict";
import test from "node:test";
import { cyrillicSegments, renderCyrillic } from "../src/lib/latin-to-cyrillic.ts";

const convert = (text, choices) => renderCyrillic(cyrillicSegments(text), choices);

test("common spellings, longest matches, passport variants and explicit signs", () => {
  assert.equal(convert("Privet, mir! Shchuka zhuk khleb yo yu ya iu ia"), "Привет, мир! Щука жук хлеб ё ю я ю я");
  assert.equal(convert("č š ž ë obʺekt chitatʹ"), "ч ш ж ё объект читать");
});

test("each ambiguous occurrence can be changed independently, including digraph splits", () => {
  assert.equal(convert("e e y i ts", { 0: "э", 4: "й", 6: "й", 8: "тс" }), "э е й й тс");
  assert.equal(convert("Semen", { 1: "ё" }), "Сёмен");
  assert.equal(convert("ie", { 0: "ъ" }), "ъ");
  assert.equal(convert("shch", { 0: "шч" }), "шч");
  assert.equal(convert("e", { 0: "invalid" }), "е");
});

test("preserves case, punctuation, whitespace, other scripts and unknown characters", () => {
  assert.equal(convert("Shchuka SHCHUKA Zh. priVet"), "Щука ЩУКА Ж. приВет");
  assert.equal(convert("  Привет\r\n123 🙂 العربية — @!"), "  Привет\r\n123 🙂 العربية — @!");
  assert.equal(convert(""), "");
});

test("apostrophes offer punctuation alternatives and standalone quotes remain intact", () => {
  assert.equal(convert("chitat'"), "читать");
  assert.equal(convert("'mir'", { 4: "'" }), "'мир'");
  assert.equal(convert("' ’"), "' ’");
});

test("doubled apostrophes produce hard signs with case and punctuation choices preserved", () => {
  assert.equal(convert("s''est' S''est' S''EST'"), "съесть Съесть СЪЕСТЬ");
  assert.equal(convert("s’’est’"), "съесть");
  assert.equal(convert("ob''ekt"), "объект");
  assert.equal(convert("s''est'", { 1: "''" }), "с''есть");
  assert.equal(convert("'' ’’"), "'' ’’");
});

test("source offsets reconstruct the full input and long text stays linear", () => {
  const text = "🙂 e\nshch " + "y".repeat(20000);
  const segments = cyrillicSegments(text);
  assert.equal(segments.map((segment) => segment.source).join(""), text);
  for (const segment of segments) {
    assert.equal(text.slice(segment.start, segment.start + segment.source.length), segment.source);
  }
  assert.equal(renderCyrillic(segments), "🙂 е\nщ " + "ы".repeat(20000));
});
