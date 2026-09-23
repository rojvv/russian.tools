import assert from "node:assert/strict";
import test from "node:test";
import { russianNames } from "../src/lib/diminutive-data.ts";
import {
  findNames,
  normalizeName,
  readDiminutiveQuery,
  searchNames,
  writeDiminutiveQuery,
} from "../src/lib/diminutive.ts";

const names = (entries) => entries.map((entry) => entry.name);

test("full names and diminutives find the same family", () => {
  for (const query of ["Дмитрий", "Дима", "Митя", "Митенька"]) {
    assert.deepEqual(names(findNames(query)), ["Дмитрий"]);
  }
  assert.ok(findNames("Мария")[0].forms.includes("Маруся"));
  assert.deepEqual(names(findNames("Маруся")), ["Мария"]);
});

test("shared forms retain every listed parent across genders", () => {
  assert.deepEqual(names(findNames("Саша")), ["Александр", "Александра"]);
  assert.deepEqual(names(findNames("Женя")), ["Евгений", "Евгения"]);
  assert.deepEqual(names(findNames("Валя")), ["Валентин", "Валентина"]);
  assert.deepEqual(names(findNames("Слава")), ["Владислав", "Вячеслав", "Станислав", "Ярослав"]);
});

test("lookup ignores case, surrounding spaces, accents, and ё spelling", () => {
  for (const query of ["  АЛЁША  ", "Алеша", "Алё́ша", "Алёша".normalize("NFD")]) {
    assert.deepEqual(names(findNames(query)), ["Алексей"]);
  }
  assert.deepEqual(names(findNames("ПЕТР")), ["Пётр"]);
  assert.equal(normalizeName("СЕРЁ́ЖА".normalize("NFD")), "сережа");
});

test("full-name spelling variants are searchable and displayed as aliases", () => {
  assert.deepEqual(names(findNames("Наталия")), ["Наталья"]);
  assert.deepEqual(names(findNames("София")), ["Софья"]);
  assert.deepEqual(names(findNames("Данила")), ["Даниил"]);
  assert.ok(searchNames("софия").some((entry) => entry.name === "Софья"));
});

test("directory searches both sides while exact lookup never guesses", () => {
  assert.ok(searchNames("мит").some((entry) => entry.name === "Дмитрий"));
  assert.ok(searchNames("нюр").some((entry) => entry.name === "Анна"));
  assert.deepEqual(findNames("Саш"), []);
  assert.deepEqual(findNames(""), []);
  assert.deepEqual(findNames("   "), []);
  assert.deepEqual(searchNames("   "), russianNames);
  assert.deepEqual(searchNames("<script>"), []);
  assert.deepEqual(findNames("Несуществующееимя"), []);
});

test("directory entries are unique, alphabetical, and reversible", () => {
  assert.equal(new Set(names(russianNames)).size, russianNames.length);
  assert.deepEqual(names(russianNames), names(russianNames).sort((a, b) => a.localeCompare(b, "ru")));
  for (const entry of russianNames) {
    assert.ok(entry.forms.length > 0, entry.name);
    assert.equal(new Set(entry.forms.map(normalizeName)).size, entry.forms.length, entry.name);
    for (const value of [entry.name, ...(entry.aliases ?? []), ...entry.forms]) {
      assert.match(value, /^[А-ЯЁ][а-яё]+$/u);
      assert.ok(findNames(value).includes(entry), `${value} → ${entry.name}`);
    }
  }
});

test("finder and directory URLs round trip independently, retaining language and hash", () => {
  const original = new URL("https://russian.tools/diminutive?lang=ru&source=test#finder");
  const state = { query: "Саша", directory: "Слав" };
  const next = writeDiminutiveQuery(original, state);
  assert.deepEqual(readDiminutiveQuery(next), state);
  assert.equal(next.searchParams.get("lang"), "ru");
  assert.equal(next.searchParams.get("source"), "test");
  assert.equal(next.hash, "#finder");
  assert.equal(original.searchParams.has("q"), false);
  assert.equal(writeDiminutiveQuery(next, { query: "", directory: "" }).href, original.href);
  const long = writeDiminutiveQuery(original, { query: "я".repeat(200), directory: "ю".repeat(200) });
  assert.equal(readDiminutiveQuery(long).query.length, 100);
  assert.equal(readDiminutiveQuery(long).directory.length, 100);
  const incoming = new URL("https://russian.tools/diminutive?q=" + "я".repeat(200) + "&directory=" + "ю".repeat(200));
  assert.equal(readDiminutiveQuery(incoming).query.length, 100);
  assert.equal(readDiminutiveQuery(incoming).directory.length, 100);
});
