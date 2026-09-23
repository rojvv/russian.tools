import assert from "node:assert/strict";
import test from "node:test";
import { abbreviationCategories, abbreviations } from "../src/lib/abbreviation-data.ts";
import {
  abbreviationKey,
  findAbbreviations,
  readAbbreviationQuery,
  searchAbbreviations,
  writeAbbreviationQuery,
} from "../src/lib/abbreviation.ts";

const expansions = (entries) => entries.map(({ expansion }) => expansion);

test("exact decoding accepts punctuation, case, spacing, transliteration, and aliases", () => {
  for (const query of ["СНИЛС", " снилс ", "С. Н. И. Л. С.", "SNILS", "snils"]) {
    assert.deepEqual(expansions(findAbbreviations(query)), ["страховой номер индивидуального лицевого счёта"]);
  }
  for (const query of ["т.е.", "Т. Е.", "те", "t. e."]) {
    assert.deepEqual(expansions(findAbbreviations(query)), ["то есть"]);
  }
  assert.ok(findAbbreviations("т. д.").some(({ short }) => short === "и т. д."));
  assert.ok(findAbbreviations("м²").some(({ short }) => short === "кв. м"));
  assert.equal(abbreviationKey("ё́.\u00a0".normalize("NFD")), "е");
  assert.equal(abbreviationKey("пр‑т"), "пр-т");
  assert.equal(abbreviationKey("п/к"), "п/к");
});

test("ambiguous abbreviations preserve every listed meaning", () => {
  assert.deepEqual(
    new Set(expansions(findAbbreviations("КПП"))),
    new Set([
      "код причины постановки на учёт",
      "коробка переключения передач",
      "контрольно-пропускной пункт",
    ]),
  );
  assert.deepEqual(new Set(expansions(findAbbreviations("г."))), new Set(["год", "город"]));
  assert.deepEqual(
    new Set(expansions(findAbbreviations("ООП"))),
    new Set([
      "основная образовательная программа",
      "объектно-ориентированное программирование",
    ]),
  );
  assert.equal(findAbbreviations("ЕГРН").length, 2);
});

test("directory searches Russian, English, Latin transliteration, and multiple keywords", () => {
  for (const query of ["пенсионного страхования", "pensionnogo strahovaniya", "Social Fund"]) {
    assert.ok(searchAbbreviations(query).some(({ short }) => short === "СФР"), query);
  }
  assert.ok(searchAbbreviations("MRI").some(({ short }) => short === "МРТ"));
  assert.ok(searchAbbreviations("налог номер").some(({ short }) => short === "ИНН"));
  assert.ok(searchAbbreviations("счет").some(({ short }) => short === "р/с"));
  assert.ok(searchAbbreviations("т.е.").some(({ short }) => short === "т. е."));
  assert.ok(searchAbbreviations("Medicine").some(({ short }) => short === "УЗИ"));
  const matches = searchAbbreviations("КТ");
  assert.equal(matches[0].short, "КТ", "exact abbreviations precede substring matches");
});

test("subject filters combine with searches without affecting decoder meanings", () => {
  assert.deepEqual(expansions(searchAbbreviations("КПП", "documents")), ["код причины постановки на учёт"]);
  for (const category of Object.keys(abbreviationCategories)) {
    const entries = searchAbbreviations("", category);
    assert.ok(entries.length >= 15, category);
    assert.ok(entries.every((entry) => entry.category === category));
  }
  assert.deepEqual(searchAbbreviations("МРТ", "addresses"), []);
  assert.equal(findAbbreviations("КПП").length, 3);
});

test("unknown, empty, and punctuation-only queries never produce guessed expansions", () => {
  for (const query of ["", "   ", "...", "<script>", "АБВГДЕЁЖЗ", "СНИ"]) {
    assert.deepEqual(findAbbreviations(query), [], query);
  }
  for (const query of ["...", "<script>", "АБВГДЕЁЖЗ"]) assert.deepEqual(searchAbbreviations(query), []);
  assert.deepEqual(searchAbbreviations("  "), abbreviations);
  assert.ok(searchAbbreviations("СНИ").length > 0);
});

test("catalog has broad coverage, complete fields, unique meanings, and reversible aliases", () => {
  assert.ok(abbreviations.length >= 350);
  assert.equal(new Set(abbreviations.map(({ id }) => id)).size, abbreviations.length);
  const meanings = new Set();
  for (const entry of abbreviations) {
    assert.ok(entry.short && entry.expansion && entry.english, entry.id);
    assert.ok(Object.hasOwn(abbreviationCategories, entry.category));
    const key = `${abbreviationKey(entry.short)}:${entry.expansion}`;
    assert.ok(!meanings.has(key), `duplicate meaning: ${key}`);
    meanings.add(key);
    for (const query of [entry.short, ...entry.aliases]) {
      assert.ok(findAbbreviations(query).includes(entry), `${query}: ${entry.id}`);
    }
  }
  const names = abbreviations.map(({ short }) => short);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "ru")));
});

test("query state round trips independently and preserves language, tracking, and anchor", () => {
  const original = new URL("https://russian.tools/abbreviation?lang=ru&source=test#decoder");
  const state = { query: "КПП", directory: "налог", category: "documents" };
  const next = writeAbbreviationQuery(original, state);
  assert.deepEqual(readAbbreviationQuery(next), state);
  assert.equal(next.searchParams.get("lang"), "ru");
  assert.equal(next.searchParams.get("source"), "test");
  assert.equal(next.hash, "#decoder");
  assert.equal(original.searchParams.has("q"), false);
  assert.equal(writeAbbreviationQuery(next, { query: "", directory: "", category: "" }).href, original.href);
  for (const invalid of ["unknown", "__proto__", "constructor"]) {
    assert.equal(readAbbreviationQuery(new URL(`https://russian.tools/abbreviation?category=${invalid}`)).category, "");
  }
  const incoming = new URL(`https://russian.tools/abbreviation?q=${"я".repeat(200)}&directory=${"ю".repeat(200)}`);
  assert.equal(readAbbreviationQuery(incoming).query.length, 120);
  assert.equal(readAbbreviationQuery(incoming).directory.length, 120);
  const long = writeAbbreviationQuery(original, { query: "я".repeat(200), directory: "ю".repeat(200), category: "" });
  assert.equal(long.searchParams.get("q").length, 120);
  assert.equal(long.searchParams.get("directory").length, 120);
});
