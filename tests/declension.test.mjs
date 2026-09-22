import assert from "node:assert/strict";
import test from "node:test";
import { readNounQuery, writeNounQuery } from "../src/lib/declension-url.ts";
import { cases, createTable, findNouns, suggestNouns } from "../src/lib/declension.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";
const nouns = readDictionary("nouns");
const get = word => findNouns(nouns, word)[0];

test("extensive noun dataset has six forms per number and preserves homonyms", () => {
  assert.ok(nouns.length > 26000);
  assert.ok(nouns.every(n => n.singular.length === 6 && n.plural.length === 6));
  assert.equal(get(" КНИ́ГА ").bare, "книга");
  assert.equal(findNouns(nouns, "замок").length, 2);
  assert.equal(findNouns(nouns, "несуществующееслово").length, 0);
  assert.equal(get("елка").bare, "ёлка");
});

test("six cases retain dictionary stress, irregular plurals, and animate accusatives", () => {
  assert.deepEqual(createTable(get("книга"))[0].rows.map(r => r.label), cases);
  assert.equal(createTable(get("книга"))[0].rows[3].form, "кни́гу");
  const person = createTable(get("человек"));
  assert.equal(person[1].rows[0].form, "лю́ди");
  assert.equal(person[1].rows[3].form, "люде́й");
  assert.equal(createTable(get("время"))[0].rows[1].form, "вре́мени");
  assert.equal(createTable(get("путь"))[0].rows[4].form, "путём");
});

test("indeclinable and number-restricted nouns render correctly without guessing gaps", () => {
  assert.ok(createTable(get("кофе"))[0].rows.every(r => r.form === "ко́фе"));
  assert.ok(createTable(get("молоко"))[1].rows.every(r => r.form === ""));
  assert.ok(createTable(get("ножницы"))[0].rows.every(r => r.form === ""));
  assert.equal(createTable(get("ножницы"))[1].rows[1].form, "но́жниц");
  const missing = { ...get("книга"), singular: ["", "-", "", "", "", ""] };
  assert.ok(createTable(missing)[0].rows.every(r => r.form === ""));
});

test("suggestions support prefixes and spelling errors while preserving exact entries", () => {
  assert.equal(suggestNouns(nouns, "книг")[0].bare, "книга");
  assert.equal(suggestNouns(nouns, "кнгиа")[0].bare, "книга");
  assert.equal(suggestNouns(nouns, "замок").length, 2);
  assert.deepEqual(suggestNouns(nouns, ""), []);
  assert.deepEqual(suggestNouns(nouns, "а".repeat(41)), []);
});

test("shareable noun queries support bare and named values and clearing", () => {
  assert.equal(readNounQuery(new URL("https://russian.tools/decliner?книга")), "книга");
  assert.equal(readNounQuery(new URL("https://russian.tools/decliner?noun=книга")), "книга");
  const url = writeNounQuery(new URL("https://russian.tools/decliner"), "замок");
  assert.equal(readNounQuery(url), "замок");
  assert.equal(writeNounQuery(url, "").search, "");
});
