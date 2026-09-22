import assert from "node:assert/strict";
import test from "node:test";
import { dictionarySeo, serializeJsonLd } from "../src/lib/seo.ts";

test("dictionary canonicals consolidate spelling, accents, and named query variants", () => {
  assert.deepEqual(dictionarySeo("/conjugator", " ЧИТА́ТЬ ", "читать"), {
    canonical: "https://russian.tools/conjugator?" + encodeURIComponent("читать"),
    noindex: false,
  });
  assert.equal(dictionarySeo("/decliner", "еж", "ёж").noindex, false);
});

test("suggestions and invalid queries cannot become indexable entry pages", () => {
  for (const [query, bare] of [["чита", "читать"], ["<invalid>", undefined]]) {
    assert.deepEqual(dictionarySeo("/conjugator", query, bare), {
      canonical: "https://russian.tools/conjugator",
      noindex: true,
    });
  }
  assert.equal(dictionarySeo("/decliner", "").noindex, false);
});

test("structured data safely round-trips inline script terminators", () => {
  const data = { description: "</script><script>alert(\"x\")</script>" };
  const serialized = serializeJsonLd(data);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), data);
});
