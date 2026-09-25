import assert from "node:assert/strict";
import test from "node:test";
import { curseLevels, curseTypes, curseWords } from "../src/lib/curse-data.ts";
import { readCurseQuery, searchCurses, writeCurseQuery } from "../src/lib/curse.ts";

test("search accepts Cyrillic, stress, е/ё, Latin, and common internet spellings", () => {
  for (const query of ["БЛЯДЬ", " бля́дь ", "блять", "бля", "blyat", "blyad"]) {
    assert.equal(searchCurses(query)[0]?.id, "blyad", query);
  }
  for (const query of ["чёрт", "черт", "chyort", "chert", "чёрт".normalize("NFD")]) {
    assert.equal(searchCurses(query)[0]?.id, "chert", query);
  }
  const idi = searchCurses("idi na khuy")[0];
  assert.equal(idi.word, "иди́ на́ хуй");
  assert.equal(idi.latin, "idi na khuy");
  assert.equal(searchCurses("cyka")[0]?.id, "suka");
  assert.equal(searchCurses("заебало")[0]?.id, "zaebat");
  assert.equal(searchCurses("poshel na huy")[0]?.id, "poshel");
  assert.equal(searchCurses("ебать")[0]?.id, "ebat", "exact headwords precede derived words");
  for (
    const [query, id] of [
      ["пизде́ть", "pizdet"],
      ["пи́здить", "pizdit"],
      ["pizdet", "pizdet"],
      ["pizdit", "pizdit"],
      ["dolboeb", "dolboyob"],
      ["отъебись", "otyebatsya"],
      ["ни   хуя", "nikhuya"],
      ["ппц", "pipets"],
      ["нифига себе", "nifigasebe"],
      ["нихуя себе", "nikhuyasebe"],
      ["заебалась", "zayebatsya"],
      ["задолбалась", "zadolbatsya"],
      ["выебываться", "vyyobyvatsya"],
      ["podyebat", "podyebat"],
      ["нехуевая", "nekhuyovy"],
      ["idi na khuy", "idinakhuy"],
      ["idi nakhuy", "idinakhuy"],
      ["иди на хуй", "idinakhuy"],
      ["иди нахуй", "idinakhuy"],
      ["идите на хуй", "idinakhuy"],
    ]
  ) assert.equal(searchCurses(query)[0]?.id, id, query);
  for (const id of ["khren", "khreny"]) {
    assert.ok(searchCurses("khren").some((entry) => entry.id === id), "soft-sign omission retains both meanings");
  }
});

test("meaning search combines with both filters and handles no results", () => {
  assert.ok(searchCurses("nonsense").some(({ id }) => id === "fignya"));
  assert.ok(searchCurses("ерунда").some(({ id }) => id === "fignya"));
  assert.ok(searchCurses("ерунда", "obscene").every(({ level }) => level === "obscene"));
  assert.deepEqual(searchCurses("блядь", "mild"), []);
  assert.deepEqual(searchCurses("блядь", "obscene", "verb"), []);
  assert.deepEqual(searchCurses("  "), curseWords);
  for (const query of ["not-a-real-word", "<script>", "..."]) assert.deepEqual(searchCurses(query), []);
  for (const level of Object.keys(curseLevels)) {
    const matches = searchCurses("", level);
    assert.ok(matches.length > 0);
    assert.ok(matches.every((entry) => entry.level === level));
  }
  for (const type of Object.keys(curseTypes)) {
    const matches = searchCurses("", "obscene", type);
    assert.ok(matches.length > 0);
    assert.ok(matches.every((entry) => entry.type === type && entry.level === "obscene"));
  }
});

test("catalog headwords, reading aids and aliases find complete, unique entries", () => {
  assert.equal(curseWords.length, 1000, "1,000 entries, excluding aliases");
  assert.equal(new Set(curseWords.map(({ id }) => id)).size, curseWords.length);
  const headwords = curseWords.map(({ word }) =>
    word.normalize("NFC").replaceAll("\u0301", "").replaceAll("ё", "е").toLowerCase()
  );
  assert.equal(new Set(headwords).size, curseWords.length, "headwords must be distinct");
  for (const entry of curseWords) {
    assert.match(entry.id, /^[a-zа-яё_-]+$/u);
    assert.ok(entry.meaning.en && entry.usage.en && entry.usage.ru, entry.id);
    if (entry.imported) {
      assert.ok(entry.source, `${entry.id}: imported definitions require attribution`);
      assert.equal(entry.example, undefined, "imported definitions must not pretend to have curated examples");
    } else {
      assert.ok(entry.meaning.ru && entry.example.en && entry.example.ru, entry.id);
    }
    for (const query of [entry.word, entry.latin, ...entry.aliases]) {
      assert.ok(searchCurses(query).includes(entry), query);
    }
    assert.equal(searchCurses(entry.word)[0]?.id, entry.id, entry.word);
    if (entry.source) {
      const source = new URL(entry.source);
      assert.equal(source.protocol, "https:");
      assert.ok(["ru.wiktionary.org", "en.wiktionary.org"].includes(source.hostname));
      assert.ok(source.pathname.startsWith("/wiki/"));
    }
  }
});

test("URL state round-trips, validates filters, limits input and preserves unrelated state", () => {
  const original = new URL("https://russian.tools/curse?lang=ru&source=test#results");
  const state = { query: "чёрт", level: "mild", type: "exclamation" };
  const next = writeCurseQuery(original, state);
  assert.deepEqual(readCurseQuery(next), state);
  assert.equal(next.searchParams.get("lang"), "ru");
  assert.equal(next.searchParams.get("source"), "test");
  assert.equal(next.hash, "#results");
  const legacy = new URL(next);
  legacy.searchParams.set("p", "25");
  assert.equal(writeCurseQuery(legacy, state).href, next.href, "obsolete page state is removed");
  assert.equal(original.searchParams.has("q"), false);
  assert.equal(writeCurseQuery(next, { query: "", level: "", type: "" }).href, original.href);
  for (const value of ["__proto__", "constructor", "unknown"]) {
    const url = new URL(`https://russian.tools/curse?level=${value}&type=${value}`);
    assert.deepEqual(readCurseQuery(url), { query: "", level: "", type: "" });
  }
  const long = writeCurseQuery(original, { ...state, query: "я".repeat(200) });
  assert.equal(long.searchParams.get("q").length, 120);
  long.searchParams.set("q", "я".repeat(200));
  assert.equal(readCurseQuery(long).query.length, 120);
});
