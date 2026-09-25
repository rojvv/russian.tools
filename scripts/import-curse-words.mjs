// Import openly licensed English Wiktionary senses extracted by Kaikki.
// Usage: node scripts/import-curse-words.mjs /path/to/vulgar.jsonl /path/to/derogatory.jsonl
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { curatedCurseWords } from "../src/lib/curse-data.ts";

const paths = process.argv.slice(2);
if (paths.length !== 2) throw new Error("Pass the vulgar and derogatory JSONL downloads, in that order.");
const normalize = (word) => word.normalize("NFC").replaceAll("\u0301", "").replaceAll("ё", "е").toLowerCase();
const existing = new Set(curatedCurseWords.map(({ word }) => normalize(word)));
const entries = new Map();
const sources = [];
const allowedPOS = new Set(["verb", "noun", "adj", "adv", "intj", "phrase", "proverb", "pron", "particle", "prep"]);
for (const [index, path] of paths.entries()) {
  const tag = index === 0 ? "vulgar" : "derogatory";
  const bytes = readFileSync(path);
  sources.push({
    url: `https://kaikki.org/dictionary/Russian/tags/${
      index === 0 ? "hR" : "Fy"
    }/${tag}/kaikki.org-dictionary-Russian-tag-${tag}.jsonl`,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  for (const line of bytes.toString("utf8").trim().split("\n")) {
    const row = JSON.parse(line);
    if (!allowedPOS.has(row.pos) || !/^[а-яё -]+$/u.test(row.word) || existing.has(normalize(row.word))) continue;
    const senses = row.senses.filter((sense) =>
      !sense.form_of && !sense.alt_of && sense.glosses?.length
      && sense.tags?.some((tag) => tag === "vulgar" || tag === "derogatory")
      && !sense.topics?.some((topic) => topic === "politics" || topic === "government")
    ).map((sense) => ({
      // Keep the full definition hierarchy and register qualifiers, but no third-party quotations.
      gloss: (sense.raw_glosses ?? sense.glosses).join(" "),
      tags: sense.tags ?? [],
    }));
    if (!senses.length) continue;
    const key = normalize(row.word);
    let entry = entries.get(key);
    if (!entry) {
      const canonical = row.forms?.find((form) => form.tags?.includes("canonical") && normalize(form.form) === key);
      entry = { lemma: row.word, word: canonical?.form ?? row.word, pos: row.pos, senses: [] };
      entries.set(key, entry);
    }
    for (const sense of senses) {
      if (!entry.senses.some((existing) => existing.gloss === sense.gloss)) entry.senses.push(sense);
    }
  }
}
// Prioritize vulgar entries, then derogatory entries; deterministic alphabetical selection within each group.
const vulgar = (entry) => entry.senses.some((sense) => sense.tags.includes("vulgar"));
const selected = [...entries.values()].sort((a, b) =>
  Number(vulgar(b)) - Number(vulgar(a)) || a.lemma.localeCompare(b.lemma, "ru")
).slice(0, 1000 - curatedCurseWords.length).sort((a, b) => a.lemma.localeCompare(b.lemma, "ru"));
if (selected.length + curatedCurseWords.length < 1000) throw new Error("Not enough distinct dictionary headwords.");
writeFileSync(
  new URL("../src/lib/curse-dictionary.json", import.meta.url),
  JSON.stringify(
    {
      license: "CC-BY-SA-4.0",
      attribution: "English Wiktionary contributors; extracted by Kaikki / Wiktextract",
      sources,
      entries: selected,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Imported ${selected.length} headwords; ${selected.length + curatedCurseWords.length} total.`);
