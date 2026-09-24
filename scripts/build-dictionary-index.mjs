import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { createTable as conjugate } from "../src/lib/conjugation.ts";
import { createTable as decline } from "../src/lib/declension.ts";
import { entryPartitionSize, indexPartition, indexPartitions } from "../src/lib/dictionary-index.ts";
import { normalizeText, searchKey, searchKeys } from "../src/lib/search-text.ts";

const root = new URL("../static/data/search/", import.meta.url);
const read = async name =>
  JSON.parse(gunzipSync(await readFile(new URL(`../static/data/${name}.json.gz`, import.meta.url))));
for (const name of ["decliner", "conjugator"]) {
  const directory = new URL(`${name}/`, root);
  const manifest = new URL(".build.json", directory);
  const sources = [
    "scripts/build-dictionary-index.mjs",
    "src/lib/dictionary-index.ts",
    "src/lib/dictionary-lookup.ts",
    "src/lib/search-text.ts",
    `src/lib/${name === "decliner" ? "declension" : "conjugation"}.ts`,
    ...(name === "decliner" ? ["nouns", "adjectives"] : ["verbs"])
      .map(data => `static/data/${data}.json.gz`),
  ];
  const hash = createHash("sha256");
  for (const source of sources) {
    hash.update(source).update("\0");
    hash.update(await readFile(new URL(`../${source}`, import.meta.url))).update("\0");
  }
  const fingerprint = hash.digest("hex");
  try {
    const previous = JSON.parse(await readFile(manifest, "utf8"));
    const files = new Set(await readdir(directory));
    if (
      previous.fingerprint === fingerprint
      && Array.isArray(previous.files)
      && previous.files.length > 0
      && previous.files.every(file => files.has(file))
    ) {
      console.log(`Skipping ${name} search index (unchanged)`);
      continue;
    }
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  const words = name === "decliner" ? [...await read("nouns"), ...await read("adjectives")] : await read("verbs");
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  const partitions = Array.from({ length: indexPartitions }, () => Object.create(null));
  const add = (key, id, first = false) => {
    const partition = partitions[parseInt(indexPartition(key), 16)];
    const ids = partition[key] ??= [];
    if ((!first || !ids.length) && ids.at(-1) !== id) ids.push(id);
  };
  for (const [id, word] of words.entries()) {
    const sections = name === "decliner"
      ? decline(word)
      : conjugate(word, word.aspect === "perfective" ? "perfective" : "imperfective");
    const forms = normalizeText(
      [word.bare, ...sections.flatMap(section => section.rows.map(row => row.form))].join("\n"),
    )
      .split(/[,;/\n]/u).map(form => form.trim()).filter(form => form && form !== "-");
    for (const form of new Set(forms)) {
      add(`e:${form}`, id);
      add(`f:${form.replaceAll("ё", "е")}`, id);
      for (const key of searchKeys(form)) add(`l:${key}`, id);
    }
    // Prefix suggestions choose the first dictionary headword, as the browser does.
    for (const [mode, key] of [["p", normalizeText(word.bare).replaceAll("ё", "е")], ["q", searchKey(word.bare)]]) {
      for (let length = 1; length <= Math.min(40, key.length); length++) {
        add(`${mode}:${key.slice(0, length)}`, id, true);
      }
    }
    add(`h:${normalizeText(word.bare)}`, id);
  }
  for (const [number, partition] of partitions.entries()) {
    await writeFile(
      new URL(`index-${number.toString(16).padStart(3, "0")}.json`, directory),
      JSON.stringify(partition),
    );
  }
  for (let offset = 0; offset < words.length; offset += entryPartitionSize) {
    await writeFile(
      new URL(`entries-${offset / entryPartitionSize}.json`, directory),
      JSON.stringify(words.slice(offset, offset + entryPartitionSize)),
    );
  }
  // Write last: an interrupted build must never be treated as complete.
  await writeFile(manifest, JSON.stringify({ fingerprint, files: await readdir(directory) }));
  console.log(`Built ${name} search index (${words.length} entries)`);
}
