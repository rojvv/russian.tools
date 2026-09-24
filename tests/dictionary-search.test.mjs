import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { suggestVerbs } from "../src/lib/conjugation.ts";
import { suggestDeclinables } from "../src/lib/declension.ts";
import { searchDictionary } from "../src/lib/server/dictionary-search.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

const fetchAsset = async path => new Response(await readFile(new URL(`../static${path}`, import.meta.url)));

test("indexed SSR matches browser form lookup, including the reported Latin query", async () => {
  for (
    const [name, words, find, queries] of [
      ["decliner", [...readDictionary("nouns"), ...readDictionary("adjectives")], suggestDeclinables, [
        "knigami",
        "книга",
        "людьми",
        " НО́ВОГО ",
        "новою",
        "всё",
        "все",
        "novyi",
        "синюю",
      ]],
      ["conjugator", readDictionary("verbs"), suggestVerbs, [
        "шёл",
        "шел",
        "стали",
        "chitayu",
        "буду читать",
        "буду",
        "учусь",
      ]],
    ]
  ) {
    for (const query of queries) {
      let bytes = 0;
      let requests = 0;
      const result = await searchDictionary(
        async path => {
          requests++;
          const response = await fetchAsset(path);
          bytes += (await response.clone().arrayBuffer()).byteLength;
          return response;
        },
        name,
        query,
      );
      assert.deepEqual(result.matches, find(words, query), `${name}: ${query}`);
      assert.equal(result.deferred, false);
      assert.ok(bytes < 256 * 1024, `${query}: ${bytes} bytes`);
      assert.ok(requests < 20, `${query}: ${requests} requests`);
    }
  }
});

test("prefixes resolve on the server; distant typos defer without loading full dictionaries", async () => {
  const prefix = await searchDictionary(fetchAsset, "decliner", "книг");
  assert.ok(prefix.matches.length);
  assert.equal(prefix.deferred, false);
  const typo = await searchDictionary(fetchAsset, "decliner", "zzzzzzzzzz");
  assert.deepEqual(typo, { matches: [], deferred: true });
});

test("failed assets propagate and a subsequent request can retry", async () => {
  await assert.rejects(searchDictionary(async () => new Response("", { status: 503 }), "decliner", "knigami"));
  assert.equal((await searchDictionary(fetchAsset, "decliner", "knigami")).matches[0].bare, "книга");
});

test("highly ambiguous forms defer before loading entry partitions", async () => {
  let requests = 0;
  const result = await searchDictionary(
    async path => {
      requests++;
      assert.match(path, /index-/);
      return Response.json({ "e:тест": Array.from({ length: 65 }, (_, i) => i) });
    },
    "decliner",
    "тест",
  );
  assert.deepEqual(result, { matches: [], deferred: true });
  assert.equal(requests, 1);
});
