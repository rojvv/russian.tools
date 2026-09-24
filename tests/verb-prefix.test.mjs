import assert from "node:assert/strict";
import test from "node:test";
import { verbFamilies } from "../src/lib/verb-prefix-data.ts";
import {
  exactPrefixVerb,
  matchesPrefixVerb,
  readPrefixQuery,
  searchVerbFamilies,
  writePrefixQuery,
} from "../src/lib/verb-prefix.ts";
import { readDictionary } from "./dictionary-fixtures.mjs";

const entries = verbFamilies.flatMap((family) => family.entries);
const entry = (id) => entries.find((item) => item.id === id);

test("search finds whole families from Cyrillic, accents, Latin, or a meaning", () => {
  for (const query of ["договорить", " ДОГОВОРИ́ТЬ ", "dogovorit", "dogovorit'", "договаривать", "finish saying"]) {
    const matches = searchVerbFamilies(query);
    assert.deepEqual(matches.map((family) => family.id), ["speak"], query);
    assert.ok(matches[0].entries.includes(entry("говорить")), "retain the base verb for comparison");
    assert.ok(matches[0].entries.includes(entry("договориться")), "retain contrasting relatives");
    assert.ok(matchesPrefixVerb(entry("договорить"), query));
  }
  assert.equal(searchVerbFamilies("perepisat")[0].id, "write");
  assert.equal(searchVerbFamilies("закончить высказывание")[0].id, "speak");
  assert.ok(searchVerbFamilies("finish").length > 1);
  assert.ok(exactPrefixVerb(entry("договорить"), "dogovorit"));
  assert.equal(exactPrefixVerb(entry("договориться"), "договорить"), false);
});

test("family selection, partial searches, and unknown input never invent verbs", () => {
  assert.deepEqual(searchVerbFamilies("", "read").map((family) => family.id), ["read"]);
  assert.equal(searchVerbFamilies("догов", "speak").length, 1);
  assert.deepEqual(searchVerbFamilies("договорить", "read"), []);
  for (const query of ["<script>", "...", "небывалоглагол", "dogovoritxyz"]) {
    assert.deepEqual(searchVerbFamilies(query), [], query);
  }
  assert.equal(searchVerbFamilies("  ").length, 8);
});

test("completion, agreement, and bounded activity have distinct lexical entries", () => {
  assert.equal(entry("договорить").imperfective, "договаривать");
  assert.equal(entry("договориться").imperfective, "договариваться");
  assert.equal(entry("научить").imperfective, "учить");
  assert.equal(entry("научиться").imperfective, "учиться");
  for (const id of ["поговорить", "почитать", "поделать", "поработать"]) {
    assert.equal(entry(id).imperfective, "", `${id} must not invent an aspect pair`);
  }
  assert.equal(entry("осмотреть").prefix, "о-");
});

test("curated forms link to existing conjugator entries with the correct aspect", () => {
  const dictionary = readDictionary("verbs");
  assert.equal(new Set(verbFamilies.map((family) => family.id)).size, verbFamilies.length);
  assert.equal(new Set(entries.map((item) => item.id)).size, entries.length);
  for (const family of verbFamilies) {
    assert.equal(family.entries[0].imperfective, family.base);
    for (const item of family.entries) {
      for (const text of [item.meaning, item.note, item.example]) {
        assert.ok(text.en && text.ru, item.id);
      }
      for (const aspect of ["imperfective", "perfective"]) {
        if (!item[aspect]) continue;
        assert.ok(
          dictionary.some((word) => word.bare === item[aspect] && (word.aspect === aspect || word.aspect === "both")),
          `${item[aspect]}: ${aspect}`,
        );
      }
    }
  }
});

test("URL state handles default families, direct searches, invalid input, and round trips", () => {
  const base = new URL("https://russian.tools/verb-prefixes?lang=ru&source=test#results");
  assert.deepEqual(readPrefixQuery(base), { query: "", family: "speak" });
  assert.deepEqual(readPrefixQuery(new URL("?q=договорить", base)), { query: "договорить", family: "all" });
  for (
    const state of [
      { query: "", family: "read" },
      { query: "договорить", family: "all" },
      { query: "finish", family: "read" },
      { query: "", family: "all" },
      { query: "  ", family: "all" },
    ]
  ) {
    const next = writePrefixQuery(base, state);
    assert.deepEqual(readPrefixQuery(next), state);
    assert.equal(next.searchParams.get("lang"), "ru");
    assert.equal(next.searchParams.get("source"), "test");
    assert.equal(next.hash, "#results");
    assert.equal(base.searchParams.has("family"), false);
    assert.equal(writePrefixQuery(next, { query: "", family: "speak" }).href, base.href);
  }
  for (const family of ["unknown", "constructor", "__proto__"]) {
    assert.equal(readPrefixQuery(new URL(`?family=${family}`, base)).family, "speak");
    assert.equal(readPrefixQuery(new URL(`?q=читать&family=${family}`, base)).family, "all");
  }
  const long = new URL(`?q=${"я".repeat(200)}`, base);
  assert.equal(readPrefixQuery(long).query.length, 120);
  assert.equal(writePrefixQuery(base, { query: "я".repeat(200), family: "all" }).searchParams.get("q").length, 120);
});
