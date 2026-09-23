import assert from "node:assert/strict";
import test from "node:test";
import { motionEntries } from "../src/lib/motion-catalog.ts";
import { defaultMotionState, readMotionQuery, writeMotionQuery } from "../src/lib/motion-url.ts";
const url = (query = "") => new URL(`https://russian.tools/motion${query}`);

test("empty URL restores defaults and persists every selected control", () => {
  assert.deepEqual(readMotionQuery(url()), defaultMotionState);
  assert.equal(
    writeMotionQuery(url(), defaultMotionState).search,
    "?family=transport&meaning=exit&aspect=perfective&situation=direction",
  );
});

test("all catalogue pairs round trip in both aspects", () => {
  for (const entry of motionEntries) {
    for (const aspect of ["perfective", "imperfective"]) {
      const state = { ...defaultMotionState, family: entry.family, meaning: entry.meaning, aspect };
      assert.deepEqual(readMotionQuery(writeMotionQuery(url(), state)), state);
    }
  }
});

test("base journeys, starts, search text, and inactive choices round trip", () => {
  for (const meaning of ["base", "start"]) {
    for (const situation of ["direction", "habit", "wandering", "return"]) {
      const state = { family: "air", meaning, situation, aspect: "imperfective", query: "летать & лететь" };
      assert.deepEqual(readMotionQuery(writeMotionQuery(url(), state)), state);
    }
  }
});

test("language, unrelated parameters, and hash survive updates without mutating source", () => {
  const original = url("?lang=ru&source=test#result");
  const next = writeMotionQuery(original, { ...defaultMotionState, meaning: "cross" });
  assert.equal(next.searchParams.get("lang"), "ru");
  assert.equal(next.searchParams.get("source"), "test");
  assert.equal(next.hash, "#result");
  assert.equal(original.searchParams.has("meaning"), false);
  assert.equal(
    writeMotionQuery(next, defaultMotionState).href,
    writeMotionQuery(original, defaultMotionState).href,
  );
});

test("invalid parameters and unavailable combinations always restore valid controls", () => {
  const state = readMotionQuery(url("?family=unknown&meaning=unknown&aspect=bad&situation=bad"));
  assert.deepEqual(state, { ...defaultMotionState, meaning: "base" });
  assert.equal(readMotionQuery(url("?family=wander&meaning=exit")).meaning, "base");
  assert.equal(readMotionQuery(url("?q=" + "я".repeat(300))).query.length, 200);
});
