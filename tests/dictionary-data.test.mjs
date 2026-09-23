import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { gzipSync } from "node:zlib";
import { cachedDictionary, loadDictionary } from "../src/lib/dictionary-data.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

test("native streaming decompression preserves every dictionary entry", async () => {
  let total = 0;
  for (const name of ["nouns", "verbs", "adjectives"]) {
    const compressed = readFileSync(new URL(`../static/data/${name}.json.gz`, import.meta.url));
    total += compressed.length;
    const entries = await loadDictionary(async path => {
      assert.equal(path, `/data/${name}.json.gz`);
      return new Response(compressed);
    }, name);
    assert.deepEqual(entries, readDictionary(name));
  }
  assert.ok(total < 8 * 1024 * 1024, `Dictionary uploads grew to ${total} bytes`);
  assert.ok(!readdirSync(new URL("../static/data/", import.meta.url)).some(file => file.endsWith(".json")));
});

test("server dictionary cache shares concurrent loads and retries network failures", async () => {
  const get = cachedDictionary("test");
  let requests = 0;
  const fetch = async () => {
    requests++;
    return requests === 1
      ? new Response("Unavailable", { status: 503 })
      : new Response(gzipSync(JSON.stringify([{ bare: "книга" }])));
  };
  await assert.rejects(get(fetch), /Could not load test dictionary/);
  const [first, second] = await Promise.all([get(fetch), get(fetch)]);
  assert.deepEqual(first, [{ bare: "книга" }]);
  assert.equal(first, second);
  assert.equal(await get(fetch), first);
  assert.equal(requests, 2);
});

test("corrupt gzip and invalid JSON fail instead of poisoning the dictionary cache", async () => {
  const get = cachedDictionary("test");
  await assert.rejects(get(async () => new Response("not gzip")));
  await assert.rejects(get(async () => new Response(gzipSync("not JSON"))));
  assert.deepEqual(await get(async () => new Response(gzipSync("[]"))), []);
});

test("already decoded HTTP gzip responses are not decompressed twice", async () => {
  const entries = [{ bare: "лес", type: "noun" }];
  for (const headers of [{ "Content-Encoding": "gzip" }, {}]) {
    assert.deepEqual(
      await loadDictionary(async () => new Response(JSON.stringify(entries), { headers }), "nouns"),
      entries,
    );
  }
  assert.deepEqual(
    await loadDictionary(async () =>
      new Response(gzipSync(JSON.stringify(entries)), {
        headers: { "Content-Encoding": "gzip" },
      }), "nouns"),
    entries,
  );
});
