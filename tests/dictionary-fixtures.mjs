import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

export function readDictionary(name) {
  return JSON.parse(
    gunzipSync(readFileSync(new URL(`../static/data/${name}.json.gz`, import.meta.url))).toString("utf8"),
  );
}
