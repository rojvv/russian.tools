import assert from "node:assert/strict";
import test from "node:test";
import { createTable as conjugate, findVerbs, suggestVerbs } from "../src/lib/conjugation.ts";
import { createTable as decline, findDeclinables, suggestDeclinables } from "../src/lib/declension.ts";
import { formLookup } from "../src/lib/dictionary-lookup.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

const verbs = readDictionary("verbs");
const words = [...readDictionary("nouns"), ...readDictionary("adjectives")];

test("inflected verbs resolve to original entries and full conjugation tables", () => {
  for (
    const [form, lemma] of [
      ["ШЁЛ", "идти"],
      ["шел", "идти"],
      ["чита́ю", "читать"],
      ["прочитаю", "прочитать"],
      ["читай", "читать"],
      ["учусь", "учиться"],
      ["буду читать", "читать"],
      ["буду", "быть"],
    ]
  ) {
    const matches = suggestVerbs(verbs, form);
    const entry = matches.find(word => word.bare === lemma);
    assert.ok(entry, `${form} → ${lemma}`);
    assert.ok(conjugate(entry, entry.aspect === "perfective" ? "perfective" : "imperfective").length >= 3);
    assert.ok(findVerbs(verbs, form).includes(entry));
  }
});

test("noun and adjective forms resolve including alternative endings", () => {
  for (
    const [form, lemma] of [["людьми", "человек"], ["книгами", "книга"], [" НО́ВОГО ", "новый"], ["новою", "новый"], [
      "синюю",
      "синий",
    ]]
  ) {
    const entry = suggestDeclinables(words, form).find(word => word.bare === lemma);
    assert.ok(entry, `${form} → ${lemma}`);
    assert.ok(decline(entry).length >= 2);
    assert.ok(findDeclinables(words, form).includes(entry));
  }
});

test("ambiguous forms preserve all entries, headwords come first, and ё stays precise", () => {
  const lookup = formLookup(word => [word.bare, ...word.forms]);
  const entries = [
    { bare: "стать", forms: ["стали", "стали"] },
    { bare: "стали", forms: ["стали"] },
    { bare: "сталь", forms: ["стали"] },
    { bare: "первый", forms: ["все"] },
    { bare: "второй", forms: ["всё"] },
  ];
  assert.deepEqual(lookup.find(entries, "стали").map(word => word.bare), ["стали", "стать", "сталь"]);
  assert.deepEqual(lookup.find(entries, "всё"), [entries[4]]);
  assert.deepEqual(lookup.find(entries, "все"), [entries[3]]);
  assert.deepEqual(lookup.find([entries[4]], "все"), [entries[4]]);
  assert.deepEqual(lookup.find(entries, ""), []);
  assert.deepEqual(lookup.find(entries, "-"), []);
  assert.deepEqual(lookup.find(entries, "неизвестный"), []);
});

test("unavailable noun numbers are not searchable forms", () => {
  const entry = { bare: "тест", kind: "noun", singularOnly: true, singular: ["тест"], plural: ["тесты"] };
  assert.deepEqual(findDeclinables([entry], "тесты"), []);
});
