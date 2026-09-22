import type { Noun } from "$lib/declension";

let dictionary: Promise<Noun[]> | undefined;
export function getNouns(): Promise<Noun[]> {
  return dictionary ??= import("../../../static/data/nouns.json").then(({ default: data }) => data as Noun[]);
}
