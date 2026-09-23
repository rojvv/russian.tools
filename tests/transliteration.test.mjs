import assert from "node:assert/strict";
import test from "node:test";
import { transliterate } from "../src/lib/transliteration.ts";

test("Russian passport spellings use ICAO mappings", () => {
  assert.equal(transliterate("Юлия Щербакова"), "Iuliia Shcherbakova");
  assert.equal(transliterate("Дмитрий Ельцин"), "Dmitrii Eltsin");
  assert.equal(transliterate("Семён Подъёмов"), "Semen Podieemov");
  assert.equal(transliterate("Егор Георгий"), "Egor Georgii");
});

test("handles the complete Russian alphabet in lowercase and uppercase", () => {
  const alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
  const expected = "abvgdeezhziiklmnoprstufkhtschshshchieyeiuia";
  assert.equal(transliterate(alphabet), expected);
  assert.equal(transliterate(alphabet.toUpperCase()), expected.toUpperCase());
});

test("preserves title case, all caps, initials, and mixed case", () => {
  assert.equal(transliterate("Жуков ЖУКОВ Ж. Щ. Ю. Щука ЮЛИЯ"), "Zhukov ZHUKOV Zh. Shch. Iu. Shchuka IULIIA");
  assert.equal(transliterate("приВет"), "priVet");
  assert.equal(transliterate("Ь Ъ ЬЬ ЪЪ"), " Ie  IEIE");
});

test("handles decomposed ё and й and removes Russian stress marks", () => {
  assert.equal(transliterate("Семён Андре́й".normalize("NFD")), "Semen Andrei");
  assert.equal(transliterate("Ё́Ж ЙО́ГА".normalize("NFD")), "EZH IOGA");
});

test("preserves whitespace, punctuation, emoji, and text outside the Russian alphabet", () => {
  const foreign = "cafe\u0301 — Ελληνικά العربية і ї є ґ";
  assert.equal(transliterate(`  Привет, мир!\r\n\t123 🙂 ${foreign}`), `  Privet, mir!\r\n\t123 🙂 ${foreign}`);
  assert.equal(transliterate(""), "");
  assert.equal(transliterate("ьъ"), "ie");
});

test("processes a full editor of expanding letters", () => {
  assert.equal(transliterate("щ".repeat(20000)), "shch".repeat(20000));
});
