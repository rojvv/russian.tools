import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { conjugationSeo } from "../src/lib/conjugation-seo.ts";
import { hasConjugationForms } from "../src/lib/conjugation.ts";
import { normalizeText, validSearchText } from "../src/lib/search-text.ts";
import { dictionarySeo, languagePath } from "../src/lib/seo.ts";
import { searchDictionary } from "../src/lib/server/dictionary-search.ts";
import { dictionaryPaths } from "../src/lib/server/sitemap.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

test("every dictionary sitemap URL resolves to an indexable, self-canonical server result", async () => {
  const nouns = readDictionary("nouns");
  const nounKeys = new Set(nouns.map(word => normalizeText(word.bare)));
  const adjectives = readDictionary("adjectives").filter(word => !nounKeys.has(normalizeText(word.bare)));
  for (
    const [name, paths] of [
      ["decliner", [...dictionaryPaths("/decliner", nouns), ...dictionaryPaths("/decliner", adjectives)]],
      ["conjugator", dictionaryPaths("/conjugator", readDictionary("verbs"), "en", hasConjugationForms)],
    ]
  ) {
    // Cache parsed assets only inside this build-time test; production requests
    // retain their bounded reads and have no isolate-wide dictionary cache.
    const assets = new Map();
    const fetchAsset = async path => {
      if (!assets.has(path)) {
        assets.set(path, JSON.parse(await readFile(new URL(`../static${path}`, import.meta.url), "utf8")));
      }
      return { ok: true, json: async () => assets.get(path) };
    };
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(paths.length > 10000);
    for (const path of paths) {
      const query = [...new URL(path, "https://russian.tools").searchParams.keys()][0];
      assert.ok(validSearchText(query, name === "conjugator"), path);
      const { matches, deferred } = await searchDictionary(fetchAsset, name, query);
      assert.equal(deferred, false, path);
      const seo = name === "conjugator"
        ? conjugationSeo(query, matches[0])
        : dictionarySeo("/decliner", query, matches[0]?.bare);
      assert.equal(seo.noindex, false, path);
      assert.equal(languagePath(seo.canonical, "en"), path);
    }
  }
});

test("a populated later homonym cannot make an empty default verb indexable", () => {
  const populated = readDictionary("verbs").find(word => word.bare === "читать");
  const empty = { ...populated, finite: [], past: [], imperative: [] };
  assert.equal(conjugationSeo("читать", empty).noindex, true);
  assert.deepEqual(dictionaryPaths("/conjugator", [empty, populated], "en", hasConjugationForms), []);
  assert.equal(dictionaryPaths("/conjugator", [populated, empty], "en", hasConjugationForms).length, 1);
  assert.equal(conjugationSeo("").noindex, false);
  // An impersonal verb with only one supplied form still has useful content.
  assert.equal(conjugationSeo("читать", { ...empty, finite: ["", "", "читает"] }).noindex, false);
});
