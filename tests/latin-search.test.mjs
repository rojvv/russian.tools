import assert from "node:assert/strict";
import test from "node:test";
import { findVerbs, suggestVerbs } from "../src/lib/conjugation.ts";
import { findDeclinables, suggestDeclinables } from "../src/lib/declension.ts";
import { formLookup } from "../src/lib/dictionary-lookup.ts";
import { findNames, searchNames } from "../src/lib/diminutive.ts";
import { matchesSearch, searchKey, validSearchText } from "../src/lib/search-text.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

test("common Latin spellings match without changing displayed words", () => {
  for (
    const [word, spellings] of [
      ["Алёша", ["Alyosha", "Alesha", "Alësha"]],
      ["Дмитрий", ["Dmitry", "Dmitriy", "Dmitrii"]],
      ["Юлия", ["Yuliya", "Julia", "Iuliia"]],
      ["Мария", ["Mariya", "Maria", "Mariia"]],
      ["Алексей", ["Alexey", "Aleksei", "Aleksey"]],
      ["Елена", ["Elena", "Yelena", "Jelena"]],
      ["Щука", ["shchuka", "schuka", "ščuka"]],
      ["читать", ["chitat", "chitat'", "čitatʹ"]],
      ["Хороший", ["khoroshiy", "horoshij"]],
    ]
  ) {
    for (const spelling of spellings) assert.equal(searchKey(spelling), searchKey(word), `${spelling} → ${word}`);
  }
  assert.equal(matchesSearch("переезжать", "pere", true), true);
  assert.equal(matchesSearch("выезжать", "vyezzhat"), true);
  assert.equal(matchesSearch("ехать", "drive"), false);
});

test("Latin name lookup preserves shared names and directory matches", () => {
  assert.deepEqual(findNames("Sasha").map(entry => entry.name), ["Александр", "Александра"]);
  assert.deepEqual(findNames("Zhenya").map(entry => entry.name), ["Евгений", "Евгения"]);
  assert.deepEqual(findNames("Dmitry").map(entry => entry.name), ["Дмитрий"]);
  assert.deepEqual(findNames("Alyosha").map(entry => entry.name), ["Алексей"]);
  assert.ok(searchNames("nyur").some(entry => entry.name === "Анна"));
  assert.ok(searchNames("aleks").some(entry => entry.name === "Александра"));
});

test("Latin verbs include infinitives, inflections, and compound futures", () => {
  const verbs = readDictionary("verbs");
  for (
    const [query, bare] of [["chitat", "читать"], ["chitayu", "читать"], ["shyol", "идти"], ["uchus'", "учиться"], [
      "budu chitat",
      "читать",
    ]]
  ) {
    assert.ok(findVerbs(verbs, query).some(entry => entry.bare === bare), `${query} → ${bare}`);
    assert.ok(suggestVerbs(verbs, query).some(entry => entry.bare === bare));
  }
  assert.ok(suggestVerbs(verbs, "chita").some(entry => entry.bare.startsWith("чита")));
});

test("Latin noun and adjective inflections resolve through the full dictionaries", () => {
  const words = [...readDictionary("nouns"), ...readDictionary("adjectives")];
  for (
    const [query, bare] of [
      ["kniga", "книга"],
      ["knigami", "книга"],
      ["lyudmi", "человек"],
      ["novogo", "новый"],
      [
        "novoyu",
        "новый",
      ],
      ["sinyuyu", "синий"],
      ["obyektami", "объект"],
      ["obiektami", "объект"],
      ["obieektami", "объект"],
      ["syezd", "съезд"],
    ]
  ) {
    assert.ok(findDeclinables(words, query).some(entry => entry.bare === bare), `${query} → ${bare}`);
  }
  assert.ok(suggestDeclinables(words, "knig").some(entry => entry.bare.startsWith("книг")));
});

test("hard-sign aliases do not collapse genuine ие sequences", () => {
  assert.equal(matchesSearch("объект", "obyekt"), true);
  assert.equal(matchesSearch("объект", "obiekt"), true);
  assert.equal(matchesSearch("объект", "obekt"), true);
  assert.equal(matchesSearch("диета", "deta"), false);
  assert.equal(matchesSearch("диета", "dieta"), true);
});

test("Latin ambiguity never changes exact Cyrillic spelling priority", () => {
  const lookup = formLookup(word => [word.bare, ...word.forms]);
  const words = [{ bare: "все", forms: [] }, { bare: "всё", forms: [] }];
  assert.deepEqual(lookup.find(words, "vse"), words);
  assert.deepEqual(lookup.find(words, "все"), [words[0]]);
  assert.deepEqual(lookup.find(words, "всё"), [words[1]]);
  const shared = [{ bare: "стать", forms: ["стали"] }, { bare: "стали", forms: [] }, {
    bare: "сталь",
    forms: ["стали"],
  }];
  assert.deepEqual(lookup.find(shared, "stali").map(word => word.bare), ["стали", "стать", "сталь"]);
});

test("server and browser input validation accepts transliteration and rejects markup", () => {
  for (const text of ["книгами", "knigami", "chitat'", "CHITAT", "čitatʹ", "что-то", "chto-to"]) {
    assert.ok(validSearchText(text), text);
  }
  assert.ok(validSearchText("budu chitat", true));
  assert.equal(validSearchText("budu chitat"), false);
  for (const text of ["", "123", "<script>", "abc/def", "?!", "'", "-abc"]) {
    assert.equal(validSearchText(text, true), false, text);
  }
});
