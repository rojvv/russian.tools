import { entryPartitionSize, indexPartition } from "../dictionary-index.ts";
import { hasLatin, normalizeText, searchKey, searchKeys } from "../search-text.ts";

/** No isolate-wide cache: memory remains bounded even when crawlers visit many words. */
export async function searchDictionary<T extends { bare: string }>(
  fetch: typeof globalThis.fetch,
  name: "decliner" | "conjugator",
  text: string,
): Promise<{ matches: T[]; deferred: boolean }> {
  const query = normalizeText(text).replace(/\s+/gu, " ");
  if (!query || query.length > 40) return { matches: [], deferred: false };
  const root = `/data/search/${name}/`;
  const requests = new Map<string, Promise<unknown>>();
  const read = <V>(file: string): Promise<V> => {
    let request = requests.get(file);
    if (!request) {
      request = fetch(root + file).then(response => {
        if (!response.ok) throw new Error(`Could not load ${name} search partition`);
        return response.json();
      });
      requests.set(file, request);
    }
    return request as Promise<V>;
  };
  const idsFor = async (key: string): Promise<number[]> => {
    const partition = await read<Record<string, number[]>>(`index-${indexPartition(key)}.json`);
    return Object.hasOwn(partition, key) ? partition[key] : [];
  };
  const entries = async (ids: number[]): Promise<T[]> =>
    Promise.all(ids.map(async id => {
      const partition = await read<T[]>(`entries-${Math.floor(id / entryPartitionSize)}.json`);
      return partition[id % entryPartitionSize];
    }));
  const bounded = (ids: number[]) =>
    ids.length <= 64 && new Set(ids.map(id => Math.floor(id / entryPartitionSize))).size <= 8;
  const latin = hasLatin(query);
  const key = latin ? searchKey(query) : query;
  let ids = await idsFor(`${latin ? "l" : "e"}:${key}`);
  if (!latin && !ids.length) ids = await idsFor(`f:${key.replaceAll("ё", "е")}`);
  if (ids.length) {
    // Very ambiguous forms must not turn into dozens of asset reads or large SSR payloads.
    if (!bounded(ids)) {
      return { matches: [], deferred: true };
    }
    const matches = await entries(ids);
    const headword = (word: T) => latin ? searchKeys(word.bare).includes(key) : normalizeText(word.bare) === query;
    matches.sort((a, b) => Number(headword(b)) - Number(headword(a)));
    return { matches, deferred: false };
  }
  const prefix = await idsFor(`${latin ? "q" : "p"}:${latin ? key : key.replaceAll("ё", "е")}`);
  if (prefix.length) {
    const [word] = await entries(prefix);
    // Preserve all homonyms of the selected headword.
    const homonyms = await idsFor(`${latin ? "l" : "h"}:${latin ? searchKey(word.bare) : normalizeText(word.bare)}`);
    if (!bounded(homonyms)) return { matches: [], deferred: true };
    const matches = await entries(homonyms);
    return {
      matches: matches.filter(entry =>
        latin
          ? searchKeys(entry.bare).includes(searchKey(word.bare))
          : normalizeText(entry.bare) === normalizeText(word.bare)
      ),
      deferred: false,
    };
  }
  // Unbounded edit-distance scans belong in the browser, never a Worker request.
  return { matches: [], deferred: true };
}
