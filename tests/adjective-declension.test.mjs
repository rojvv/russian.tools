import assert from "node:assert/strict";
import test from "node:test";
import { readDeclensionQuery, writeDeclensionQuery } from "../src/lib/declension-url.ts";
import { adjectiveCases, createTable, findDeclinables, suggestDeclinables } from "../src/lib/declension.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

const adjectives = readDictionary("adjectives");
const nouns = readDictionary("nouns");
const words = [...nouns, ...adjectives];
const get = word => findDeclinables(adjectives, word)[0];

test("adjective dictionary provides four paradigms", () => {
  assert.ok(adjectives.length > 40000);
  for (const adjective of adjectives) {
    assert.equal(adjective.kind, "adjective");
    assert.match(adjective.bare, /^[а-яё]+(?:-[а-яё]+)*$/iu);
    for (const gender of ["masculine", "feminine", "neuter", "plural"]) {
      assert.equal(adjective[gender].length, 7);
      assert.ok(adjective[gender].every(form => typeof form === "string"));
    }
  }
});

test("hard, soft, stressed, and possessive adjectives retain their dictionary forms", () => {
  const fresh = createTable(get(" НО́ВЫЙ "));
  assert.deepEqual(fresh.map(section => section.title), ["Masculine", "Feminine", "Neuter", "Plural"]);
  assert.deepEqual(fresh[0].rows.map(row => row.label), adjectiveCases);
  assert.deepEqual(fresh[0].rows.map(row => row.form), [
    "но́вый",
    "но́вого",
    "но́вому",
    "но́вый",
    "но́вого",
    "но́вым",
    "но́вом",
  ]);
  assert.equal(fresh[1].rows[5].form, "но́вой, но́вою");
  assert.equal(get("синий").feminine[3], "си́нюю");
  assert.equal(get("большой").masculine[5], "больши́м");
  assert.equal(get("лисий").masculine[1], "ли́сьего");
  assert.equal(get("лисий").plural[4], "ли́сьих");
  assert.equal(get("рабочий").neuter[3], "рабо́чее");
});

test("animate accusatives are identified independently of upstream variant order", () => {
  for (
    const [word, inanimate, animate, pluralInanimate, pluralAnimate] of [
      ["новый", "но́вый", "но́вого", "но́вые", "но́вых"],
      ["горячий", "горя́чий", "горя́чего", "горя́чие", "горя́чих"],
    ]
  ) {
    const entry = get(word);
    assert.equal(entry.masculine[3], inanimate);
    assert.equal(entry.masculine[4], animate);
    assert.equal(entry.plural[3], pluralInanimate);
    assert.equal(entry.plural[4], pluralAnimate);
    assert.equal(entry.feminine[3], entry.feminine[4]);
    assert.equal(entry.neuter[3], entry.neuter[4]);
  }
});

test("shared lookup preserves noun/adjective homonyms and exact adjective matches", () => {
  assert.equal(findDeclinables(words, "новый")[0].kind, "adjective");
  const entries = suggestDeclinables(words, "рабочий");
  assert.ok(entries.some(entry => entry.kind !== "adjective"));
  assert.ok(entries.some(entry => entry.kind === "adjective"));
  assert.equal(suggestDeclinables(words, "хорошйи")[0].bare, "хороший");
  assert.equal(createTable(findDeclinables(words, "книга")[0])[0].rows[3].form, "кни́гу");
});

test("missing adjective forms remain blank instead of being generated", () => {
  const entry = get("беж");
  assert.equal(createTable(entry)[0].rows[0].form, "беж");
  assert.ok(createTable(entry)[0].rows.slice(1).every(row => row.form === ""));
  assert.ok(createTable(entry).slice(1).every(section => section.rows.every(row => row.form === "")));
});

test("adjective URLs support bare and named queries while retaining language", () => {
  for (const query of ["?новый", "?adjective=новый", "?word=новый", "?lang=ru&новый"]) {
    assert.equal(readDeclensionQuery(new URL(`https://russian.tools/decliner${query}`)), "новый");
  }
  const original = new URL("https://russian.tools/decliner?noun=книга&lang=ru");
  const changed = writeDeclensionQuery(original, "синий");
  assert.equal(readDeclensionQuery(changed), "синий");
  assert.equal(changed.searchParams.get("lang"), "ru");
  assert.equal(readDeclensionQuery(writeDeclensionQuery(changed, "")), "");
});
