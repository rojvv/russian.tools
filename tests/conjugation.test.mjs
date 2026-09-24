import assert from "node:assert/strict";
import test from "node:test";
import { createTable, exportRows, findVerbs, suggestVerbs, toCsv } from "../src/lib/conjugation.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";
const verbs = readDictionary("verbs");
const get = (word) => findVerbs(verbs, word)[0];

test("Russian verb fields contain no Latin letters or leaked source markup", () => {
  for (const verb of verbs) {
    for (const form of [verb.bare, verb.infinitive, ...verb.finite, ...verb.past, ...verb.imperative]) {
      assert.doesNotMatch(form, /[a-zA-Z$]/u, `${verb.bare}: ${form}`);
    }
  }
  assert.equal(get("сбраживать").infinitive, "сбра́живать");
  assert.equal(get("сбраживать").past[2], "сбра́живало");
  assert.deepEqual(get("взъесться").past, ["взъе́лся", "взъе́лась", "взъе́лось", "взъе́лись"]);
});

test("lookup accepts case and stress, preserves homonyms, and rejects unknown verbs", () => {
  assert.equal(get(" ЧИТА́ТЬ ").bare, "читать");
  assert.ok(findVerbs(verbs, "писать").length > 1);
  assert.equal(findVerbs(verbs, "абракадабрить").length, 0);
});

test("imperfective, perfective and irregular forms have the correct tense", () => {
  const read = createTable(get("читать"), "imperfective");
  assert.equal(read[0].title, "Present");
  assert.equal(read[0].rows[0].form, "чита́ю");
  assert.equal(read[1].rows[0].form, "бу́ду чита́ть");
  const done = createTable(get("прочитать"), "perfective");
  assert.equal(done[0].title, "Future");
  assert.equal(done[0].rows[0].form, "прочита́ю");
  assert.ok(!done.some(s => s.title === "Present"));
  assert.equal(createTable(get("идти"), "imperfective")[2].rows[0].form, "шёл");
  assert.equal(createTable(get("быть"), "imperfective")[1].rows[0].form, "бу́ду");
  assert.equal(createTable(get("победить"), "perfective")[0].rows[0].form, "");
  assert.equal(createTable(get("учиться"), "imperfective")[0].rows[0].form, "учу́сь");
});

test("быть uses its irregular future in both aspect interpretations", () => {
  for (const aspect of ["imperfective", "perfective"]) {
    const future = createTable(get("быть"), aspect).find(section => section.title === "Future");
    assert.deepEqual(future.rows.map(row => row.form), ["бу́ду", "бу́дешь", "бу́дет", "бу́дем", "бу́дете", "бу́дут"]);
  }
});

test("impersonal verbs retain person restrictions in future tables, lookup, and exports", () => {
  for (const bare of ["смеркаться", "тошнить"]) {
    const verb = get(bare);
    const sections = createTable(verb, "imperfective");
    const expected = ["", "", `бу́дет ${verb.infinitive}`, "", "", ""];
    assert.deepEqual(sections.find(section => section.title === "Future").rows.map(row => row.form), expected);
    assert.deepEqual(findVerbs([verb], `буду ${bare}`), []);
    assert.deepEqual(findVerbs([verb], `будет ${bare}`), [verb]);
    assert.deepEqual(
      exportRows(verb.infinitive, "imperfective", sections)
        .filter(row => row[0] === "Future").map(row => row[2]),
      expected,
    );
  }
});

test("unknown finite forms do not produce invented compound futures", () => {
  const verb = { ...get("читать"), finite: ["", "-", "чита́ет"] };
  const future = createTable(verb, "imperfective").find(section => section.title === "Future");
  assert.deepEqual(future.rows.map(row => row.form), ["", "", "бу́дет чита́ть", "", "", ""]);
});

test("both-aspect entries support either interpretation", () => {
  const verb = verbs.find(v => v.aspect === "both");
  assert.equal(createTable(verb, "imperfective").length, 4);
  assert.equal(createTable(verb, "perfective").length, 3);
});

test("edits are exported without changing the dictionary; CSV escapes cells and formulas", () => {
  const verb = get("читать");
  const sections = createTable(verb, "imperfective");
  sections[0].rows[0].form = "edited, \"form\"\nsecond line";
  assert.equal(verb.finite[0], "чита́ю");
  const rows = exportRows(verb.infinitive, "imperfective", sections);
  assert.ok(rows.some(row => row.includes("edited, \"form\"\nsecond line")));
  const csv = toCsv([...rows, ["=1+1"]]);
  assert.ok(csv.includes("\"edited, \"\"form\"\"\nsecond line\""));
  assert.ok(csv.includes("\"'=1+1\""));
  assert.ok(csv.includes("CC BY-SA 4.0"));
});

test("live lookup completes prefixes and finds spelling mistakes without changing exact matches", () => {
  assert.equal(suggestVerbs(verbs, "чита")[0].bare, "читать");
  assert.equal(suggestVerbs(verbs, "читать")[0].bare, "читать");
  assert.equal(suggestVerbs(verbs, "читат")[0].bare, "читать");
  assert.ok(suggestVerbs(verbs, "писать").length > 1);
  assert.deepEqual(suggestVerbs(verbs, ""), []);
  assert.equal(suggestVerbs(verbs, "читтаь")[0].bare, "читать");
});

test("current OpenRussian export includes additional verbs and complete paradigms", () => {
  assert.ok(verbs.length >= 15300);
  assert.ok(verbs.every(v => v.finite.length === 6 && v.past.length === 4 && v.imperative.length === 2));
  assert.equal(get("гуглить").finite[0], "гу́глю");
  assert.equal(get("вложиться").aspect, "perfective");
  assert.equal(createTable(get("вложиться"), "perfective")[0].rows[0].form, "вложу́сь");
  assert.equal(get("актуализировать").aspect, "both");
});
