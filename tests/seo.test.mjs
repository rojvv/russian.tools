import assert from "node:assert/strict";
import test from "node:test";
import { readVerbQuery } from "../src/lib/conjugation-url.ts";
import { readNounQuery } from "../src/lib/declension-url.ts";
import { canonicalRedirect, dictionarySeo, languageUrl, serializeJsonLd } from "../src/lib/seo.ts";

test("tracking parameters never become dictionary searches or hide a real query", () => {
  for (const read of [readVerbQuery, readNounQuery]) {
    for (const tracking of ["utm_source=newsletter", "utm_campaign=launch", "gclid=123", "fbclid=123", "_gl=123"]) {
      assert.equal(read(new URL(`https://russian.tools/?${tracking}&lang=en`)), "");
      assert.equal(read(new URL(`https://russian.tools/?${tracking}&читать&lang=ru`)), "читать");
      assert.equal(read(new URL(`https://russian.tools/?${tracking}&q=книга`)), "книга");
    }
  }
});

test("canonical redirects converge and keep preview hosts local", () => {
  const canonical = dictionarySeo("/decliner", "книга", "книга").canonical;
  const path = `/decliner?${encodeURIComponent("книга")}&lang=ru`;
  assert.equal(canonicalRedirect(new URL("http://localhost:5173/decliner?noun=книга&lang=ru"), canonical, "ru"), path);
  assert.equal(canonicalRedirect(new URL(`http://localhost:5173${path}`), canonical, "ru"), null);
  assert.equal(canonicalRedirect(new URL(languageUrl(canonical, "en")), canonical, "en"), null);
});

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

test("explicit language URLs preserve word queries and replace the previous language", async () => {
  const { languageUrl } = await import("../src/lib/seo.ts");
  const { readNounQuery, writeNounQuery } = await import("../src/lib/declension-url.ts");
  const { readVerbQuery, writeVerbQuery } = await import("../src/lib/conjugation-url.ts");
  for (
    const [path, word, read, write] of [
      ["/decliner", "книга", readNounQuery, writeNounQuery],
      ["/conjugator", "читать", readVerbQuery, writeVerbQuery],
    ]
  ) {
    const canonical = dictionarySeo(path, word, word).canonical;
    const ru = new URL(languageUrl(canonical, "ru"));
    assert.equal(ru.href, `${canonical}&lang=ru`);
    assert.equal(read(ru), word);
    assert.equal(languageUrl(ru.href, "en"), `${canonical}&lang=en`);
    assert.equal(write(ru, "мир").searchParams.get("lang"), "ru");
    assert.equal(read(write(ru, "")), "");
    assert.equal(read(new URL(`https://russian.tools${path}?lang=ru&${encodeURIComponent(word)}`)), word);
    assert.equal(read(new URL(`https://russian.tools${path}?lang=ru`)), "");
  }
});
