import assert from "node:assert/strict";
import test from "node:test";
import { messages, preferredLocale } from "../src/lib/i18n.ts";

test("language preference honors saved choice and browser language priorities", () => {
  assert.equal(preferredLocale("en", "ru-RU,ru;q=0.9"), "en");
  assert.equal(preferredLocale("ru", "en-US"), "ru");
  assert.equal(preferredLocale(undefined, "ru-RU, en;q=0.8"), "ru");
  assert.equal(preferredLocale(undefined, "ru;q=0.3,en-US;q=0.9"), "en");
  assert.equal(preferredLocale(undefined, "ru;q=0,en"), "en");
  assert.equal(preferredLocale("invalid", "ru"), "ru");
  assert.equal(preferredLocale(undefined, "de-DE"), "en");
  assert.equal(preferredLocale(undefined, null), "en");
});

test("Russian translates every UI key", () => {
  assert.deepEqual(Object.keys(messages.ru).sort(), Object.keys(messages.en).sort());
  for (const value of Object.values(messages.ru)) assert.ok(value.length > 0);
});
