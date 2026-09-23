import assert from "node:assert/strict";
import test from "node:test";
import {
  motionEntries,
  motionFamilies,
  motionMeanings,
  motionStarts,
  searchMotion,
} from "../src/lib/motion-catalog.ts";
import { chooseMotion, motionCopy } from "../src/lib/motion.ts";

test("requested driving verbs retain their real aspect partners", () => {
  for (
    const [perfective, imperfective, meaning] of [
      ["выехать", "выезжать", "exit"],
      ["переехать", "переезжать", "cross"],
      ["въехать", "въезжать", "enter"],
      ["подъехать", "подъезжать", "approach"],
    ]
  ) {
    assert.ok(
      searchMotion(perfective).some((entry) => entry.imperfective === imperfective && entry.meaning === meaning),
    );
  }
  assert.equal(searchMotion("  ВЫЕ́ХАТЬ  ")[0].perfective, "выехать");
  assert.deepEqual(searchMotion("xyz"), []);
});

test("irregular stems are lexical pairs, not prefixed basic multidirectional verbs", () => {
  for (
    const [perfective, imperfective] of [
      ["прийти", "приходить"],
      ["переплыть", "переплывать"],
      ["вынести", "выносить"],
      ["перевезти", "перевозить"],
      ["привести", "приводить"],
      ["выгнать", "выгонять"],
      ["вытащить", "вытаскивать"],
      ["перекатить", "перекатывать"],
    ]
  ) assert.ok(motionEntries.some((entry) => entry.perfective === perfective && entry.imperfective === imperfective));
});

test("catalogue covers 14 families with valid selections and distinct aspect forms", () => {
  assert.equal(motionFamilies.length, 14);
  const keys = new Set();
  for (const entry of motionEntries) {
    const key = `${entry.family}:${entry.meaning}`;
    assert.ok(!keys.has(key));
    keys.add(key);
    assert.ok(motionFamilies.some((family) => family.id === entry.family));
    assert.ok(motionMeanings[entry.meaning].en && motionMeanings[entry.meaning].ru);
    assert.match(entry.imperfective, /^[а-яё]+$/u);
    assert.match(entry.perfective, /^[а-яё]+$/u);
    assert.notEqual(entry.imperfective, entry.perfective);
  }
  for (const family of motionFamilies) {
    assert.ok(motionStarts[family.id]);
    assert.ok(motionEntries.some((entry) => entry.family === family.id));
  }
  assert.equal(motionStarts.transport, "поехать");
  assert.ok(!motionEntries.some((entry) => entry.perfective === "поехать"));
});

test("directed journeys select идти, ехать, and лететь", () => {
  assert.equal(chooseMotion("foot", "direction").verb, "идти");
  assert.equal(chooseMotion("transport", "direction").verb, "ехать");
  assert.equal(chooseMotion("air", "direction").verb, "лететь");
});

test("habits, movement around, and single past round trips select multidirectional verbs", () => {
  for (const situation of ["habit", "wandering", "return"]) {
    assert.equal(chooseMotion("foot", situation).verb, "ходить");
    assert.equal(chooseMotion("transport", situation).verb, "ездить");
    assert.equal(chooseMotion("air", situation).verb, "летать");
  }
});

test("every journey has bilingual examples, explanations, and a contrasting verb", () => {
  for (const mode of ["foot", "transport", "air"]) {
    for (const situation of ["direction", "habit", "wandering", "return"]) {
      const result = chooseMotion(mode, situation);
      assert.notEqual(result.verb, result.contrastVerb);
      assert.equal(result.example.length, 2);
      for (const locale of ["en", "ru"]) assert.ok(motionCopy[locale][result.reason]);
    }
  }
});
