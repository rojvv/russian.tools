/** Dictionaries are stored compressed so uploads and downloads stay small. */
export async function loadDictionary<T>(fetch: typeof globalThis.fetch, name: string): Promise<T[]> {
  const response = await fetch(`/data/${name}.json.gz`);
  if (!response.ok || !response.body) throw new Error(`Could not load ${name} dictionary`);
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).json() as Promise<T[]>;
}

/** Share decoded server data between requests, and allow retries after failure. */
export function cachedDictionary<T>(name: string) {
  let request: Promise<T[]> | undefined;
  return (fetch: typeof globalThis.fetch): Promise<T[]> =>
    request ??= loadDictionary<T>(fetch, name).catch((error) => {
      request = undefined;
      throw error;
    });
}
